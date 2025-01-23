const User = require("../../../models/user-model");
const Cart = require("../../../models/cart-model");
const mongoose = require("mongoose")


module.exports = {
    storeToCart: async (foodId, itemCount, user) => {
        try {
            
            const cartData = new Cart({
                userId: user._id,
                foodId: foodId,
                qty: itemCount
            })

            const savedCartData = await cartData.save();


            const userData = await User.findByIdAndUpdate(
                user._id,
                {$push: { cart: savedCartData._id}},
                {new: true}
            );
            
            if(!userData) {
                return false;
            } 


            return cartData;
        } catch (err) {
            console.error("Error in storeToCart (from service file):", err);
            return false;
        }
    },
    updateCart: async (cartId, foodId, itemCount) => {
        try {
            
            const updateCartData = await Cart.findByIdAndUpdate(
                cartId,
                {
                    foodId: foodId,
                    qty: itemCount
                },
                {new: true}
            );
            
            if(!updateCartData) {
                return false;
            } 


            return updateCartData;
        } catch (err) {
            console.error("Error in updateCartData (from service file):", err);
            return false;
        }
    },
    deleteCartItem: async (cartId, user) => {
        try {
            
            const deletedCartData = await Cart.findByIdAndDelete(cartId);
            
            if(!deletedCartData) {
                return false;
            } 
            await User.updateOne(
                { _id: user._id },
                { $pull: { cart: cartId } }  // The $pull operator removes the cartId from the user's cart array
            );

            return deletedCartData;
        } catch (err) {
            console.error("Error in updateCartData (from service file):", err);
            return false;
        }
    },
}