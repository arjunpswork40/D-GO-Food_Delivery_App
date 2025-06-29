const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const availedCouponSchema = new Schema({
  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  redeemedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('AvailedCoupon', availedCouponSchema);
