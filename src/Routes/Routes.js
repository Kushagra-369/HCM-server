const express = require("express");
const router = express.Router();

// Import controller functions
const { HCM, UserOtpVerify, LogInUser,ResendOTP  } = require("../Controller/UserController");

router.post("/HCM", HCM);
router.post("/user_otp_verify/:id", UserOtpVerify);
router.post("/LogInUser", LogInUser);
router.post("/resend_otp/:id", ResendOTP);

module.exports = router;
