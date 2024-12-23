import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";

const GRID_SIZE = 5;

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const generateGrid = (numMines) => {
  const totalTiles = GRID_SIZE * GRID_SIZE;
  if (numMines >= totalTiles) numMines = totalTiles - 1;
  const grid = Array(numMines).fill(true).concat(Array(totalTiles - numMines).fill(false));
  return shuffleArray(grid);
};

const calculateMultiplier = (numMines, safeRevealed) => {
  const totalTiles = GRID_SIZE * GRID_SIZE;
  const safeTiles = totalTiles - numMines;
  const baseMultiplier = totalTiles / safeTiles;
  return Math.pow(baseMultiplier, safeRevealed).toFixed(2);
};

const Mines = () => {
  const [numMines, setNumMines] = useState(5);
  const [grid, setGrid] = useState(generateGrid(numMines));
  const [revealed, setRevealed] = useState(Array(GRID_SIZE * GRID_SIZE).fill(false));
  const [gameOver, setGameOver] = useState(false);
  const [bet, setBet] = useState(10);
  const [safeCount, setSafeCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentMultiplier = calculateMultiplier(numMines, safeCount);
  const potentialWin = (bet * currentMultiplier).toFixed(2);

  // Fetch initial wallet balance
  useEffect(() => {
    const fetchWalletData = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Please log in to play");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get("https://anti-gambling-backend.onrender.com/wallet", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setWalletBalance(response.data.balance);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch wallet data");
        setLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  const updateBackendBalance = async (newBalance, gameResult) => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      await axios.post(
        "https://anti-gambling-backend.onrender.com/wallet/update",
        {
          balance: newBalance,
          gameResult,
          betAmount: bet
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
    } catch (err) {
      console.error("Failed to update balance:", err);
      setError("Failed to update balance");
    }
  };

  const handleTileClick = async (index) => {
    if (!isPlaying || gameOver || revealed[index]) return;

    const newRevealed = [...revealed];
    newRevealed[index] = true;
    setRevealed(newRevealed);

    if (grid[index]) {
      // Hit a mine - game over, lose bet
      setGameOver(true);
      setIsPlaying(false);
      await updateBackendBalance(walletBalance, "bust");
    } else {
      setSafeCount((prev) => prev + 1);
    }
  };

  const handleStartGame = async () => {
    if (bet > walletBalance || bet <= 0 || !localStorage.getItem("authToken")) return;
    
    try {
      const newBalance = walletBalance - bet;
      await updateBackendBalance(newBalance, "start");
      setWalletBalance(newBalance);
      setIsPlaying(true);
      handleRestart();
    } catch (err) {
      setError("Failed to start game");
    }
  };

  const handleCashout = async () => {
    if (!isPlaying || gameOver) return;

    try {
      const winnings = parseFloat(potentialWin);
      const newBalance = walletBalance + winnings;
      await updateBackendBalance(newBalance, "player_wins");
      setWalletBalance(newBalance);
      setGameOver(true);
      setIsPlaying(false);
    } catch (err) {
      setError("Failed to process winnings");
    }
  };

  const handleRestart = () => {
    setGrid(generateGrid(numMines));
    setRevealed(Array(GRID_SIZE * GRID_SIZE).fill(false));
    setGameOver(false);
    setSafeCount(0);
  };

  if (loading) return <div style={styles.container}>Loading...</div>;
  if (error) return <div style={styles.container}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.gameCard}>
        <h2 style={styles.title}>Mines</h2>

        <div style={styles.gameInfo}>
          <div style={styles.balanceDisplay}>
            Balance: ₹{walletBalance.toFixed(2)}
          </div>
          <div style={styles.multiplierDisplay}>
            Multiplier: {currentMultiplier}x
          </div>
          {isPlaying && (
            <div style={styles.potentialWin}>
              Potential Win: ₹{potentialWin}
            </div>
          )}
        </div>

        <div style={styles.grid}>
          {grid.map((mine, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: !revealed[index] && isPlaying ? 1.05 : 1 }}
              style={styles.tile}
              onClick={() => handleTileClick(index)}
            >
              {revealed[index] && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {mine ? "💣" : "💎"}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        <div style={styles.controls}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Bet Amount
              <input
                type="number"
                value={bet}
                onChange={(e) => setBet(Number(e.target.value))}
                style={styles.input}
                disabled={isPlaying}
                min="0"
                max={walletBalance}
              />
            </label>
            <label style={styles.label}>
              Number of Mines
              <input
                type="number"
                value={numMines}
                onChange={(e) => setNumMines(Number(e.target.value))}
                style={styles.input}
                disabled={isPlaying}
                min="1"
                max={GRID_SIZE * GRID_SIZE - 1}
              />
            </label>
          </div>

          {!isPlaying ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              style={styles.button}
              onClick={handleStartGame}
              disabled={bet > walletBalance || bet <= 0}
            >
              Start Game
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              style={{ ...styles.button, backgroundColor: "#10B981" }}
              onClick={handleCashout}
              disabled={gameOver}
            >
              Cash Out
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(to bottom, #A4D7E1, #FFFFFF)",
    padding: "6rem 1rem",
  },
  gameCard: {
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: "0.75rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    padding: "1.5rem",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 600,
    color: "#004D4D",
    marginBottom: "1.5rem",
    textAlign: "center",
  },
  gameInfo: {
    textAlign: "center",
    marginBottom: "2rem",
    color: "#475569",
  },
  balanceDisplay: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#004D4D",
    marginBottom: "0.5rem",
  },
  multiplierDisplay: {
    fontSize: "1.1rem",
    color: "#004D4D",
    marginBottom: "0.5rem",
  },
  potentialWin: {
    fontSize: "1.1rem",
    color: "#10B981",
    fontWeight: "600",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
    gap: "0.25rem",
    marginBottom: "1.5rem",
    maxWidth: "400px",
    margin: "0 auto",
  },
  tile: {
    aspectRatio: "1",
    backgroundColor: "#FFFFFF",
    borderRadius: "0.375rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.25rem",
    cursor: "pointer",
    border: "1px solid #004D4D",
    transition: "all 0.2s",
  },
  controls: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  inputGroup: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "0.75rem",
    marginBottom: "0.75rem",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    color: "#475569",
  },
  input: {
    padding: "0.5rem",
    borderRadius: "0.5rem",
    border: "1px solid #E2E8F0",
    fontSize: "1rem",
  },
  button: {
    backgroundColor: "#004D4D",
    color: "#FFFFFF",
    padding: "0.75rem 1.5rem",
    borderRadius: "0.5rem",
    border: "none",
    cursor: "pointer",
    fontSize: "1.1rem",
    fontWeight: "500",
  },
};

export default Mines;