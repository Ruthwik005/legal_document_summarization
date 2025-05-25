import React from 'react';
import { Link, useNavigate } from "react-router-dom";
import { FiUpload, FiDownload, FiCheck, FiFileText, FiBookOpen, FiSearch, FiClock, FiAward, FiShield, FiList } from 'react-icons/fi';
import './ModelsPage.css';

const ModelsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      {/* Main Content */}
      <div className="main-content">
        {/* Navigation */}
        <div className="nav">
          <Link to="/dash" className="back-link" aria-label="Back to Dashboard">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="header">
          <h1>AI Document Summarizer</h1>
          <p>Condense complex documents into clear summaries with AI.</p>
        </div>

        {/* Full-length Cards */}
        <div className="full-length-cards">
          {/* Card 1: Legal Document Summarization */}
          <div className="full-card legal-card">
            <div className="card-visual">
              <div className="animated-placeholder legal-placeholder">
                <svg className="visual-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="20" y="15" width="60" height="70" rx="5" stroke="#3b82f6" strokeWidth="3"/>
                  <path d="M30 30 H70 M30 40 H70 M30 50 H70 M30 60 H70" stroke="#ffffff" strokeWidth="2"/>
                  <path d="M35 75 L45 75 L50 70 L55 75 L65 75" fill="none" stroke="#ffffff" strokeWidth="2"/>
                </svg>
              </div>
            </div>
            <div className="card-content">
              <div className="card-header">
                <div className="animated-icon">
                  <FiFileText className="card-icon" />
                </div>
                <h2>Legal Document Summarization</h2>
              </div>
              <p className="card-description">
                Simplify legal documents with AI-driven summaries of key clauses and details.
              </p>
              <div className="how-it-works">
                <h3 className="how-it-works-title">How It Works:</h3>
                <div className="steps">
                  <div className="step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h4>Upload Document</h4>
                      <p>Upload PDF, DOCX, or TXT files.</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h4>AI Analysis</h4>
                      <p>AI identifies key terms and obligations.</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h4>Structured Summary</h4>
                      <p>Get a clear summary of essential points.</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">4</div>
                    <div className="step-content">
                      <h4>Interactive Q&A</h4>
                      <p>Ask questions about your document.</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">5</div>
                    <div className="step-content">
                      <h4>Add Notes</h4>
                      <p>Annotate summaries for reference.</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">6</div>
                    <div className="step-content">
                      <h4>Download Summary</h4>
                      <p>Export as TXT for sharing.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Transformer-based Legal Summarization */}
          <div className="full-card generative-ai-card">
            <div className="card-visual">
              <div className="animated-placeholder transformer-placeholder">
                <svg className="visual-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 70 L50 30 L80 70" fill="none" stroke="#10b981" strokeWidth="3"/>
                  <path d="M30 70 H70 V80 H30 V70 Z" stroke="#ffffff" strokeWidth="2"/>
                  <path d="M40 50 H60 M40 60 H60" stroke="#ffffff" strokeWidth="2"/>
                </svg>
              </div>
            </div>
            <div className="card-content">
              <div className="card-header">
                <div className="animated-icon">
                  <FiBookOpen className="card-icon" />
                </div>
                <h2>Transformer-based Summarization</h2>
              </div>
              <p className="card-description">
                Generate precise, human-like summaries with our advanced Transformer model.
              </p>
              <div className="card-features">
                <div className="feature">
                  <div className="feature-icon-wrapper">
                    <FiClock className="feature-icon" />
                  </div>
                  <span>Time-efficient summaries</span>
                </div>
                <div className="feature">
                  <div className="feature-icon-wrapper">
                    <FiCheck className="feature-icon" />
                  </div>
                  <span>High accuracy</span>
                </div>
                <div className="feature">
                  <div className="feature-icon-wrapper">
                    <FiBookOpen className="feature-icon" />
                  </div>
                  <span>Rapid processing</span>
                </div>
                <div className="feature">
                  <div className="feature-icon-wrapper">
                    <FiFileText className="feature-icon" />
                  </div>
                  <span>Legal document focus</span>
                </div>
              </div>
              <button className="primary-btn" onClick={() => navigate("/Summarization")}>
                <div className="btn-icon-wrapper">
                  <FiDownload className="btn-icon" />
                </div>
                Generate Summary
              </button>
              <div className="card-stats">
                <div className="stat">
                  <div className="stat-icon-wrapper">
                    <FiAward className="stat-icon" />
                  </div>
                  <span>80% accuracy</span>
                </div>
                <div className="stat">
                  <div className="stat-icon-wrapper">
                    <FiShield className="stat-icon" />
                  </div>
                  <span>Secure processing</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: RAG-Powered Legal Search */}
          <div className="full-card">
            <div className="card-visual">
              <div className="animated-placeholder search-placeholder">
                <svg className="visual-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="65" cy="35" r="15" stroke="#8b5cf6" strokeWidth="3"/>
                  <path d="M75 45 L85 55" stroke="#8b5cf6" strokeWidth="3"/>
                  <rect x="20" y="50" width="60" height="35" rx="5" stroke="#ffffff" strokeWidth="2"/>
                  <path d="M30 65 H70 M30 75 H70" stroke="#ffffff" strokeWidth="2"/>
                </svg>
              </div>
            </div>
            <div className="card-content">
              <div className="card-header">
                <div className="animated-icon">
                  <FiSearch className="card-icon" />
                </div>
                <h2>RAG-Powered Legal Search</h2>
              </div>
              <p className="card-description">
                Extract precise answers from documents with semantic search.
              </p>
              <div className="card-features">
                <div className="feature">
                  <div className="feature-icon-wrapper">
                    <FiSearch className="feature-icon" />
                  </div>
                  <span>Fast retrieval</span>
                </div>
                <div className="feature">
                  <div className="feature-icon-wrapper">
                    <FiFileText className="feature-icon" />
                  </div>
                  <span>Multi-document search</span>
                </div>
                <div className="feature">
                  <div className="feature-icon-wrapper">
                    <FiCheck className="feature-icon" />
                  </div>
                  <span>Accurate context</span>
                </div>
                <div className="feature">
                  <div className="feature-icon-wrapper">
                    <FiShield className="feature-icon" />
                  </div>
                  <span>Pure retrieval</span>
                </div>
              </div>
              <button className="primary-btn" onClick={() => navigate("/QAPage")}>
                <div className="btn-icon-wrapper">
                  <FiSearch className="btn-icon" />
                </div>
                Ask Questions
              </button>
              <div className="card-tags">
                <span className="tag">Case Law</span>
                <span className="tag">Contracts</span>
                <span className="tag">Statutes</span>
                <span className="tag">Briefs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer-model">
        <div className="footer-content">
          <div className="footer-section">
            <h1>AI Summarizer</h1>
            <p className="subtitle">Powered by Transformers</p>
          </div>
          <div className="footer-section">
            <h2>Features</h2>
            <ul>
              <li>Summarization</li>
              <li>Q&A</li>
              <li>Notes</li>
              <li>Export</li>
              <li>Multi-language</li>
            </ul>
          </div>
          <div className="footer-section">
            <h2>Formats</h2>
            <ul>
              <li>PDF</li>
              <li>DOCX</li>
              <li>TXT</li>
              <li>Scanned PDFs</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ModelsPage;