const nodemailer = require("nodemailer");
const dotenv = require("dotenv")
dotenv.config()

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 465,
  secure: true,
  service: "gmail",
  auth: {
    user: process.env.NodeMailerUser,
    pass: process.env.NodeMailerPassword,
  },
});

exports.OTPverificationUser = async (name, email, randomOTP) => {
  try {
    const info = await transporter.sendMail({
      from: '"Maddison Foo Koch" kushagra100chhabra@gmail.com', // You can update this
      to: email,
      subject: "Verify Your Account - OTP Code",
      text: `Hello ${name}, your OTP code is ${randomOTP}`, // fallback for non-HTML email clients
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #333;">Hello ${name},</h2>
                    <p>Thank you for registering. Please use the following One-Time Password (OTP) to verify your account:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 24px; font-weight: bold; background-color: #f4f4f4; padding: 10px 20px; border-radius: 5px; display: inline-block;">
                            ${randomOTP}
                        </span>
                    </div>
                    <p>This OTP is valid for the next <strong>5 minutes</strong>. Do not share this code with anyone.</p>
                    <p>If you did not request this, please ignore this email or contact support immediately.</p>
                    <br />
                    <p style="color: #888;">– The Team at YourCompany</p>
                </div>
            `
    });

    console.log("OTP email sent: %s", info.messageId);
  } catch (e) {
    console.error("Error sending OTP email:", e);
  }
};

exports.changeEmail = async (name, email, randomOTP) => {
  try {
    const info = await transporter.sendMail({
      from: '"Your App Name" <kushagra100chhabra@gmail.com>',
      to: email,
      subject: "📧 Confirm Your New Email Address – OTP Verification",
      text: `Hi ${name},\n\nWe received a request to change the email address associated with your account.\n\nYour One-Time Password (OTP) to verify this change is: ${randomOTP}\n\nThis OTP is valid for 10 minutes.\n\nIf you did not request this change, please ignore this email or contact support.\n\n– The Your App Name Team`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <h2 style="color: #2c3e50;">Hi ${name} 👋</h2>
          <p>We received a request to change the email address associated with your account.</p>
          <p>To confirm this change, please use the OTP below:</p>
          <div style="background-color: #f9f9f9; padding: 15px 25px; font-size: 24px; font-weight: bold; border-radius: 6px; display: inline-block; margin: 15px 0;">
            ${randomOTP}
          </div>
          <p>This OTP is valid for <strong>10 minutes</strong>.</p>
          <p>If you did not request this, please secure your account and contact support.</p>
          <hr style="margin: 30px 0;"/>
          <p style="font-size: 14px; color: #888;">This is an automated message. Please do not reply.</p>
          <p style="font-size: 14px; color: #888;">– The Your App Name Team</p>
        </div>
      `
    });

    console.log(`✅ Change Email OTP sent to ${email}, messageId: ${info.messageId}`);
  } catch (e) {
    console.error("❌ Failed to send Change Email OTP to", email, e);
  }
};




