const express = require("express");
const router = express.Router();
const controller = require("../controller/payment");
const auth = require("../middleware/auth-middleware");
const {createPaymentValidator} = require("../middleware/validator/payment/create-payment-validator");
const {confirmPaymentValidator} = require("../middleware/validator/payment/confirm-payment-validator");
router.post(
    "/create-payment",
    auth.decodeToken,
    createPaymentValidator,
    controller.createPaymentIntent
)

router.post(
    "/confirm-payment",
    auth.decodeToken,
    confirmPaymentValidator,
    controller.confirmPayment
)

// router.post(
//     "/stripe-payment-status-webhook",
//     controller.handleStripeWebhook
// )

router.post('/stripe-payment-status-webhook', express.raw({ type: 'application/json' }), controller.handleStripeWebhook);


module.exports = router