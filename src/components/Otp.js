import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Otp.css';

const Otp = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine); // Initial network state
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  // Handle email check and initial focus
  useEffect(() => {
    const email = localStorage.getItem('email');
    if (!email) {
      navigate('/signup');
      return;
    }
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
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
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
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

    if (newOtp.join('').length === 6) {
      verifyOtp(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1].focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const pasteArray = pasteData.split('').slice(0, 6);
      setOtp(pasteArray);
      verifyOtp(pasteData);
    }
  };

  const verifyOtp = async (fullOtp) => {
    if (!navigator.onLine) {
      setIsOffline(true); // Ensure banner is shown
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
      return;
    }

    setIsVerifying(true);
    try {
      const email = localStorage.getItem('email');
      const response = await fetch('http://localhost:8080/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: fullOtp }),
      });

      const result = await response.json();
      // Minimum delay to ensure animation visibility
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (response.ok) {
        toast.success('OTP verified successfully!', {
          position: 'top-right',
          autoClose: 3000,
          onClose: () => {
            localStorage.setItem('token', result.token);
            navigate('/signin');
          },
        });
      } else {
        toast.error(result.error || 'Invalid OTP. Please try again.', {
          position: 'top-right',
          autoClose: 5000,
        });
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0].focus();
      }
    } catch (error) {
      toast.error('Error verifying OTP. Please try again.', {
        position: 'top-right',
        autoClose: 5000,
      });
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const requestNewOtp = async () => {
    if (!navigator.onLine) {
      setIsOffline(true); // Ensure banner is shown
      return;
    }

    try {
      setIsResending(true);
      const email = localStorage.getItem('email');
      if (!email) {
        toast.error('No email found. Please sign up again.', {
          position: 'top-right',
          autoClose: 5000,
        });
        return;
      }

      const response = await fetch('http://localhost:8080/auth/request-new-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success('New OTP sent to your email.', {
          position: 'top-right',
          autoClose: 3000,
        });
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0].focus();
      } else {
        toast.error(result.error || 'Failed to request new OTP.', {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    } catch (error) {
      toast.error('Error requesting new OTP. Please try again.', {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleDismissOffline = () => {
    setIsOffline(false);
  };

  return (
    <div className="otp-page">
      <div className="otp-card">
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

        <div className="otp-container">
          <h2 className="otp-title">Verify Your Account</h2>
          <p className="otp-subtitle">
            Enter the 6-digit code sent to <strong className="otp-email">{localStorage.getItem('email')}</strong>
          </p>

          <div className="otp-inputs-container" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                id={`otp-input-${index}`}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`otp-input ${digit ? 'otp-input-has-value' : ''}`}
                autoFocus={index === 0}
                disabled={isVerifying}
              />
            ))}
          </div>

          {/* Loading animation */}
          {isVerifying && (
            <div className="otp-loading-container" aria-live="polite">
              <div className="otp-loading-spinner"></div>
              <p className="otp-loading-text">Verifying OTP...</p>
            </div>
          )}

          <p className="otp-request-text">
            Didn't receive code?{' '}
            <button
              className={`otp-resend-btn ${isResending ? 'otp-resend-btn-loading' : ''}`}
              onClick={requestNewOtp}
              disabled={isResending || isVerifying}
            >
              {isResending ? 'Sending...' : 'Resend Code'}
            </button>
          </p>

          <div className="otp-spam-message">
            <p>If you don't see the email in your inbox, please check your spam folder.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Otp;