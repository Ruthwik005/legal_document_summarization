import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import './BlogList.css';

const BlogList = ({ isAdmin = false }) => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const endpoint = isAdmin ? 'http://localhost:8080/api/blog-posts/admin' : 'http://localhost:8080/api/blog-posts';
        const response = await axios.get(endpoint, {
          headers: isAdmin
            ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
            : undefined,
        });
        setPosts(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load blog posts');
        if (err.response?.status === 401 && isAdmin) {
          navigate('/signin');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [isAdmin, navigate]);

  const handleDelete = async (id) => {
    confirmAlert({
      customUI: ({ onClose }) => (
        <div className="bloglist-confirm-dialog">
          <h3 className="bloglist-confirm-title">Confirm deletion</h3>
          <p className="bloglist-confirm-message">Are you sure you want to delete this post?</p>
          <div className="bloglist-confirm-buttons">
            <button
              className="bloglist-confirm-btn bloglist-confirm-btn-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="bloglist-confirm-btn bloglist-confirm-btn-delete"
              onClick={async () => {
                try {
                  await axios.delete(`http://localhost:8080/api/blog-posts/${id}`, {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                  });
                  setPosts(posts.filter((post) => post._id !== id));
                  onClose();
                } catch (err) {
                  setError(err.response?.data?.error || 'Failed to delete post');
                  onClose();
                }
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ),
    });
  };

  const handlePublish = async (id) => {
    confirmAlert({
      customUI: ({ onClose }) => (
        <div className="bloglist-confirm-dialog">
          <h3 className="bloglist-confirm-title">Confirm Publish</h3>
          <p className="bloglist-confirm-message">Do you want to publish this post now?</p>
          <div className="bloglist-confirm-buttons">
            <button
              className="bloglist-confirm-btn bloglist-confirm-btn-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="bloglist-confirm-btn bloglist-confirm-btn-publish"
              onClick={async () => {
                try {
                  await axios.put(
                    `http://localhost:8080/api/blog-posts/${id}`,
                    { isPublished: true },
                    {
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                      },
                    }
                  );
                  setPosts(
                    posts.map((post) =>
                      post._id === id ? { ...post, isPublished: true } : post
                    )
                  );
                  onClose();
                } catch (err) {
                  setError(err.response?.data?.error || 'Failed to publish post');
                  onClose();
                }
              }}
            >
              Publish
            </button>
          </div>
        </div>
      ),
    });
  };

  const categoryDisplay = {
    judgement: 'Judgement',
    'law-change': 'Law Change',
    'new-law': 'New Law',
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags?.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesCategory =
      filterCategory === 'all' || post.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  if (isLoading) return (
    <div className="bloglist-loading-container">
      <div className="bloglist-loading-spinner"></div>
    </div>
  );

  if (error) return (
    <div className="bloglist-error-message">
      <svg className="bloglist-error-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      {error}
    </div>
  );

  return (
    <div className="bloglist-container">
      <div className="bloglist-header">
        <h1 className="bloglist-title">
          {isAdmin ? 'Manage Blog Posts' : 'Legal Updates'}
        </h1>

        <div className="bloglist-controls">
          {isAdmin && (
            <Link to="/admin/blog/new" className="bloglist-new-post-btn">
              <svg className="bloglist-new-post-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Post
            </Link>
          )}

          <div className="bloglist-filter-controls">
            <div className="bloglist-search-input-wrapper">
              <svg className="bloglist-search-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 itles1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bloglist-search-input"
              />
            </div>

            {isAdmin && (
              <div className="bloglist-select-wrapper">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bloglist-category-select"
                >
                  <option value="all">All Categories</option>
                  <option value="judgement">Judgements</option>
                  <option value="law-change">Law Changes</option>
                  <option value="new-law">New Laws</option>
                </select>
                <div className="bloglist-select-arrow"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="bloglist-empty-state">
          <svg className="bloglist-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="bloglist-empty-text">
            {posts.length === 0 ? 'No posts found' : 'No posts match your search criteria'}
          </p>
        </div>
      ) : (
        <div className="bloglist-grid">
          {filteredPosts.map((post) => (
            <div key={post._id} className="bloglist-card">
              <div className="bloglist-card-header">
                <span className={`bloglist-category-badge ${post.category}`}>
                  {categoryDisplay[post.category] || 'Unknown'}
                </span>

                {isAdmin && (
                  <div className="bloglist-card-actions">
                    <button
                      onClick={() => navigate(`/admin/blog/edit/${post._id}`)}
                      className="bloglist-action-btn bloglist-edit-btn"
                      title="Edit"
                    >
                      <svg className="bloglist-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(post._id)}
                      className="bloglist-action-btn bloglist-delete-btn"
                      title="Delete"
                    >
                      <svg className="bloglist-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <div className="bloglist-card-body">
                <h2 className="bloglist-post-title">
                  <Link
                    to={isAdmin ? `/admin/blog/edit/${post._id}` : `/blog/${post._id}`}
                    className="bloglist-post-link"
                  >
                    {post.title}
                  </Link>
                </h2>

                <div className="bloglist-post-meta">
                  <span className="bloglist-post-author">
                    Posted by {post.postedBy?.name || 'Admin'}
                  </span>
                  <span className="bloglist-post-date">
                    {format(new Date(post.createdAt), 'MMMM d, yyyy')}
                  </span>
                </div>

                {post.tags?.length > 0 && (
                  <div className="bloglist-post-tags">
                    {post.tags.map((tag) => (
                      <span key={tag} className="bloglist-tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div
                  className="bloglist-post-excerpt"
                  dangerouslySetInnerHTML={{
                    __html:
                      post.content.substring(0, 300) + (post.content.length > 300 ? '...' : ''),
                  }}
                />
              </div>

              <div className="bloglist-card-footer">
                {isAdmin && !post.isPublished ? (
                  <button
                    onClick={() => handlePublish(post._id)}
                    className="bloglist-publish-now-btn"
                  >
                    Want to post now?
                    <svg className="bloglist-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                ) : (
                  <Link
                    to={isAdmin ? `/admin/blog/edit/${post._id}` : `/blog/${post._id}`}
                    className="bloglist-read-more-btn"
                  >
                    {isAdmin ? 'Edit post' : 'Read more'}
                    <svg className="bloglist-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogList;