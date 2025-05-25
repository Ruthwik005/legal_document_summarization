import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './FeedbackList.css';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

const FeedbackList = () => {
  const [feedbackList, setFeedbackList] = useState([]);

  // Fetch feedback on mount
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8080/api/feedback', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setFeedbackList(response.data);
      } catch (error) {
        toast.error('Failed to fetch feedback.', {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    };

    fetchFeedback();
  }, []);

  // Handle feedback deletion
  const handleDelete = async (id) => {
    confirmAlert({
      customUI: ({ onClose }) => (
        <div className="feedbacklist-confirm-dialog">
          <h3 className="feedbacklist-confirm-title">Delete Feedback</h3>
          <p className="feedbacklist-confirm-message">Are you sure you want to delete this feedback? This action cannot be undone.</p>
          <div className="feedbacklist-confirm-buttons">
            <button
              onClick={onClose}
              className="feedbacklist-confirm-btn feedbacklist-confirm-cancel"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                try {
                  const token = localStorage.getItem('token');
                  await axios.delete(`http://localhost:8080/api/feedback/${id}`, {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  });

                  setFeedbackList(feedbackList.filter((feedback) => feedback._id !== id));
                  toast.success('Feedback deleted successfully!', {
                    position: 'top-right',
                    autoClose: 5000,
                  });
                  onClose();
                } catch (error) {
                  toast.error('Failed to delete feedback.', {
                    position: 'top-right',
                    autoClose: 5000,
                  });
                  onClose();
                }
              }}
              className="feedbacklist-confirm-btn feedbacklist-confirm-delete"
            >
              Delete
            </button>
          </div>
        </div>
      ),
    });
  };

  // Handle bookmark toggle
  const handleBookmark = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:8080/api/feedback/${id}/bookmark`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setFeedbackList(
        feedbackList.map((feedback) =>
          feedback._id === id ? response.data : feedback
        )
      );
      toast.success(`Feedback ${response.data.isBookmarked ? 'bookmarked' : 'unbookmarked'}!`, {
        position: 'top-right',
        autoClose: 5000,
      });
    } catch (error) {
      toast.error('Failed to bookmark feedback.', {
        position: 'top-right',
        autoClose: 5000,
      });
    }
  };

  return (
    <div className="feedbacklist-container">
      <ToastContainer />
      <h2>Feedback Management</h2>
      {feedbackList.length === 0 ? (
        <p>No feedback available.</p>
      ) : (
        <ul className="feedbacklist-list">
          {feedbackList.map((feedback) => (
            <li
              key={feedback._id}
              className={`feedbacklist-item ${feedback.isBookmarked ? 'feedbacklist-bookmarked' : ''}`}
            >
              <div className="feedbacklist-content">
                <p><strong>User:</strong> {feedback.username}</p>
                <p><strong>Email:</strong> {feedback.email}</p>
                <p><strong>Feedback:</strong> {feedback.content}</p>
                <p><strong>Date:</strong> {new Date(feedback.createdAt).toLocaleString()}</p>
              </div>
              <div className="feedbacklist-actions">
                <button
                  className="feedbacklist-bookmark-btn"
                  onClick={() => handleBookmark(feedback._id)}
                >
                  {feedback.isBookmarked ? 'Unbookmark' : 'Bookmark'}
                </button>
                <button
                  className="feedbacklist-delete-btn"
                  onClick={() => handleDelete(feedback._id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FeedbackList;