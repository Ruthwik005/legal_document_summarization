import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Upload, FileText, Download, MessageSquare, HelpCircle,
  BookOpen, Users, ShieldCheck, Lightbulb,
  Facebook, Twitter, Instagram, Linkedin
} from "lucide-react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./HomeDoop.css";

export default function HomeDoop() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const showSignUpNotification = (message = "sign up first to use this feature!") => {
    toast.warn(message, {
      position: "top-center",
      autoClose: 5000,
      hideProgressBar: false,
    
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      icon: "⚠️",
      theme: "light",
    });
  };

  return (
    <div className="homedoop-min-h-screen homedoop-bg-gray-100 homedoop-text-gray-900">
      {/* Header */}
      <header className="homedoop-header-home homedoop-bg-[#2c3e50] homedoop-shadow-md homedoop-py-4 homedoop-px-8 homedoop-flex homedoop-justify-between homedoop-items-center homedoop-fixed homedoop-w-full homedoop-top-0 homedoop-z-50">
        <h1 className="homedoop-text-2xl homedoop-font-bold homedoop-text-white">LExiMinD</h1>

        {/* Desktop Navigation */}
        <nav className="homedoop-nav-menu">
          <ul className="homedoop-flex homedoop-space-x-8 homedoop-items-center">
            <li><a href="#homedoop-HeroSection" className="homedoop-nav-link">Home</a></li>
            <li><a href="#homedoop-how-it-works" className="homedoop-nav-link">How It Works</a></li>
            <li><a href="#homedoop-AboutUs" className="homedoop-nav-link">About Us</a></li>
            <li><a href="#homedoop-Feedback" className="homedoop-nav-link">Feedback</a></li>
            <li>
              <Link to="/signin" state={{ isSignIn: true }} className="homedoop-signin-button">
                Sign In
              </Link>
            </li>
            <li>
              <Link to="/signup" state={{ isSignIn: false }} className="homedoop-register-button">
                Register
              </Link>
            </li>
          </ul>
        </nav>

        {/* Mobile Menu */}
        <div className="homedoop-mobile-menu">
          <Link to="/signin" state={{ isSignIn: true }} className="homedoop-signin-button">
            Sign In
          </Link>
          <Link to="/signup" state={{ isSignIn: false }} className="homedoop-register-button">
            Register
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} className="homedoop-dropdown-button">
            Drop Down
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="homedoop-dropdown-menu homedoop-open">
          <ul className="homedoop-flex homedoop-flex-col">
            <li><a href="#homedoop-HeroSection" className="homedoop-dropdown-link" onClick={closeMenu}>Home</a></li>
            <li><a href="#homedoop-how-it-works" className="homedoop-dropdown-link" onClick={closeMenu}>How It Works</a></li>
            <li><a href="#homedoop-AboutUs" className="homedoop-dropdown-link" onClick={closeMenu}>About Us</a></li>
            <li><a href="#homedoop-Feedback" className="homedoop-dropdown-link" onClick={closeMenu}>Feedback</a></li>
          </ul>
        </div>
      )}

      {/* Hero Section */}
      <section id="homedoop-HeroSection" className="homedoop-hero-section">
        <div className="homedoop-hero-overlay">
          <ToastContainer />
          <h1 className="homedoop-welcome-title">Welcome to LexiMind</h1>
          <h2 className="homedoop-hero-title">Summarize Legal Documents Instantly with Our Website</h2>
          <p className="homedoop-hero-text">Save time and get precise legal document summaries in seconds.</p>
          <button
            className="homedoop-hero-button"
            onClick={() => showSignUpNotification()}
          >
            GO
          </button>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="homedoop-how-it-works" className="homedoop-section">
        <h3 className="homedoop-section-title">How It Works</h3>
        <div className="homedoop-card-container">
          <div className="homedoop-card">
            <Upload size={40} className="homedoop-card-icon" />
            <h4>1. Upload Your Document</h4>
            <p>Drag and drop your legal document or click to select a PDF or Word file from your device.</p>
          </div>
          <div className="homedoop-card">
            <FileText size={40} className="homedoop-card-icon" />
            <h4>2. AI Processes & Summarizes</h4>
            <p>Our AI analyzes the document, extracting key points and generating a concise summary instantly.</p>
          </div>
          <div className="homedoop-card">
            <Download size={40} className="homedoop-card-icon" />
            <h4>3. Download the Summary</h4>
            <p>Receive a clear, structured summary in PDF format, ready to download and share.</p>
          </div>
          <div className="homedoop-card">
            <HelpCircle size={40} className="homedoop-card-icon" />
            <h4>4. Ask Questions & Get Answers</h4>
            <p>Use our chat feature to ask follow-up questions about the document and get precise answers.</p>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="homedoop-AboutUs" className="homedoop-section">
        <h3 className="homedoop-section-title">About Us</h3>
        <div className="homedoop-card-container">
          <div className="homedoop-card">
            <BookOpen size={40} className="homedoop-card-icon" />
            <h4>Mission</h4>
            <p>We aim to simplify legal documents using AI-powered summarization, helping students and lawyers save time.</p>
          </div>
          <div className="homedoop-card">
            <Users size={40} className="homedoop-card-icon" />
            <h4>Who We Serve</h4>
            <p>Designed for law students, legal professionals, and researchers needing quick access to legal insights.</p>
          </div>
          <div className="homedoop-card">
            <ShieldCheck size={40} className="homedoop-card-icon" />
            <h4>Accuracy & Security</h4>
            <p>Our AI ensures precise legal terminology retention, maintaining data confidentiality.</p>
          </div>
          <div className="homedoop-card">
            <Lightbulb size={40} className="homedoop-card-icon" />
            <h4>Why Choose Us?</h4>
            <p>Our tool is built specifically for the legal domain, offering contextual and legally accurate summaries.</p>
          </div>
        </div>
      </section>

      {/* Feedback Section */}
      <section id="homedoop-Feedback" className="homedoop-section">
        <h3 className="homedoop-section-title">Feedback</h3>
        <div className="homedoop-feedback-container">
          <MessageSquare size={40} className="homedoop-feedback-icon" />
          <p className="homedoop-feedback-text">We value your feedback! Let us know how we can improve.</p>
          <textarea className="homedoop-feedback-input" placeholder="Enter your feedback here..."></textarea>
          <button
            className="homedoop-feedback-button"
            onClick={() => showSignUpNotification("Sign up to our website first!")}
          >
            Submit Feedback
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="homedoop-footer-home">
        <div className="homedoop-follow-us">
          <h3 className="homedoop-footer-title">Follow Us</h3>
          <div className="homedoop-social-cards">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="homedoop-social-card homedoop-facebook">
              <Facebook size={40} className="homedoop-social-icon" />
              <p>Facebook</p>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="homedoop-social-card homedoop-twitter">
              <Twitter size={40} className="homedoop-social-icon" />
              <p>Twitter</p>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="homedoop-social-card homedoop-instagram">
              <Instagram size={40} className="homedoop-social-icon" />
              <p>Instagram</p>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="homedoop-social-card homedoop-linkedin">
              <Linkedin size={40} className="homedoop-social-icon" />
              <p>LinkedIn</p>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}