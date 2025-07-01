const express = require("express");
const router = express.Router();
const controller = require("../controller/coustomer");
const auth = require("../middleware/auth-middleware");
const {customerAdressUpdateValidator} = require("../middleware/validator/customer/customer-address-update-validator");
const {BankdetailsValidationRules} = require("../middleware/validator/customer/coustomer-bankdetails-update-validatrer");
const {getRestaurantDetailsValidator} = require("../middleware/validator/customer/get-restaurant-detail-validator");
const changePasswordValidator = require("../middleware/validator/change-password-validator");
const {customerAdressDeleteValidator} = require("../middleware/validator/customer/customer-address-delete-validator");
const {forgotPasswordValidator} = require("../middleware/validator/forgot-password-validator");
const {resetPasswordValidator} = require("../middleware/validator/reset-password-validator");
const {addOrRemoveFavoriteListValidator} = require("../middleware/validator/customer/favorite/add-or-remove-favorite-list");

// router.get(
//     "/all",
//     auth.decodeToken,
//     controller.allFoods
// )
router.get(
    "/favorites-list/:page/:limit",
    auth.decodeToken,
    controller.getFavoriteList
)

router.get(
    "/home/:page/:limit",
    // auth.decodeToken,
    controller.getHomeDetails
)

router.get(
    "/search/:page/:limit",
    // auth.decodeToken,
    controller.search
)

router.get(
    "/offers/restaurant/:page/:limit",
    // auth.decodeToken,
    controller.restaurantOffers
)

router.get(
    "/restaurants/:page/:limit",
    // auth.decodeToken,
    controller.restaurantList
)

router.get(
    "/restaurant/:restaurantId/:page/:limit",
    // auth.decodeToken,
    getRestaurantDetailsValidator,
    controller.restaurantDetails
)

router.get(
    "/account/:page/:limit",
    auth.decodeToken,
    controller.accountDetails
)

router.post(
    "/address",
    auth.decodeToken,
    customerAdressUpdateValidator,
    controller.CustomeraddressAdd
)

router.delete(
    "/address",
    auth.decodeToken,
    customerAdressDeleteValidator,
    controller.CustomeraddressDelete
)

router.post(
    "/change-password",
    auth.decodeToken,
    changePasswordValidator,
    controller.changePassword
)

router.post(
    "/bank-details",
    auth.decodeToken,
    BankdetailsValidationRules,
    controller.updateBankDetails
)

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

router.post(
    "/add-or-remove-from-favorite-list",
    auth.decodeToken,
    addOrRemoveFavoriteListValidator,
    controller.addOrRemoveFromFavoriteList
)
router.get(
    "/offers/:page/:limit",
    // auth.decodeToken,
    controller.getOffers
)

router.get(
    "/offer/:offerId",
    // auth.decodeToken,
    controller.getOfferById
)

router.get(
    "/:id([0-9a-fA-F]{24})",
    auth.decodeToken,
    controller.customerprofile
)


module.exports = router