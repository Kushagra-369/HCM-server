const cloudinary = require("cloudinary").v2
const dotenv = require("dotenv")
dotenv.config()

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});



exports.UploadProfileImg = async (file) => {
    try {
        console.log(file);
        const uploadResult = await cloudinary.uploader.upload(file)

        return {secure_url:uploadResult.secure_url , public_id:uploadResult.public_id}

    }
    catch (err) { console.log(err) }
}

exports.DeleteProfileImg = async (public_id) => {
    try {
        const result = await cloudinary.uploader.destroy(public_id);
        console.log("Deleted image result:", result);
        return result; // usually { result: "ok" } or similar
    }
    catch (err) {
        console.log("Cloudinary delete error:", err);
        throw err;
    }
}

exports.uploadProduct = async (file) => {
    try {

        const uploadResult = await cloudinary.uploader.upload(file);

        return { secure_url: uploadResult.secure_url, public_id: uploadResult.public_id }
    }
    catch (err) { console.log(err) }
}