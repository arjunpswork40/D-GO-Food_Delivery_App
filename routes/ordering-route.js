const express = require("express")
const router = express.Router()
const controller = require("../controller/order")
const auth = require("../middleware/auth-middleware")
const {
        customerPlaceOrderValidator
    } = require("../middleware/validator/order/cutomer-place-order-validator");

router.post(
    "/",
    auth.decodeToken,
    customerPlaceOrderValidator,
    controller.checkout
)

router.get(
    "/",
    auth.decodeToken,
    controller.orderHistroy
)

module.exports = router