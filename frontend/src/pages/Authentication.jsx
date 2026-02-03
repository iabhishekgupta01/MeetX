import React, { useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import styles from "../styles/Authentication.module.css";


export default function Authentication() {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  

  const { handleLogin, handleRegister } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isSignup) {
        const res = await handleRegister(name, username, password);
        setMessage(res || "Account created successfully 🎉");
        setIsSignup(false);
      } else {
        console.log("Logging in");
        await handleLogin(username, password);
        console.log("Logged in successfully");
        window.location.href = "/";
      }

      setName("");
      setUsername("");
      setPassword("");
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.authBox}>
        
        {/* LEFT IMAGE PANEL */}
        <div className={styles.imagePanel}>
          <img
            src="authentication.gif"
            alt="authentication"
          />
          <h3>Secure Access</h3>
          <p>Your data is protected.</p>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className={styles.formPanel}>
          <h2>{isSignup ? "Create Account" : "Welcome Back"}</h2>
          <p className={styles.subtitle}>
            {isSignup
              ? "Create your account to get started"
              : "Login to continue"}
          </p>

          <div className={styles.tabs}>
            <button
              className={!isSignup ? styles.active : ""}
              onClick={() => setIsSignup(false)}
            >
              Login
            </button>
            <button
              className={isSignup ? styles.active : ""}
              onClick={() => setIsSignup(true)}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {isSignup && (
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}

            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <div className={styles.error}>{error}</div>}
            {message && <div className={styles.success}>{message}</div>}

            <button type="submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : isSignup
                ? "Create Account"
                : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
