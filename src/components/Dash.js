import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Upload, FileText, Download, MessageSquare,
  HelpCircle, BookOpen, Users, ShieldCheck,
  Lightbulb, Facebook, Twitter, Instagram,
  Linkedin, User, LogOut, Notebook
} from "lucide-react";
import { SnackbarProvider, useSnackbar } from 'notistack';
import "./Dash.css";
import axios from 'axios';

const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decodedToken = JSON.parse(window.atob(base64));
    return decodedToken;
  } catch (error) {
    return null;
  }
};

function DashContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [userData, setUserData] = useState({
    name: "User",
    email: "user@example.com",
  });
  const [hasNewBlog, setHasNewBlog] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const getImageSrc = (size = "") => {
    const storedImage = localStorage.getItem("image");
    if (storedImage) {
      try {
        new URL(storedImage);
        return storedImage;
      } catch (e) {
      }
    }

    const name = localStorage.getItem("username") || "User";
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}${size}&background=random`;
    return fallbackUrl;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    const urlEmail = urlParams.get("email");
    const urlImage = urlParams.get("image");

    if (urlToken) {
      localStorage.setItem("token", urlToken);
      localStorage.setItem("email", urlEmail || "");
      if (urlImage) {
        localStorage.setItem("image", urlImage);
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (token || urlToken) {
      const decodedToken = decodeJWT(token || urlToken);
      if (decodedToken) {
        const username = decodedToken.username || decodedToken.name || "User";
        const email = decodedToken.email || urlEmail || "user@example.com";
        const image = decodedToken.image || urlImage;

        if (image) {
          localStorage.setItem("image", image);
        }

        localStorage.setItem("username", username);
        localStorage.setItem("email", email);

        setUserData({
          name: username,
          email,
        });
      }
    }

    const checkNewBlogs = async () => {
      if (!navigator.onLine) {
        return;
      }

      try {
        const response = await axios.get('http://localhost:8080/api/blog-posts', {
          params: { limit: 1, sort: '-createdAt' }
        });
        const latestPost = response.data[0];
        const lastVisited = localStorage.getItem('lastBlogVisit');
        
        if (latestPost && (!lastVisited || new Date(latestPost.createdAt) > new Date(lastVisited))) {
          setHasNewBlog(true);
        }
      } catch (error) {
        // Silently fail
      }
    };

    checkNewBlogs();
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
    setProfileOpen(false);
    enqueueSnackbar("You have been logged out", {
      variant: 'info',
      anchorOrigin: { vertical: 'top', horizontal: 'right' },
      autoHideDuration: 5000,
    });
  };

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) {
      enqueueSnackbar("Feedback cannot be empty!", {
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' },
        autoHideDuration: 5000,
      });
      return;
    }

    if (!navigator.onLine) {
      enqueueSnackbar("You are offline. Please check your internet connection.", {
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' },
        autoHideDuration: 5000,
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        'http://localhost:8080/api/feedback',
        { content: feedback },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      enqueueSnackbar("Feedback submitted successfully!", {
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'right' },
        autoHideDuration: 5000,
      });
      setFeedback('');
    } catch (error) {
      enqueueSnackbar("Failed to submit feedback. Please try again.", {
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' },
        autoHideDuration: 5000,
      });
    }
  };

  const handleDismissOffline = () => {
    setIsOffline(false);
  };

  const handleUploadCardClick = (e) => {
    if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
      navigate("/Summarization");
    }
  };

  const handleUploadCardKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate("/Summarization");
    }
  };

  const handleQACardClick = (e) => {
    if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
      navigate("/QAPage");
    }
  };

  const handleQACardKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate("/QAPage");
    }
  };

  return (
    <div className="dash-container">
      {isOffline && (
        <div className="offline-banner animate-slide-in-right" role="alert">
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

      <header className="dash-header">
        <h1 className="dash-logo">LexiMind</h1>
        <nav className="dash-desktop-nav">
          <ul className="dash-nav-list">
            <li><a href="#dash-hero" className="dash-nav-link">Home</a></li>
            <li><a href="#dash-how-it-works" className="dash-nav-link">How It Works</a></li>
            <li><a href="#dash-about" className="dash-nav-link">About Us</a></li>
            <li className="dash-nav-item">
              <Link to="/blog" className="dash-nav-link">
                Blog
                {hasNewBlog && <span className="dash-notification-dot"></span>}
              </Link>
            </li>
            <li><a href="#dash-feedback" className="dash-nav-link">Feedback</a></li>
            <li className="dash-profile-container">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="dash-profile-button"
                aria-label="Profile menu"
              >
                <div className="dash-profile-avatar">
                  <img
                    src={getImageSrc()}
                    alt="Profile"
                    className="dash-profile-image"
                    onError={(e) => {
                      const name = localStorage.getItem("username") || "User";
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        name
                      )}&background=random`;
                    }}
                  />
                  <span className="dash-profile-indicator"></span>
                </div>
              </button>
              {profileOpen && (
                <div className={`dash-profile-dropdown animate-flip-in ${profileOpen ? 'dash-dropdown-open' : ''}`}>
                  <div className="dash-profile-info">
                    <img
                      src={getImageSrc('&size=128')}
                      alt="Profile"
                      className="dash-profile-large-image"
                      onError={(e) => {
                        const name = localStorage.getItem("username") || "User";
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          name
                        )}&background=random&size=128`;
                      }}
                    />
                    <p className="dash-profile-name">{userData.name}</p>
                    <p className="dash-profile-email">{userData.email}</p>
                  </div>
                  <div className="dash-profile-actions">
                    <Link to="/ProfileWeb" className="dash-profile-action" onClick={() => setProfileOpen(false)}>
                      <User size={20} className="dash-action-icon" />
                      My Profile
                    </Link>
                    <Link to="/NotesApp" className="dash-profile-action" onClick={() => setProfileOpen(false)}>
                      <Notebook size={20} className="dash-action-icon" />
                      My Notes
                    </Link>
                    <button className="dash-profile-action" onClick={handleLogout}>
                      <LogOut size={20} className="dash-action-icon" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </li>
          </ul>
        </nav>
        <div className="dash-mobile-nav">
          <div className="dash-profile-container">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="dash-profile-button"
              aria-label="Profile menu"
            >
              <div className="dash-profile-avatar">
                <img
                  src={getImageSrc()}
                  alt="Profile"
                  className="dash-profile-image"
                  onError={(e) => {
                    const name = localStorage.getItem("username") || "User";
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      name
                    )}&background=random`;
                  }}
                />
                <span className="dash-profile-indicator"></span>
              </div>
            </button>
            {profileOpen && (
              <div className={`dash-profile-dropdown animate-flip-in ${profileOpen ? 'dash-dropdown-open' : ''}`}>
                <div className="dash-profile-info">
                  <img
                    src={getImageSrc('&size=128')}
                    alt="Profile"
                    className="dash-profile-large-image"
                    onError={(e) => {
                        const name = localStorage.getItem("username") || "User";
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          name
                        )}&background=random&size=128`;
                      }}
                  />
                  <p className="dash-profile-name">{userData.name}</p>
                  <p className="dash-profile-email">{userData.email}</p>
                </div>
                <div className="dash-profile-actions">
                  <Link to="/ProfileWeb" className="dash-profile-action" onClick={() => setProfileOpen(false)}>
                    <User size={20} className="dash-action-icon" />
                    My Profile
                  </Link>
                  <Link to="/NotesApp" className="dash-profile-action" onClick={() => setProfileOpen(false)}>
                    <Notebook size={20} className="dash-action-icon" />
                    My Notes
                  </Link>
                  <button className="dash-profile-action" onClick={handleLogout}>
                    <LogOut size={20} className="dash-action-icon" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="dash-menu-button"
            aria-label="Mobile menu"
          >
            <span className={`dash-menu-icon ${menuOpen ? 'dash-menu-icon-open' : ''}`}></span>
            <span className={`dash-menu-icon ${menuOpen ? 'dash-menu-icon-open' : ''}`}></span>
            <span className={`dash-menu-icon ${menuOpen ? 'dash-menu-icon-open' : ''}`}></span>
          </button>
        </div>
      </header>
      {menuOpen && (
        <div className={`dash-mobile-menu animate-slide-down ${menuOpen ? 'dash-menu-open' : ''}`}>
          <ul className="dash-mobile-menu-list">
            <li><a href="#dash-hero" className="dash-mobile-menu-link animate-stagger" onClick={closeMenu}>Home</a></li>
            <li><a href="#dash-how-it-works" className="dash-mobile-menu-link animate-stagger" onClick={closeMenu}>How It Works</a></li>
            <li><a href="#dash-about" className="dash-mobile-menu-link animate-stagger" onClick={closeMenu}>About Us</a></li>
            <li className="dash-nav-item">
              <Link to="/blog" className="dash-mobile-menu-link animate-stagger" onClick={closeMenu}>
                Blog
                {hasNewBlog && <span className="dash-notification-dot"></span>}
              </Link>
            </li>
            <li><a href="#dash-feedback" className="dash-mobile-menu-link animate-stagger" onClick={closeMenu}>Feedback</a></li>
          </ul>
        </div>
      )}
      <section id="dash-hero" className="dash-hero">
        <div className="dash-hero-overlay animate-scale-in">
          <h1 className="dash-welcome-title animate-typewriter">Welcome to LexiMind</h1>
          <h2 className="dash-hero-title">Summarize Legal Documents Instantly with Our Website</h2>
          <p className="dash-hero-text">Save time and get precise legal document summaries in seconds.</p>
          <button className="dash-hero-button dash-button-hover" onClick={() => navigate("/ModelsPage")} aria-label="Get Started">
            Get Started
          </button>
        </div>
      </section>
      <section id="dash-how-it-works" className="dash-section">
        <h3 className="dash-section-title animate-reveal">How It Works</h3>
        <div className="dash-info-container">
          <div
            className="dash-info-block dash-info-block-clickable animate-bounce-in"
            style={{ animationDelay: '0.2s' }}
            onClick={handleUploadCardClick}
            onKeyDown={handleUploadCardKeyDown}
            role="button"
            tabIndex={0}
            aria-label="Navigate to Summarization page"
          >
            <div className="dash-info-icon-container">
              <Upload size={40} className="dash-info-icon" aria-hidden="true" />
            </div>
            <h4 className="dash-info-title">Upload Document</h4>
            <p className="dash-info-text">Easily upload your legal documents in any format to begin the summarization process.</p>
          </div>
          <div className="dash-info-block animate-bounce-in" style={{ animationDelay: '0.3s' }}>
            <div className="dash-info-icon-container">
              <FileText size={40} className="dash-info-icon" aria-hidden="true" />
            </div>
            <h4 className="dash-info-title">AI Processing</h4>
            <p className="dash-info-text">Our advanced AI technology analyzes and generates concise summaries to streamline your workflow.</p>
          </div>
          <div className="dash-info-block animate-bounce-in" style={{ animationDelay: '0.4s' }}>
            <div className="dash-info-icon-container">
              <Download size={40} className="dash-info-icon" aria-hidden="true" />
            </div>
            <h4 className="dash-info-title">Get Results</h4>
            <p className="dash-info-text">Download your summarized document in multiple formats for easy access and sharing.</p>
          </div>
          <div
            className="dash-info-block dash-info-block-clickable animate-bounce-in"
            style={{ animationDelay: '0.5s' }}
            onClick={handleQACardClick}
            onKeyDown={handleQACardKeyDown}
            role="button"
            tabIndex={0}
            aria-label="Navigate to QA page"
          >
            <div className="dash-info-icon-container">
              <HelpCircle size={40} className="dash-info-icon" aria-hidden="true" />
            </div>
            <h4 className="dash-info-title">Ask Questions</h4>
            <p className="dash-info-text">Interact with our AI to get precise answers to specific questions about your document.</p>
          </div>
        </div>
      </section>
      <section id="dash-about" className="dash-section">
        <h3 className="dash-section-title animate-reveal">About Us</h3>
        <div className="dash-info-container">
          <div className="dash-info-block animate-bounce-in" style={{ animationDelay: '0.2s' }}>
            <div className="dash-info-icon-container">
              <BookOpen size={40} className="dash-info-icon" aria-hidden="true" />
            </div>
            <h4 className="dash-info-title">Our Mission</h4>
            <p className="dash-info-text">To transform legal document analysis with AI, saving time and enhancing clarity for professionals and students.</p>
          </div>
          <div className="dash-info-block animate-bounce-in" style={{ animationDelay: '0.3s' }}>
            <div className="dash-info-icon-container">
              <Users size={40} className="dash-info-icon" aria-hidden="true" />
            </div>
            <h4 className="dash-info-title">Who We Serve</h4>
            <p className="dash-info-text">Law firms, corporate legal teams, law students, and anyone needing quick, accurate document insights.</p>
          </div>
          <div className="dash-info-block animate-bounce-in" style={{ animationDelay: '0.4s' }}>
            <div className="dash-info-icon-container">
              <ShieldCheck size={40} className="dash-info-icon" aria-hidden="true" />
            </div>
            <h4 className="dash-info-title">Accuracy & Security</h4>
            <p className="dash-info-text">Our AI preserves legal terminology and ensures data confidentiality with top-tier security standards.</p>
          </div>
          <div className="dash-info-block animate-bounce-in" style={{ animationDelay: '0.5s' }}>
            <div className="dash-info-icon-container">
              <Lightbulb size={40} className="dash-info-icon" aria-hidden="true" />
            </div>
            <h4 className="dash-info-title">Why Choose Us</h4>
            <p className="dash-info-text">Our legal-specific AI delivers contextual insights and accuracy unmatched by generic tools.</p>
          </div>
        </div>
      </section>
      <section id="dash-feedback" className="dash-section">
        <h3 className="dash-section-title animate-reveal">Feedback</h3>
        <div className="dash-feedback-container animate-slide-up">
          <div className="dash-feedback-icon-container">
            <MessageSquare size={60} className="dash-feedback-icon animate-pulse" aria-hidden="true" />
          </div>
          <p className="dash-feedback-text">We value your feedback! Let us know how we can improve your experience with LexiMind.</p>
          <textarea
            className="dash-feedback-input"
            placeholder="Enter your feedback here..."
            rows="5"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            aria-label="Feedback input"
          ></textarea>
          <button 
            className="dash-feedback-button dash-button-hover"
            onClick={handleFeedbackSubmit}
            aria-label="Submit feedback"
          >
            Submit Feedback
          </button>
        </div>
      </section>
      <footer className="dash-footer animate-scale-in">
        <div className="dash-follow-us">
          <h3 className="dash-footer-title animate-reveal">Follow Us</h3>
          <div className="dash-social-cards">
            <a href="https://www.facebook.com/profile.php?id=61575305309035" target="_blank" rel="noopener noreferrer" className="dash-social-card dash-facebook animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <Facebook size={32} className="dash-social-icon" aria-hidden="true" />
              <p>Facebook</p>
            </a>
            <a href="https://x.com/Leximind_off" target="_blank" rel="noopener noreferrer" className="dash-social-card dash-twitter animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <Twitter size={32} className="dash-social-icon" aria-hidden="true" />
              <p>Twitter</p>
            </a>
            <a href="https://www.instagram.com/leximind_official?igsh=c3lnODBjeXlhazlw" target="_blank" rel="noopener noreferrer" className="dash-social-card dash-instagram animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <Instagram size={32} className="dash-social-icon" aria-hidden="true" />
              <p>Instagram</p>
            </a>
            <a href="https://www.linkedin.com/in/leximind1/" target="_blank" rel="noopener noreferrer" className="dash-social-card dash-linkedin animate-scale-in" style={{ animationDelay: '0.5s' }}>
              <Linkedin size={32} className="dash-social-icon" aria-hidden="true" />
              <p>LinkedIn</p>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Dash() {
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      autoHideDuration={5000}
    >
      <DashContent />
    </SnackbarProvider>
  );
}