const express = require("express");
const router = express.Router();
const multer = require("multer")

// Import controller functions
const { HCM, UserOtpVerify, LogInUser,ResendOTP , userDelete,userUpdated,newEmail,newEmailVerify,changePassword,UploadProfileImg} = require("../Controller/UserController");
const {UserAuthenticate , UserAuthorize} = require("../middleware/UserAuth")
const {LogInAdmin,AdminOtpVerify,UploadAdminProfileImg,changeAdminPassword} = require("../Controller/AdminController")
const {authenticate,AdminAuthorize} = require("../middleware/AdminAuth")

const upload = multer({storage:multer.diskStorage({})})

// user
router.post("/HCM", HCM);
router.post("/user_otp_verify/:id", UserOtpVerify);
router.post("/LogInUser", LogInUser);
router.post("/resend_otp/:id", ResendOTP);
router.delete("/userDelete/:id", userDelete);
router.put("/userUpdated/:id", userUpdated);
router.put('/newEmail/:id', UserAuthenticate, UserAuthorize, newEmail);
router.post('/newEmailVerify/:id', UserAuthenticate, UserAuthorize, newEmailVerify);
router.put('/changePassword/:id', UserAuthenticate, UserAuthorize, changePassword);
router.put('/UploadProfileImg/:id', upload.single("profileIMG"), UserAuthenticate, UserAuthorize, UploadProfileImg);

// admin
router.post("/LogInAdmin", LogInAdmin);
router.post("/AdminOtpVerify/:id", AdminOtpVerify);
router.put('/UploadAdminProfileImg/:id', upload.single("profileIMG"), authenticate, AdminAuthorize, UploadAdminProfileImg);
router.put("/admin/changePassword/:id", authenticate, AdminAuthorize, changeAdminPassword);

module.exports = router;
