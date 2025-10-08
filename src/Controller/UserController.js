const UserModel = require("../Model/UserModel");
const { OTPverificationUser } = require("../Mail/UserMail");
const { errorHandlingdata } = require('../Error/ErrorHandling')
const { changeEmail } = require("../Mail/UserMail");
const { UploadProfileImg, DeleteProfileImg } = require("../Images/UploadImage")
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
const type = req.query.type || "user";
if (type === "change_email") { /* process email change OTP */ }

    if (!otp) 
      return res.status(400).send({ status: false, msg: "Please provide OTP" });

    const user = await UserModel.findById(id);
    if (!user) 
      return res.status(404).send({ status: false, msg: "User not found" });

    let dbOtp, otpExpire;

    // Select the OTP based on verification type
    if (type === "email_change") {
      dbOtp = user.Verification?.email?.UserOTP;
      otpExpire = user.Verification?.email?.expireOTP;
    } else {
      dbOtp = user.Verification?.user?.UserOTP;
      otpExpire = user.Verification?.user?.expireOTP;
    }

    if (!dbOtp) 
      return res.status(400).send({ status: false, msg: "No OTP generated" });

    if (otpExpire && otpExpire < new Date()) {
      return res.status(400).send({ status: false, msg: "OTP expired. Please request a new one." });
    }

    if (dbOtp != otp) {
      return res.status(400).send({ status: false, msg: "Invalid OTP" });
    }

    if (type === "email_change") {
      const newEmail = user.Verification?.email?.newEmail;
      if (!newEmail) 
        return res.status(400).send({ status: false, msg: "No new email found" });

      // Update email and remove OTP info
      await UserModel.findByIdAndUpdate(
        id,
        {
          $set: { email: newEmail },
          $unset: { "Verification.email": "" }
        },
        { new: true }
      );

      return res.status(200).send({ status: true, msg: "Email verified successfully" });
    } else {
      // Normal account verification
      await UserModel.findByIdAndUpdate(
        id,
        {
          $set: { "Verification.user.isVerify": true },
          $unset: { "Verification.user.UserOTP": "", "Verification.user.expireOTP": "" },
        },
        { new: true }
      );

      return res.status(200).send({ status: true, msg: "User verified successfully" });
    }

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
    if (!user) 
      return res.status(400).send({ status: false, msg: "User not found" });

    const type = req.query.type || "user";

    if (type === "change_email") {
      // Generate OTP for email change
      const randomOTP = crypto.randomInt(1000, 10000);
      const expireOTPAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await UserModel.findByIdAndUpdate(id, {
        $set: {
          "Verification.email.UserOTP": randomOTP,
          "Verification.email.expireOTP": expireOTPAt
        }
      });

      changeEmail(user.name, user.Verification?.email?.newEmail, randomOTP);

      return res.status(200).send({ status: true, msg: "Email change OTP resent successfully" });
    }

    // Generate OTP for normal user verification
    const randomOTP = crypto.randomInt(1000, 10000);
    const expireOTPAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

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

exports.userDelete = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("🟦 Incoming Delete Request for ID:", id);

    const user = await UserModel.findById(id);
    console.log("🟩 User found:", !!user);

    if (!user) {
      return res.status(404).send({ status: false, msg: "User not found" });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { $set: { "Verification.user.isDeleted": true } },
      { new: true }
    );
    console.log("🟨 User updated:", !!updatedUser);

    if (!updatedUser) {
      return res.status(500).send({ status: false, msg: "Failed to delete user" });
    }

    console.log("✅ User marked as deleted:", updatedUser._id);

    // Comment out the mailer for now
    // OTPverificationUser(updatedUser.name, updatedUser.email, "0000");

    return res.status(200).send({ status: true, msg: "Account deleted successfully" });

  } catch (e) {
    console.error("❌ Error deleting user:", e);
    return res.status(500).send({ status: false, msg: e.message });
  }
};

exports.userUpdated = async (req, res) => {
  try {
    const id = req.params.id;
    const { name } = req.body;

    const user = await UserModel.findById(id);
    if (!user) return res.status(404).send({ status: false, msg: "User not found" });

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { $set: { name } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(500).send({ status: false, msg: "Failed to update user" });
    }

    const DBDATA = {
      name: updatedUser.name,
      email: updatedUser.email,
      _id: updatedUser._id,
    };

    return res
      .status(200)
      .send({ status: true, msg: "Account updated successfully", data: DBDATA });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ status: false, msg: e.message });
  }
};

exports.changePassword = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body

        const { currentPassword, newPassword } = data

        if (currentPassword == newPassword) return res.status(400).send({ status: false, msg: "not provide same password " })


        const randomOTP = Math.floor(1000 + Math.random() * 9000);



        const user = await UserModel.findById(id);
        if (!user) return res.status(404).send({ status: false, msg: "User not found" });

        const bcryptPass = await bcrypt.compare(currentPassword, user.password);
        if (!bcryptPass) return res.status(400).send({ status: false, msg: "Wrong Password" })

        const hashPassword = await bcrypt.hash(newPassword, 10);

        await UserModel.findByIdAndUpdate({ _id: id }, { $set: { password: hashPassword } })

        res.status(200).send({ status: true, msg: "Password updated successfully" });
    } catch (e) {
        console.error(e);
        errorHandlingdata(e, res);
    }
};

