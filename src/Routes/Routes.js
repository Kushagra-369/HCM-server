const express = require("express");
const router = express.Router();
const multer = require("multer");

// Import controller functions
const {HCM,  UserOtpVerify,  LogInUser,  ResendOTP,  userDelete,  userUpdated,  newEmail,  newEmailVerify,  changePassword,  UploadProfileImg,createReview} = require("../Controller/UserController");

const {  LogInAdmin,  AdminOtpVerify,  UploadAdminProfileImg,  changeAdminPassword,CreateMonsterByAdmin,getAllReviews,getAllUsers} = require("../Controller/AdminController");

const { UserAuthenticate, UserAuthorize } = require("../middleware/UserAuth");
const { authenticate, AdminAuthorize } = require("../middleware/AdminAuth");

const { createMonster,getAllMonsters,getAllCreatedMonsters } = require("../Controller/MonsterController");

const upload = multer({ storage: multer.diskStorage({}) });

// ✅ USER ROUTES
router.post("/HCM", HCM);
router.post("/user_otp_verify/:id", UserOtpVerify);
router.post("/LogInUser", LogInUser);
router.post("/resend_otp/:id", ResendOTP);
router.delete("/userDelete/:id", userDelete);
router.put("/userUpdated/:id", userUpdated);
router.put("/newEmail/:id", UserAuthenticate, UserAuthorize, newEmail);
router.post("/newEmailVerify/:id", UserAuthenticate, UserAuthorize, newEmailVerify);
router.put("/changePassword/:id", UserAuthenticate, UserAuthorize, changePassword);
router.put(  "/UploadProfileImg/:id",upload.single("profileIMG"),UserAuthenticate,UserAuthorize, UploadProfileImg);
router.post("/CreateUserReview/:userId", createReview);

// ✅ ADMIN ROUTES
router.post("/LogInAdmin", LogInAdmin);
router.post("/AdminOtpVerify/:id", AdminOtpVerify);
router.put(  "/UploadAdminProfileImg/:id",  upload.single("profileIMG"),  authenticate, AdminAuthorize, UploadAdminProfileImg);
router.put( "/admin/changePassword/:id",  authenticate,  AdminAuthorize,  changeAdminPassword);
router.get("/GetAllReviews", getAllReviews);
router.get("/getAllUsers", getAllUsers);

// ✅ MONSTER ROUTE (from React frontend)
router.post("/monsters", UserAuthenticate, createMonster);
router.get("/getAllMonsters", getAllMonsters);
router.get("/getAllCreatedMonsters", getAllCreatedMonsters);
router.post("/CreateMonsterByAdmin", upload.single("image"), CreateMonsterByAdmin);

module.exports = router;
