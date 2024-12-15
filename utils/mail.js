const nodemailer = require('nodemailer');


let transporter = nodemailer.createTransport({
 
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,  
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASSWORD,
  }, tls: {
    rejectUnauthorized: false
}
});

const sendEmail = async (email,otp)=> {
  let mailOptions = {
    from: process.env.USER_EMAIL,
    to: email,
    subject: 'OTP Verification',
    text: `Your One-Time Password (OTP) is: ${otp}`
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log('OTP Sented: ' + email);
    
  } catch (error) {
    console.log( "error senting otp : " + error.message );
  }
}


module.exports = sendEmail;