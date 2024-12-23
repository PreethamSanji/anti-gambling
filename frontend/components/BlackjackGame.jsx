import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from "framer-motion";
import '@fontsource/quicksand';
import '@fontsource/comfortaa';

const BlackjackGame = () => {
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [gameStatus, setGameStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [bet, setBet] = useState(10);
  const [balance, setBalance] = useState(0);
  const [showDealerCards, setShowDealerCards] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setMessage('Authentication token not found. Please log in again.');
        return;
      }

      const response = await axios.get('https://anti-gambling-backend.onrender.com/wallet', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching balance:', error.response?.data || error.message);
      setMessage(`Error fetching balance: ${error.response?.data?.message || error.message}`);
    }
  };

  const updateBalance = async (newBalance, result, betAmount) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setMessage('Authentication token not found. Please log in again.');
        return;
      }

      const response = await axios.post(
        'https://anti-gambling-backend.onrender.com/wallet/update',
        { 
          balance: newBalance,
          gameResult: result,
          betAmount: betAmount
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setBalance(response.data.balance);
      return true;
    } catch (error) {
      console.error('Error updating balance:', error.response?.data || error.message);
      setMessage(`Error updating balance: ${error.response?.data?.message || error.message}`);
      return false;
    }
  };

  const initializeDeck = () => {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const newDeck = suits.flatMap(suit => 
      values.map(value => ({ suit, value }))
    );
    
    // Shuffle
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    
    return newDeck;
  };

  const calculateHandValue = (hand) => {
    let value = 0;
    let aces = 0;

    hand.forEach(card => {
      if (card.value === 'A') {
        aces += 1;
        value += 11;
      } else if (['K', 'Q', 'J'].includes(card.value)) {
        value += 10;
      } else {
        value += parseInt(card.value);
      }
    });

    while (value > 21 && aces > 0) {
      value -= 10;
      aces -= 1;
    }

    return value;
  };

  const dealCards = async () => {
    if (bet > balance) {
      setMessage('Insufficient balance');
      return;
    }
    if (bet <= 0) {
      setMessage('Invalid bet amount');
      return;
    }

    const newDeck = initializeDeck();
    const newPlayerHand = [newDeck.pop(), newDeck.pop()];
    const newDealerHand = [newDeck.pop(), newDeck.pop()];

    setDeck(newDeck);
    setPlayerHand(newPlayerHand);
    setDealerHand(newDealerHand);
    setGameStatus('playing');
    setShowDealerCards(false);
    setMessage('');

    // Deduct bet immediately
    const deductResult = await updateBalance(balance - bet, 'bet', bet);
    if (!deductResult) {
      return;
    }

    // Check for blackjack
    if (calculateHandValue(newPlayerHand) === 21) {
      handleGameEnd('blackjack');
    }
  };

  const hit = () => {
    if (gameStatus !== 'playing') return;

    const newDeck = [...deck];
    const card = newDeck.pop();
    const newPlayerHand = [...playerHand, card];
    
    setDeck(newDeck);
    setPlayerHand(newPlayerHand);

    if (calculateHandValue(newPlayerHand) > 21) {
      handleGameEnd('bust');
    }
  };

  const stand = () => {
    if (gameStatus !== 'playing') return;

    let newDeck = [...deck];
    let newDealerHand = [...dealerHand];

    while (calculateHandValue(newDealerHand) < 17) {
      newDealerHand.push(newDeck.pop());
    }

    setDeck(newDeck);
    setDealerHand(newDealerHand);
    setShowDealerCards(true);

    const playerValue = calculateHandValue(playerHand);
    const dealerValue = calculateHandValue(newDealerHand);

    if (dealerValue > 21) {
      handleGameEnd('dealer_bust');
    } else if (dealerValue > playerValue) {
      handleGameEnd('dealer_wins');
    } else if (dealerValue < playerValue) {
      handleGameEnd('player_wins');
    } else {
      handleGameEnd('push');
    }
  };

  const handleGameEnd = async (result) => {
    setGameStatus('finished');
    setShowDealerCards(true);

    let newBalance = balance;
    let message = '';

    switch (result) {
      case 'blackjack':
        newBalance += bet * 2.5;
        message = 'Blackjack! You win!';
        break;
      case 'dealer_bust':
      case 'player_wins':
        newBalance += bet * 2;
        message = 'You win!';
        break;
      case 'push':
        newBalance += bet;
        message = 'Push - your bet is returned';
        break;
      case 'bust':
      case 'dealer_wins':
        message = result === 'bust' ? 'Bust! You lose!' : 'Dealer wins!';
        break;
    }

    const updateResult = await updateBalance(newBalance, result, bet);
    if (updateResult) {
      setMessage(message);
    }
  };

  return (
    <div className="container">
      <div className="game-wrapper">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="blackjack-container"
        >
          <h1 className="game-title">Blackjack</h1>
          
          <div className="game-info">
            <div className="balance">Balance: ₹{balance.toFixed(2)}</div>
            <div className="bet-controls">
              <input
                type="number"
                value={bet}
                onChange={(e) => setBet(Math.max(0, Number(e.target.value)))}
                disabled={gameStatus === 'playing'}
                className="bet-input"
              />
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={dealCards}
                disabled={gameStatus === 'playing' || bet > balance}
                className="game-button"
              >
                Deal
              </motion.button>
            </div>
          </div>
  
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="message"
            >
              {message}
            </motion.div>
          )}
  
          <div className="game-area">
            <div className="hand dealer-hand">
              <h3>Dealer's Hand ({showDealerCards ? calculateHandValue(dealerHand) : '?'})</h3>
              <div className="cards">
                {dealerHand.map((card, index) => (
                  <motion.div 
                    key={index}
                    initial={{ rotateY: 180, scale: 0 }}
                    animate={{ rotateY: !showDealerCards && index === 1 ? 180 : 0, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                    className={`card ${(card.suit === '♥' || card.suit === '♦') ? 'red' : 'black'}`}
                  >
                    {!showDealerCards && index === 1 ? '?' : `${card.value}${card.suit}`}
                  </motion.div>
                ))}
              </div>
            </div>
  
            <div className="hand player-hand">
              <h3>Your Hand ({calculateHandValue(playerHand)})</h3>
              <div className="cards">
                {playerHand.map((card, index) => (
                  <motion.div 
                    key={index}
                    initial={{ rotateY: 180, scale: 0 }}
                    animate={{ rotateY: 0, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                    className={`card ${(card.suit === '♥' || card.suit === '♦') ? 'red' : 'black'}`}
                  >
                    {card.value}{card.suit}
                  </motion.div>
                ))}
              </div>
            </div>
  
            <div className="game-controls">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={hit}
                disabled={gameStatus !== 'playing'}
                className="game-button"
              >
                Hit
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stand}
                disabled={gameStatus !== 'playing'}
                className="game-button"
              >
                Stand
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
  
      <style jsx>{`
        .container {
  min-height: 100vh;
  background: linear-gradient(to bottom, #A4D7E1, #FFFFFF);
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-wrapper {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.blackjack-container {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  
}

.game-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #004D4D;
  text-align: center;
  margin-bottom: 1rem;
  font-family: 'Comfortaa', cursive;
}

.game-info {
  margin-bottom: 1rem;
  padding: 0.75rem;
}

.game-area {
  gap: 1rem;
  
}

.hand {
  padding: 1rem;
}

.hand h3 {
  margin-bottom: 0.75rem;
}
        .balance {
          font-size: 1.25rem;
          font-weight: 600;
          color: #004D4D;
        }
  
        .bet-controls {
          display: flex;
          gap: 1rem;
        }
  
        .bet-input {
          padding: 0.75rem;
          border: 2px solid #A4D7E1;
          border-radius: 0.5rem;
          outline: none;
          font-family: 'Quicksand', sans-serif;
          transition: border-color 0.2s;
        }
  
        .bet-input:focus {
          border-color: #004D4D;
        }
  
        .message {
          padding: 1rem;
          margin: 1rem 0;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 0.75rem;
          text-align: center;
          color: #004D4D;
          font-weight: 500;
        }
  
        
  
        .cards {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }
  
        .card {
          width: 80px;
          height: 120px;
          border: 2px solid #A4D7E1;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          perspective: 1000px;
        }
  
        .card.red {
          color: #dc2626;
        }
  
        .card.black {
          color: #1f2937;
        }
  
        .game-controls {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
        }
  
        .game-button {
          background: #004D4D;
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          font-family: 'Quicksand', sans-serif;
          transition: all 0.2s;
        }
  
        .game-button:disabled {
          background: #9CA3AF;
          cursor: not-allowed;
        }
  
        .game-button:hover:not(:disabled) {
          background: #003333;
        }
      `}</style>
    </div>
  );
};

export default BlackjackGame;