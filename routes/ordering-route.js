const express = require("express")
const router = express.Router()
const controller = require("../controller/order")
const auth = require("../middleware/auth-middleware")

const {
        customerPlaceOrderValidator
    } = require("../middleware/validator/order/cutomer-place-order-validator");
const {
    prepareOrderValidator
} = require("../middleware/validator/order/owner-prepare-validation");
const {
    acceptOrRejectOrderValidator
} = require("../middleware/validator/order/accept-or-reject-order-validator.js");
const {
    orderCompletedValidator
} = require("../middleware/validator/order/order-completed-validator.js");

router.post(
    "/",
    auth.decodeToken,
    customerPlaceOrderValidator,
    controller.checkout
)

router.post(
    "/prepare",
    auth.decodeToken,
    prepareOrderValidator,
    controller.prepareOrder
)

router.post(
    "/accept-or-reject-order",
    auth.decodeToken,
    acceptOrRejectOrderValidator,
    controller.acceptOrRejectOrder
)

router.post(
    "/owner-completed-the-order",
    auth.decodeToken,
    prepareOrderValidator,
    controller.ownerCompletedThePrepartion
)

router.post(
    "/order-picked-up",
    auth.decodeToken,
    prepareOrderValidator,
    controller.orderPickedUp
)

router.post(
    "/delivery-completed",
    auth.decodeToken,
    orderCompletedValidator,
    controller.deliveryCompleted
)

router.get(
    "/",
    auth.decodeToken,
    controller.orderHistroy
)

module.exports = router