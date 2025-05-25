const express = require('express');
const router = express.Router();
const UserLoginStats = require('../model/UserLoginStats');
const BlogPost = require('../model/BlogPost');
const Feedback = require('../model/Feedback');
const { verifyAdmin } = require('../Middleware/auth');
const jwt = require('jsonwebtoken');
const { startOfDay } = require('date-fns');

// Get login statistics (for graph)
router.get('/login-stats', verifyAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    const start = startOfDay(new Date(startDate));
    const end = new Date(startOfDay(new Date(endDate)).getTime() + 24 * 60 * 60 * 1000 - 1);

    console.log('Querying login-stats:', {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });

    const stats = await UserLoginStats.find({
      createdAt: {
        $gte: start,
        $lte: end,
      },
    }).sort({ createdAt: 1 });

    console.log('Fetched login-stats:', {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      stats: stats.map(stat => ({
        date: stat.createdAt.toISOString().split('T')[0],
        count: stat.count,
      })),
    });

    res.json(
      stats.map(stat => ({
        date: stat.createdAt.toISOString().split('T')[0],
        count: stat.count,
      }))
    );
  } catch (error) {
    console.error('Login stats error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user login statistics (for table)
router.get('/user-login-stats', verifyAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const start = startOfDay(new Date(startDate));
    const end = new Date(startOfDay(new Date(endDate)).getTime() + 24 * 60 * 60 * 1000 - 1);

    console.log('Querying user-login-stats:', {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });

    const rawStats = await UserLoginStats.find({
      createdAt: {
        $gte: start,
        $lte: end,
      },
    }).sort({ createdAt: 1 });

    console.log('Raw stats from MongoDB:', {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      rawStats: rawStats.map(stat => ({
        createdAt: stat.createdAt.toISOString(),
        userLogins: stat.userLogins,
      })),
    });

    const stats = await UserLoginStats.aggregate([
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $unwind: '$userLogins',
      },
      {
        $group: {
          _id: '$userLogins.email',
          count: { $sum: '$userLogins.count' },
        },
      },
      {
        $project: {
          _id: 0,
          email: '$_id',
          count: 1,
        },
      },
      {
        $sort: { email: 1 },
      },
    ]);

    console.log('Fetched user-login-stats:', {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      stats,
    });

    res.json(stats);
  } catch (error) {
    console.error('User login stats error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Server error' });
  }
});

// Blog Post CRUD
router.post('/blog-posts', verifyAdmin, async (req, res) => {
  try {
    const { title, content, category, tags, isPublished = true } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Title, content, and category are required' });
    }
    const newPost = new BlogPost({
      title,
      content,
      category,
      tags: tags || [],
      isPublished,
      postedBy: req.user.id,
    });
    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

router.get('/blog-posts/admin', verifyAdmin, async (req, res) => {
  try {
    const posts = await BlogPost.find().sort({ createdAt: -1 }).populate('postedBy', 'name');
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts (admin):', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

router.get('/blog-posts', async (req, res) => {
  try {
    const posts = await BlogPost.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .populate('postedBy', 'name');
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts (public):', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

router.get('/blog-posts/:id', async (req, res) => {
  try {
    const post = await BlogPost.findOne({ _id: req.params.id, isPublished: true })
      .populate('postedBy', 'name');
    if (!post) {
      return res.status(404).json({ error: 'Post not found or not published' });
    }
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

router.get('/blog-posts/admin/:id', verifyAdmin, async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id).populate('postedBy', 'name');
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    console.error('Error fetching post (admin):', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

router.put('/blog-posts/:id', verifyAdmin, async (req, res) => {
  try {
    const { title, content, category, tags, isPublished } = req.body;
    const updatedPost = await BlogPost.findByIdAndUpdate(
      req.params.id,
      { title, content, category, tags: tags || [], isPublished, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!updatedPost) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

router.delete('/blog-posts/:id', verifyAdmin, async (req, res) => {
  try {
    const deletedPost = await BlogPost.findByIdAndDelete(req.params.id);
    if (!deletedPost) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

// Feedback routes
router.post('/feedback', async (req, res) => {
  try {
    const { content } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-123');
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (!content) {
      return res.status(400).json({ error: 'Feedback content is required' });
    }
    const email = decoded.email;
    if (!email) {
      console.error('No email found in token:', decoded);
      return res.status(401).json({ error: 'User email not found in token' });
    }
    const newFeedback = new Feedback({
      content,
      email,
      username: decoded.username || 'User',
    });
    await newFeedback.save();
    res.status(201).json({ success: true, message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

router.get('/feedback', verifyAdmin, async (req, res) => {
  try {
    const feedback = await Feedback.find().sort({ createdAt: -1 });
    await Feedback.updateMany({ isNew: true }, { $set: { isNew: false } });
    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

router.delete('/feedback/:id', verifyAdmin, async (req, res) => {
  try {
    const deletedFeedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!deletedFeedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    res.json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
});

router.put('/feedback/:id/bookmark', verifyAdmin, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    feedback.isBookmarked = !feedback.isBookmarked;
    feedback.isNew = false;
    await feedback.save();
    res.json(feedback);
  } catch (error) {
    console.error('Error bookmarking feedback:', error);
    res.status(500).json({ error: 'Failed to bookmark feedback' });
  }
});

router.get('/feedback/new-count', verifyAdmin, async (req, res) => {
  try {
    const count = await Feedback.countDocuments({ isNew: true });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching new feedback count:', error);
    res.status(500).json({ error: 'Failed to fetch new feedback count' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;