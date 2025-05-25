import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./SignIn.css";
import { jwtDecode } from "jwt-decode";

const GoogleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="24px"
    height="24px"
  >
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
    />
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </svg>
);

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine); // Initial network state

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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const emailParam = params.get("email");
    if (token && emailParam) {
      localStorage.removeItem('token');
      localStorage.removeItem('email');
      try {
        const decoded = jwtDecode(token);
        localStorage.setItem("token", token);
        localStorage.setItem("email", emailParam);
        navigate(decoded.isAdmin ? "/admin/dashboard" : "/Dash", { replace: true });
      } catch (error) {
        toast.error("Google signin failed. Please try again.", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    }
  }, [location, navigate]);

  const onSubmit = async (data) => {
    if (!navigator.onLine) {
      setIsOffline(true); // Ensure banner is shown
      return;
    }

    setIsLoading(true);
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('email');

      const response = await fetch("http://localhost:8080/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (response.ok) {
        localStorage.setItem("token", result.token);
        localStorage.setItem("email", result.email);
        navigate(result.isAdmin ? "/admin/dashboard" : "/Dash", { replace: true });
      } else {
        toast.error(result.error || "Signin failed", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });

        if (result.error === "User does not exist. Please sign up.") {
          setTimeout(() => navigate("/signup", { replace: true }), 3000);
        }
      }
    } catch (error) {
      toast.error("Error during signin. Please try again.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (!navigator.onLine) {
      setIsOffline(true); // Show banner if offline
      return;
    }
    window.location.href = "http://localhost:8080/auth/google";
  };

  const handleForgotPassword = () => {
    navigate("/ForgetPassward", { replace: true });
  };

  const handleDismissOffline = () => {
    setIsOffline(false);
  };

  return (
    <div className="signin-container">
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

      <div className="signin-form-box">
        <h2 className="signin-title">Sign in</h2>
        <p className="signin-subtitle">
          Welcome back! Don't have an account?{" "}
          <span className="signin-link" onClick={() => navigate("/signup", { replace: true })}>
            Sign up
          </span>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="signin-form">
          <div className="signin-form-group">
            <label className="signin-label">Email address</label>
            <div className="signin-input-wrapper">
              <input
                type="email"
                {...register("email", { required: "Email is required" })}
                className="signin-input"
              />
            </div>
            {errors.email && <p className="signin-error">{errors.email.message}</p>}
          </div>

          <div className="signin-form-group">
            <label className="signin-label">Password</label>
            <div className="signin-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password", { required: "Password is required" })}
                className="signin-input"
              />
              <button
                type="button"
                className="signin-eye-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <p className="signin-error">{errors.password.message}</p>}
          </div>

          <button type="submit" className="signin-submit-btn" disabled={isLoading}>
            {isLoading ? (
              <div className="signin-loading-content">
                <div className="signin-loading-spinner"></div>
                <span>Signing in...</span>
              </div>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <button className="signin-social-btn signin-google-btn" onClick={handleGoogleSignIn}>
          <GoogleIcon /> Sign in with Google
        </button>

        <p className="signin-forgot-password">
          Forgot your password?{" "}
          <span className="signin-link" onClick={handleForgotPassword}>
            Reset it
          </span>
        </p>
      </div>
    </div>
  );
}