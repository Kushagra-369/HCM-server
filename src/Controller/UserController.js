const UserModel = require("../Model/UserModel")
const { OTPverificationUser } = require("../Mail/UserMail")
const crypto = require('crypto');
const otp = crypto.randomInt(1000, 10000); ` `

exports.HCM = async (req, res) => {
    try {
        const data = req.body

        if (Object.keys(data).length === 0) { return res.status(400).send({ status: false, msg: "can not give empty field" }) }

        const randomOTP = crypto.randomInt(1000, 10000);

        const Verification = {}
        Verification.user = {}
        const expireOTPAt = new Date(Date.now() + 5 * 60 * 1000);

        const CheckUser = await UserModel.findOneAndUpdate({ email: data.email }, { $set: { "Verification.user.OTP": randomOTP, "Verification.user.expireOTP": expireOTPAt } }, { new: true });
        if (CheckUser) {
            console.log(CheckUser);
            const DBDATABASE = { name: CheckUser.name, email: CheckUser.email, _id: CheckUser._id }
            const userVerification = CheckUser.Verification?.user || {};
            const adminVerification = CheckUser.Verification?.Admin || {};


            const { isDeleted, isVerify, isAccountActive } = Verification
            if (userVerification.isDeleted) return res.status(400).send({ status: false, msg: 'User already deleted' });
            if (userVerification.isVerify) return res.status(400).send({ status: false, msg: 'Account already verified, please login' });
            if (!adminVerification.isAccountActive) return res.status(400).send({ status: false, msg: 'User is blocked by admin' });

            OTPverificationUser(CheckUser.name, CheckUser.email, randomOTP)
            return res.status(200).send({ status: true, msg: "OTP sent successfully", data: DBDATABASE })

        }
        data.role = 'user'
        data.Verification = { user: { UserOTP: randomOTP, expireOTP: expireOTPAt } }

        const newUser = await UserModel.create(data);

        const newDB = { name: newUser.name, email: newUser.email, _id: newUser._id }

        return res.status(201).send({ status: true, msg: 'User created successfully', data: newDB });

    }

    catch (e) { return res.status(500).send({ status: false, msg: e.message }) }

}

exports.UserOtpVerify = async (req, res) => {
    try {

        const otp = req.body.otp;
        const id = req.params.id;

        if (!otp) return res.status(400).send({ status: true, msg: "pls Provide OTP" });

        const user = await UserModel.findById(id);
        if (!user) return res.status(400).send({ status: true, msg: "User not found" });
        const dbOtp = user.Verification.user.UserOTP;

        if (!(dbOtp == otp)) return res.status(400).send({ status: true, msg: "The OTP you entered is incorrect. Please try again." });

        await UserModel.findByIdAndUpdate({ _id: id }, { $set: { 'Varification.user.isVerify': true } }, { new: true });
        res.status(200).send({ status: true, msg: "User Verify successfully" });

    }
    catch (e) { errorHandlingdata(e, res) }
}

exports.getHCMById = async (req, res) => {
    try {

        const id = req.params.id

        const DB = await UserModel.findById(id)

        if (!DB) return res.status(400).send({ status: false, msg: 'Data Not Found' })
        return res.status(200).send({ status: true, data: DB })
    }
    catch (e) { res.status(500).send({ status: false, msg: e.message }) }
}