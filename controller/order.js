const User = require("../models/user-model")
const Food = require("../models/food-model")
const Order = require("../models/order-model")
const Cart = require("../models/cart-model")
const { makeJsonResponse } = require("../utils/response")
const {USER_TYPES}= require("../constants/user/user-constants")
const {ORDER_STATUS}= require("../constants/order/order-statuses")

const {
    placeOrder,
    prepareOrderStatusUpdate,
    acceptOrRejectOrderUpdate,
    ownerCompletedThePrepartionUpdate,
    orderPickedUpUpdate,
    deliveryCompletedUpdate
} = require("../controller/services/order/order-related-services")
class order {
    static async checkout(req, res, next) {
        try {
            const { user } = req;
            const { cartId, addressId, phone, paidThrough } = req.body;

            if(user.role != USER_TYPES.CUSTOMER) {
                return res.status(409).json(makeJsonResponse('Customer can only place order', {}, {}, 409, false));
            }

            // Check if an order already exists for the given cart
            const existingOrder = await Order.findOne({ customerId: user._id, cartId });
            if (existingOrder) {
                return res.status(409).json(makeJsonResponse('Order already placed', {}, {}, 409, false));
            }

            // Fetch cart details
            const cartItem = await Cart.findOne({_id:cartId,userId:user._id});
            if (!cartItem) {
                return res.status(404).json(makeJsonResponse('Cart not found', {}, {}, 404, false));
            }

            // Find address from user's saved addresses
            const addressDetails = user.customerDetails.savedAddresses.find(addr => addr._id.toString() === addressId);
            if (!addressDetails) {
                return res.status(404).json(makeJsonResponse('Address not found in saved addresses', {}, {}, 404, false));
            }

            // Place the order
            const orderPlaced = await placeOrder(cartItem, addressDetails, phone, paidThrough, user);
            const orderDetails = {
                cartId: orderPlaced.cartId,
                customerId: orderPlaced.customerId,
                restaurantId: orderPlaced.restaurantId,
                items: orderPlaced.items,
                address: orderPlaced.address,
                phone: orderPlaced.phone,
                totalAmount: orderPlaced.totalAmount,
                orderDate: orderPlaced.orderDate,
                paidThrough: orderPlaced.paidThrough,
                status: orderPlaced.status,
                _id: orderPlaced._id

            }
            if(orderPlaced) {
                return res.status(201).json(makeJsonResponse('Order placed successfully', { orderDetails }, {}, 201, true));
            } else {
                return res.status(500).json(makeJsonResponse('Order placed failed', { orderDetails }, {}, 500, true));
            }
        } catch (error) {
            console.log("error from controller checkout function => ",error)
            return res.status(500).json(makeJsonResponse('Order Failed', {}, {error: error.message || "Internal error occurred"}, 500, false));
        }
    }

    static async orderHistroy(req, res, next) {
        const userId = req.user
        const allUserOrder = await Order.find({
            orderId: userId._id
        })
        return res.status(200).json(allUserOrder)
    }

    static async prepareOrder(req, res, next) {
        try {
            const user = req.user;
            const {orderId} = req.body;

            if(user.role != USER_TYPES.OWNER){
                return res.status(409).json(makeJsonResponse('Restaurant owner can only update order status to start preparation', {}, {}, 409, false));
            }

            const order = await Order.findOne(
                {
                    _id: orderId,
                    status: ORDER_STATUS.CUSTOMER_PLACED_ORDER
                }
            );
            console.log("order===>",order)
            console.log("Order  ddd===>",{
                _id: orderId,
                status: ORDER_STATUS.CUSTOMER_PLACED_ORDER
            })
            if (!order) {
                return res.status(400).json(
                    makeJsonResponse(
                        'order is not found or Order cycle is not correct. Owner can only start prepare after customer placed the order', 
                        {},
                        {}, 
                        400, 
                        false
                    )
                );
            }

            const statusUpdate = await prepareOrderStatusUpdate(orderId, user._id);
            if(statusUpdate.status) {
                return res.status(200).json(makeJsonResponse('Order status updated', { statusUpdate }, {}, 200, true));
            } else {
                return res.status(500).json(makeJsonResponse(statusUpdate.message, {}, {}, 500, false));
            }
        } catch(error) {
            console.log("error from controller prepareOrder function => ",error)
            return res.status(500).json(makeJsonResponse('Order preparetion failed', {}, {error: error.message || "Internal error occurred"}, 500, false));
        }
    }

    static async acceptOrRejectOrder(req, res, next) {
        try {
            const user = req.user;
            const {orderId,status} = req.body;

            if(user.role != USER_TYPES.DELIVERY_PARTNER){
                return res.status(409).json(makeJsonResponse('Delivery Partner  can only update delivery partner status', {}, {}, 409, false));
            }

            const order = await Order.findOne(
                {
                    _id: orderId,
                    status: ORDER_STATUS.OWNER_STARTED_PREPARATION
                }
            );          

            if (!order) {
                return res.status(400).json(
                    makeJsonResponse(
                        'Order is not found or Order cycle is not correct. Delivery partner can only accept or reject the order only if the owner started the preparation', 
                        {},
                        {}, 
                        400, 
                        false
                    )
                );
            }

            const statusUpdate = await acceptOrRejectOrderUpdate(orderId,status, user._id);
            if(statusUpdate.status) {
                return res.status(200).json(makeJsonResponse('Order status updated', { statusUpdate }, {}, 200, true));
            } else {
                return res.status(500).json(makeJsonResponse(statusUpdate.message, {}, {}, 500, false));
            }
        } catch(error) {
            console.log("error from controller acceptOrRejectOrder function => ",error)
            return res.status(500).json(makeJsonResponse('Order preparetion failed', {}, {error: error.message || "Internal error occurred"}, 500, false));
        }
    }

