const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // true only for port 465
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

const sendEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.BREVO_SMTP_USER,
    to: email,
    subject: "OTP Verification",
    text: `Your One-Time Password (OTP) is: ${otp}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    console.log("OTP Sent:", email);
    console.log("Message ID:", info.messageId);

    return true;
  } catch (error) {
    console.error("Error sending OTP:", error.message);
    return false;
  }
};

module.exports = sendEmail;