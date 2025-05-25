import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './PublicBlogList.css';

const PublicBlogList = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine); // Initial network state

  useEffect(() => {
    const fetchPosts = async () => {
      if (!navigator.onLine) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get('http://localhost:8080/api/blog-posts');
        setPosts(response.data);
        // Update last visited timestamp
        localStorage.setItem('lastBlogVisit', new Date().toISOString());
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load blog posts');
        toast.error(err.response?.data?.error || 'Failed to load blog posts', {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Handle offline/online detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setError(''); // Clear error when back online
      setIsLoading(true); // Trigger reload
      const fetchPosts = async () => {
        try {
          const response = await axios.get('http://localhost:8080/api/blog-posts');
          setPosts(response.data);
          localStorage.setItem('lastBlogVisit', new Date().toISOString());
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to load blog posts');
          toast.error(err.response?.data?.error || 'Failed to load blog posts', {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchPosts();
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

  const filteredPosts = posts.filter((post) => {
    const categoryMatch = categoryFilter === 'all' || post.category === categoryFilter;
    const searchMatch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.tags &&
        post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    return categoryMatch && searchMatch;
  });

  const handleDismissOffline = () => {
    setIsOffline(false);
  };

  return (
    <div className="PublicBlogList">
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

      <div className="PublicBlogList__wrapper">
        <div className="PublicBlogList__container">
          <div className="PublicBlogList__nav">
            <Link to="/dash" className="PublicBlogList__back-link" aria-label="Back to Dashboard">
              ← Back
            </Link>
          </div>

          {isLoading ? (
            <div className="PublicBlogList__loading-container">
              <div className="PublicBlogList__loading-spinner"></div>
              <p className="PublicBlogList__loading-text">Loading Legal Updates...</p>
            </div>
          ) : error ? (
            <div className="PublicBlogList__error-message">
              <svg className="PublicBlogList__error-icon" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          ) : (
            <>
              <div className="PublicBlogList__header">
                <h1 className="PublicBlogList__title">Latest Legal Updates</h1>
                <p className="PublicBlogList__subtitle">Stay informed with the most recent legal developments</p>
              </div>

              <div className="PublicBlogList__filter-container">
                <div className="PublicBlogList__filter-group">
                  <div className="PublicBlogList__select-wrapper">
                    <select
                      id="category"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="PublicBlogList__category-select"
                    >
                      <option value="all">All Categories</option>
                      <option value="judgement">Famous Judgements</option>
                      <option value="law-change">Law Changes</option>
                      <option value="new-law">New Laws</option>
                    </select>
                    <div className="PublicBlogList__select-arrow"></div>
                  </div>

                  <div className="PublicBlogList__search-input-wrapper">
                    <svg className="PublicBlogList__search-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <input
                      type="text"
                      id="search"
                      placeholder="Search updates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="PublicBlogList__search-input"
                    />
                  </div>
                </div>
              </div>

              {filteredPosts.length === 0 ? (
                <div className="PublicBlogList__empty-state">
                  <svg
                    className="PublicBlogList__empty-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="PublicBlogList__empty-text">No legal updates found matching your criteria</p>
                </div>
              ) : (
                <div className="PublicBlogList__grid">
                  {filteredPosts.map((post) => (
                    <div key={post._id} className="PublicBlogList__card">
                      <div className="PublicBlogList__card-header">
                        <span
                          className={`PublicBlogList__category-badge PublicBlogList__category-badge--${post.category}`}
                        >
                          {post.category === 'judgement'
                            ? 'Judgement'
                            : post.category === 'law-change'
                            ? 'Law Change'
                            : 'New Law'}
                        </span>
                      </div>

                      <div className="PublicBlogList__card-body">
                        <h2 className="PublicBlogList__post-title">
                          <Link to={`/blog/${post._id}`} className="PublicBlogList__post-link">
                            {post.title}
                          </Link>
                        </h2>

                        <div className="PublicBlogList__post-meta">
                          <span className="PublicBlogList__post-date">
                            {format(new Date(post.createdAt), 'MMMM d, yyyy')}
                          </span>
                        </div>

                        {post.tags?.length > 0 && (
                          <div className="PublicBlogList__post-tags">
                            {post.tags.map((tag) => (
                              <span key={tag} className="PublicBlogList__tag">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div
                          className="PublicBlogList__post-excerpt"
                          dangerouslySetInnerHTML={{
                            __html: post.content.substring(0, 300) + (post.content.length > 300 ? '...' : ''),
                          }}
                        />
                      </div>

                      <div className="PublicBlogList__card-footer">
                        <Link to={`/blog/${post._id}`} className="PublicBlogList__read-more-btn">
                          Read full update
                          <svg
                            className="PublicBlogList__arrow-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicBlogList;