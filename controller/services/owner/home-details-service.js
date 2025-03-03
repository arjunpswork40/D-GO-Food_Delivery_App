const {ORDER_STATUS} = require("../../../constants/order/order-statuses")
const notificationsModel = require("../../../models/notifications-model")
const Users = require("../../../models/user-model")
const Orders = require("../../../models/order-model")
const mongoose = require("mongoose");
// const User = mongoose.model("Users"); 
const {USER_TYPES} = require("../../../constants/user/user-constants")

module.exports = {
    getHomeDetailsWithOrderData: async (user) => {
        let finalResult = {
            message: "Internal error occured.",
            status: false,
            data: []
        };
        
        try{

            const userDetails = await Users.findById(user._id).select('profile_image name email phone').lean();
            let orderDetails = await Orders.find({ restaurantId: new mongoose.Types.ObjectId(user._id) }) // ✅ Use `find()` instead of `findById()`
                            .populate("restaurantId", "name email") // ✅ Populate restaurant details
                            .select("phone totalAmount orderDate paidThrough status") // ✅ Select required fields
                            .lean();
          
            orderDetails = orderDetails.map(order => ({
                ...order,
                restaurantDetails: order.restaurantId, // Rename field
                restaurantId: order.restaurantId._id // Remove original `restaurantId`
              }));
          
            if(!userDetails) {
                finalResult.message = "User data not found."
                return finalResult;
            }
          
            finalResult.message = "User details with order data.";
            finalResult.status = true;
            finalResult.data = {userDetails, orderDetails};

            return finalResult;

        }catch(error) {
            console.log("error from getHomeDetailsWithOrderData (service function) :: ",error)
            finalResult.message = error.message || "Internal error occurred";
            return finalResult;
        }
    }
}