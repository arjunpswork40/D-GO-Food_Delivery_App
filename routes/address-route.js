const express = require("express")
const router = express.Router()
const controller = require("../controller/address")
const auth = require("../middleware/auth-middleware")

router.get(
    "/list",
    auth.decodeToken,
    controller.addressList
)

module.exports = router