    static async ownerCompletedThePrepartion(req, res, next) {
        try {
            const user = req.user;
            const {orderId} = req.body;

            if(user.role != USER_TYPES.OWNER){
                return res.status(409).json(makeJsonResponse('Restaurant owner  can only update the preparation status', {}, {}, 409, false));
            }

            const order = await Order.findOne(
                {
                    _id: orderId,
                    status: ORDER_STATUS.DELIVERY_PARTNER_ACCEPTED_ORDER
                }
            );            

            if (!order) {
                return res.status(400).json(
                    makeJsonResponse(
                        'Order is not found or Order cycle is not correct. Owner can complete the order only if any of the delivery partner accepted the request', 
                        {},
                        {}, 
                        400, 
                        false
                    )
                );
            }

            const statusUpdate = await ownerCompletedThePrepartionUpdate(orderId, user._id);
            if(statusUpdate.status) {
                return res.status(200).json(makeJsonResponse('Order status updated', { statusUpdate }, {}, 200, true));
            } else {
                return res.status(500).json(makeJsonResponse(statusUpdate.message, {}, {}, 500, false));
            }
        } catch(error) {
            console.log("error from controller ownerCompletedThePrepartion function => ",error)
            return res.status(500).json(makeJsonResponse('Order preparetion failed', {}, {error: error.message || "Internal error occurred"}, 500, false));
        }
    }

    static async orderPickedUp(req, res, next) {
        try {
            const user = req.user;
            const {orderId} = req.body;

            if(user.role != USER_TYPES.DELIVERY_PARTNER){
                return res.status(409).json(makeJsonResponse('Delivery partner can only update the picked-up status', {}, {}, 409, false));
            }

            const order = await Order.findOne(
                {
                    _id: orderId,
                    status: ORDER_STATUS.OWNER_COMPLETED_THE_PREPARATION
                }
            );            

            if (!order) {
                return res.status(400).json(
                    makeJsonResponse(
                        'Order is not found or Order cycle is not correct. Delivery partner can only pickup the order if the restaurant owner completes the preparation', 
                        {},
                        {}, 
                        400, 
                        false
                    )
                );
            }

            const statusUpdate = await orderPickedUpUpdate(orderId, user._id);
            if(statusUpdate.status) {
                return res.status(200).json(makeJsonResponse('Order status updated', { statusUpdate }, {}, 200, true));
            } else {
                return res.status(500).json(makeJsonResponse(statusUpdate.message, {}, {}, 500, false));
            }
        } catch(error) {
            console.log("error from controller orderPickedUp function => ",error)
            return res.status(500).json(makeJsonResponse('Order preparetion failed', {}, {error: error.message || "Internal error occurred"}, 500, false));
        }
    }

    static async deliveryCompleted(req, res, next) {
        try {
            const user = req.user;
            const { orderId, otp } = req.body;
    
            // Validate request data
            if (!orderId || !otp) {
                return res.status(400).json(makeJsonResponse('Order ID and OTP are required', {}, {}, 400, false));
            }
    
            // Check if user has the correct role
            if (user.role !== USER_TYPES.DELIVERY_PARTNER) {
                return res.status(403).json(makeJsonResponse('Only delivery partners can update order completion status', {}, {}, 403, false));
            }
    
            // Find the order with the provided OTP
            const order = await Order.findOne({ _id: orderId, OTP: otp, otpVerificationStatus: false });
    
            if (!order) {
                return res.status(400).json(makeJsonResponse('Invalid OTP or order already verified', {}, {}, 400, false));
            }
    
            if(order.status != ORDER_STATUS.DELIVERY_PARTNER_PICKED_UP_THE_ORDER) {
                return res.status(400).json(
                    makeJsonResponse(
                        'Order is not found or Order cycle is not correct. OTP verification and order complete can only do when order is picked up.', 
                        {},
                        {}, 
                        400, 
                        false
                    )
                );
            }
            // Update order status
            const statusUpdate = await deliveryCompletedUpdate(orderId, user._id);
    
            if (statusUpdate.status) {
                return res.status(200).json(makeJsonResponse('Order status updated successfully', { statusUpdate }, {}, 200, true));
            } else {
                return res.status(500).json(makeJsonResponse(statusUpdate.message, {}, {}, 500, false));
            }
            
        } catch (error) {
            console.error("Error in deliveryCompleted function:", error);
            return res.status(500).json(makeJsonResponse('Order completion failed', {}, { error: error.message || "Internal server error" }, 500, false));
        }
    }
    
}

module.exports = order