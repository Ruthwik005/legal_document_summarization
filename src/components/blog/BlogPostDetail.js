import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import './BlogPostDetail.css';

const BlogPostDetail = ({ isAdmin = false }) => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const endpoint = isAdmin 
          ? `http://localhost:8080/api/blog-posts/admin/${id}`
          : `http://localhost:8080/api/blog-posts/${id}`;
        
        const response = await axios.get(endpoint, {
          headers: isAdmin
            ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
            : undefined,
        });
        setPost(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load blog post');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [id, isAdmin]);

  if (isLoading) return (
    <div className="blogpostdetail-loading-container">
      <div className="blogpostdetail-loading-spinner"></div>
    </div>
  );

  if (error) return (
    <div className="blogpostdetail-error-message">
      <svg className="blogpostdetail-error-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      {error}
    </div>
  );

  if (!post) return (
    <div className="blogpostdetail-empty-state">
      <svg className="blogpostdetail-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="blogpostdetail-empty-text">Post not found</p>
    </div>
  );

  return (
    <div className="blogpostdetail-container">
      <Link 
        to={isAdmin ? '/admin/blog' : '/blog'} 
        className="blogpostdetail-back-link"
      >
        <svg className="blogpostdetail-back-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to {isAdmin ? 'Manage Blog Posts' : 'Legal Updates'}
      </Link>

      <article className="blogpostdetail-post">
        <div className="blogpostdetail-post-header">
          <span className={`blogpostdetail-category-badge ${post.category}`}>
            {post.category === 'judgement'
              ? 'Judgement'
              : post.category === 'law-change'
              ? 'Law Change'
              : 'New Law'}
          </span>

          <h1 className="blogpostdetail-post-title">{post.title}</h1>

          <div className="blogpostdetail-post-meta">
            <span className="blogpostdetail-post-author">
              Posted by {post.postedBy?.name || 'Admin'}
            </span>
            <span className="blogpostdetail-post-date">
              {format(new Date(post.createdAt), 'MMMM d, yyyy')}
            </span>
          </div>

          {post.tags?.length > 0 && (
            <div className="blogpostdetail-post-tags">
              {post.tags.map((tag) => (
                <span key={tag} className="blogpostdetail-tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div 
          className="blogpostdetail-post-content" 
          dangerouslySetInnerHTML={{ __html: post.content }} 
        />
      </article>
    </div>
  );
};

export default BlogPostDetail;