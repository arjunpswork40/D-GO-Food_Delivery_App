const express = require("express");
const router = express.Router();
const controller = require("../controller/coustomer");
const auth = require("../middleware/auth-middleware");
const {customerAdressUpdateValidator} = require("../middleware/validator/customer/customer-address-update-validator");
const {BankdetailsValidationRules} = require("../middleware/validator/customer/coustomer-bankdetails-update-validatrer");
const {getRestaurantDetailsValidator} = require("../middleware/validator/customer/get-restaurant-detail-validator");
const forgotPasswordValidator = require("../middleware/validator/forgot-password-validator");

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
    "/restaurant/:restaurantId/:page/:limit",
    auth.decodeToken,
    getRestaurantDetailsValidator,
    controller.restaurantDetails
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
    "/address",
    auth.decodeToken,
    customerAdressUpdateValidator,
    controller.CustomeraddressAdd
)

router.post(
    "/forgot-password",
    auth.decodeToken,
    forgotPasswordValidator,
    controller.forgotPassword
)

router.post(
    "/bank-details",
    auth.decodeToken,
    BankdetailsValidationRules,
    controller.updateBankDetails
)



module.exports = router