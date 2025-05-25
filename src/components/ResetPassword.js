import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./ResetPassword.css";

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine); // Initial network state
  const navigate = useNavigate();

  // Handle token expiry and offline detection
  useEffect(() => {
    const token = localStorage.getItem("resetToken");
    const expiry = localStorage.getItem("tokenExpiry");
    
    if (!token || Date.now() > parseInt(expiry)) {
      localStorage.removeItem("resetToken");
      localStorage.removeItem("tokenExpiry");
      localStorage.removeItem("resetEmail");
      toast.error("Session expired. Please request a new OTP.", {
        position: "top-right",
        autoClose: 5000,
      });
      setTimeout(() => navigate("/forgot-password"), 3000);
    }
  }, [navigate]);

  // Handle offline/online detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const validatePassword = (pass) => {
    if (pass.length < 7) {
      setPasswordError("Password must be at least 7 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const validateConfirmPassword = (confirmPass) => {
    if (confirmPass !== password) {
      setConfirmPasswordError("Passwords don't match");
      return false;
    }
    setConfirmPasswordError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    if (!navigator.onLine) {
      setIsOffline(true); // Ensure banner is shown
      return;
    }

    const token = localStorage.getItem("resetToken");

    try {
      const response = await fetch("http://localhost:8080/auth/ResetPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      if (response.ok) {
        localStorage.removeItem("resetToken");
        localStorage.removeItem("tokenExpiry");
        localStorage.removeItem("resetEmail");
        toast.success("Password reset successful! Redirecting...", {
          position: "top-right",
          autoClose: 3000,
          onClose: () => navigate("/signin"),
        });
      } else {
        const error = await response.json();
        toast.error(error.message || "Password reset failed", {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } catch (err) {
      toast.error("Network error. Please try again.", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  const handleDismissOffline = () => {
    setIsOffline(false);
  };

  return (
    <div className="reset-password-container">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Custom Offline Notification */}
      {isOffline && (
        <div className="offline-banner" role="alert">
          <span>You are offline. Please check your internet connection.</span>
          <button
            className="offline-banner-close"
            onClick={handleDismissOffline}
            aria-label="Dismiss offline notification"
          >
            ×
          </button>
        </div>
      )}

      <div className="resetforgotcard">
        <div className="resetforgotform-container">
          <h1 className="resetforgotheadingH1">Reset Password</h1>
          <p>Enter your new password (minimum 7 characters)</p>

          <div className="resetforgotinput-container">
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validatePassword(e.target.value);
                if (confirmPassword) validateConfirmPassword(confirmPassword);
              }}
              required
              minLength="7"
            />
            {passwordError && <div className="error-message">{passwordError}</div>}
          </div>

          <div className="resetforgotinput-container">
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                validateConfirmPassword(e.target.value);
              }}
              required
              minLength="7"
            />
            {confirmPasswordError && <div className="error-message">{confirmPasswordError}</div>}
          </div>

          <button
            className="resetforgotreset-button"
            onClick={handleSubmit}
            disabled={passwordError || confirmPasswordError || password.length < 7}
          >
            Reset Password
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;