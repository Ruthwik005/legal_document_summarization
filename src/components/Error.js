import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Error.css';

function Error() {
  const navigate = useNavigate();

  return (
    <div className="error-container">
      <motion.div
        className="floating-circle circle-1"
        animate={{
          y: [0, 20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <motion.div
        className="floating-circle circle-2"
        animate={{
          y: [0, -30, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />

      <motion.div
        className="error-content"
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, type: 'spring' }}
      >
        <motion.img
          className="error-image"
          src="https://cdn-icons-png.flaticon.com/512/755/755014.png"
          alt="Error"
          animate={{
            rotate: [0, 10, -10, 10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
          }}
        />
        <h1 className="error-heading">404 - Page Not Found</h1>
        <p className="error-subheading">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <motion.button
          className="error-button"
          onClick={() => navigate('/')}
          whileHover={{
            scale: 1.05,
            backgroundColor: '#3a5a80',
          }}
          whileTap={{ scale: 0.95 }}
        >
          Go to Home
        </motion.button>
      </motion.div>
    </div>
  );
}

export default Error;