const {ORDER_STATUS} = require("../../../constants/order/order-statuses")
const notificationsModel = require("../../../models/notifications-model")
const Food = require("../../../models/food-model")
const User = require("../../../models/user-model")
const {USER_TYPES} = require("../../../constants/user/user-constants")

module.exports = {
    getFoodDetail: async (foodId) => {
        let finalResult = {
            message: "Internal error occured.",
            status: false,
            data: []
        };
        
        try{

            const result = await Food.findOne(
                { "foodItems._id": foodId }, 
                { "foodItems.$": 1 } // Only return the matched food item
                );

            if(!result) {
                finalResult.message = "Food item not found."
                return finalResult;
            }
          
            finalResult.message = "Food item found.";
            finalResult.status = true;
            finalResult.data = result.foodItems

            return finalResult;

        }catch(error) {
            console.log("error from getFoodDetail (service function) :: ",error)
            finalResult.message = error.message || "Internal error occurred";
            return finalResult;
        }
    }
}