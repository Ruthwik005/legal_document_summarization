import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import './AdminLayout.css';
import axios from 'axios';

const AdminLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newFeedbackCount, setNewFeedbackCount] = useState(0);
  const location = useLocation();

  // Fetch new feedback count
  const fetchNewFeedbackCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/feedback/new-count', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setNewFeedbackCount(response.data.count);
    } catch (error) {
      // Handle error silently or with alternative feedback if needed
    }
  };

  // Fetch count on route change, except for /admin/feedback
  useEffect(() => {
    if (location.pathname !== '/admin/feedback') {
      fetchNewFeedbackCount();
    }
  }, [location.pathname]);

  // Handle feedback link click
  const handleFeedbackClick = () => {
    setMobileMenuOpen(false);
    setNewFeedbackCount(0); // Clear notification dot on first click
  };

  return (
    <div className="adminlayout-container">
      {/* Desktop Sidebar / Mobile Top Nav */}
      <div className={`adminlayout-sidebar ${mobileMenuOpen ? 'adminlayout-mobile-open' : ''}`}>
        <div className="adminlayout-sidebar-header">
          <h1 className="adminlayout-sidebar-title">Admin Panel</h1>
          <button 
            className="adminlayout-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
        
        <nav className="adminlayout-sidebar-nav">
          <ul className="adminlayout-nav-list">
            <li className="adminlayout-nav-item">
              <Link
                to="/admin/dashboard"
                className="adminlayout-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="adminlayout-link-icon">📊</span>
                <span className="adminlayout-link-text">Dashboard</span>
              </Link>
            </li>
            <li className="adminlayout-nav-item">
              <Link
                to="/admin/blog"
                className="adminlayout-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="adminlayout-link-icon">✍</span>
                <span className="adminlayout-link-text">Blog Management</span>
              </Link>
            </li>
            <li className="adminlayout-nav-item">
              <Link
                to="/admin/feedback"
                className="adminlayout-nav-link"
                onClick={handleFeedbackClick}
              >
                <span className="adminlayout-link-icon">💬</span>
                <span className="adminlayout-link-text">
                  Feedback
                  {newFeedbackCount > 0 && (
                    <span className="adminlayout-new-feedback-indicator"></span>
                  )}
                </span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="adminlayout-main">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;