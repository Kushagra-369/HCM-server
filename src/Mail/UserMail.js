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

