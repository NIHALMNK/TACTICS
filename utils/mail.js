const SibApiV3Sdk = require("sib-api-v3-sdk");

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];

apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async (email, otp) => {
  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = "OTP Verification";

    sendSmtpEmail.sender = {
      name: "Tactics",
      email: process.env.SENDER_EMAIL,
    };

    sendSmtpEmail.to = [{ email }];

    sendSmtpEmail.htmlContent = `
      <h2>Your OTP</h2>
      <h1>${otp}</h1>
      <p>This OTP expires in 5 minutes.</p>
    `;

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log("Email sent:", response);

    return true;
  } catch (error) {
    console.error(
      "Brevo Error:",
      error.response?.body || error
    );

    return false;
  }
};

module.exports = sendEmail;