const User = require("../../models/userRegister");
const OTP = require("../../models/otpModel");
const bcrypt = require("bcrypt");
const sendEmail = require("../../utils/mail");
const otpGenerator = require("otp-generator");

module.exports = {
  loadForgotPassword: async (req, res) => {
    try {
      console.log("--->>>loadForgotPassword");

      res.render("user/forgotPassword", { message: null });
    } catch (error) {
      console.error("Error loading forgot password page:", error);
      res.status(500).send("Server Error");
    }
  },

  sendResetOTP: async (req, res) => {
    try {
      console.log("--->>>sendResetOTP");

      const { email } = req.body;
      
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "No account found with this email."
        });
      }

      const otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false
      });

      await OTP.findOneAndUpdate(
        { email },
        {
          email,
          otp,
          createdAt: Date.now(),
          expiresAt: new Date(Date.now() + 3 * 60 * 1000),
          attempts: 0
        },
        { upsert: true }
      );

      await sendEmail(email, otp);

      req.session.resetEmail = email;

      res.json({ success: true, message: "Reset OTP sent successfully!" });
    } catch (error) {
      console.error("Error sending reset OTP:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  resendOTP: async (req, res) => {
    try {
      console.log("--->>>resendOTP");

      const { email } = req.body;

      const existingOTP = await OTP.findOne({ email });
      if (existingOTP) {
        const timeSinceLastOTP = Date.now() - existingOTP.createdAt;
        const cooldownPeriod = 60 * 1000; 

        if (timeSinceLastOTP < cooldownPeriod) {
          const remainingTime = Math.ceil((cooldownPeriod - timeSinceLastOTP) / 1000);
          return res.status(429).json({
            success: false,
            message: `Please wait ${remainingTime} seconds before requesting a new code.`
          });
        }
      }

      const otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false
      });

      await OTP.findOneAndUpdate(
        { email },
        {
          email,
          otp,
          createdAt: Date.now(),
          expiresAt: new Date(Date.now() + 3 * 60 * 1000),
          attempts: 0 
        },
        { upsert: true }
      );

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

  verifyResetOTP: async (req, res) => {
    try {
      console.log("--->>>verifyResetOTP");

      const { otp } = req.body;
      const email = req.session.resetEmail;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Session expired. Please try again."
        });
      }

      const otpRecord = await OTP.findOne({ email });
      
      if (!otpRecord) {
        return res.status(401).json({
          success: false,
          message: "Invalid verification code."
        });
      }

      if (otpRecord.expiresAt < Date.now()) {
        await OTP.deleteOne({ email }); 
        return res.status(401).json({
          success: false,
          message: "Verification code has expired."
        });
      }

      const maxAttempts = 5;
      if (otpRecord.attempts >= maxAttempts) {
        await OTP.deleteOne({ email }); 
        return res.status(401).json({
          success: false,
          message: "Maximum verification attempts reached. Please request a new code."
        });
      }

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

      res.json({ success: true, message: "Verification successful!" });
    } catch (error) {
      console.error("Error verifying reset OTP:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  resetPassword: async (req, res) => {
    try {
      console.log("--->>>resetPassword");

      const { password } = req.body;
      const email = req.session.resetEmail;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Session expired. Please try again."
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await User.findOneAndUpdate(
        { email },
        { password: hashedPassword }
      );

      await OTP.deleteOne({ email });

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