exports.UploadProfileImg = async (req, res) => {
  try {
    const id = req.params.id;
    const file = req.file;

    if (!file) {
      return res.status(400).send({ status: false, msg: "Please provide a file" });
    }

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).send({ status: false, msg: "User not found" });
    }

    // Delete old image if it exists
    if (user.profileIMG?.public_id) {
      await DeleteProfileImg(user.profileIMG.public_id);
    }

    // Upload new image to Cloudinary
    const uploadedImg = await UploadProfileImg(file.path);

    // Log the returned data for debugging
    console.log("🧩 Cloudinary Upload Result:", uploadedImg);

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { $set: { profileIMG: uploadedImg } },
      { new: true, runValidators: false }
    );

    // Safely extract URL
    const secureUrl =
      uploadedImg?.secure_url ||
      uploadedImg?.url ||
      updatedUser?.profileIMG?.secure_url ||
      updatedUser?.profileIMG?.url ||
      null;

    if (!secureUrl) {
      return res.status(500).send({
        status: false,
        msg: "Image upload succeeded, but no URL found from Cloudinary",
      });
    }

    return res.status(200).send({
      status: true,
      msg: "Profile updated successfully",
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profileIMG: { secure_url: secureUrl },
      },
    });
  } catch (e) {
    console.error(e);
    errorHandlingdata(e, res);
  }
};


exports.newEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const { password, newEmail } = req.body;

        if (!id || !password || !newEmail) {
            return res.status(400).send({ status: false, msg: "Missing required fields" });
        }

        // Find the user by ID
        const user = await UserModel.findById(id);
        if (!user) return res.status(404).send({ status: false, msg: "User not found" });

        // Check if new email is already in use
        const emailExists = await UserModel.findOne({ email: newEmail, role: 'user' });
        if (emailExists) {
            return res.status(400).send({ status: false, msg: "Email already registered" });
        }

        // Check password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).send({ status: false, msg: "Wrong password" });
        }

        // Account status checks
        const userVerification = user.Verification?.user || {};
        const adminVerification = user.Verification?.Admin || {};

        if (userVerification.isDeleted) {
            return res.status(400).send({ status: false, msg: "User already deleted" });
        }

        if (!adminVerification?.isAccountActive) {
            return res.status(400).send({ status: false, msg: "User is blocked by admin" });
        }

        // Generate OTP and expiry time
        const randomOTP = Math.floor(1000 + Math.random() * 9000);
        const expireOTPAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

        // Update user document with new email OTP info
await UserModel.findByIdAndUpdate(
    id,
    {
        $set: {
            "Verification.email.newEmail": newEmail,
            "Verification.email.UserOTP": randomOTP,
            "Verification.email.expireOTP": expireOTPAt
        }
    },
    { new: true }
);

        // Send email with OTP
        changeEmail(user.name, newEmail, randomOTP);

        return res.status(200).send({ status: true, msg: "OTP sent to new email successfully" });

    } catch (e) {
        errorHandlingdata(e, res);
    }
};

exports.newEmailVerify = async (req, res) => {
    try {
        const { otp, email } = req.body;
        const id = req.params.id;

        if (!otp || !email) {
            return res.status(400).send({ status: false, msg: "OTP and email are required" });
        }

        // Find the user by ID and ensure they are active
        const user = await UserModel.findById(id);
        if (!user) return res.status(404).send({ status: false, msg: "User not found" });

        if (user.Verification?.user?.isDeleted) {
            return res.status(400).send({ status: false, msg: "User account deleted" });
        }

        if (!user.Verification?.Admin?.isAccountActive) {
            return res.status(400).send({ status: false, msg: "User is blocked by admin" });
        }

        // Check if Verification.email exists
        if (!user.Verification?.email) {
            return res.status(400).send({ status: false, msg: "No pending email change request" });
        }

        const dbOTP = String(user.Verification.email.UserOTP || "");
        const dbExpire = user.Verification.email.expireOTP;

if (!dbExpire || !(new Date(dbExpire) > new Date())) {
    return res.status(400).send({ status: false, msg: "OTP Expired. Please request a new one." });
}


        if (String(otp) !== dbOTP) {
            return res.status(400).send({ status: false, msg: "Wrong OTP" });
        }

        const newEmail = user.Verification.email.newEmail;
        if (!newEmail) {
            return res.status(400).send({ status: false, msg: "No new email found to verify" });
        }

        // Ensure new email is not already in use
        const emailExists = await UserModel.findOne({ email: newEmail });
        if (emailExists) {
            return res.status(400).send({ status: false, msg: "New email already in use" });
        }

        // Update email and clean up OTP data
        await UserModel.findByIdAndUpdate(
            id,
            {
                $set: { email: newEmail },
                $unset: { "Verification.email": "" }
            },
            { new: true }
        );

        return res.status(200).send({ status: true, msg: "Email verified successfully" });

    } catch (e) {
        console.error(e);
        return res.status(500).send({ status: false, msg: "Internal Server Error", error: e.message });
    }
};

