const MonsterModel = require("../Model/MonsterModel");
const UserModel = require("../Model/UserModel");
const path = require("path"); 
const Review = require("../Model/ReviewModel");
const { otpVerificationAdmin } = require("../Mail/UserMail")
const { errorHandlingdata } = require('../Error/ErrorHandling')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const { UploadProfileImg, DeleteProfileImg,uploadProduct } = require("../Images/UploadImage")
const dotenv = require("dotenv")
dotenv.config()


exports.LogInAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("📩 Incoming admin login request:", { email });

    const user = await UserModel.findOne({ email, role: "admin" });
    if (!user) {
      console.log("❌ No admin user found");
      return res.status(400).send({ status: false, msg: "Admin user not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Wrong password");
      return res.status(400).send({ status: false, msg: "Incorrect password" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    console.log("✅ OTP generated:", otp);

    const updatedAdmin = await UserModel.findOneAndUpdate(
      { email, role: "admin" },
      {
        $set: {
          "Verification.Admin.AdminOTP": otp,
          "Verification.Admin.expireOTP": otpExpiry,
        },
      },
      { new: true }
    );

    console.log("✅ OTP saved in DB:", updatedAdmin?._id);

    await otpVerificationAdmin(user.name, user.email, otp);

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_Admin_SECRET_KEY,
      { expiresIn: "24h" }
    );

    return res.status(200).send({
      status: true,
      msg: "Login successful. OTP sent.",
      data: { token, id: user._id, email: user.email },
    });
  } catch (e) {
    console.error("🔥 LogInAdmin Error:", e);
    return res.status(500).send({ status: false, msg: e.message });
  }
};

 
exports.getAllUserData = async (req, res) => {
    try {

        const type = req.params.type
        const isDeleted = req.params.isDeleted
        if (type == 'all') {
            if (isDeleted == 'true') {
                const DB = await UserModel.find({ role: 'user', 'Verification.user.isDeleted': true })
                if (DB.length == 0) return res.status(400).send({ status: false, msg: "Data not Found" })
                if (!DB) return res.status(400).send({ status: false, msg: "Data not Found" })
                return res.status(200).send({ status: true, msg: "Successfully Got All User Data", data: DB })
            }
            else {
                const DB = await UserModel.find({ role: 'user', 'Verification.user.isDeleted': false })
                if (!DB) return res.status(400).send({ status: false, msg: "Data not Found" })
                return res.status(200).send({ status: true, msg: "Successfully Got All User Data", data: DB })
            }
        } else {
            const DB = await UserModel.findById(type)
            if (!DB) return res.status(400).send({ status: false, msg: "Data not Found" })
            return res.status(200).send({ status: true, msg: "Succesfully User Data", data: DB })
        }
    }
    catch (e) {
        errorHandlingdata(e, res)
    }
}

exports.AdminOtpVerify = async (req, res) => {
    try {
        const otp = req.body.otp;
        const id = req.params.id;

        if (!otp) {
            return res.status(400).send({ status: false, msg: "Please provide OTP" });
        }

        const user = await UserModel.findById(id);
        if (!user || user.role.toLowerCase() !== "admin") {
            return res.status(404).send({ status: false, msg: "Admin user not found" });
        }

        console.log("User OTP from DB:", user.Verification?.Admin?.AdminOTP);
        console.log("OTP Expiry:", user.Verification?.Admin?.expireOTP);

        const dbOtp = user.Verification?.Admin?.AdminOTP?.toString();
        const otpExpiry = user.Verification?.Admin?.expireOTP;

        if (!dbOtp || dbOtp !== otp.toString()) {
            return res.status(400).send({ status: false, msg: "Incorrect OTP" });
        }

        if (!otpExpiry || new Date() > new Date(otpExpiry)) {
            return res.status(400).send({ status: false, msg: "OTP has expired. Please request a new one." });
        }

        await UserModel.findByIdAndUpdate(
            id,
            { $set: { 'Verification.Admin.isOtpVerified': "1" } },
            { new: true }
        );

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_Admin_SECRET_KEY,
            { expiresIn: "24h" }
        );

        return res.status(200).send({
            status: true,
            msg: "Admin verified successfully",
            data: {
                id: user._id,
                token,
                name: user.name,
                email: user.email,
                profileIMG: user.profileIMG
            }
        });
    } catch (e) {
        console.error("AdminOtpVerify Error:", e);
        errorHandlingdata(e, res);
    }
};

