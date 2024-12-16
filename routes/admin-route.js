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

 
module.exports = router