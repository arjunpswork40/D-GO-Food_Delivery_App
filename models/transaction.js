const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    stripePaymentIntentId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'succeeded', 'failed'], default: 'pending' },
});

module.exports = mongoose.model('Transaction', transactionSchema);
