import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './BlogEditor.css';

const BlogEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'judgement',
    tags: '',
    isPublished: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      const fetchPost = async () => {
        try {
          const response = await axios.get(`http://localhost:8080/api/blog-posts/admin/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setFormData({
            title: response.data.title,
            content: response.data.content,
            category: response.data.category,
            tags: response.data.tags.join(', '),
            isPublished: response.data.isPublished,
          });
        } catch (err) {
          setError('Failed to load post');
        }
      };
      fetchPost();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleContentChange = (content) => {
    setFormData((prev) => ({ ...prev, content }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const postData = {
        ...formData,
        tags: formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      };

      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      };

      if (id) {
        await axios.put(`http://localhost:8080/api/blog-posts/${id}`, postData, config);
      } else {
        await axios.post('http://localhost:8080/api/blog-posts', postData, config);
      }

      navigate('/admin/blog');
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.message ||
        'Failed to save post. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    document.title = id ? 'Edit Blog Post' : 'Create New Blog Post';
  }, [id]);

  return (
    <div className="blogeditor-container">
      <div className="blogeditor-header">
        <h1 className="blogeditor-title">
          {id ? 'Edit Blog Post' : 'Create New Blog Post'}
        </h1>
        <div className="blogeditor-underline"></div>
      </div>

      {error && (
        <div className="blogeditor-error-message">
          <svg className="blogeditor-error-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="blogeditor-form">
        <div className="blogeditor-form-group">
          <label htmlFor="title" className="blogeditor-form-label">
            Title <span className="blogeditor-required">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            className="blogeditor-form-input"
            required
            placeholder="Enter post title"
          />
        </div>

        <div className="blogeditor-form-group">
          <label htmlFor="category" className="blogeditor-form-label">
            Category <span className="blogeditor-required">*</span>
          </label>
          <div className="blogeditor-select-wrapper">
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="blogeditor-form-select"
              required
            >
              <option value="judgement">Famous Judgement</option>
              <option value="law-change">Law Change</option>
              <option value="new-law">New Law</option>
            </select>
            <div className="blogeditor-select-arrow"></div>
          </div>
        </div>

        <div className="blogeditor-form-group">
          <label className="blogeditor-form-label">
            Content <span className="blogeditor-required">*</span>
          </label>
          <div className="blogeditor-quill-wrapper">
            <ReactQuill
              theme="snow"
              value={formData.content}
              onChange={handleContentChange}
              className="blogeditor-quill-editor"
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  ['link', 'image'],
                  ['clean'],
                ],
              }}
            />
          </div>
        </div>

        <div className="blogeditor-form-group">
          <label htmlFor="tags" className="blogeditor-form-label">
            Tags (comma separated)
          </label>
          <input
            id="tags"
            name="tags"
            type="text"
            value={formData.tags}
            onChange={handleChange}
            className="blogeditor-form-input"
            placeholder="e.g., supreme court, constitution, amendment"
          />
          <p className="blogeditor-form-hint">
            Separate multiple tags with commas
          </p>
        </div>

        <div className="blogeditor-form-group blogeditor-checkbox-group">
          <label className="blogeditor-checkbox-label">
            <input
              id="isPublished"
              name="isPublished"
              type="checkbox"
              checked={formData.isPublished}
              onChange={handleChange}
              className="blogeditor-checkbox-input"
            />
            <span className="blogeditor-checkbox-custom"></span>
            <span className="blogeditor-checkbox-text">Publish immediately</span>
          </label>
        </div>

        <div className="blogeditor-form-actions">
          <button
            type="button"
            onClick={() => navigate('/admin/blog')}
            className="blogeditor-cancel-btn"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="blogeditor-submit-btn"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="blogeditor-spinner"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Post'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BlogEditor;