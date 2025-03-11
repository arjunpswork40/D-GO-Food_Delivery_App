const express = require("express")
const router = express.Router()
const controller = require("../controller/delivery-partner")
const auth = require("../middleware/auth-middleware")
const changePasswordValidator = require("../middleware/validator/change-password-validator");
const {forgotPasswordValidator} = require("../middleware/validator/forgot-password-validator");
const {resetPasswordValidator} = require("../middleware/validator/reset-password-validator");

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

module.exports = router