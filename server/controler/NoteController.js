const Note = require("../model/Note");

exports.createNote = async (req, res) => {
  try {
    const { title, content, tags = [] } = req.body;
    console.log('Creating note for user:', req.user._id, req.user.email); // Debug
    
    const note = new Note({
      title,
      content,
      tags,
      user: req.user._id // Use _id from user lookup
    });

    await note.save();
    
    res.status(201).json(note);
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getNotes = async (req, res) => {
  try {
    console.log('Fetching notes for user:', req.user._id, req.user.email); // Debug
    const notes = await Note.find({ user: req.user._id }).sort({ updatedAt: -1 });
    
    res.json({ notes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags, isPinned } = req.body;
    console.log('Updating note:', id, 'for user:', req.user._id, req.user.email); // Debug
    
    const note = await Note.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { title, content, tags, isPinned },
      { new: true }
    );
    
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    
    res.json(note);
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting note:', id, 'for user:', req.user._id, req.user.email); // Debug
    
    const note = await Note.findOneAndDelete({ 
      _id: id, 
      user: req.user._id 
    });
    
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    
    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ error: "Server error" });
  }
};