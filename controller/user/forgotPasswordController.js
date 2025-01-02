// forgotPasswordController.js
const User = require("../../models/userRegister");
const OTP = require("../../models/otpModel");
const bcrypt = require("bcrypt");
const sendEmail = require("../../utils/mail");
const otpGenerator = require("otp-generator");

module.exports = {
  // Load forgot password page
  loadForgotPassword: async (req, res) => {
    try {
      res.render("user/forgotPassword", { message: null });
    } catch (error) {
      console.error("Error loading forgot password page:", error);
      res.status(500).send("Server Error");
    }
  },

  // Send OTP for password reset
  sendResetOTP: async (req, res) => {
    try {
      const { email } = req.body;
      
      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "No account found with this email."
        });
      }

      // Generate OTP
      const otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false
      });

      // Save OTP with extended expiration (3 minutes)
      await OTP.findOneAndUpdate(
        { email },
        {
          email,
          otp,
          createdAt: Date.now(),
          expiresAt: new Date(Date.now() + 3 * 60 * 1000),
          attempts: 0 // Reset attempts counter on new OTP
        },
        { upsert: true }
      );

      // Send OTP email
      await sendEmail(email, otp);

      // Save email in session for verification
      req.session.resetEmail = email;

      res.json({ success: true, message: "Reset OTP sent successfully!" });
    } catch (error) {
      console.error("Error sending reset OTP:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Resend OTP
  resendOTP: async (req, res) => {
    try {
      const { email } = req.body;

      // Verify if previous OTP exists and check cooldown
      const existingOTP = await OTP.findOne({ email });
      if (existingOTP) {
        const timeSinceLastOTP = Date.now() - existingOTP.createdAt;
        const cooldownPeriod = 60 * 1000; // 1 minute cooldown

        if (timeSinceLastOTP < cooldownPeriod) {
          const remainingTime = Math.ceil((cooldownPeriod - timeSinceLastOTP) / 1000);
          return res.status(429).json({
            success: false,
            message: `Please wait ${remainingTime} seconds before requesting a new code.`
          });
        }
      }

      // Generate new OTP
      const otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false
      });

      // Update OTP record
      await OTP.findOneAndUpdate(
        { email },
        {
          email,
          otp,
          createdAt: Date.now(),
          expiresAt: new Date(Date.now() + 3 * 60 * 1000),
          attempts: 0 // Reset attempts counter
        },
        { upsert: true }
      );

      // Send new OTP email
      await sendEmail(email, otp);

      res.json({ 
        success: true, 
        message: "New verification code sent successfully!" 
      });
    } catch (error) {
      console.error("Error resending OTP:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to send new verification code." 
      });
    }
  },

  // Verify reset OTP
  verifyResetOTP: async (req, res) => {
    try {
      const { otp } = req.body;
      const email = req.session.resetEmail;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Session expired. Please try again."
        });
      }

      const otpRecord = await OTP.findOne({ email });
      
      // Check if OTP record exists
      if (!otpRecord) {
        return res.status(401).json({
          success: false,
          message: "Invalid verification code."
        });
      }

      // Check if OTP is expired
      if (otpRecord.expiresAt < Date.now()) {
        await OTP.deleteOne({ email }); // Clean up expired OTP
        return res.status(401).json({
          success: false,
          message: "Verification code has expired."
        });
      }

      // Check maximum attempts
      const maxAttempts = 5;
      if (otpRecord.attempts >= maxAttempts) {
        await OTP.deleteOne({ email }); // Clean up after max attempts
        return res.status(401).json({
          success: false,
          message: "Maximum verification attempts reached. Please request a new code."
        });
      }

      // Verify OTP
      if (otpRecord.otp !== otp) {
        await OTP.updateOne(
          { email },
          { $inc: { attempts: 1 } }
        );
        return res.status(401).json({
          success: false,
          message: "Invalid verification code."
        });
      }

      // OTP verified successfully
      res.json({ success: true, message: "Verification successful!" });
    } catch (error) {
      console.error("Error verifying reset OTP:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Reset password
  resetPassword: async (req, res) => {
    try {
      const { password } = req.body;
      const email = req.session.resetEmail;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Session expired. Please try again."
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update user password
      await User.findOneAndUpdate(
        { email },
        { password: hashedPassword }
      );

      // Clean up OTP record
      await OTP.deleteOne({ email });

      // Clear session
      delete req.session.resetEmail;

      res.json({
        success: true,
        message: "Password reset successful!"
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};