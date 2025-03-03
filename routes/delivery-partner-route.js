const express = require("express")
const router = express.Router()
const controller = require("../controller/delivery-partner")
const auth = require("../middleware/auth-middleware")
const forgotPasswordValidator = require("../middleware/validator/forgot-password-validator");

router.post(
    "/forgot-password",
    auth.decodeToken,
    forgotPasswordValidator,
    controller.forgotPassword
)

module.exports = router