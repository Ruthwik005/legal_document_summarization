import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ResetOtp.css";

const ResetOtp = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine); // Initial network state
  const navigate = useNavigate();
  const location = useLocation();
  const inputRefs = useRef([]);

  useEffect(() => {
    const resetEmail = location.state?.email || localStorage.getItem("resetEmail");
    if (!resetEmail) {
      navigate("/ForgetPassword");
      return;
    }
    setEmail(resetEmail);
    localStorage.setItem("resetEmail", resetEmail);
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [navigate, location]);

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

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }

    if (newOtp.every((digit) => digit !== "")) {
      verifyOtp(newOtp.join(""));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1].focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text/plain").trim();
    if (/^\d{6}$/.test(pasteData)) {
      const pasteArray = pasteData.split("").slice(0, 6);
      setOtp(pasteArray);
      verifyOtp(pasteData);
    }
  };

  const verifyOtp = async (fullOtp) => {
    if (!navigator.onLine) {
      setIsOffline(true); // Ensure banner is shown
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0].focus();
      return;
    }

    try {
      setIsVerifying(true);
      const response = await fetch("http://localhost:8080/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: fullOtp }),
      });

      const result = await response.json();
      if (response.ok) {
        localStorage.setItem("resetToken", result.token);
        localStorage.setItem("tokenExpiry", Date.now() + 15 * 60 * 1000);
        toast.success("OTP verified! Redirecting...", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          onClose: () => navigate("/ResetPassword"),
        });
      } else {
        toast.error(result.message || "Invalid OTP", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0].focus();
      }
    } catch (error) {
      toast.error("Network error. Please try again.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0].focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const resendOtp = async () => {
    if (!navigator.onLine) {
      setIsOffline(true); // Ensure banner is shown
      return;
    }

    try {
      setIsResending(true);
      const response = await fetch("http://localhost:8080/auth/ForgetPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        toast.success("New OTP sent!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0].focus();
      } else {
        const result = await response.json();
        toast.error(result.error || "Failed to resend OTP", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      toast.error("Failed to resend. Try again later.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleDismissOffline = () => {
    setIsOffline(false);
  };

  return (
    <div className="resetotp-page-wrapper">
      <div className="resetotp-card">
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

        <div className="resetotp-container">
          <h2 className="resetotp-title">Password Reset Verification</h2>
          <p className="resetotp-subtitle">
            Enter the OTP sent to <strong className="resetotp-email">{email}</strong>
          </p>

          <div className="resetotp-inputs" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                id={`resetotp-input-${index}`}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`resetotp-input ${isVerifying ? "resetotp-input-loading" : ""}`}
                autoFocus={index === 0}
                disabled={isVerifying}
              />
            ))}
          </div>

          {isVerifying && (
            <div className="resetotp-loading-spinner">
              <div className="resetotp-spinner-dot"></div>
              <div className="resetotp-spinner-dot"></div>
              <div className="resetotp-spinner-dot"></div>
            </div>
          )}

          <p className="resetotp-request">
            Didn't receive code?{" "}
            <button
              className={`resetotp-resend-link ${isResending ? "resetotp-resend-loading" : ""}`}
              onClick={resendOtp}
              disabled={isResending}
            >
              {isResending ? (
                <>
                  <span className="resetotp-resend-spinner"></span>
                  Sending...
                </>
              ) : (
                "Request again"
              )}
            </button>
          </p>

          <p className="resetotp-spam-note">
            <svg className="resetotp-spam-icon" viewBox="0 0 24 24" width="16" height="16">
              <path
                fill="currentColor"
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
              />
            </svg>
            If you don't see the email, please check your spam folder.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetOtp;