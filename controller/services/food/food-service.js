const { ORDER_STATUS } = require("../../../constants/order/order-statuses")
const notificationsModel = require("../../../models/notifications-model")
const Food = require("../../../models/food-model")
const Cart = require("../../../models/cart-model")
const User = require("../../../models/user-model")
const { USER_TYPES } = require("../../../constants/user/user-constants")

module.exports = {
    getFoodDetail: async (foodId) => {
        let finalResult = {
            message: "Internal error occured.",
            status: false,
            data: [],
            cartEntry: []
        };

        try {

            const result = await Food.findOne(
                { "foodItems._id": foodId },
                { "foodItems.$": 1 } // Only return the matched food item
            );

            const cartItem = await Cart.findOne(
                { "foodItems.foodId": foodId },
                { "foodItems.$": 1 } // Only return the matched cart item
            );

            if (cartItem) {
                finalResult.cartEntry = cartItem.foodItems[0];
            }

            if (!result) {
                finalResult.message = "Food item not found."
                return finalResult;
            }

            finalResult.message = "Food item found.";
            finalResult.status = true;
            finalResult.data = result.foodItems

            return finalResult;

        } catch (error) {
            console.log("error from getFoodDetail (service function) :: ", error)
            finalResult.message = error.message || "Internal error occurred";
            return finalResult;
        }
    },

    getAllFoodList: async (hotelId, skip, limit) => {
        let finalResult = {
            message: "Internal error occured.",
            status: false,
            data: []
        };

        try {
            const result = await Food.aggregate([
                { $match: { hotelId } }, // Filter by hotelId
                {
                    $addFields: {
                        totalItems: { $size: "$foodItems" }, // Count total food items
                        paginatedItems: { $slice: ["$foodItems", skip, limit] } // Apply pagination
                    }
                },
                {
                    $project: {
                        _id: 1,
                        hotelId: 1,
                        totalItems: 1,
                        foodItems: "$paginatedItems" // Replace original array with paginated items
                    }
                }
            ]);


            if (!result) {
                finalResult.message = "No food items found."
                return finalResult;
            }

            finalResult.message = "Food items found.";
            finalResult.status = true;
            finalResult.data = result;

            return finalResult;

        } catch (error) {
            console.log("error from getAllFoodList (service function) :: ", error)
            finalResult.message = error.message || "Internal error occurred";
            return finalResult;
        }
    },

    getUnAvailableAllFoodList: async (hotelId, skip, limit) => {
        let finalResult = {
            message: "Internal error occured.",
            status: false,
            data: []
        };

        try {
            const result = await Food.aggregate([
                { $match: { hotelId } }, // Filter by hotelId
                {
                    $addFields: {
                        filteredItems: {
                            $filter: {
                                input: "$foodItems",
                                as: "item",
                                cond: { $eq: ["$$item.available", false] } // Filter available items
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        totalItems: { $size: "$filteredItems" }, // Count total available food items
                        paginatedItems: { $slice: ["$filteredItems", skip, limit] } // Apply pagination
                    }
                },
                {
                    $project: {
                        _id: 1,
                        hotelId: 1,
                        totalItems: 1,
                        foodItems: "$paginatedItems" // Replace with paginated and filtered items
                    }
                }
            ]);


            if (!result) {
                finalResult.message = "No food items found."
                return finalResult;
            }

            finalResult.message = "Food items found.";
            finalResult.status = true;
            finalResult.data = result;

            return finalResult;

        } catch (error) {
            console.log("error from getUnAvailableAllFoodList (service function) :: ", error)
            finalResult.message = error.message || "Internal error occurred";
            return finalResult;
        }
    },
    getAvailableAllFoodList: async (hotelId, skip, limit) => {
        let finalResult = {
            message: "Internal error occured.",
            status: false,
            data: []
        };

        try {
            const result = await Food.aggregate([
                { $match: { hotelId } }, // Filter by hotelId
                {
                    $addFields: {
                        filteredItems: {
                            $filter: {
                                input: "$foodItems",
                                as: "item",
                                cond: { $eq: ["$$item.available", true] } // Filter available items
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        totalItems: { $size: "$filteredItems" }, // Count total available food items
                        paginatedItems: { $slice: ["$filteredItems", skip, limit] } // Apply pagination
                    }
                },
                {
                    $project: {
                        _id: 1,
                        hotelId: 1,
                        totalItems: 1,
                        foodItems: "$paginatedItems" // Replace with paginated and filtered items
                    }
                }
            ]);


            if (!result) {
                finalResult.message = "No food items found."
                return finalResult;
            }

            finalResult.message = "Food items found.";
            finalResult.status = true;
            finalResult.data = result;

            return finalResult;

        } catch (error) {
            console.log("error from getAvailableAllFoodList (service function) :: ", error)
            finalResult.message = error.message || "Internal error occurred";
            return finalResult;
        }
    },

    removeFoodItemByOwnerAction: async (hotelId, foodId) => {
        let finalResult = {
            message: "Internal error occured.",
            status: false,
            data: []
        };

        try {

            const updateResult = await Food.updateOne(
                { hotelId },
                { $pull: { foodItems: { _id: foodId } } }
            );

            if (updateResult.n === 0) {
                finalResult.message = "No matching food item found to remove.";
                finalResult.status = false;
            } else {
                const updatedData = await Food.findOne(
                    { hotelId },
                    { foodItems: 1 } // Only return the foodItems field
                );
                finalResult.message = "Food item removed successfully.";
                finalResult.status = true;
                finalResult.data = updatedData._doc; // Return only the _doc field of the updated data model
            }

            return finalResult;

        } catch (error) {
            console.log("error from getAvailableAllFoodList (service function) :: ", error)
            finalResult.message = error.message || "Internal error occurred";
            return finalResult;
        }
    }
}