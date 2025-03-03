const express = require("express")
const router = express.Router()
const controller = require("../controller/payment")
const auth = require("../middleware/auth-middleware")
const {createPaymentValidator} = require("../middleware/validator/payment/create-payment-validator")

router.post(
    "/create-payment",
    auth.decodeToken,
    createPaymentValidator,
    controller.createPaymentIntent
)

module.exports = router