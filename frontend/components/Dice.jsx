import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const DiceGame = () => {
  const [sliderValue, setSliderValue] = useState(50);
  const [betAmount, setBetAmount] = useState(10);
  const [multiplier, setMultiplier] = useState(2);
  const [result, setResult] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial wallet balance
  useEffect(() => {
    fetchWalletBalance();
  }, []);

  // Recalculate multiplier when slider value changes
  useEffect(() => {
    const newMultiplier = (100 / sliderValue).toFixed(2);
    setMultiplier(newMultiplier);
  }, [sliderValue]);

  const fetchWalletBalance = async () => {
    const token = localStorage.getItem("authToken");
    
    if (!token) {
      setError("No token found, please log in.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get("https://anti-gambling-backend.onrender.com/wallet", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setBalance(response.data.balance);
      setIsLoading(false);
    } catch (err) {
      setError("Failed to fetch wallet balance");
      setIsLoading(false);
    }
  };

  const updateWalletBalance = async (newBalance, gameResult, bet) => {
    const token = localStorage.getItem("authToken");
    
    if (!token) {
      setError("No token found, please log in.");
      return;
    }

    try {
      const response = await axios.post(
        "https://anti-gambling-backend.onrender.com/wallet/update",
        {
          balance: newBalance,
          gameResult: gameResult,
          betAmount: bet
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setBalance(response.data.balance);
    } catch (err) {
      setError("Failed to update wallet balance");
      // Refresh balance to ensure consistency
      fetchWalletBalance();
    }
  };

  const handleRoll = async () => {
    if (isRolling || betAmount > balance || betAmount <= 0) return;

    setIsRolling(true);
    const randomNumber = Math.random() * 100;
    const won = randomNumber <= sliderValue;

    setTimeout(async () => {
      const payout = won ? betAmount * multiplier : 0;
      const newBalance = won ? 
        balance + (betAmount * (multiplier - 1)) : 
        balance - betAmount;

      setResult({
        won,
        number: randomNumber.toFixed(2),
        payout
      });

      // Update balance in backend
      await updateWalletBalance(
        newBalance,
        won ? "player_wins" : "dealer_wins",
        betAmount
      );

      setIsRolling(false);
    }, 1000);
  };

  const handleBetChange = (e) => {
    const value = Number(e.target.value);
    if (value > balance) {
      setBetAmount(balance);
    } else if (value < 0) {
      setBetAmount(0);
    } else {
      setBetAmount(value);
    }
  };

  if (isLoading) {
    return <div style={styles.loading}>Loading wallet...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.gameCard}>
        <h2 style={styles.title}>Dice Game</h2>
        
        <div style={styles.balanceContainer}>
          <span style={styles.balanceLabel}>Balance:</span>
          <span style={styles.balanceAmount}>₹{balance.toFixed(2)}</span>
        </div>

        <div style={styles.sliderContainer}>
          <input
            type="range"
            min="1"
            max="98"
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            style={styles.slider}
            disabled={isRolling}
          />
          <div style={styles.sliderInfo}>
            <div>
              <span style={styles.label}>Roll Under</span>
              <span style={styles.value}>{sliderValue}%</span>
            </div>
            <div>
              <span style={styles.label}>Multiplier</span>
              <span style={styles.value}>{multiplier}x</span>
            </div>
            <div>
              <span style={styles.label}>Win Chance</span>
              <span style={styles.value}>{sliderValue}%</span>
            </div>
          </div>
        </div>

        <div style={styles.betControls}>
          <div style={styles.betAmount}>
            <span style={styles.label}>Bet Amount</span>
            <input
              type="number"
              value={betAmount}
              onChange={handleBetChange}
              style={styles.input}
              disabled={isRolling}
              min="0"
              max={balance}
            />
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              ...styles.button,
              opacity: (isRolling || betAmount > balance || betAmount <= 0) ? 0.5 : 1
            }}
            onClick={handleRoll}
            disabled={isRolling || betAmount > balance || betAmount <= 0}
          >
            {isRolling ? 'Rolling...' : 'Roll Dice'}
          </motion.button>
        </div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              ...styles.result,
              backgroundColor: result.won ? '#10b981' : '#ef4444'
            }}
          >
            <span style={styles.resultNumber}>{result.number}</span>
            <span style={styles.resultText}>
              {result.won ? `Won ₹${result.payout.toFixed(2)}` : 'Lost'}
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
};


