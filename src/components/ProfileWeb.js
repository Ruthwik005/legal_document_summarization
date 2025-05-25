import React, { useState, useEffect } from 'react';
import { FiUser, FiHome, FiFileText, FiSun, FiMoon, FiCheck, FiLogOut, FiArrowLeft } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

function ProfileWeb() {
  const navigate = useNavigate();
  const [name, setName] = useState(localStorage.getItem('username') || 'Guest');
  const [email, setEmail] = useState(localStorage.getItem('email') || 'N/A');
  const [image, setImage] = useState(localStorage.getItem('image') || '');
  const [theme, setTheme] = useState('dark');
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(atob(base64));
       
        setName(decoded.username || 'Guest');
        setEmail(decoded.email || 'N/A');
        setImage(decoded.image || localStorage.getItem('image') || '');
      } catch (error) {
        // Handle error silently
      }
    }
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleBack = () => {
    navigate('/Dash');
  };

  const getImageSrc = (image, name) => {
    if (image) {
      return image;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
  };

  return (
    <div className={`profilepage-container ${theme}`}>
      <motion.div
        className="profilepage-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="profilepage-header">
          <h3>Profile</h3>
          <div className="profilepage-actions">
            <motion.button
              onClick={handleBack}
              className="profilepage-back-btn"
              title="Go back to dashboard"
              aria-label="Go back to dashboard"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiArrowLeft />
              Back
            </motion.button>
            <motion.button
              onClick={toggleTheme}
              className="profilepage-theme-btn"
              title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {theme === 'dark' ? <FiSun /> : <FiMoon />}
            </motion.button>
            <div className="profilepage-nav">
              <motion.button
                onClick={() => navigate('/')}
                className="profilepage-nav-btn"
                title="Go to Summarization"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiHome />
              </motion.button>
              <motion.button
                onClick={() => navigate('/NotesApp')}
                className="profilepage-nav-btn"
                title="Go to Notes"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiFileText />
              </motion.button>
            </div>
          </div>
        </div>
        <motion.div
          className="profilepage-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="profilepage-picture-container"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="profilepage-picture"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <img
                src={getImageSrc(image, name)}
                alt="Profile"
                className="profilepage-image"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
                }}
              />
            </motion.div>
          </motion.div>
          <motion.div
            className="profilepage-info"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="profilepage-field profilepage-name"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 10, delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
            >
              <label>Name</label>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {name}
              </motion.p>
            </motion.div>
            <motion.div
              className="profilepage-field profilepage-email"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 10, delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
            >
              <label>Email</label>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                title={email}
              >
                {email}
              </motion.p>
            </motion.div>
          </motion.div>
        </motion.div>
        <motion.div
          className="profilepage-logout-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <motion.button
            onClick={handleLogout}
            className="profilepage-logout-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiLogOut className="profilepage-logout-icon" />
            Logout
          </motion.button>
        </motion.div>
      </motion.div>
      <AnimatePresence>
        {showNotification && (
          <motion.div
            className="profilepage-notification"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <FiCheck className="profilepage-notification-icon" />
            Theme updated!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProfileWeb;