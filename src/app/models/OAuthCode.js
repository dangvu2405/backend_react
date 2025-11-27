const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OAuthCodeSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'TaiKhoan',
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expireAfterSeconds: 0 }
    }
}, { timestamps: true });

// Tự động xóa document sau khi expiresAt
OAuthCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OAuthCode', OAuthCodeSchema);













