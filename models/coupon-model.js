const mongoose = require('mongoose');
const Schema = mongoose.Schema

const couponSchema = new Schema({
    code: { type: String, required: true, unique: true }, // need to make unique coupons with prefix.
    type: { type: String, enum: ['general', 'invite', 'hotels'], required: true },
    value: { type: Number, default: 4 },
    discount_type: { type: String, enum: ['amount', 'percentage'], required: true, default: 'amount' },
    isRedeemed: { type: Boolean, default: false },
    issuedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // if its general then it will be null
    expiry: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now, },
},
{
    timestamps: true,
});

module.exports = mongoose.model('Coupon', couponSchema);