const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(to bottom, #A4D7E1, #FFFFFF)",
    padding: "6rem 1rem",
    fontFamily: 'Quicksand, sans-serif',
  },
  gameCard: {
    maxWidth: "800px",
    margin: "0 auto",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: "0.75rem",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    padding: "2rem",
    backdropFilter: "blur(8px)",
  },
  balanceContainer: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: "1.5rem",
    padding: "1rem",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: "0.5rem",
  },
  balanceLabel: {
    color: "#004D4D",
    marginRight: "0.5rem",
    fontFamily: 'Quicksand, sans-serif',
    fontWeight: "500",
  },
  balanceAmount: {
    color: "#004D4D",
    fontWeight: "600",
    fontSize: "1.25rem",
    fontFamily: 'Comfortaa, cursive',
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "700",
    color: "#004D4D",
    marginBottom: "2rem",
    textAlign: "center",
    fontFamily: 'Comfortaa, cursive',
  },
  sliderContainer: {
    marginBottom: "2rem",
    padding: "1.5rem",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: "0.75rem",
  },
  slider: {
    width: "100%",
    height: "8px",
    backgroundColor: "#A4D7E1",
    borderRadius: "4px",
    outline: "none",
    WebkitAppearance: "none",
    cursor: "pointer",
  },
  sliderInfo: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "1.5rem",
    fontFamily: 'Quicksand, sans-serif',
  },
  label: {
    color: "#004D4D",
    display: "block",
    marginBottom: "0.5rem",
    fontSize: "0.875rem",
    fontWeight: "500",
  },
  value: {
    color: "#004D4D",
    fontWeight: "600",
    fontFamily: 'Comfortaa, cursive',
  },
  betControls: {
    display: "flex",
    gap: "1.5rem",
    alignItems: "flex-end",
    marginBottom: "2rem",
    padding: "1.5rem",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: "0.75rem",
  },
  betAmount: {
    flex: 1,
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "0.5rem",
    border: "2px solid #A4D7E1",
    outline: "none",
    fontFamily: 'Quicksand, sans-serif',
    fontSize: "1rem",
    transition: "border-color 0.2s ease",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    '&:focus': {
      borderColor: "#004D4D",
    }
  },
  button: {
    backgroundColor: "#004D4D",
    color: "white",
    padding: "0.75rem 1.5rem",
    borderRadius: "0.5rem",
    border: "none",
    cursor: "pointer",
    fontWeight: "500",
    fontFamily: 'Quicksand, sans-serif',
    transition: "all 0.2s ease",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    '&:hover': {
      backgroundColor: "#003333",
      transform: "translateY(-2px)",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.15)",
    }
  },
  result: {
    padding: "1.5rem",
    borderRadius: "0.75rem",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backdropFilter: "blur(8px)",
    fontFamily: 'Quicksand, sans-serif',
  },
  resultNumber: {
    fontSize: "1.5rem",
    fontWeight: "600",
    fontFamily: 'Comfortaa, cursive',
  },
  resultText: {
    fontWeight: "500",
    fontSize: "1.25rem",
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#004D4D',
    fontFamily: 'Quicksand, sans-serif',
    fontSize: "1.25rem",
  },
  error: {
    textAlign: 'center',
    padding: '2rem',
    color: '#dc2626',
    fontFamily: 'Quicksand, sans-serif',
    fontSize: "1.25rem",
  }
};

export default DiceGame;
