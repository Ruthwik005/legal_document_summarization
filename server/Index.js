require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const routes = require("./routes/UserRoutes");
const app = express();
const adminRoutes = require("./routes/admin");

// CORS configuration
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Middleware
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.JWT_SECRET || "secret-123",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  }
}));

app.use(passport.initialize());
app.use(passport.session());
app.options('*', cors());
app.use("/auth", routes);
app.use("/api/notes", routes);
app.use("/api", adminRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_CONN, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));