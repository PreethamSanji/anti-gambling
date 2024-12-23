// Wallet.js
import { useEffect, useState } from "react";
import axios from "axios";

const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        // Replace with your actual API to get the wallet balance.
        const token = localStorage.getItem("token"); // Assuming token is stored in localStorage after login
        const response = await axios.get("https://anti-gambling-backend.onrender.com/wallet", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setBalance(response.data.balance);
      } catch (err) {
        console.error("Error fetching wallet balance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="wallet-info">
      <span>Balance: ₹{balance}</span>
    </div>
  );
};

export default Wallet;