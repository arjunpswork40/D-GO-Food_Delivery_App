const Food = require("../../models/food-model");

module.exports = {
    getFoodDetailsFromFoodId: async (restaurantId, foodId) => {
        try {
            const food = await Food.findOne(
                {
                    hotelId: restaurantId,
                    "foodItems._id": foodId
                },
                {
                    "foodItems.$": 1
                }
            );
            console.log(food)
            return food.foodItems[0];;
        } catch (err) {
            console.error("Error in getFoodPriceFromFoodId (from service file):", err);
            return false;
        }
    },

    // this function is being called from both addtocart and removeFromCart scenarios.
    // so based on addOrRemoveStatus, qty add or minus logic implemented.
    updateItemArray: async (items, foodId, qty, restaurantId, addOrRemoveStatus) => {
        let result = {
            items: items,
            status: false,
            message: 'Some error occurred.'
        };
        console.log("result====>",result)
        try {
            let found = false;
            const price = await module.exports.getFoodDetailsFromFoodId(restaurantId, foodId);
            if (!price) {
                result.message = "Food item not found in given restaurant.";
                return result;
            }
    
            for (let i = 0; i < items.length; i++) {
                let food = items[i];
    
                if (food?.foodId?.toString() === foodId) {
                    let calculatedQty = addOrRemoveStatus 
                        ? Number(food.qty) + Number(qty) 
                        : Number(food.qty) - Number(qty);
    
                    if (calculatedQty <= 0) {
                        // Remove the item from the array
                        items.splice(i, 1);
                    } else {
                        // Update the item
                        food.qty = calculatedQty;
                        food.price = price.price;
                    }
    
                    found = true;
                    result.items = items;
                    result.status = true;
                    result.message = "Success";
                    break;
                }
            }
    
            // If the food item was not found and we are adding a new item
            if (addOrRemoveStatus && !found) {
                const priceData = price.price;
                items.push({ foodId, qty, price: priceData });
                result.items = items;
                result.status = true;
                result.message = "Success";
            }
    
            return result;
        } catch (err) {
            console.error("Error in updateItemArray (from service file):", err);
            return result;
        }
    },    

    foodItemCheck: async (restaurantId, foodId) => {
        try {

            const food = await Food.findOne({
                hotelId: restaurantId,  // Match the hotelId
                'foodItems._id': foodId  // Match the food item ID within the foodItems array
            });

            return food ? true : false;

        } catch (err) {
            console.error("Error in areIdsFromSingleFoodModel (from service file):", err);
            return false;
        }
    },
}