exports.UploadAdminProfileImg = async (req, res) => {
  try {
    const id = req.params.id;
    const file = req.file;

    if (!file) {
      return res.status(400).send({ status: false, msg: "Please provide a file" });
    }

    const admin = await UserModel.findById(id);
    if (!admin) {
      return res.status(404).send({ status: false, msg: "Admin not found" });
    }

    if (admin.profileIMG?.public_id) {
      await DeleteProfileImg(admin.profileIMG.public_id);
    }

    // Upload new image to Cloudinary
    const uploadedImg = await UploadProfileImg(file.path);

    // Log the returned data for debugging
    console.log("🧩 Cloudinary Upload Result:", uploadedImg);

    const updatedAdmin = await UserModel.findByIdAndUpdate(
      id,
      { $set: { profileIMG: uploadedImg } },
      { new: true, runValidators: false }
    );

    // Safely extract URL
    const secureUrl =
      uploadedImg?.secure_url ||
      uploadedImg?.url ||
      updatedAdmin?.profileIMG?.secure_url ||
      updatedAdmin?.profileIMG?.url ||
      null;

    if (!secureUrl) {
      return res.status(500).send({
        status: false,
        msg: "Image upload succeeded, but no URL found from Cloudinary",
      });
    }

    return res.status(200).send({
      status: true,
      msg: "Admin profile updated successfully",
      data: {
        _id: updatedAdmin._id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        profileIMG: { secure_url: secureUrl },
      },
    });
  } catch (e) {
    console.error(e);
    errorHandlingdata(e, res);
  }
};


exports.changeAdminPassword = async (req, res) => {
  try {
    const adminId = req.params.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).send({ status: false, msg: "All fields are required" });
    }

    const admin = await UserModel.findById(adminId);
    if (!admin || admin.role !== "admin") {
      return res.status(404).send({ status: false, msg: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).send({ status: false, msg: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedAdmin = await UserModel.findByIdAndUpdate(
      adminId,
      { password: hashedPassword },
      { new: true, runValidators: false } // ❌ skip name/email validation
    );

    return res.status(200).send({
      status: true,
      msg: "Password changed successfully",
      data: {
        id: updatedAdmin._id,
        name: updatedAdmin.name,
        email: updatedAdmin.email
      }
    });
  } catch (error) {
    console.error("changeAdminPassword Error:", error);
    errorHandlingdata(error, res);
  }
};


exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("userId", "name email") // fetch user info
      .sort({ createdAt: -1 }); // latest first

    return res.status(200).send({
      status: true,
      message: "All reviews fetched successfully",
      data: reviews,
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

exports.CreateMonsterByAdmin = async (req, res) => {
  try {
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);

    const {
      eyes,
      heads,
      wings,
      base,
      arms,
      tentacles,
      customerName,
      customerEmail,
      adminId,
    } = req.body;

    if (!adminId)
      return res.status(400).json({ msg: "Admin ID must be present" });

    if (!eyes || !heads || !wings || !base || !arms)
      return res
        .status(400)
        .json({ msg: "All required fields must be provided" });

    if (!customerName || !customerEmail)
      return res
        .status(400)
        .json({ msg: "Customer name and email are required" });

    if (!req.file)
      return res.status(400).json({ msg: "Image must be uploaded" });

    // ✅ Upload monster image to Cloudinary
    const uploaded = await uploadProduct(req.file.path);

    if (!uploaded || !uploaded.secure_url) {
      return res.status(500).json({
        status: false,
        msg: "Failed to upload image to Cloudinary",
      });
    }

    console.log("Cloudinary upload result:", uploaded);

    const monster = await MonsterModel.create({
      eyes,
      heads,
      wings,
      base,
      arms,
      tentacles: tentacles || "no",
      customerName,
      customerEmail,
      createdBy: adminId,
      role: "admin",
      monster_image: {
        secure_url: uploaded.secure_url, // Cloudinary secure URL
        public_id: uploaded.public_id,
      },
    });

    return res.status(201).json({
      status: true,
      msg: "Monster created successfully",
      data: monster,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: false, msg: "Server error", error: error.message });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("userId", "name email") // fetch user info
      .sort({ createdAt: -1 }); // latest first

    return res.status(200).send({
      status: true,
      message: "All reviews fetched successfully",
      data: reviews,
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};
