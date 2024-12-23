import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const WalletPage = () => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchWalletData = async () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      setError("No token found, please log in.");
      setLoading(false);
      navigate("/login"); // Redirect to login page if token is not found
      return;
    }

    try {
      const response = await axios.get("https://anti-gambling-backend.onrender.com/wallet", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      // Ensure the balance is set to 0 if not defined
      setBalance(Number(data.balance) || 0); 
      setLoading(false);
    } catch (err) {
      console.error("Error fetching wallet data:", err);
      setError("Failed to fetch wallet data.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div>Loading...</div>
      </div>
    );
  }

  const renderMessage = () => {
    if (balance === 0) {
      return (
        <div style={styles.warningContainer}>
          <h3 style={styles.warningText}>You’re BROKE! 🥲</h3>
          <p style={styles.warningNote}>
            RIP your balance... it's officially dead. 💀 <br />
            "Zero balance detected. Prepare to start a new life and create a new account. 🚶‍♂️"
          </p>
          <p style={styles.extraFunnyNote}>
            You really went *all in*, huh? 🫠 Well, the casino always wins! 🎰
          </p>
        </div>
      );
    } else if (balance < 100000) {
      return (
        <div style={styles.warningContainer}>
          <h3 style={styles.warningText}>Ohhh, you're so cooked! 🫡</h3>
          <p style={styles.warningNote}>
            Your balance is looking crispy. If you hit ₹0, it's game over! Try not to let it happen. 💀
          </p>
        </div>
      );
    } else if (balance === 100000) {
      return (
        <div style={styles.edgeContainer}>
          <h3 style={styles.edgeText}>Right on the edge! 🪶</h3>
          <p style={styles.edgeNote}>
            ₹100,000 balance? Living life on the *perfectly neutral* side, huh? 🤓
          </p>
          <p style={styles.edgeExtraNote}>
            "One big win or one small loss... what’s it gonna be? 🎢"
          </p>
        </div>
      );
    } else {
      return (
        <div style={styles.successContainer}>
          <h3 style={styles.successText}>Let him cook! 🔥</h3>
          <p style={styles.successNote}>
            Big baller vibes! 💸 "Keep it rolling, you're on a streak!" 🎉
          </p>
        </div>
      );
    }
  };

  return (
    <div style={styles.container}>
      <button style={styles.backButton} onClick={() => navigate(-1)}>
        ← Back
      </button>

      {error && <div style={styles.errorAlert}>{error}</div>}

      <div style={styles.walletCard}>
        <h2 style={styles.balanceLabel}>Available Balance</h2>
        <div style={styles.balanceAmount}>₹{balance.toFixed(2)}</div>
      </div>

      {/* Conditional Message */}
      {renderMessage()}
    </div>
  );
};

const styles = {
  container: { minHeight: "100vh", padding: "2rem", background: "#f3f4f6" },
  backButton: {
    marginBottom: "1rem",
    cursor: "pointer",
    background: "none",
    border: "none",
    color: "#374151",
  },
  errorAlert: { color: "#dc2626", marginBottom: "1rem" },
  walletCard: {
    padding: "2rem",
    background: "white",
    borderRadius: "0.5rem",
    marginBottom: "2rem",
    textAlign: "center",
  },
  balanceLabel: { fontSize: "1.25rem", color: "#374151" },
  balanceAmount: { fontSize: "2rem", fontWeight: "bold", margin: "1rem 0" },
  warningContainer: {
    padding: "1rem",
    background: "#fde047",
    borderRadius: "0.5rem",
    marginTop: "1rem",
    textAlign: "center",
  },
  warningText: { fontSize: "1.5rem", color: "#d97706", fontWeight: "bold" },
  warningNote: { color: "#854d0e", marginTop: "0.5rem" },
  extraFunnyNote: { color: "#b91c1c", marginTop: "0.5rem", fontStyle: "italic" },
  edgeContainer: {
    padding: "1rem",
    background: "#c7d2fe",
    borderRadius: "0.5rem",
    marginTop: "1rem",
    textAlign: "center",
  },
  edgeText: { fontSize: "1.5rem", color: "#4f46e5", fontWeight: "bold" },
  edgeNote: { color: "#3730a3", marginTop: "0.5rem" },
  edgeExtraNote: { color: "#1e3a8a", marginTop: "0.5rem", fontStyle: "italic" },
  successContainer: {
    padding: "1rem",
    background: "#d1fae5",
    borderRadius: "0.5rem",
    marginTop: "1rem",
    textAlign: "center",
  },
  successText: { fontSize: "1.5rem", color: "#059669", fontWeight: "bold" },
  successNote: { color: "#065f46", marginTop: "0.5rem" },
};

export default WalletPage;