const express = require("express");
const router = express.Router();
const controller = require("../controller/owner");
const auth = require("../middleware/auth-middleware");
const { uploadMultipleFiles } = require("../utils/fileUploader");
const {isFilesExist} = require("../middleware/fileChecker");
const path=require("path");
const {ownerBankDetailsValidator} = require("../middleware/validator/owner-bank-details-validator");
const {hotelDetailsValidator} = require("../middleware/validator/owner-hotel-details-validator");
const multer = require("multer");
const forgotPasswordValidator = require("../middleware/validator/forgot-password-validator");


const existingPath=path.resolve("./uploads")

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/hotel"); // Upload directory
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
    },
  });

  const uploads = multer({ storage });

  const uploadFields = uploads.fields([
    { name: "hotelImages", maxCount: 10 },
    { name: "menuImages", maxCount: 10 },
    { name: "hotelMainImage", maxCount: 1 },
  ]);

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

router.post(
    "/bank-details",
    auth.decodeToken,
    ownerBankDetailsValidator,
    controller.updateBankDetails
)

router.post(
    "/hotel-details",
    auth.decodeToken,
    uploadFields,
    hotelDetailsValidator,
    controller.updateHotelDetails
)

router.post(
  "/forgot-password",
  auth.decodeToken,
  forgotPasswordValidator,
  controller.forgotPassword
)
module.exports = router