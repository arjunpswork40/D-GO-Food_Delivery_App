const express = require("express")
const router = express.Router()
const controller = require("../controller/food")
const auth = require("../middleware/auth-middleware")
const {foodDetailValidator} = require("../middleware/validator/food/food-detail-validator")

router.get(
    "/all",
    // auth.decodeToken,
    controller.allFoods
)

router.get(
    "/:foodId",
    // auth.decodeToken,
    foodDetailValidator,
    controller.foodDetail
)

// router.get(
//     "/:id",
//     auth.decodeToken,
//     controller.aFoodDetails
// )

module.exports = router