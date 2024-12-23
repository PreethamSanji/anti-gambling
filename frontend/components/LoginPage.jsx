import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import Wallet from "../Wallet";
import '@fontsource/quicksand';
import '@fontsource/comfortaa';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState(null);
  const navigate = useNavigate();

  const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(to bottom, #A4D7E1, #FFFFFF)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
    fontFamily: 'Quicksand, sans-serif',
  },
  formCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(8px)",
    borderRadius: "0.75rem",
    padding: "2rem",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#004D4D",
    marginBottom: "1rem",
    textAlign: "center",
    fontFamily: 'Comfortaa, cursive',
  },
  subtitle: {
    fontSize: "1rem",
    color: "#475569",
    marginBottom: "1.5rem",
    textAlign: "center",
    fontFamily: 'Quicksand, sans-serif',
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontSize: "0.875rem",
    color: "#004D4D",
    fontWeight: "500",
    fontFamily: 'Quicksand, sans-serif',
  },
  input: {
    padding: "0.75rem",
    borderRadius: "0.5rem",
    border: "2px solid #A4D7E1",
    fontSize: "1rem",
    transition: "all 0.2s",
    outline: "none",
    fontFamily: 'Quicksand, sans-serif',
    '&:focus': {
      borderColor: "#004D4D",
    }
  },
  button: {
    backgroundColor: "#004D4D",
    color: "white",
    padding: "0.75rem",
    borderRadius: "0.5rem",
    border: "none",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
    marginTop: "0.5rem",
    fontFamily: 'Quicksand, sans-serif',
    '&:hover': {
      backgroundColor: "#003333",
      transform: "translateY(-1px)",
    }
  },
  error: {
    color: "#dc2626",
    fontSize: "0.875rem",
    textAlign: "center",
    marginTop: "0.5rem",
    fontFamily: 'Quicksand, sans-serif',
  },
  signupPrompt: {
    textAlign: "center",
    marginTop: "1rem",
    color: "#475569",
    fontSize: "0.875rem",
    fontFamily: 'Quicksand, sans-serif',
  },
  signupLink: {
    color: "#004D4D",
    textDecoration: "none",
    marginLeft: "0.25rem",
    fontWeight: "500",
    '&:hover': {
      textDecoration: "underline",
    }
  },
};
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const fetchWalletBalance = async (token) => {
    try {
      const response = await axios.get("https://anti-gambling-backend.onrender.com/wallet", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBalance(response.data.balance);
    } catch (error) {
      console.error("Failed to fetch wallet balance:", error);
      // setError("Failed to retrieve wallet balance");
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  try {
    const response = await axios.post("https://anti-gambling-backend.onrender.com/login", formData);
    const token = response.data.token;

    // Store the token in localStorage with the correct key 'authToken'
    localStorage.setItem("authToken", token);

    // Fetch and set the wallet balance
    await fetchWalletBalance(token);

    navigate("/dashboard");
  } catch (error) {
    setError(
      error.response?.data?.message || 
      "Invalid username or password"
    );
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      fetchWalletBalance(token);
    }
  }, []);

  return (
    <div style={styles.container}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={styles.formCard}
      >
        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.subtitle}>Log in to Gambler's Dilemma</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              style={{
                ...styles.input,
                borderColor: error ? "#dc2626" : "#e2e8f0",
              }}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={{
                ...styles.input,
                borderColor: error ? "#dc2626" : "#e2e8f0",
              }}
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <motion.button
            type="submit"
            style={styles.button}
            whileHover={{ backgroundColor: "#1d4ed8" }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Log In"}
          </motion.button>
        </form>

        <div style={styles.signupPrompt}>
          Don't have an account?
          <Link to="/signup" style={styles.signupLink}>
            Sign up here
          </Link>
        </div>

        {/* {balance !== null && (
          <div style={{ textAlign: "center", marginTop: "1.5rem", color: "#1e293b", fontSize: "1.25rem" }}>
            <Wallet />
          </div>
        )} */}
      </motion.div>
    </div>
  );
};

export default LoginPage;