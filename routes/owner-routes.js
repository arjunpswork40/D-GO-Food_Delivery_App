const express = require("express")
const router = express.Router()
const controller = require("../controller/owner")
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


router.get(
    "/:id",
    auth.decodeToken,
    controller.userProfile
)

router.delete(
    "/:id",
    auth.decodeToken,
    controller.deleteUser
)
module.exports = router