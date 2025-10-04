const UserModel = require("../Model/UserModel");
const { OTPverificationUser } = require("../Mail/UserMail");
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv")
dotenv.config()

exports.HCM = async (req, res) => {
  try {
    const data = req.body;
    if (Object.keys(data).length === 0) {
      return res.status(400).send({ status: false, msg: "Fields cannot be empty" });
    }

    const randomOTP = crypto.randomInt(1000, 10000);
    const expireOTPAt = new Date(Date.now() + 5 * 60 * 1000);

    // check if user already exists
    const CheckUser = await UserModel.findOneAndUpdate(
      { email: data.email },
      {
        $set: {
          "Verification.user.UserOTP": randomOTP,
          "Verification.user.expireOTP": expireOTPAt,
        },
      },
      { new: true }
    );

    if (CheckUser) {
      const DBDATABASE = { name: CheckUser.name, email: CheckUser.email, _id: CheckUser._id };
      const userVerification = CheckUser.Verification?.user || {};
      const adminVerification = CheckUser.Verification?.admin || {};

      if (userVerification.isDeleted) return res.status(400).send({ status: false, msg: 'User deleted' });
      if (userVerification.isVerify) {
        return res.status(200).send({
          status: true,
          msg: 'Account already verified, please login',
          data: DBDATABASE,
        });
      }
      if (!adminVerification.isAccountActive) return res.status(400).send({ status: false, msg: 'User blocked by admin' });

      OTPverificationUser(CheckUser.name, CheckUser.email, randomOTP);
      return res.status(200).send({ status: true, msg: "OTP sent successfully", data: DBDATABASE });
    }

    // create new user
    data.role = 'user';
    data.Verification = { user: { UserOTP: randomOTP, expireOTP: expireOTPAt, isVerify: false, isDeleted: false } };

    const newUser = await UserModel.create(data);
    const newDB = { name: newUser.name, email: newUser.email, _id: newUser._id };

    OTPverificationUser(newUser.name, newUser.email, randomOTP);
    return res.status(201).send({ status: true, msg: 'User created successfully', data: newDB });
  } catch (e) {
    return res.status(500).send({ status: false, msg: e.message });
  }
};

exports.UserOtpVerify = async (req, res) => {
  try {
    const otp = req.body.otp;
    const id = req.params.id;

    if (!otp) return res.status(400).send({ status: false, msg: "Please provide OTP" });

    const user = await UserModel.findById(id);
    if (!user) return res.status(404).send({ status: false, msg: "User not found" });

    const dbOtp = user.Verification?.user?.UserOTP;
    const otpExpire = user.Verification?.user?.expireOTP;

    if (!dbOtp) return res.status(400).send({ status: false, msg: "No OTP generated" });
    if (otpExpire && otpExpire < new Date()) {
      return res.status(400).send({ status: false, msg: "OTP expired. Please request a new one." });
    }
    if (dbOtp != otp) {
      return res.status(400).send({ status: false, msg: "Invalid OTP" });
    }

    await UserModel.findByIdAndUpdate(
      id,
      {
        $set: { "Verification.user.isVerify": true },
        $unset: { "Verification.user.UserOTP": "", "Verification.user.expireOTP": "" },
      },
      { new: true }
    );

    return res.status(200).send({ status: true, msg: "User verified successfully" });
  } catch (e) {
    return res.status(500).send({ status: false, msg: e.message });
  }
};

exports.LogInUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const CheckUser = await UserModel.findOne({ email, role: "user" });
    if (!CheckUser) return res.status(400).send({ status: false, msg: "User not found" });

    const userVerification = CheckUser.Verification?.user || {};
    const adminVerification = CheckUser.Verification?.admin || {};

    // password check
    const comparePass = await bcrypt.compare(password, CheckUser.password);
    if (!comparePass) return res.status(400).send({ status: false, msg: "Wrong password" });

    // verification checks
    if (userVerification.isDeleted) return res.status(400).send({ status: false, msg: 'User deleted' });
    if (!userVerification.isVerify) return res.status(400).send({ status: false, msg: 'Please verify your OTP' });
if (adminVerification.isAccountActive === false)
    return res.status(400).send({ status: false, msg: 'User blocked by admin' });

    const token = jwt.sign({ userId: CheckUser._id }, process.env.JWT_User_SECRET_KEY, { expiresIn: '24h' });

    const DBDATA = { profileIMG: CheckUser.profileIMG, name: CheckUser.name, email: CheckUser.email };
    return res.status(200).send({
      status: true,
      msg: "Login successfully",
      data: { token, id: CheckUser._id, DBDATA },
    });
  } catch (e) {
    return res.status(500).send({ status: false, msg: e.message });
  }
};

exports.getUserById = async (req, res) => {
    try {

        const id = req.params.id

        const DB = await UserModel.findById(id)

        if (!DB) return res.status(400).send({ status: false, msg: 'Data Not Found' })
        return res.status(200).send({ status: true, data: DB })
    }
    catch (e) { res.status(500).send({ status: false, msg: e.message }) }
}

exports.ResendOTP = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await UserModel.findById(id);
    if (!user) return res.status(400).send({ status: false, msg: "User not found" });

    const randomOTP = crypto.randomInt(1000, 10000);
    const expireOTPAt = new Date(Date.now() + 5 * 60 * 1000);

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { 
        $set: { 
          "Verification.user.UserOTP": randomOTP, 
          "Verification.user.expireOTP": expireOTPAt 
        } 
      },
      { new: true }
    );

    OTPverificationUser(updatedUser.name, updatedUser.email, randomOTP);

    return res.status(200).send({ status: true, msg: "OTP resent successfully" });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ status: false, msg: e.message });
  }
};

