const express = require('express')
const router = express.Router()
const controller = require("../controller/index")
const  auth = require("../middleware/auth-middleware")
const {hotelOwnerValidationRules} = require("../middleware/validator/owner-registration-validator")
const {customerRegistrationValidator} = require("../middleware/validator/customer-registration-validator.js")
const path = require('path');
const multer = require("multer");

// const { uploadMultipleFiles,uploadSingleFile } = require("../utils/fileUploader")
const existingPath=path.resolve("./uploads/hotel")

// Configure storage (e.g., disk storage)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log("Destination called for file:", file.originalname);

      cb(null, "uploads/hotel"); // Upload directory
    },
    filename: (req, file, cb) => {
        console.log("Filename called for file:", file.originalname);

      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
    },
  });
  
  // Initialize multer
  const uploads = multer({ storage });
  
  // Define fields
  const uploadFields = uploads.fields([
    { name: "hotelImages", maxCount: 10 },
    { name: "menuImages", maxCount: 10 },
    { name: "hotelMainImage", maxCount: 1 },
  ]);
  const uploadSingle = uploads.single("hotelMainImage");

// const multipleFileUploader = uploadMultipleFiles(
//     "",
//     ["image/png", "image/jpeg", "image/jpg"],
//     existingPath
//   );


//   const singleFileUploader = uploadSingleFile(
//     "file1",
//     1,
//     ["image/png", "application/x-httpd-php"],
//     existingPath
//   );


router.use(
    "/docs",
    require("./doc")
)

router.use(
    "/owner/profile",
    require("./owner-routes.js")
)

router.use(
    "/customer/profile",
    require("./customer-route.js")
)

router.use(
    "/address",
    require("./address-route.js")
)

router.use(
    "/admin",
    require("./admin-route")
)

router.use(
    "/food",
    require("./food-route")
)

router.use(
    "/user/cart",
    require("./cart-route")
)

router.use(
    "/user/ordering",
    require("./ordering-route")
)

router.use(
    "/language",
    require("./language-route")
)


router.get(
    "/insert-dummy-data",
    controller.dummyData
)


router.get(
    "/",
    controller.allFoods
)

// Customer profile
router.post(
    "/customer/signup",
    customerRegistrationValidator,
    controller.newCustomer
)
router.post(
    "/customer/login",
    controller.customerLogin
)

router.post("/test-upload", uploadSingle, (req, res) => {
    console.log("Files:", req.files);
    res.send("Upload test successful");
});

// Owner profile
router.post(
    "/owner/signup",
    (req, res, next) => {
        console.log("Before Multer Middleware");
        next();
    },
    uploadFields,
    (req, res, next) => {
        console.log("After Multer Middleware");
        next();
    },
    hotelOwnerValidationRules,
    controller.newOwner
)
router.post(
    "/owner/login",
    controller.ownerLogin
)

// Delivery Partner profile
router.post(
    "/delivery-partner/signup",
    controller.newDeliveryPartner
)
    
router.post(
    "/delivery-partner/login",
    controller.deliveryPartnerLogin
)
    
router.put(
    "/edit",
    auth.decodeToken,
    controller.userUpdate
)
    
router.put(
    "/updatepassword",
    auth.decodeToken,
    controller.updatePassword
)
    
router.post(
    "/requestpasswordreset",
    controller.requestPasswordReset
)
    
router.post(
    "/resetpassword",
    controller.resetPassword
)


module.exports = router