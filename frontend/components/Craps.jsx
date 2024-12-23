import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from "react-router-dom";


const Craps = () => {
  const navigate = useNavigate();

  const [dice, setDice] = useState([1, 1]);
  const [rolling, setRolling] = useState(false);
  const [point, setPoint] = useState(null);
  const [bet, setBet] = useState(0);
  const [balance, setBalance] = useState(null);
  const [betType, setBetType] = useState('pass');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);

  // Fetch initial wallet balance
  useEffect(() => {
    const fetchWalletData = async () => {
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        setError("No token found, please log in.");
        return;
      }

      try {
        const response = await axios.get("https://anti-gambling-backend.onrender.com/wallet", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setBalance(response.data.balance);
        setError(null);
      } catch (err) {
        setError("Failed to fetch wallet data");
        console.error("Error fetching wallet:", err);
      }
    };

    fetchWalletData();
  }, []);

  const updateWalletBalance = async (newBalance, gameResult, betAmount) => {
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
          gameResult,
          betAmount
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setBalance(response.data.balance);
      setError(null);
    } catch (err) {
      setError("Failed to update wallet");
      console.error("Error updating wallet:", err);
    }
  };

  const rollDice = () => {
    if (rolling || bet === 0) return;

    setRolling(true);
    setMessage('');

    const newDice = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
    ];

    setTimeout(() => {
      setDice(newDice);
      setRolling(false);
      handleRollResult(newDice[0] + newDice[1]);
    }, 1000);
  };

  const handleRollResult = async (total) => {
    let gameResult = '';
    let newBalance = balance;

    if (!point) {
      // Come out roll
      if (total === 7 || total === 11) {
        if (betType === 'pass') {
          newBalance = balance + bet * 2;
          gameResult = 'player_wins';
          setMessage('Pass Line wins!');
        } else {
          gameResult = 'dealer_wins';
          setMessage('Don\'t Pass Line loses!');
        }
        setBet(0);
      } else if (total === 2 || total === 3 || total === 12) {
        if (betType === 'dontPass') {
          newBalance = balance + bet * 2;
          gameResult = 'player_wins';
          setMessage('Don\'t Pass Line wins!');
        } else {
          gameResult = 'dealer_wins';
          setMessage('Pass Line loses!');
        }
        setBet(0);
      } else {
        setPoint(total);
        setMessage(`Point is ${total}`);
        return; // Don't update wallet for point establishment
      }
    } else {
      // Point phase
      if (total === point) {
        if (betType === 'pass') {
          newBalance = balance + bet * 2;
          gameResult = 'player_wins';
          setMessage('Pass Line wins!');
        } else {
          gameResult = 'dealer_wins';
          setMessage('Don\'t Pass Line loses!');
        }
        setPoint(null);
        setBet(0);
      } else if (total === 7) {
        if (betType === 'dontPass') {
          newBalance = balance + bet * 2;
          gameResult = 'player_wins';
          setMessage('Don\'t Pass Line wins!');
        } else {
          gameResult = 'dealer_wins';
          setMessage('Pass Line loses!');
        }
        setPoint(null);
        setBet(0);
      } else {
        return; // Don't update wallet for ongoing point phase rolls
      }
    }

    // Update wallet balance in backend and state
    await updateWalletBalance(newBalance, gameResult, bet);
  };

  const placeBet = async (amount) => {
    if (amount <= balance && !rolling) {
      setBet(amount);
      const newBalance = balance - amount;
      setBalance(newBalance);
      // Update wallet when placing bet
      await updateWalletBalance(newBalance, 'bet_placed', amount);
    }
  };

  if (balance === null) {
    return <div style={styles.loading}>Loading wallet...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.gameCard}>
        <h2 style={styles.title}>Craps</h2>

        <div style={styles.gameInfo}>
          <div style={styles.balanceDisplay}>Balance: ₹{balance.toFixed(2)}</div>
          {point && <div>Point: {point}</div>}
          <div>Current Bet: ₹{bet}</div>
          {message && <div style={styles.message}>{message}</div>}
        </div>

        <div style={styles.diceContainer}>
          {dice.map((die, index) => (
            <motion.div
              key={index}
              style={styles.die}
              animate={{
                rotate: rolling ? 360 : 0,
                scale: rolling ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 1 }}
            >
              {die}
            </motion.div>
          ))}
        </div>

        <div style={styles.bettingControls}>
          <div style={styles.betButtons}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              style={{
                ...styles.button,
                backgroundColor: betType === 'pass' ? '#004D4D' : '#9CA3AF',
              }}
              onClick={() => setBetType('pass')}
              disabled={rolling || bet > 0}
            >
              Pass Line
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              style={{
                ...styles.button,
                backgroundColor: betType === 'dontPass' ? '#004D4D' : '#9CA3AF',
              }}
              onClick={() => setBetType('dontPass')}
              disabled={rolling || bet > 0}
            >
              Don't Pass
            </motion.button>
          </div>

          <div style={styles.betAmounts}>
            {[10, 25, 50, 100].map((amount) => (
              <motion.button
                key={amount}
                whileHover={{ scale: 1.05 }}
                style={styles.button}
                onClick={() => placeBet(amount)}
                disabled={rolling || bet > 0 || amount > balance}
              >
                ₹{amount}
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            style={{
              ...styles.button,
              padding: '1rem 2rem',
              fontSize: '1.2rem',
              backgroundColor: rolling || bet === 0 ? '#9CA3AF' : '#004D4D',
            }}
            onClick={rollDice}
            disabled={rolling || bet === 0}
          >
            {rolling ? 'Rolling...' : 'Roll Dice'}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  // ... (keeping all existing styles)
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom, #A4D7E1, #FFFFFF)',
    padding: '6rem 1rem',
  },
  gameCard: {
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '0.75rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    padding: '2rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#004D4D',
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  gameInfo: {
    textAlign: 'center',
    marginBottom: '2rem',
    color: '#475569',
  },
  balanceDisplay: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#004D4D',
    marginBottom: '0.5rem',
  },
  message: {
    fontSize: '1rem',
    color: '#333333',
    marginTop: '1rem',
  },
  diceContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    marginBottom: '2rem',
  },
  die: {
    width: '60px',
    height: '60px',
    backgroundColor: '#FFFFFF',
    color: '#004D4D',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.5rem',
    fontSize: '24px',
    fontWeight: 'bold',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  bettingControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    alignItems: 'center',
  },
  betButtons: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
  },
  betAmounts: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
    gap: '0.5rem',
    width: '100%',
    maxWidth: '400px',
  },
  button: {
    backgroundColor: '#004D4D',
    color: '#FFFFFF',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    fontSize: '1.2rem',
    color: '#004D4D',
  },
  error: {
    textAlign: 'center',
    padding: '2rem',
    fontSize: '1.2rem',
    color: '#DC2626',
  },
};

export default Craps;