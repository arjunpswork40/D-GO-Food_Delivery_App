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
    "/home/:page/:limit",
    auth.decodeToken,
    controller.getHomeDetails
)

router.get(
    "/search/:page/:limit",
    auth.decodeToken,
    controller.search
)

router.get(
    "/offers/restaurant/:page/:limit",
    auth.decodeToken,
    controller.restaurantOffers
)

router.get(
    "/restaurants/:page/:limit",
    auth.decodeToken,
    controller.restaurantList
)

router.get(
    "/account/:page/:limit",
    auth.decodeToken,
    controller.accountDetails
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