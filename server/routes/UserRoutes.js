const express = require("express");
const passport = require("passport");
const {
  signup,
  signin,
  googleAuth,
  googleCallback,
  getMe,
  verifyOTP,
  forgotPassword,
  resetPassword,
  verifyResetOtp,
  requestNewOtp,
} = require("../controler/UserControler");
const {
  createNote,
  getNotes,
  updateNote,
  deleteNote
} = require("../controler/NoteController");
const { verifyToken } = require("../Middleware/VerifyToken");
const router = express.Router();

// Public authentication routes
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/verify-otp", verifyOTP);
router.get("/google", googleAuth);
router.get("/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:3000/signup"
  }),
  googleCallback
);
router.get("/me", getMe);
router.post("/request-new-otp", requestNewOtp);
router.post("/ForgetPassword", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/ResetPassword", resetPassword);



// Protected note routes
router.post("/", verifyToken, createNote);
router.get("/", verifyToken, getNotes);
router.put("/:id", verifyToken, updateNote);
router.delete("/:id", verifyToken, deleteNote);

module.exports = router;