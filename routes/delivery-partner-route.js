const express = require("express")
const router = express.Router()
const controller = require("../controller/delivery-partner")
const paymentController = require("../controller/payment")
const auth = require("../middleware/auth-middleware")
const changePasswordValidator = require("../middleware/validator/change-password-validator");
const {forgotPasswordValidator} = require("../middleware/validator/forgot-password-validator");
const {resetPasswordValidator} = require("../middleware/validator/reset-password-validator");
const {emailValidator} = require("../middleware/validator/emailValidator");
const {stipeAccounIdValidator} = require("../middleware/validator/stipeAccounIdValidator");

router.post(
    "/change-password",
    auth.decodeToken,
    changePasswordValidator,
    controller.changePassword
)
router.post(
    "/forgot-password",
    forgotPasswordValidator,
    controller.forgotPassword
)

router.post(
    "/reset-password",
    resetPasswordValidator,
    controller.resetPassword
)

router.post(
    "/create-stripe-account",
    auth.decodeToken,
    paymentController.createStripeAccount
)

router.post(
    "/create-stripe-account-link",
    auth.decodeToken,
    stipeAccounIdValidator,
    paymentController.createStripeAccountLink
)

router.post(
    "/stripe-account-details",
    auth.decodeToken,
    paymentController.getStripeAccountDetails
)
router.post(
    "/stripe-account-update-link",
    auth.decodeToken,
    paymentController.getStripeAccountUpdateLink
)
router.delete(
    "/delete-account",
    auth.decodeToken,
    controller.deActivateAccountDP
)
router.post(
    "/delete-stripe-account",
    auth.decodeToken,
    paymentController.deleteStripeAccount
)

router.post(   
    "/get-stripe-account-balance",
    auth.decodeToken,
    paymentController.getStripeAccountBalance
)



module.exports = router