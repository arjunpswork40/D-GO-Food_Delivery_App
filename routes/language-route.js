const express = require("express")
const router = express.Router()
const controller = require("../controller/multi-language/language")


router.post(
    "/",
    controller.changeLanguage
)

module.exports = router