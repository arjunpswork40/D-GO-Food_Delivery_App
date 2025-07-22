const express = require("express")
const router = express.Router()
const controller = require("../controller/admin")
const auth = require("../middleware/auth-middleware")
const { uploadMultipleFiles } = require("../utils/fileUploader")
const {isFilesExist} = require("../middleware/fileChecker")
const path=require("path")

const existingPath=path.resolve("./uploads")

const multipleFileUploader = uploadMultipleFiles(
    "",
    ["image/png", "image/jpeg", "image/jpg"],
    existingPath
  );



router.post(
    "/",
    auth.decodeTokenAdmin,
    auth.isAdmin,
    [multipleFileUploader.array("images",10)],
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

router.get(
    "/allpartners",
    auth.decodeTokenAdmin,
    auth.isAdmin,
    controller.allpartners
)

router.post(
    "/user/create",
    // auth.decodeTokenAdmin,
    // auth.isAdmin,
    controller.createUser
)

router.get(
    "/users/get",
    // auth.decodeTokenAdmin,
    // auth.isAdmin,
    controller.getAllUsers
)


router.get(
    "/user/get/:id",
    // auth.decodeTokenAdmin,
    // auth.isAdmin,
    controller.getUser
)


router.put(
    "/user/update/:id",
    // auth.decodeTokenAdmin,
    // auth.isAdmin,
    controller.updateUser
)


router.get(
    "/dashboard/count",
    auth.decodeTokenAdmin,
    auth.isAdmin,
    controller.getDashboardCount
)

router.get(
    "/dashboard/recent-sales",
    auth.decodeTokenAdmin,
    auth.isAdmin,
    controller.DashboardRecentSales
)

router.get(
    "/dashboard/best-sellers",
    auth.decodeTokenAdmin,
    auth.isAdmin,
    controller.getBestSellingRestaurants
)
 
router.get(
    "/dashboard/sales-overview",
    auth.decodeTokenAdmin,
    auth.isAdmin,
    controller.getSalesOverview
)

module.exports = router