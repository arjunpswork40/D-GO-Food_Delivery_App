const express = require("express")
const router = express.Router()
const controller = require("../controller/admin")
const auth = require("../middleware/auth-middleware")

router.post(
    "/",
    auth.decodeTokenAdmin,
    auth.isAdmin,
    controller.newFood
)

router.post(
    "/insert-dummy-admin",
    controller.dummyAdmin
)

router.post(
    "/pass-me/auth/login",
    controller.login
)

router.get(
    "/allfoods",
    auth.decodeTokenAdmin,
    auth.isAdmin,
    controller.allFoods
)

router.post(
    "/makeavailable",
    auth.decodeTokenAdmin,
    auth.isAdmin,
    controller.makeFoodAvailable
)

router.post(
    "/makeadmin",
    auth.decodeTokenAdmin,
    auth.isAdmin,
    controller.makeAdmin
)

router.delete(
    "/:id",
    auth.decodeTokenAdmin,
    auth.isAdmin,
    controller.deleteFood
)
 
module.exports = router