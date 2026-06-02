const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

const sendEmail = async (email, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"Tactics" <${process.env.BREVO_SMTP_USER}>`,
      to: email,
      subject: "OTP Verification",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background:#f5f5f5; padding:20px;">
          <div style="max-width:600px;margin:auto;background:#fff;padding:30px;border-radius:10px;">
            
            <h2 style="text-align:center;">
              Verify Your Account
            </h2>

            <p>Hello,</p>

            <p>Your One-Time Password (OTP) is:</p>

            <div style="text-align:center;margin:30px 0;">
              <div
                style="
                  display:inline-block;
                  padding:15px 30px;
                  border:2px dashed #2563eb;
                  border-radius:8px;
                  font-size:32px;
                  font-weight:bold;
                  letter-spacing:8px;
                  color:#2563eb;
                "
              >
                ${otp}
              </div>
            </div>

            <p style="text-align:center;">
              This OTP will expire in 5 minutes.
            </p>

            <p>
              If you did not request this OTP, please ignore this email.
            </p>

            <hr />

            <p style="font-size:12px;color:#666;">
              Tactics Team
            </p>

          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent:", info.messageId);

    return true;
  } catch (error) {
    console.error("Email Error:", error);
    return false;
  }
};

module.exports = sendEmail;