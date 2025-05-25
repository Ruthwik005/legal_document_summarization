import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import './NotesApp.css';

// Set axios defaults
axios.defaults.baseURL = 'http://localhost:8080';

const NotesApp = () => {
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeNote, setActiveNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine); // Initial network state
  const navigate = useNavigate();

  // Load saved notes from API
  useEffect(() => {
    const fetchNotes = async () => {
      if (!navigator.onLine) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view notes.');
          setIsLoading(false);
          return;
        }

        const response = await axios.get('/api/notes', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        setNotes(response.data.notes || []);
      } catch (err) {
        const errorMsg = err.response?.data?.error || 'Failed to load notes. Please try again.';
        setError(errorMsg);
        if (err.response?.status === 401 && err.response?.data?.error.includes('expired')) {
          localStorage.removeItem('token');
          window.location.href = '/signin';
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, []);

  // Handle offline/online detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setError(''); // Clear error when back online
      setIsLoading(true); // Trigger reload
      const fetchNotes = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            setError('Please log in to view notes.');
            setIsLoading(false);
            return;
          }

          const response = await axios.get('/api/notes', {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          setNotes(response.data.notes || []);
        } catch (err) {
          const errorMsg = err.response?.data?.error || 'Failed to load notes. Please try again.';
          setError(errorMsg);
          if (err.response?.status === 401 && err.response?.data?.error.includes('expired')) {
            localStorage.removeItem('token');
            window.location.href = '/signin';
          }
        } finally {
          setIsLoading(false);
        }
      };
      fetchNotes();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleNewNote = () => {
    setIsEditing(true);
    setCurrentNote('');
    setCurrentTitle('');
    setActiveNote(null);
  };

  const saveNote = async () => {
    if (!currentNote.trim() || !currentTitle.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to save notes.');
        setIsLoading(false);
        return;
      }

      const noteData = {
        title: currentTitle,
        content: currentNote,
        tags: [],
      };

      let response;
      if (activeNote) {
        response = await axios.put(`/api/notes/${activeNote._id}`, noteData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotes(notes.map((note) => (note._id === activeNote._id ? response.data : note)));
      } else {
        response = await axios.post(`/api/notes`, noteData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotes([response.data, ...notes]);
      }

      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save note.');
      if (err.response?.status === 401 && err.response?.data?.error.includes('expired')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNote = async (id) => {
    confirmAlert({
      customUI: ({ onClose }) => (
        <div className="notes-confirm-dialog">
          <h3 className="notes-confirm-title">Delete Note</h3>
          <p className="notes-confirm-message">Are you sure you want to delete this note? This action cannot be undone.</p>
          <div className="notes-confirm-buttons">
            <button
              onClick={onClose}
              className="notes-confirm-btn notes-confirm-cancel"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                setIsLoading(true);
                setError(null);
                try {
                  const token = localStorage.getItem('token');
                  if (!token) {
                    setError('Please log in to delete notes.');
                    setIsLoading(false);
                    onClose();
                    return;
                  }

                  await axios.delete(`/api/notes/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  setNotes(notes.filter((note) => note._id !== id));
                  onClose();
                } catch (err) {
                  setError(err.response?.data?.error || 'Failed to delete note.');
                  if (err.response?.status === 401 && err.response?.data?.error.includes('expired')) {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                  }
                  onClose();
                } finally {
                  setIsLoading(false);
                }
              }}
              className="notes-confirm-btn notes-confirm-delete"
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      ),
    });
  };

  const editNote = (note) => {
    setCurrentNote(note.content);
    setCurrentTitle(note.title);
    setIsEditing(true);
    setActiveNote(note);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setError(null);
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.content && note.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDismissOffline = () => {
    setIsOffline(false);
  };

  return (
    <div className="notes-app">
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

      <header className="notes-header">
        <div className="notes-header-left">
          <span
            onClick={() => navigate('/dash')}
            className="notes-back-link"
            aria-label="Back to Dashboard"
          >
            ← Back
          </span>
        </div>
        <div className="notes-header-center">
          <h1 className="notes-title">LExiMinD Notepad</h1>
        </div>
        <div className="notes-header-actions">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="notes-search-input"
          />
        </div>
      </header>

      {error && <div className="notes-error">{error}</div>}

      <main className="notes-main-container">
        <div className="notes-editor-container">
          {isEditing ? (
            <div className="notes-editor-card">
              <input
                type="text"
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                placeholder="Note Title"
                className="notes-title-input"
                autoFocus
                disabled={isLoading}
              />
              <textarea
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                placeholder="Start typing your note..."
                className="notes-content-input"
                disabled={isLoading}
              />
              <div className="notes-editor-actions">
                <button onClick={cancelEdit} className="notes-cancel-btn" disabled={isLoading}>
                  Cancel
                </button>
                <button onClick={saveNote} className="notes-save-btn" disabled={isLoading}>
                  {isLoading ? 'Saving...' : activeNote ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="notes-new-note-container">
              <button
                onClick={handleNewNote}
                className="notes-new-note-btn"
                disabled={isLoading}
              >
                + New Note
              </button>
            </div>
          )}
        </div>

        {isLoading && !isEditing ? (
          <div className="notes-loading">Loading notes...</div>
        ) : filteredNotes.length > 0 ? (
          <div className="notes-list-card">
            <div className="notes-card-header">
              <h2 className="notes-card-title">Saved Notes</h2>
              <span className="notes-count">{filteredNotes.length}</span>
            </div>
            <div className="notes-list">
              {filteredNotes.map((note) => (
                <div
                  key={note._id}
                  className="notes-list-item"
                  onClick={() => editNote(note)}
                >
                  <div className="notes-item-title">{note.title}</div>
                  <div className="notes-item-content">
                    {note.content &&
                      (note.content.length > 80
                        ? `${note.content.substring(0, 80)}...`
                        : note.content)}
                  </div>
                  <div className="notes-item-footer">
                    <span className="notes-item-date">
                      {formatDate(note.updatedAt)} • {formatTime(note.updatedAt)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note._id);
                      }}
                      className="notes-delete-btn"
                      disabled={isLoading}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="notes-empty">
            {searchTerm ? 'No matching notes found.' : 'No notes yet. Create your first note!'}
          </div>
        )}
      </main>
    </div>
  );
};

export default NotesApp;