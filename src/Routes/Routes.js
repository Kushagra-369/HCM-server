const express = require("express");
const router = express.Router();

// Import controller functions
const { HCM, UserOtpVerify, LogInUser,ResendOTP , userDelete,userUpdated,newEmail,newEmailVerify} = require("../Controller/UserController");
const {UserAuthenticate , UserAuthorize} = require("../middleware/UserAuth")

router.post("/HCM", HCM);
router.post("/user_otp_verify/:id", UserOtpVerify);
router.post("/LogInUser", LogInUser);
router.post("/resend_otp/:id", ResendOTP);
router.delete("/userDelete/:id", userDelete);
router.put("/userUpdated/:id", userUpdated);
router.put('/newEmail/:id', UserAuthenticate, UserAuthorize, newEmail);
router.post('/newEmailVerify/:id', UserAuthenticate, UserAuthorize, newEmailVerify);
module.exports = router;
