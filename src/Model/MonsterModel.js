const mongoose = require("mongoose");

const MonsterSchema = new mongoose.Schema({
     monster_image: {
            type: {
                secure_url: { type: String, required: false, trim: true },
                public_id: { type: String, required: false, trim: true }
            }
        },
  eyes: { type: Number, required: true },
  heads: { type: Number, required: true },
  wings: { type: String, enum: ["yes", "no"], default: "no" },
  base: { 
    type: String, 
    enum: ["fire", "water", "air", "sky", "earth"], 
    required: true 
  },
  arms: { type: Number, required: true },
  tentacles: { type: String, enum: ["yes", "no"], default: "no" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  customerName: { type: String, required: false }, // ✅ Added customer name
  customerEmail: { type: String, required: false }, // ✅ Added customer email
  role: { type: String, enum: ["user", "admin"], default: "user" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Monster", MonsterSchema);
