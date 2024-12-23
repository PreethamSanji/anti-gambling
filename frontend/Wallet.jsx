import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWalletData = async () => {
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        setError("No token found. Please log in.");
        navigate("/login"); // Redirect to login page if token is not found
        return;
      }

      try {
        const response = await axios.get("https://anti-gambling-backend.onrender.com/wallet", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBalance(response.data.balance || 0);
      } catch (err) {
        console.error("Error fetching wallet data:", err);
        setError("Failed to fetch wallet data. Please try again.");
      }
    };

    fetchWalletData();
  }, [navigate]);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="wallet-container">
      <h2>Your Wallet</h2>
      <p>Balance: ₹{balance.toFixed(2)}</p>
    </div>
  );
};

export default Wallet;
