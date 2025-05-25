const mongoose = require("mongoose");

const bcrypt = require("bcryptjs");



const userSchema = new mongoose.Schema({

  username: { type: String, required: true },

  email: { type: String, required: true, unique: true },

  password: { type: String },

  image: { type: String },

  isAdmin: { 

    type: Boolean,

    default: false // 99% of users will NOT be admins

  },

  otp_verification: { type: String, default: null },

  otpExpiresAt: { type: Date, default: null },

  isVerified: { type: Boolean, default: false },

  resetOtp: { type: String, default: null }, // Changed from resetPasswordToken

  resetotpExpiresAt: { type: Date, default: null },

}, {

  timestamps: true,

});



userSchema.pre("save", async function (next) {

  if (this.isModified("password")) {

    this.password = await bcrypt.hash(this.password, 10);

  }

  next();

});



userSchema.methods.comparePassword = async function (password) {

  return await bcrypt.compare(password, this.password);

};



module.exports = mongoose.model("User", userSchema);