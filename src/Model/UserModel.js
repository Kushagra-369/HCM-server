const mongoose = require("mongoose")
const { ValidName, ValidEmail, ValidPassword } = require("../Validation/AllValidation")
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema(
    {
        profile_image: {
            type: {
                url: { type: String, required: true, trim: true },
                public_id: { type: String, required: true, trim: true }
            }
        },
        name: { type: String, required: [true, " Name is Required "], validate: [ValidName, "Name is not valid"], trim: true },
        email: { type: String, required: [true, " Email is Required "], validate: [ValidEmail, "Email is not valid"], trim: true, lowercase: true },
        password: { type: String, required: [true, " Password is Required "], validate: [ValidPassword, "Password is not valid"], trim: true },
        Verification: {
            user: {
                UserOTP: { type: String, default: 0 },
                isDeleted: { type: Boolean, default: false },
                isVerify: { type: Boolean, default: false },
                isOtpVerified: { type: String, default: 0 },
                expireOTP: { type: Date, default: null }
            },
            Admin: {
                isAccountActive: { type: Boolean, default: true },
                AdminOTP: { type: String, default: null },
                isOtpVerified: { type: String, default: 0 },
            }
        },
        role: { type: String, enum: ['user', 'admin'], required: true, trim: true },
    },
    { timestamps: true }
)


UserSchema.pre('save' , async function (next) {

    try{
        this.password = await bcrypt.hash(this.password ,10)
    }
    catch(err){
        next(err)
    }
    
})

module.exports = mongoose.model('User', UserSchema) 