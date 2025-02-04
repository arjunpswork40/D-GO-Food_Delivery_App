const User = require("../../../models/user-model");
const Cart = require("../../../models/cart-model");
const mongoose = require("mongoose");
const Food = require("../../../models/food-model");
const { 
    getFoodDetailsFromFoodId,
    updateItemArray,
    foodItemCheck
 } = require("../../../utils/helper/food-model-helper")


module.exports = {
    storeOrUpdateToCart: async (restaurantId, foodId, qty, user) => {

        let result = {
            cartData: [],
            status: false,
            message: 'Some error occured.'
        }
        try {
            
            const cartEntry = await Cart.findOne({restaurantId:restaurantId,userId: user._id});

            const foodEntryCheck = await foodItemCheck(restaurantId,foodId)

            if(foodEntryCheck) {

                let cartData = cartEntry ?? {};
                if(cartEntry) {
                    // Get the current price of the food item
                    const price = await getFoodDetailsFromFoodId(restaurantId, foodId);
                    if (!price) {
                        return result.message = "food item not found in given restaurant.";
                    } 

                    const updatedTotalPrice = cartEntry.totalPrice + (Number(qty) * price.price);

                    // Update items array
                    let items = await updateItemArray(cartEntry.foodItems, foodId, qty, restaurantId,true); 

                    if(items.status ) {
                        cartData = await Cart.findByIdAndUpdate(
                            cartEntry._id,
                            {
                                foodItems: items.items,
                                totalPrice: updatedTotalPrice
                            },
                            {new: true}
                        );
                        result.cartData = cartData;
                        result.status = true;
                        result.message = "item updated in cart";
                    } 
                
                } else {

                    await Cart.deleteMany({ userId: user._id });

                    // Create a new cart entry
                    const price = await getFoodDetailsFromFoodId(restaurantId, foodId);
                    if (!price) {
                        return result.message = "food item not found in given restaurant.";
                    }

                    cartData = new Cart({
                        userId: user._id,
                        restaurantId: restaurantId,
                        foodItems: [{
                            foodId,
                            qty,
                            price: price.price,
                        }],
                        totalPrice: Number(qty) * Number(price.price)
                    });
                    result.cartData = cartData;
                    result.status = true;
                    result.message = "item updated in cart";

                    const savedCartData = await cartData.save();
                    const userData = await User.findByIdAndUpdate(
                        user._id,
                        {$push: { cart: savedCartData._id}},
                        {new: true}
                    );
                    
                    if(!userData) {
                        result.message = "User not found";
                        return result;
                    } 
        
                }
            } else {
                result.message = "Given Food is not from given restaurant"
            }

            return result;
        } catch (err) {
            console.error("Error in storeToCart (from service file):", err);
            return result;
        }
    },

    removeOrDeleteFromCart: async (restaurantId, foodId, qty, user) => {

        let result = {
            cartData: [],
            status: false,
            message: 'Some error occured.'
        }
        try {
            
            const cartEntry = await Cart.findOne({restaurantId:restaurantId,userId: user._id});

            const foodEntryCheck = await foodItemCheck(restaurantId,foodId)

            if(foodEntryCheck) {

                let cartData = cartEntry ?? {};
                if(cartEntry) {
                    // Get the current price of the food item
                    const price = await getFoodDetailsFromFoodId(restaurantId, foodId);
                    if (!price) {
                        return result.message = "food item not found in given restaurant.";
                    } 

                    let entryQtyCheck = cartEntry?.foodItems.find(i => i.foodId.toString() === foodId);
                    let updatedTotalPrice = cartEntry.totalPrice - (Number(qty) * price.price);

                    if(qty > entryQtyCheck?.qty) {
                        updatedTotalPrice = cartEntry.totalPrice - (Number(entryQtyCheck.qty) * price.price);
                    }

                    if(cartEntry.foodItems.length === 0) {
                        // if one or zero entry found in food item, deleting entire cart.
                        await Cart.deleteMany({ userId: user._id });
                        result.status = true;
                        result.message = "Cart deleted";
                    } else if(cartEntry.foodItems.length === 1) {
                        const lastEntry = cartEntry.foodItems[0];
                        if(lastEntry.qty === 1 || lastEntry.qty === 0 || lastEntry.qty == qty) {
                            await Cart.deleteMany({ userId: user._id });
                            result.status = true;
                            result.message = "Cart deleted";
                        } else {
                            // Update items array
                            let items = await updateItemArray(cartEntry.foodItems, foodId, qty, restaurantId,false); 

                            if(items.status ) {
                                cartData = await Cart.findByIdAndUpdate(
                                    cartEntry._id,
                                    {
                                        foodItems: items.items,
                                        totalPrice: updatedTotalPrice
                                    },
                                    {new: true}
                                );
                                result.cartData = cartData;
                                result.status = true;
                                result.message = "item updated in cart";
                            } 
                        }
                    } else {
                        // Update items array
                        let items = await updateItemArray(cartEntry.foodItems, foodId, qty, restaurantId,false); 

                        if(items.status ) {
                            cartData = await Cart.findByIdAndUpdate(
                                cartEntry._id,
                                {
                                    foodItems: items.items,
                                    totalPrice: updatedTotalPrice
                                },
                                {new: true}
                            );
                            result.cartData = cartData;
                            result.status = true;
                            result.message = "item updated in cart";
                        } 
                    }
                
                } else {
                    result.status = true;
                    result.message = "Cart is empty";
                }
            } else {
                result.message = "Given Food is not from given restaurant"
            }

            return result;
        } catch (err) {
            console.error("Error in storeToCart (from service file):", err);
            return result;
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