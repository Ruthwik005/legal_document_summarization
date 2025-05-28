import React, { useState, useCallback, useEffect } from 'react';
import { FiUpload, FiX, FiFile, FiSend, FiArrowLeft } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import './QAPage.css';

function QAPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [question, setQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFilename, setCurrentFilename] = useState(null);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const savedState = localStorage.getItem('qaState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (
          Array.isArray(parsed.qaHistory) &&
          (typeof parsed.currentFilename === 'string' || parsed.currentFilename === null) &&
          (typeof parsed.fileName === 'string' || parsed.fileName === null)
        ) {
          setQaHistory(parsed.qaHistory);
          setCurrentFilename(parsed.currentFilename);
          if (parsed.fileName) {
            setSelectedFile({ name: parsed.fileName });
          }
        } else {
          localStorage.removeItem('qaState');
        }
      } catch (err) {
        setError('Failed to load saved Q&A');
        localStorage.removeItem('qaState');
      }
    }
  }, []);

  useEffect(() => {
    if (qaHistory.length > 0 || selectedFile || currentFilename) {
      try {
        localStorage.setItem('qaState', JSON.stringify({
          qaHistory: qaHistory,
          currentFilename,
          fileName: selectedFile ? selectedFile.name : null,
        }));
      } catch (err) {
        setError('Failed to save Q&A history');
      }
    }
  }, [qaHistory, selectedFile, currentFilename]);

  useEffect(() => {
    return () => {
      try {
        localStorage.removeItem('qaState');
      } catch (err) {
        setError('Failed to clear Q&A history');
      }
    };
  }, [location]);

  const handleFileChange = useCallback(async (file, retries = 3, delay = 5000) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB. Processing may be slow due to API limits.');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('http://localhost:8001/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.status === 503 && retries > 0) {
        setError(`Server is initializing. Retrying in ${delay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return handleFileChange(file, retries - 1, delay * 2);
      }

      if (!response.ok || response.status !== 200) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload document');
      }

      const data = await response.json();
      if (data.status !== 'success') {
        throw new Error(data.error || 'Failed to upload document');
      }

      setCurrentFilename(data.filename);
      setSelectedFile(file);
      setQaHistory([]);
      localStorage.removeItem('qaState');
    } catch (err) {
      setError(`Error uploading document: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleInputChange = useCallback((event) => {
    handleFileChange(event.target.files[0]);
  }, [handleFileChange]);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, [handleFileChange]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setCurrentFilename(null);
    setQaHistory([]);
    setError(null);
    try {
      localStorage.removeItem('qaState');
    } catch (err) {
      setError('Failed to clear Q&A history');
    }
  }, []);

  const handleQuestionSubmit = useCallback(
    async (e, retries = 3, delay = 5000) => {
      if (
        ((e.key === 'Enter' && !e.shiftKey && question.trim()) || e.type === 'click') &&
        !isProcessing
      ) {
        e.preventDefault();
        if (!selectedFile) {
          setError('Please upload a document first.');
          return;
        }
        if (question.trim().split(/\s+/).length < 3) {
          setError('Please ask a more detailed question (minimum 3 words)');
          return;
        }

        const newQaEntry = {
          question,
          answer: 'Processing...',
          sections: [],
          isRelevant: true,
        };
        setQaHistory((prev) => [...prev, newQaEntry]);
        setQuestion('');
        setIsProcessing(true);

        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          formData.append('question', question);
          const response = await fetch('http://localhost:8001/ask', {
            method: 'POST',
            body: formData,
          });

          if (response.status === 503 && retries > 0) {
            setError(`Server is initializing. Retrying in ${delay/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return handleQuestionSubmit(e, retries - 1, delay * 2);
          }

          if (!response.ok || response.status !== 200) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to get answer');
          }

          const data = await response.json();
          if (data.status !== 'success') {
            throw new Error(data.error || 'Failed to get answer');
          }

          setQaHistory((prev) => {
            const updatedHistory = [...prev];
            updatedHistory[prev.length - 1] = {
              question,
              answer: data.answer,
              sections: data.sections || [],
              isRelevant: data.isRelevant,
              filename: data.filename,
            };
            return updatedHistory;
          });
        } catch (err) {
          setError(`Error processing question: ${err.message}`);
          setQaHistory((prev) => {
            const updatedHistory = [...prev];
            updatedHistory[prev.length - 1] = {
              question,
              answer: `Error: ${err.message}`,
              sections: [],
              isRelevant: false,
              filename: null,
            };
            return updatedHistory;
          });
        } finally {
          setIsProcessing(false);
        }
      }
    },
    [question, selectedFile, isProcessing]
  );

  const handleBackClick = () => {
    navigate('/ModelsPage');
  };

  return (
    <div className="qna-main-page">
      {error && (
        <motion.div
          className="qna-error-notification"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setError(null)}
        >
          {error}
        </motion.div>
      )}
      <motion.button
        className="qna-back-btn"
        onClick={handleBackClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        <FiArrowLeft />
      </motion.button>

      <div className="qna-file-upload-section">
        <motion.div
          className="qna-file-upload-box"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h3>Legal Document Q&A</h3>
          <p>Ask questions about your legal documents. Large files (>5MB) may cause delays due to API limits.</p>
          <div
            className={`qna-upload-area ${isDragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <AnimatePresence>
              {selectedFile ? (
                <motion.div
                  key="file-preview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="qna-file-preview"
                >
                  <div className="qna-file-info">
                    <FiFile className="qna-file-icon" />
                    <p className="qna-file-name">{selectedFile.name}</p>
                    {isProcessing && <div className="qna-spinner">Processing...</div>}
                  </div>
                  <motion.button
                    className="qna-remove-file"
                    onClick={handleRemoveFile}
                    disabled={isProcessing}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FiX />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="upload-prompt"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="qna-upload-prompt"
                >
                  <FiUpload className="qna-upload-icon" />
                  <p>{isDragging ? 'Drop your document here' : 'Drag and drop your legal documents'}</p>
                  <small>or</small>
                </motion.div>
              )}
            </AnimatePresence>
            <label className="qna-upload-btn">
              <input
                type="file"
                onChange={handleInputChange}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.txt"
                disabled={isProcessing}
              />
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <FiUpload className="qna-btn-icon" />
              </motion.div>
              {isProcessing ? 'Processing...' : 'Browse files'}
            </label>
            <p className="qna-file-types">Supported: PDF, DOC, DOCX, TXT</p>
          </div>
        </motion.div>

        <AnimatePresence>
          {selectedFile && (
            <motion.div
              className="qna-section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <h4 className="qna-heading">Questions & Answers</h4>
              <div className="qna-history">
                {qaHistory.length > 0 ? (
                  qaHistory.map((qa, index) => (
                    <motion.div
                      key={index}
                      className="qna-entry"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <span className="qna-question">Q: {qa.question}</span>
                      <div className={`qna-answer-card ${!qa.isRelevant ? 'irrelevant' : ''}`}>
                        <p className="qna-answer">A: {qa.answer}</p>
                        {qa.sections && qa.sections.length > 0 && (
                          <div className="qna-relevant-sections">
                            <h5 className="qna-h5">Relevant Sections:</h5>
                            {qa.sections.map((section, i) => (
                              <div key={i} className="qna-section-card">
                                <p
                                  className="qna-paragraph"
                                  dangerouslySetInnerHTML={{ __html: section.content }}
                                />
                                <small>Relevance: {section.score.toFixed(2)}</small>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="qna-placeholder" aria-live="polite">
                    No questions asked yet.
                  </p>
                )}
              </div>
              <div className="qna-input-bar">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleQuestionSubmit}
                  placeholder="Ask a question about your document..."
                  className="qna-input"
                  rows="4"
                  disabled={isProcessing}
                />
                <motion.button
                  onClick={handleQuestionSubmit}
                  className="qna-send-btn"
                  disabled={isProcessing || !question.trim()}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiSend />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default QAPage;
