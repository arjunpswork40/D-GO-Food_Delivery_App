const express = require("express")
const router = express.Router()
const controller = require("../controller/coupons")
const auth = require("../middleware/auth-middleware")
const path=require("path")

router.post( // general coupons
    "/create-coupons",
    auth.decodeTokenAdmin,
    auth.isAdmin,
    controller.createCoupons
)

router.get(
    "/get-all-coupons",
    auth.decodeTokenAdmin,
    auth.isAdmin,
    controller.getAllCoupons
)

router.post(
    "/redeem-coupons",
    controller.redeemCoupons
)

router.post(     //create and assign coupon to a user (invite coupons).
    "/invitation-coupons",
    controller.createInvitationCoupons
) // when a user invites 5 friends. he will get this coupon. 

router.post(     //create and assign coupon to a user (hotel coupons).
    "/hotel-coupons",
    controller.createHotelCoupons
) // when a person orders 10 times from same hotel. call this function.then a coupon will be assigned to him and 11th time check if this coupon exist and automatically reduce 4 euros from the bill


// 3 scenarios.
// students invites , hotel 4 euro , direct supply.
// 4 euro coupon we can redeem 3 times 
//  invite 5 people -> 4 euro coupon.
// same hotel 10 times in 30 days follow money 4 euro ,
// 11th order reduce 4 euro.
// create coupons.(worth 4 euro) 
 
module.exports = router