import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Crash.css";

const Crash = () => {
  const navigate = useNavigate();
  const [bet, setBet] = useState(0);
  const [balance, setBalance] = useState(0); // Actual wallet balance
  const [multiplier, setMultiplier] = useState(1);
  const [crashed, setCrashed] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [profitLoss, setProfitLoss] = useState(0);
  const [autoCashout, setAutoCashout] = useState(0);
  const [gameHistory, setGameHistory] = useState([]);
  const HOUSE_EDGE = 0.05;
  const MAX_MULTIPLIER = 100;

  // Fetch wallet balance on component mount
  useEffect(() => {
    const fetchBalance = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("Please log in to play.");
        return;
      }

      try {
        const response = await axios.get("https://anti-gambling-backend.onrender.com/wallet", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setBalance(response.data.balance);
      } catch (error) {
        console.error("Error fetching wallet balance:", error);
        alert("Failed to fetch wallet balance.");
      }
    };

    fetchBalance();
  }, []);

  const updateWallet = async (newBalance, gameResult) => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      await axios.post(
        "https://anti-gambling-backend.onrender.com/wallet/update",
        {
          balance: newBalance,
          gameResult,
          betAmount: bet,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Error updating wallet:", error);
      alert("Failed to update wallet.");
    }
  };

  const handleStartGame = () => {
    if (bet <= 0 || bet > balance) {
      alert("Invalid bet amount");
      return;
    }

    setBalance((prev) => prev - bet); // Deduct bet from balance
    updateWallet(balance - bet, "start_game"); // Sync with backend
    setMultiplier(1);
    setCrashed(false);
    setGameActive(true);
  };

  const handleCashout = () => {
    if (!gameActive || crashed) return;

    const winnings = bet * multiplier;
    setBalance((prev) => prev + winnings);
    setProfitLoss((prev) => prev + (winnings - bet));
    setGameActive(false);

    updateWallet(balance + winnings, "cashout"); // Sync with backend

    setGameHistory((prev) => [...prev, multiplier.toFixed(2)].slice(-10));
  };

  useEffect(() => {
    let animationFrame;
    let startTime;

    const crashPoint = Math.max(1, (1 / (1 - Math.random())) * (1 - HOUSE_EDGE));

    const updateGame = (timestamp) => {
      if (!startTime) startTime = timestamp;

      if (gameActive && !crashed) {
        const elapsed = (timestamp - startTime) / 1000;
        const currentMultiplier = Math.pow(Math.E, elapsed * 0.6);

        if (currentMultiplier >= crashPoint) {
          setCrashed(true);
          setGameActive(false);
          setProfitLoss((prev) => prev - bet);
          updateWallet(balance, "crash"); // Sync crash with backend
          setGameHistory((prev) => [...prev, crashPoint.toFixed(2)].slice(-10));
          return;
        }

        if (currentMultiplier >= MAX_MULTIPLIER) {
          handleCashout();
          return;
        }

        if (autoCashout > 0 && currentMultiplier >= autoCashout) {
          handleCashout();
          return;
        }

        setMultiplier(currentMultiplier);
        animationFrame = requestAnimationFrame(updateGame);
      }
    };

    if (gameActive && !crashed) {
      animationFrame = requestAnimationFrame(updateGame);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [gameActive, crashed, bet, autoCashout]);

  return (
    <div className="container"> 
      <div className="sidebar">
        <h1 className="title">Crash Game</h1>

        <div className="balanceInfo">
          <div className="balance">Balance: ₹{balance.toFixed(2)}</div>
          <div className="profitLoss">
            P/L:{" "}
            <span style={{ color: profitLoss >= 0 ? "#10b981" : "#ef4444" }}>
              ₹{profitLoss.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="controls">
          <label className="label">
            Bet Amount:
            <input
              type="number"
              value={bet}
              onChange={(e) => setBet(Math.max(0, Number(e.target.value)))}
              className="input"
              disabled={gameActive}
            />
          </label>

          <label className="label">
            Auto Cashout:
            <input
              type="number"
              value={autoCashout}
              onChange={(e) => setAutoCashout(Math.max(1.01, Number(e.target.value)))}
              className="input"
              disabled={gameActive}
              step="0.1"
              min="1.01"
            />
          </label>

          {!gameActive ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="button"
              onClick={handleStartGame}
              disabled={crashed && gameActive}
            >
              Place Bet
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ backgroundColor: "#10b981" }}
              onClick={handleCashout}
            >
              Cashout @ {(bet * multiplier).toFixed(2)}
            </motion.button>
          )}
        </div>

        <div className="history">
          <h3 className="historyTitle">Previous Crashes</h3>
          <div className="historyList">
            {gameHistory.map((crash, index) => (
              <span
                key={index}
                className="historyItem"
                style={{
                  backgroundColor: crash < 2 ? "#fecaca" : "#86efac",
                  color: crash < 2 ? "#dc2626" : "#059669",
                }}
              >
                {crash}x
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="gameArea">
        <div className="multiplierDisplay">
          {crashed ? (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              style={{ color: "#dc2626" }}
              className="multiplier"
            >
              CRASHED @ {multiplier.toFixed(2)}x
            </motion.div>
          ) : (
            <div className="multiplier">{multiplier.toFixed(2)}x</div>
          )}
        </div>

        <div style={styles.graphContainer}>
          <div style={styles.progressBar}>
             <motion.div
               style={{
                  ...styles.progress,
                    width: gameActive ? `${Math.min((multiplier / MAX_MULTIPLIER) * 100, 100)}%` : "0%",
                    backgroundColor: crashed ? "#dc2626" : "#2563eb",
               }} 
                  animate={{
                  width: gameActive ? `${Math.min((multiplier / MAX_MULTIPLIER) * 100, 100)}%` : "0%",
                 }}
                transition={{ duration: 0.1 }}
              />
            </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  graphContainer: {
    width: '100%',
    padding: '1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '0.5rem',
    marginBottom: '1rem',
  },
  progressBar: {
    width: '100%',
    height: '2rem',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    position: 'relative',
  },
  progress: {
    height: '100%',
    transition: 'width 0.1s ease-in-out',
    borderRadius: '0.5rem',
  },
  backButton: {
    position: 'fixed',
    top: '1rem',
    left: '26rem',
    backgroundColor: '#004D4D',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontFamily: 'Quicksand, sans-serif',
    fontSize: '1rem',
    zIndex: 10,
  }
};

export default Crash;