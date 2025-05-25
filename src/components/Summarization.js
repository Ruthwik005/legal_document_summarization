import React, { useState, useCallback, useEffect } from 'react';
import { FiUpload, FiZap, FiX, FiCheck, FiFile, FiCopy, FiSend, FiDownload, FiChevronDown, FiEdit, FiArrowLeft } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './Summarization.css';

function Summarization() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [buttonHover, setButtonHover] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [showSummaryResult, setShowSummaryResult] = useState(false);
  const [question, setQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState([]);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState(null);
  const [language, setLanguage] = useState('english');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [showDownloadNotification, setShowDownloadNotification] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  const navigate = useNavigate();

  const languageOptions = [
    { value: 'english', label: 'English', flag: '🇬🇧', code: 'en' },
    { value: 'hindi', label: 'Hindi', flag: '🇮🇳', code: 'hi' },
    { value: 'telugu', label: 'Telugu', flag: '🇮🇳', code: 'te' },
    { value: 'tamil', label: 'Tamil', flag: '🇮🇳', code: 'ta' },
    { value: 'bengali', label: 'Bengali', flag: '🇮🇳', code: 'bn' },
    { value: 'marathi', label: 'Marathi', flag: '🇮🇳', code: 'mr' },
    { value: 'kannada', label: 'Kannada', flag: '🇮🇳', code: 'kn' },
  ];

  useEffect(() => {
    try {
      const savedState = localStorage.getItem('summaryState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        const restoredSummary = typeof parsedState.summaryText === 'string' && parsedState.summaryText.trim() ? parsedState.summaryText : '';
        const restoredQaHistory = Array.isArray(parsedState.qaHistory) && parsedState.qaHistory.every(
          item => typeof item.question === 'string' && typeof item.answer === 'string'
        ) ? parsedState.qaHistory : [];
        if (restoredSummary || restoredQaHistory.length > 0) {
          setSummaryText(restoredSummary);
          setQaHistory(restoredQaHistory);
          setShowSummaryResult(true);
          setIsComplete(true);
        } else {
          localStorage.removeItem('summaryState');
        }
      }
    } catch (e) {
      setError('Failed to load saved summary or Q&A.');
      localStorage.removeItem('summaryState');
    }
  }, []);

  useEffect(() => {
    if (!summaryText && qaHistory.length === 0) {
      return;
    }
    try {
      const state = { summaryText, qaHistory };
      localStorage.setItem('summaryState', JSON.stringify(state));
    } catch (e) {
      setError('Failed to save summary or Q&A.');
    }
  }, [summaryText, qaHistory]);

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const response = await fetch('http://localhost:5000/health');
        const data = await response.json();
        setApiStatus(data);
      } catch (err) {
        setApiStatus({ status: 'unreachable' });
      }
    };
    checkApiHealth();
  }, []);

  const handleFileChange = useCallback((file) => {
    if (file) {
      setSelectedFile(file);
      setError(null);
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
      e.dataTransfer.clearData();
    }
  }, [handleFileChange]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  const handleGenerate = async () => {
    if (!selectedFile) {
      setError('Please upload a document.');
      return;
    }

    setIsGenerating(true);
    setShowSummaryResult(true);
    setSummaryText('Processing document...');
    setError(null);
    setTranslatedText('');
    setQaHistory([]);
    setLanguage('english');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('http://localhost:5000/summarize', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      const newSummary = data.summary || 'No summary content available';
      setSummaryText(newSummary);
      setIsComplete(true);
    } catch (err) {
      setError(err.message || 'Unknown error occurred');
      setSummaryText('');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetProcess = () => {
    setSelectedFile(null);
    setIsComplete(false);
    setShowSummaryResult(false);
    setSummaryText('');
    setQaHistory([]);
    setError(null);
    setTranslatedText('');
    setLanguage('english');
    try {
      localStorage.removeItem('summaryState');
    } catch (e) {
      setError('Failed to clear saved data.');
    }
  };

  const translateSummary = async () => {
    if (!summaryText || language === 'english') {
      setTranslatedText('');
      return;
    }

    setIsTranslating(true);
    try {
      const targetLang = languageOptions.find((l) => l.value === language)?.code || 'en';

      const response = await fetch('http://localhost:5000/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: summaryText,
          lang: targetLang,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Translation failed');
      }

      setTranslatedText(data.translation || '');
    } catch (err) {
      setError('Translation failed: ' + err.message);
      setTranslatedText('');
    } finally {
      setIsTranslating(false);
    }
  };

  const copyToClipboard = () => {
    if (translatedText) {
      navigator.clipboard.writeText(translatedText);
    } else if (summaryText) {
      navigator.clipboard.writeText(summaryText);
    }
    setShowCopyNotification(true);
    setTimeout(() => setShowCopyNotification(false), 2000);
  };

  const downloadSummary = () => {
    const content = translatedText || summaryText || 'No summary available';
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `summary_${language}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    setShowDownloadNotification(true);
    setTimeout(() => setShowDownloadNotification(false), 2000);
  };

  const handleNotesClick = () => {
    navigate('/NotesApp');
  };

  const handleBackClick = () => {
    navigate('/ModelsPage'); 
  };

  useEffect(() => {
    if (summaryText && language !== 'english') {
      translateSummary();
    } else {
      setTranslatedText('');
    }
  }, [language, summaryText]);

  const handleQuestionSubmit = async (e) => {
    if ((e.key === 'Enter' && !e.shiftKey && question.trim()) || e.type === 'click') {
      e.preventDefault();

      if (!selectedFile) {
        setError('Please upload a document to ask questions.');
        return;
      }

      const newQaEntry = {
        question: question,
        answer: 'Processing...',
        loading: true,
        relevantSections: [],
      };
      setQaHistory((prev) => [...prev, newQaEntry]);
      setQuestion('');

      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('question', question);

        const response = await fetch('http://localhost:5000/ask', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        setQaHistory((prev) => {
          const updatedHistory = [...prev];
          updatedHistory[updatedHistory.length - 1] = {
            question: question,
            answer: data.answer || 'No answer found',
            relevantSections: data.sections || [],
            loading: false,
          };
          return updatedHistory;
        });
      } catch (err) {
        setQaHistory((prev) => {
          const updatedHistory = [...prev];
          updatedHistory[updatedHistory.length - 1] = {
            question: question,
            answer: `Error: ${err.message}`,
            loading: false,
            relevantSections: [],
          };
          return updatedHistory;
        });
        setError(err.message);
      }
    }
  };

  const sparkleColors = ['#26A69A', '#FF6F61', '#FFD54F', '#4FC3F7', '#AB47BC'];

  return (
    <div className="summary-mainPage">
      <motion.button
        className="summary-back-btn"
        onClick={handleBackClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.2 }}
        aria-label="Back to model page"
      >
        <FiArrowLeft className="summary-back-icon" />
      </motion.button>

      {apiStatus && apiStatus.status === 'unreachable' && (
        <motion.div
          className="summary-api-warning"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          ⚠ The API server is unreachable. Please make sure the backend service is running.
        </motion.div>
      )}

      <div className="summary-file-upload-section">
        <motion.div
          className="summary-file-upload-box"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h3>Legal Document Summarizer</h3>
          <p>Upload your document for AI-powered insights</p>

          <div
            className={`summary-upload-area ${isDragging ? 'dragging' : ''} ${isComplete ? 'complete' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <AnimatePresence mode="wait">
              {isComplete ? (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="summary-complete-state"
                >
                  <div className="summary-checkmark-circle">
                    <FiCheck className="summary-checkmark" />
                  </div>
                  <p>Analysis Complete!</p>
                  <motion.button
                    className="summary-reset-btn"
                    onClick={resetProcess}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    Start New Analysis
                  </motion.button>
                </motion.div>
              ) : selectedFile ? (
                <motion.div
                  key="file-preview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="summary-file-preview"
                >
                  <div className="summary-file-info">
                    <FiFile className="summary-file-icon" />
                    <p className="summary-file-name">{selectedFile.name}</p>
                  </div>
                  <motion.button
                    className="summary-remove-file"
                    onClick={handleRemoveFile}
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
                  className="summary-upload-prompt"
                >
                  <FiUpload className="summary-upload-icon" />
                  <p>{isDragging ? 'Drop your file here' : 'Drag & drop your document'}</p>
                  <small>or</small>
                </motion.div>
              )}
            </AnimatePresence>

            {!isComplete && (
              <label className="summary-upload-btn">
                <input
                  type="file"
                  onChange={handleInputChange}
                  style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx,.txt"
                />
                <motion.div
                  className="summary-btn-icon-wrapper"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiUpload className="summary-btn-icon" />
                </motion.div>
                Select File
              </label>
            )}

            <p className="summary-file-types">Supports: PDF, DOC, DOCX, TXT</p>
          </div>

          <AnimatePresence>
            {selectedFile && !isComplete && (
              <motion.button
                className="summary-generate-btn"
                onClick={handleGenerate}
                disabled={isGenerating}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                whileHover={
                  !isGenerating
                    ? {
                        scale: 1.05,
                        boxShadow: '0 8px 24px rgba(38, 166, 154, 0.6)',
                      }
                    : {}
                }
                whileTap={!isGenerating ? { scale: 0.95 } : {}}
                onHoverStart={() => setButtonHover(true)}
                onHoverEnd={() => setButtonHover(false)}
                aria-label="Analyze document now"
              >
                {isGenerating ? (
                  <>
                    <div className="summary-sparkle-container">
                      {[...Array(5)].map((_, i) => (
                        <motion.span
                          key={i}
                          className="summary-sparkle"
                          style={{
                            backgroundColor: sparkleColors[i % sparkleColors.length],
                          }}
                          animate={{
                            scale: [0.5, 1, 0.5],
                            opacity: [0, 1, 0],
                            x: (Math.random() - 0.5) * 20,
                            y: (Math.random() - 0.5) * 20,
                          }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: 'easeInOut',
                          }}
                        />
                      ))}
                    </div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{
                        scale: buttonHover ? 1.2 : 1,
                      }}
                      transition={{
                        duration: 0.3,
                        ease: 'easeInOut',
                      }}
                    >
                      <FiZap className="summary-btn-icon" />
                    </motion.div>
                    <span>Analyze Now</span>
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {showSummaryResult && (
            <motion.div
              className="summary-result-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div className="summary-result-header">
                <h4>Summary</h4>
                <div className="summary-actions">
                  <div className="summary-language-select">
                    <motion.div className="language-select-wrapper" whileHover={{ scale: (!isComplete || isGenerating) ? 1 : 1.03 }}>
                      <div
                        className={`language-select-trigger ${(!isComplete || isGenerating) ? 'disabled' : ''}`}
                        onClick={() => {
                          if (isComplete && !isGenerating) {
                            setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
                          }
                        }}
                        aria-disabled={!isComplete || isGenerating}
                        title={!isComplete || isGenerating ? 'Please wait until analysis is complete' : 'Select language'}
                      >
                        <span>{languageOptions.find((l) => l.value === language)?.flag}</span>
                        <span>{languageOptions.find((l) => l.value === language)?.label}</span>
                        <motion.div
                          animate={{ rotate: isLanguageDropdownOpen ? 180 : 0 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                        >
                          <FiChevronDown />
                        </motion.div>
                      </div>
                      <AnimatePresence>
                        {isLanguageDropdownOpen && (
                          <motion.div
                            className="language-dropdown"
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                          >
                            {languageOptions.map((option) => (
                              <div
                                key={option.value}
                                className={`language-option ${language === option.value ? 'selected' : ''}`}
                                onClick={() => {
                                  setLanguage(option.value);
                                  setIsLanguageDropdownOpen(false);
                                }}
                              >
                                <span>{option.flag}</span>
                                <span>{option.label}</span>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                  <motion.button
                    onClick={downloadSummary}
                    className="summary-download-btn"
                    disabled={!isComplete || isGenerating || error}
                    title={isComplete && !error ? 'Download summary' : 'Complete analysis to download'}
                    whileHover={{ scale: isComplete && !error ? 1.05 : 1 }}
                    whileTap={{ scale: isComplete && !error ? 0.95 : 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isGenerating ? <div className="summary-spinner"></div> : <FiDownload />}
                    <span>Download</span>
                  </motion.button>
                  <motion.button
                    onClick={copyToClipboard}
                    className="summary-copy-btn"
                    disabled={!summaryText}
                    title="Copy to clipboard"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FiCopy />
                    <span>Copy</span>
                  </motion.button>
                </div>
              </div>

              <div className="summary-result-content">
                {error ? (
                  <div className="summary-error">
                    <p>{error}</p>
                  </div>
                ) : isTranslating ? (
                  <div className="summary-translating">
                    <div className="summary-spinner"></div>
                    Translating to {languageOptions.find((l) => l.value === language)?.label}...
                  </div>
                ) : translatedText ? (
                  <div className="summary-translated">
                    <p className="summary-translation-note">
                      Translated to {languageOptions.find((l) => l.value === language)?.label}:
                    </p>
                    {translatedText.split('\n').map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                ) : summaryText ? (
                  summaryText.split('\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))
                ) : (
                  <p>No summary generated</p>
                )}
              </div>

              {isComplete && !error && (
                <div className="summary-result-footer">
                  <motion.button
                    onClick={handleNotesClick}
                    className="summary-notes-btn"
                    title="Go to notes"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FiEdit />
                    Notes
                  </motion.button>
                  <div className="summary-completion-badge">
                    <FiCheck /> Complete
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isComplete && !error && (
            <motion.div
              className="summary-qa-section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <h4>Ask Questions</h4>
              {qaHistory.length > 0 ? (
                <div className="summary-qa-history">
                  {qaHistory.map((qa, index) => (
                    <motion.div
                      key={index}
                      className="summary-qa-entry"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1, ease: 'easeOut' }}
                    >
                      <span className="summary-qa-question">Q: {qa.question}</span>
                      <div className="summary-qa-answer-card">
                        {qa.loading ? (
                          <div className="summary-qa-loading">
                            <div className="summary-qa-spinner"></div>
                            Processing...
                          </div>
                        ) : (
                          <>
                            <p className="summary-qa-answer">A: {qa.answer}</p>
                            {qa.relevantSections && qa.relevantSections.length > 0 && (
                              <div className="summary-qa-relevant-sections">
                                <h5>Relevant Sections:</h5>
                                {qa.relevantSections.map((section, i) => (
                                  <div key={i} className="summary-qa-section">
                                    <p
                                      className="question-answer"
                                      dangerouslySetInnerHTML={{ __html: section.content }}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="summary-qa-placeholder">Ask a question to get started.</p>
              )}
              {selectedFile ? (
                <div className="summary-qa-input-bar">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={handleQuestionSubmit}
                    placeholder="Ask about your document..."
                    className="summary-qa-input"
                  />
                  <motion.button
                    onClick={handleQuestionSubmit}
                    className="summary-qa-send-btn"
                    disabled={!question.trim()}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    aria-label="Send question"
                  >
                    <FiSend />
                  </motion.button>
                </div>
              ) : (
                <p className="summary-qa-note">
                  Re-upload the document to ask questions.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showCopyNotification && (
            <motion.div
              className="notification copy-notification"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <FiCheck className="notification-icon" />
              Copied to clipboard!
            </motion.div>
          )}

          {showDownloadNotification && (
            <motion.div
              className="notification download-notification"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <FiDownload className="notification-icon" />
              Summary downloaded!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Summarization;