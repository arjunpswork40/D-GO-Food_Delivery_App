const express = require("express")
const router = express.Router()
const controller = require("../controller/coustomer")
const auth = require("../middleware/auth-middleware")

// router.get(
//     "/all",
//     auth.decodeToken,
//     controller.allFoods
// )

router.get(
    "/:page/:limit",
    auth.decodeToken,
    controller.getHomeDetails
)

router.get(
    "/:id",
    auth.decodeToken,
    controller.customerprofile
)

router.post(
    "/:id",
    auth.decodeToken,
    controller.CustomeraddressAdd
)


module.exports = router