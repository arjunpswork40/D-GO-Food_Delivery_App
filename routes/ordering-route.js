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

const { 
    ownerPlacedOrderValidator 
} = require("../middleware/validator/order/owner-place-order-validator.js");

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
    "/owner-place-order",
    auth.decodeToken,
    ownerPlacedOrderValidator,
    controller.ownerPlaceOwner
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
    "/delivery-partner/order-requests/:page/:limit",
    auth.decodeToken,
    controller.deliveryPartnerOrderList
)

router.get(
    "/delivery-partner/list/completed/:page/:limit",
    auth.decodeToken,
    controller.deliveryPartnerCompletedOrders
)

router.get(
    "/delivery-partner/list/cancelled/:page/:limit",
    auth.decodeToken,
    controller.deliveryPartnerCancelledOrders
)

router.get(
    "/delivery-partner/list/rejected/:page/:limit",
    auth.decodeToken,
    controller.deliveryPartnerRejectedOrders
)

router.get(
    "/delivery-partner/list/accepted/:page/:limit",
    auth.decodeToken,
    controller.deliveryPartnerAcceptedOrders
)

router.get(
    "/customer/list/:page/:limit",
    auth.decodeToken,
    controller.orderHistroy
)

router.get(
    "/customer/list/completed/:page/:limit",
    auth.decodeToken,
    controller.customerCompletedOrders
)

router.get(
    "/customer/list/cancelled/:page/:limit",
    auth.decodeToken,
    controller.customerCancelledOrders
)

router.get(
    "/owner/list/:page/:limit",
    auth.decodeToken,
    controller.ownerOrderHistroy
)

module.exports = router