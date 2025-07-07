const express = require("express");
const router = express.Router();
const controller = require("../controller/owner");
const auth = require("../middleware/auth-middleware");
const { uploadMultipleFiles } = require("../utils/fileUploader");
const { makeJsonResponse } = require("../utils/response");
const path = require("path");
const { ownerBankDetailsValidator } = require("../middleware/validator/owner-bank-details-validator");
const { hotelDetailsValidator } = require("../middleware/validator/owner-hotel-details-validator");
const { addFoodByOwner } = require("../middleware/validator/food/add-food-by-owner");
const { removeFoodItemByOwnerValidator } = require("../middleware/validator/food/remove-food-by-owner");
const { updateFoodItemByOwnerValidator } = require("../middleware/validator/food/update-food-item-by-owner");
const {forgotPasswordValidator} = require("../middleware/validator/forgot-password-validator");
const {resetPasswordValidator} = require("../middleware/validator/reset-password-validator");

const multer = require("multer");
const fs = require("fs");


const existingPath = path.resolve("./uploads")

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, "uploads/hotel"); // Upload directory
//     },
//     filename: (req, file, cb) => {
//       const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//       cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
//     },
//   });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const foodPath = "uploads/food"; // Ensure correct path
    if (!fs.existsSync(foodPath)) {
      fs.mkdirSync(foodPath, { recursive: true });
    }
    cb(null, foodPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
  },
});

// Allowed file types
const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];


// File filter for validation
const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Invalid file type. Only JPG, PNG, GIF, and WebP are allowed."), false);
  }
  cb(null, true);
};

const uploads = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 6MB limit
  fileFilter,
});

const uploadFields = uploads.fields([
  { name: "hotelImages", maxCount: 10 },
  { name: "menuImages", maxCount: 10 },
  { name: "hotelMainImage", maxCount: 1 },
]);

// router.get(
//     "/:id",
//     auth.decodeToken,
//     controller.userProfile
// )

// router.delete(
//   "/:id",
//   auth.decodeToken,
//   controller.deleteUser
// )

router.post(
  "/bank-details",
  auth.decodeToken,
  ownerBankDetailsValidator,
  controller.updateBankDetails
)

router.post(
  "/restaurant-details",
  auth.decodeToken,
  uploadFields,
  hotelDetailsValidator,
  controller.updateRestaurantDetails
)

router.get(
  "/details",
  auth.decodeToken,
  controller.profileDetails
)
router.get(
  "/bank-details",
  auth.decodeToken,
  controller.bankDetails
)
router.get(
  "/restaurant-details",
  auth.decodeToken,
  controller.restaurantDetails
)

const uploadFoodImages = uploads.fields([
  { name: "foodImages", maxCount: 6 },
]);
router.post(
  "/add-food",
  (req, res, next) => {
    uploadFoodImages(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          response = makeJsonResponse(`File Validation error.`, {}, { error: "Only 6 images are allowed." }, 400, false);
          return res.status(400).json(response);
        }
        response = makeJsonResponse(`File Validation error.`, {}, { error: err.message }, 400, false);
        return res.status(400).json(response);
      } else if (err) {
        response = makeJsonResponse(`File Validc1ation error.`, {}, { error: err.message }, 400, false);
        return res.status(400).json(response);
      }
      next();
    });
  },
  auth.decodeToken,
  addFoodByOwner,
  controller.addFoodByOwner
);
router.post(
  "/change-password",
  auth.decodeToken,
  controller.changePassword
);

router.post(
  "/forgot-password",
  forgotPasswordValidator,
  controller.forgotPassword
)

router.post(
  "/reset-password",
  resetPasswordValidator,
  controller.resetPassword
)
router.delete(
    "/delete-account",
    auth.decodeToken,
    controller.deActivateAccount
)

router.get(
  "/home",
  auth.decodeToken,
  controller.homeDetails
);


router.get(
  "/food-list/:page/:limit",
  auth.decodeToken,
  controller.getFoodList
);

router.get(
  "/food-available-list/:page/:limit",
  auth.decodeToken,
  controller.getAvailableFoodList
);

router.get(
  "/food-unavailable-list/:page/:limit",
  auth.decodeToken,
  controller.getUnAvailableFoodList
);

router.post(
  "/remove-food-item",
  auth.decodeToken,
  removeFoodItemByOwnerValidator,
  controller.removeFoodItemByOwner
);

router.post(
  "/update-food-item",
  (req, res, next) => {
    uploadFoodImages(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          response = makeJsonResponse(`File Validation error.`, {}, { error: "Only 6 images are allowed." }, 400, false);
          return res.status(400).json(response);
        }
        response = makeJsonResponse(`File Validation error.`, {}, { error: err.message }, 400, false);
        return res.status(400).json(response);
      } else if (err) {
        response = makeJsonResponse(`File Validc1ation error.`, {}, { error: err.message }, 400, false);
        return res.status(400).json(response);
      }
      next();
    });
  },
  auth.decodeToken,
  updateFoodItemByOwnerValidator,
  controller.updateFoodItemByOwner
);



module.exports = router;