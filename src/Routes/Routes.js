const express= require("express")
const router = express.Router()
const{HCM ,UserOtpVerify} = require("../Controller/UserController")

router.post("/HCM" , HCM)
router.post('/user_otp_verify/:id', UserOtpVerify);

module.exports  = router
