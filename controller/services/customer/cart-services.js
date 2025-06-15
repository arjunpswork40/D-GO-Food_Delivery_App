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

            const cartEntry = await Cart.findOne({ restaurantId: restaurantId, userId: user._id });

            const foodEntryCheck = await foodItemCheck(restaurantId, foodId)

            if (foodEntryCheck) {

                let cartData = cartEntry ?? {};
                if (cartEntry) {
                    // Get the current price of the food item
                    const price = await getFoodDetailsFromFoodId(restaurantId, foodId);
                    if (!price) {
                        return result.message = "food item not found in given restaurant.";
                    }

                    const updatedTotalPrice = parseFloat((cartEntry.totalPrice + (Number(qty) * price.price)).toFixed(2));

                    // Update items array
                    let items = await updateItemArray(cartEntry.foodItems, foodId, qty, restaurantId, true);

                    if (items.status) {
                        cartData = await Cart.findByIdAndUpdate(
                            cartEntry._id,
                            {
                                foodItems: items.items,
                                totalPrice: updatedTotalPrice
                            },
                            { new: true }
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
                            price: parseFloat(price.price.toFixed(2)),
                        }],
                        totalPrice: parseFloat((Number(qty) * Number(price.price)).toFixed(2))
                    });
                    result.cartData = cartData;
                    result.status = true;
                    result.message = "item updated in cart";

                    const savedCartData = await cartData.save();
                    const userData = await User.findByIdAndUpdate(
                        user._id,
                        { $push: { cart: savedCartData._id } },
                        { new: true }
                    );

                    if (!userData) {
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

            const cartEntry = await Cart.findOne({ restaurantId: restaurantId, userId: user._id });

            const foodEntryCheck = await foodItemCheck(restaurantId, foodId)

            if (foodEntryCheck) {

                let cartData = cartEntry ?? {};
                if (cartEntry) {
                    // Get the current price of the food item
                    const price = await getFoodDetailsFromFoodId(restaurantId, foodId);
                    if (!price) {
                        return result.message = "food item not found in given restaurant.";
                    }

                    let entryQtyCheck = cartEntry?.foodItems.find(i => i.foodId.toString() === foodId);
                    let updatedTotalPrice = parseFloat((cartEntry.totalPrice - (Number(qty) * price.price)).toFixed(2));

                    if (qty > entryQtyCheck?.qty) {
                        updatedTotalPrice = parseFloat((cartEntry.totalPrice - (Number(entryQtyCheck.qty) * price.price)).toFixed(2));
                    }

                    if (cartEntry.foodItems.length === 0) {
                        // if one or zero entry found in food item, deleting entire cart.
                        await Cart.deleteMany({ userId: user._id });
                        result.status = true;
                        result.message = "Cart deleted";
                    } else if (cartEntry.foodItems.length === 1) {
                        const lastEntry = cartEntry.foodItems[0];
                        if (lastEntry.qty === 1 || lastEntry.qty === 0 || lastEntry.qty == qty) {
                            await Cart.deleteMany({ userId: user._id });
                            result.status = true;
                            result.message = "Cart deleted";
                        } else {
                            // Update items array
                            let items = await updateItemArray(cartEntry.foodItems, foodId, qty, restaurantId, false);

                            if (items.status) {
                                cartData = await Cart.findByIdAndUpdate(
                                    cartEntry._id,
                                    {
                                        foodItems: items.items,
                                        totalPrice: updatedTotalPrice
                                    },
                                    { new: true }
                                );
                                result.cartData = cartData;
                                result.status = true;
                                result.message = "item updated in cart";
                            }
                        }
                    } else {
                        // Update items array
                        let items = await updateItemArray(cartEntry.foodItems, foodId, qty, restaurantId, false);

                        if (items.status) {
                            cartData = await Cart.findByIdAndUpdate(
                                cartEntry._id,
                                {
                                    foodItems: items.items,
                                    totalPrice: updatedTotalPrice
                                },
                                { new: true }
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

    updateCart: async (cartId, foodId, qty) => {
        let result = { status: false, message: "Some error occurred.", data: [] };
        try {
            const cart = await Cart.findOne({ _id: cartId, "foodItems.foodId": foodId });

            if (!cart) {
                result.message = "Cart not found or selected food item inside given cart is not found.";
                return result;
            }
            const foodItem = await Food.findOne(
                { "foodItems._id": foodId, hotelId: cart.restaurantId },
                { "foodItems.$": 1 }
            );

            if (!foodItem) {
                result.message = "Food item not found.";
                return result;
            }

            const price = foodItem.foodItems[0].price;
            let totalPrice = parseFloat((price * qty).toFixed(2));
            console.log(qty, typeof qty, typeof 0,qty == 0);
            if (qty == 0) {
                if (cart.foodItems.length === 1) {
                    await Cart.findByIdAndDelete(cartId);
                    await User.updateOne(
                        { _id: cart.userId },
                        { $pull: { cart: cartId } }
                    );
                    result.status = true;
                    result.message = "Cart deleted.";
                    return result;
                } else {
                    const remainingItems = cart.foodItems.filter(item => item.foodId.toString() !== foodId);
                    const updatedTotalPrice = remainingItems.reduce((acc, item) => acc + (item.qty * item.price), 0);

                    const updatedCartData = await Cart.findByIdAndUpdate(
                        cartId,
                        {
                            $pull: { foodItems: { foodId: foodId } },
                            $set: { totalPrice: updatedTotalPrice }
                        },
                        { new: true }
                    );
                    result.status = true;
                    result.message = "Item removed from cart.";
                    result.data = updatedCartData;
                    return result;
                }
            } else {
                const updatedCartData = await Cart.findByIdAndUpdate(
                    cartId,
                    {
                        $set: {
                            "foodItems.$[elem].qty": qty,
                            "foodItems.$[elem].price": price,
                            totalPrice: totalPrice
                        }
                    },
                    {
                        arrayFilters: [{ "elem.foodId": foodId }],
                        new: true
                    }
                );

                if (!updatedCartData) {
                    result.message = "Failed to update cart.";
                    return result;
                }

                result.status = true;
                result.message = "Cart updated successfully.";
                result.data = updatedCartData;
                return result;
            }
        } catch (err) {
            console.error("Error in updateCartData (from service file):", err);
            result.message = "Error occurred while updating cart.";
            return result;
        }
    },
    deleteCartItem: async (cartId, user) => {
        try {

            const deletedCartData = await Cart.findByIdAndDelete(cartId);

            if (!deletedCartData) {
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