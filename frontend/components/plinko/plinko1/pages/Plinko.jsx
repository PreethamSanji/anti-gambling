import { useEffect, useRef, useState } from "react"
import { BallManager } from "../game/classes/BallManager"
import axios from "axios"
import '@fontsource/quicksand'
import '@fontsource/comfortaa'
import { useNavigate } from "react-router-dom";

const baseURL = "https://anti-gambling-backend.onrender.com";

const Plinko = () => {
  const navigate = useNavigate();
  const [ballManager, setBallManager] = useState()
  const [betAmount, setBetAmount] = useState(0)
  const [multiplier, setMultiplier] = useState(0)
  const [result, setResult] = useState(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [showMultiplier, setShowMultiplier] = useState(false)
  const [error, setError] = useState(null)
  const canvasRef = useRef()

  // Fetch initial wallet balance
  useEffect(() => {
    const fetchWalletBalance = async () => {
      const token = localStorage.getItem("authToken")
      if (!token) {
        setError("No token found, please log in.")
        return
      }

      try {
        const response = await axios.get("https://anti-gambling-backend.onrender.com/wallet", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setWalletBalance(response.data.balance || 0)
      } catch (error) {
        console.error("Error fetching wallet balance:", error)
        setError("Failed to fetch wallet balance.")
      }
    }

    fetchWalletBalance()
  }, [])

  useEffect(() => {
    if (canvasRef.current) {
      const ballManager = new BallManager(canvasRef.current)
      ballManager.onBallLand = () => {
        setShowResult(true)
      }
      setBallManager(ballManager)
    }
  }, [canvasRef])

  const updateWalletBalance = async (newBalance, gameResult, betAmount) => {
    const token = localStorage.getItem("authToken")
    if (!token) {
      setError("No token found, please log in.")
      return
    }

    try {
      await axios.post(
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
      )
    } catch (error) {
      console.error("Error updating wallet balance:", error)
      setError("Failed to update wallet balance.")
    }
  }

  const handleAddBall = async () => {
    try {
      if (betAmount <= 0) {
        alert("Please enter a valid bet amount!")
        return
      }

      if (betAmount > walletBalance) {
        alert("Insufficient balance!")
        return
      }

      setResult(null)
      setShowMultiplier(false)
      
      // Deduct bet amount locally and update backend
      const newBalance = walletBalance - betAmount
      setWalletBalance(newBalance)
      await updateWalletBalance(newBalance, "plinko_bet", betAmount)

      const response = await axios.post(`${baseURL}/game`, {
        data: betAmount
      })
      
      if (ballManager) {
        ballManager.addBall(response.data.point)
        
        // Add delay for multiplier display
        setTimeout(async () => {
          setShowMultiplier(true)
          setMultiplier(response.data.multiplier)
          const winAmount = betAmount * response.data.multiplier
          setResult(winAmount)
          
          // Update wallet with winnings and sync with backend
          const finalBalance = newBalance + winAmount
          setWalletBalance(finalBalance)
          await updateWalletBalance(
            finalBalance,
            winAmount > betAmount ? "plinko_win" : "plinko_loss",
            betAmount
          )
        }, 3200)
      }
    } catch (error) {
      console.error("Error in game:", error)
      setError("Error occurred during game play.")
      // Restore the original balance if there's an error
      const response = await axios.get("https://anti-gambling-backend.onrender.com/wallet", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      })
      setWalletBalance(response.data.balance || 0)
    }
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>
  }

  return(
    <div className="min-h-screen bg-gradient-to-b from-[#A4D7E1] to-white font-['Quicksand']">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        <h1 className="text-4xl font-bold text-center text-[#004D4D] mb-8 font-['Comfortaa']">
          Plinko
        </h1>
        
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Control Panel */}
          <div className="w-full lg:w-1/4 bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-6 space-y-6">
          
            <h2 className="text-2xl font-semibold text-[#004D4D] font-['Comfortaa']">
              Controls
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Bet Amount
                </label>
                <input 
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#004D4D] focus:border-transparent transition duration-200"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Multiplier
                </label>
                <div className="text-2xl font-bold text-[#004D4D]">
                  {multiplier}x
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Result
                </label>
                <div className="text-2xl font-bold text-[#004D4D]">
                  {result && `₹${result.toFixed(2)}`}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Wallet Balance
                </label>
                <div className="text-2xl font-bold text-[#004D4D]">
                  ₹{walletBalance.toFixed(2)}
                </div>
              </div>

              <button 
                onClick={handleAddBall}
                className="w-full bg-[#004D4D] hover:bg-[#003333] text-white font-medium py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105"
              >
                Drop Ball
              </button>
              
            </div>
            
          </div>

          {/* Game Canvas */}
          <div className="w-full lg:w-[65%]">
            <canvas 
              ref={canvasRef} 
              width="800" 
              height="800"
              className="w-full bg-white rounded-xl shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Plinko