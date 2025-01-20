const express = require("express")
const router = express.Router()
const controller = require("../controller/cart")
const auth = require("../middleware/auth-middleware")
const {addToCartValidator} = require("../middleware/validator/cart/add-to-cart-validator")
const {updateCartValidator} = require("../middleware/validator/cart/update-cart-validator")
const {deleteCartItemValidator} = require("../middleware/validator/cart/delete-cart-item-validator")

// router.get(
//     "/",
//     auth.decodeToken,
//     controller.allCartItem
// )

// router.put(
//     "/:id/:qty",
//     auth.decodeToken,
//     controller.editCart
// )

// router.post(
//     "/:id/:qty",
//     auth.decodeToken,
//     controller.addToCart2
// )

// router.delete(
//     "/:id",
//     auth.decodeToken,
//     controller.removeFromCart
// )

router.get(
    "/",
    auth.decodeToken,
    controller.allCartItem
)
router.post(
    "/add-to-cart",
    auth.decodeToken,
    addToCartValidator,
    controller.addToCart
)

router.post(
    "/update-cart",
    auth.decodeToken,
    updateCartValidator,
    controller.updateCart
)

router.delete(
    "/remove-cart-item/:cartId",
    auth.decodeToken,
    deleteCartItemValidator,
    controller.deleteCart
)
module.exports = router