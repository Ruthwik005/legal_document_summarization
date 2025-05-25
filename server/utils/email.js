const nodemailer = require("nodemailer");

// Create a transporter object using SendGrid's SMTP server
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // SendGrid SMTP host
  port: process.env.EMAIL_PORT, // SendGrid SMTP port
  secure: false, // Use `true` for port 465, `false` for other ports
  auth: {
    user: process.env.EMAIL_USER, // Your SendGrid username (usually 'apikey')
    pass: process.env.EMAIL_PASS, // Your SendGrid API key
  },
});

// Function to send OTP email
const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender address
    to: email, // Recipient address
    subject: "Your OTP for Verification", // Email subject
    text: `Your OTP is: ${otp}`, // Plain text body
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("OTP email sent successfully");
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw error;
  }
};

module.exports = sendOtpEmail;