const {ORDER_STATUS} = require("../../../constants/order/order-statuses")
const notificationsModel = require("../../../models/notifications-model")
const Order = require("../../../models/order-model")
const User = require("../../../models/user-model")
const {USER_TYPES} = require("../../../constants/user/user-constants")

module.exports = {
    placeOrder: async (cartItem, addressDetails, phone, paidThrough, user) => {
        try {

            const address = {
                label : addressDetails?.label ?? '',
                type : addressDetails?.type ?? '',
                coordinates : addressDetails?.coordinates ?? '',
                street : addressDetails?.street ?? '',
                city : addressDetails?.city ?? '',
                state : addressDetails?.state ?? '',
                country : addressDetails?.country ?? '',
                zipCode : addressDetails?.zipCode ?? '',
                lat : addressDetails?.lat ?? '',
                lng : addressDetails?.lng ?? '',
            }

            const logData = {
                status: ORDER_STATUS.CUSTOMER_PLACED_ORDER,
                userId: user._id,
                userType: USER_TYPES.CUSTOMER
            }

            const order = new Order({
                cartId: cartItem._id,
                customerId: user._id,
                items: cartItem.foodItems,
                restaurantId: cartItem.restaurantId,
                address: address,
                phone: phone,
                totalAmount: cartItem.totalPrice,
                orderDate: new Date(),
                paidThrough: paidThrough,
                status: ORDER_STATUS.CUSTOMER_PLACED_ORDER  ,
                logs: [logData]
            })

            const savedOrder = await order.save();
            await User.findByIdAndUpdate(
                user._id,
                {
                    $push: {
                        "customerDetails.orders": {
                            orderId: savedOrder._id,
                            orderDate: savedOrder.orderDate,
                            status: "pending",
                        },
                    },
                },
                { new: true, runValidators: true } 
            )
            await User.findByIdAndUpdate(
                cartItem.restaurantId,
                {
                    $push: {
                        orders: savedOrder._id,
                    },
                },
                { new: true, runValidators: true } 
            )
            return savedOrder;

        } catch(error) {
            console.error("Error in placeOrder (from service file):", error);
            return false;
        }
    },

    prepareOrderStatusUpdate: async (orderId, userId) => {

        let finalResponseFormat = {
            data:[],
            message: "Internal error",
            status: false
        }

        try{

            const logEntry = {
                status: ORDER_STATUS.OWNER_STARTED_PREPARATION,
                userId: userId,
                userType: USER_TYPES.OWNER
            }
            const updatedData = await Order.findByIdAndUpdate(
                {
                    _id: orderId,
                    restaurantId: userId
                },
                {
                    status: ORDER_STATUS.OWNER_STARTED_PREPARATION,
                    $push: {
                        logs: logEntry
                    }
                },
                {
                    new: true,
                    runValidators: true
                }
            )

            if(updatedData) {
                // send notification

                // find the closet first delivery partner.

                const restaurantLocation = await User.findById(userId).select("hotelDetails.location hotelDetails.coordinates hotelDetails.name");

                const nearByLimit = process.env.NEAR_BY_MAX_DISTANCE || 50000;
                const longitude = restaurantLocation.hotelDetails.location.lng || restaurantLocation.hotelDetails.location.coordinates[0];
                const latitude = restaurantLocation.hotelDetails.location.lat || restaurantLocation.hotelDetails.location.coordinates[1];

                const nearbyDeliveryPartners = await User.findOne({
                    role: USER_TYPES.DELIVERY_PARTNER,
                    "deliveryPartnerDetails.currentLocation.coordinates": {
                        $near: {
                            $geometry: {
                                type: "Point",
                                coordinates: [longitude, latitude] // MongoDB expects [lng, lat]
                            },
                            $maxDistance: nearByLimit // Radius in meters
                        }
                    }
                });

                let notification = `${restaurantLocation.hotelDetails.name} request you to take an order. Please login to app for more details`

                const deliveryPartnerNotification = new notificationsModel({
                    userId: nearbyDeliveryPartners._id,
                    notification: notification,
                    userType: USER_TYPES.DELIVERY_PARTNER
                });

                await deliveryPartnerNotification.save();

                await Order.findByIdAndUpdate(updatedData._id,{deliveryPartnerId: nearbyDeliveryPartners._id},{
                    new: true,
                    runValidators: true
                })

                const nearbyDeliveryPartnersData = {
                    userId: nearbyDeliveryPartners._id,
                    name: nearbyDeliveryPartners.name,
                    phone: nearbyDeliveryPartners.phone,    
                };

                finalResponseFormat.status = true;
                finalResponseFormat.message = "oreder status updated";
                finalResponseFormat.data = {
                    items: updatedData.items,
                    totalAmount: updatedData.totalAmount,
                    address: updatedData.address,
                    phone: updatedData.phone,
                    orderDate: updatedData.orderDate,
                    restaurantId: updatedData.restaurantId,
                    status: updatedData.status,
                    cartId: updatedData.cartId,
                    deliveryPartner: nearbyDeliveryPartnersData,
                    paidThrough: updatedData.paidThrough,
                };
                return finalResponseFormat;
            } else {
                finalResponseFormat.message = "oreder with given ID is not found";
                return finalResponseFormat;
            }
            
        } catch(error) {
            console.error("Error in prepareOrderStatusUpdate (from service file):", error);
            finalResponseFormat.message = error.message?? "Inernal error occured";
            return finalResponseFormat;
        }
    },

    acceptOrRejectOrderUpdate: async (orderId, status, userId) => {

        let finalResponseFormat = {
            data:[],
            message: "Internal error",
            status: false
        }

        try{

            const deliveryPartnerStatus = status ? ORDER_STATUS.DELIVERY_PARTNER_ACCEPTED_ORDER : ORDER_STATUS.DELIVERY_PARTNER_REJECTED_ORDER;

            const logEntry = {
                status: deliveryPartnerStatus,
                userId: userId,
                userType: USER_TYPES.DELIVERY_PARTNER
            }

            let updateData = {
                status: deliveryPartnerStatus,
                $push: {
                    logs: logEntry
                }
            };
            
            if (!status) {

                // need to check if the id is already exists in rejectedDeliveryPartners

                updateData.$push.rejectedDeliveryPartners = userId; 
            }
            

            const updatedData = await Order.findByIdAndUpdate(
                {
                    _id: orderId,
                    deliveryPartnerId: userId
                },
                updateData,
                {
                    new: true,
                    runValidators: true
                }
            )

            if(updatedData) {

                if(!status) {
                    // send notification

                    // find the closet first delivery partner.

                    const restaurantLocation = await User.findById(updatedData.restaurantId).select("hotelDetails.location hotelDetails.name");


                    const nearByLimit = process.env.NEAR_BY_MAX_DISTANCE || 5000;
                    const longitude = restaurantLocation.hotelDetails.location.lng;
                    const latitude = restaurantLocation.hotelDetails.location.lat;
                    const excludedUserIds = updatedData.rejectedDeliveryPartners;

                    const nearbyDeliveryPartners = await User.findOne({
                        role: USER_TYPES.DELIVERY_PARTNER,
                        _id: { $nin: excludedUserIds },
                        "deliveryPartnerDetails.currentLocation.coordinates": {
                            $near: {
                                $geometry: {
                                    type: "Point",
                                    coordinates: [longitude, latitude] // MongoDB expects [lng, lat]
                                },
                                $maxDistance: nearByLimit // Radius in meters
                            }
                        }
                    });

                    console.log(nearbyDeliveryPartners)
                    if(nearbyDeliveryPartners) {
                        let notification = `${restaurantLocation.hotelDetails.name} request you to take an order. Please login to app for more details`

                        const deliveryPartnerNotification = new notificationsModel({
                            userId: nearbyDeliveryPartners._id,
                            notification: notification,
                            userType: USER_TYPES.DELIVERY_PARTNER
                        });
    
                        await deliveryPartnerNotification.save();
                    } else {
                        // need to implement the logic whatt if no partners are arround
                    }
                }
                
                finalResponseFormat.status = true;
                finalResponseFormat.message = "oreder status updated";
                finalResponseFormat.data = updatedData;
                return finalResponseFormat;
            } else {
                finalResponseFormat.message = "oreder with given ID is not found";
                return finalResponseFormat;
            }
            
        } catch(error) {
            console.error("Error in prepareOrderStatusUpdate (from service file):", error);
            finalResponseFormat.message = error.message?? "Inernal error occured";
            return finalResponseFormat;
        }
    },

    ownerCompletedThePrepartionUpdate: async (orderId, userId) => {

        let finalResponseFormat = {
            data:[],
            message: "Internal error",
            status: false
        }

        try{


            const logEntry = {
                status: ORDER_STATUS.OWNER_COMPLETED_THE_PREPARATION,
                userId: userId,
                userType: USER_TYPES.OWNER
            }

            let updateData = {
                status: ORDER_STATUS.OWNER_COMPLETED_THE_PREPARATION,
                $push: {
                    logs: logEntry
                }
            };

            const updatedData = await Order.findByIdAndUpdate(
                {
                    _id: orderId,
                    restaurantId: userId,
                },
                updateData,
                {
                    new: true,
                    runValidators: true
                }
            )

            if(updatedData) {

                finalResponseFormat.status = true;
                finalResponseFormat.message = "oreder status updated";
                finalResponseFormat.data = updatedData;
                return finalResponseFormat;
            } else {
                finalResponseFormat.message = "oreder with given ID is not found";
                return finalResponseFormat;
            }
            
        } catch(error) {
            console.error("Error in ownerCompletedThePrepartionUpdate (from service file):", error);
            finalResponseFormat.message = error.message?? "Inernal error occured";
            return finalResponseFormat;
        }
    },

    orderPickedUpUpdate: async (orderId, userId) => {

        let finalResponseFormat = {
            data:[],
            message: "Internal error",
            status: false
        }

        try{


            const logEntry = {
                status: ORDER_STATUS.DELIVERY_PARTNER_PICKED_UP_THE_ORDER,
                userId: userId,
                userType: USER_TYPES.DELIVERY_PARTNER
            };

            const OTP = Math.floor(100000 + Math.random() * 900000).toString();

            let updateData = {
                status: ORDER_STATUS.DELIVERY_PARTNER_PICKED_UP_THE_ORDER,
                $push: {
                    logs: logEntry
                },
                OTP,
                otpVerificationStatus: false
            };


            const updatedData = await Order.findByIdAndUpdate(
                {
                    _id: orderId,
                    restaurantId: userId,
                },
                updateData,
                {
                    new: true,
                    runValidators: true
                }
            )

            if(updatedData) {

                finalResponseFormat.status = true;
                finalResponseFormat.message = "oreder status updated";
                finalResponseFormat.data = updatedData;
                return finalResponseFormat;
            } else {
                finalResponseFormat.message = "oreder with given ID is not found";
                return finalResponseFormat;
            }
            
        } catch(error) {
            console.error("Error in ownerCompletedThePrepartionUpdate (from service file):", error);
            finalResponseFormat.message = error.message?? "Inernal error occured";
            return finalResponseFormat;
        }
    },

    deliveryCompletedUpdate: async (orderId, userId) => {

        let finalResponseFormat = {
            data:[],
            message: "Internal error",
            status: false
        }

        try{


            const logEntry = {
                status: ORDER_STATUS.OTP_VERIFIED_AND_COMPLETED_THE_ORDER,
                userId: userId,
                userType: USER_TYPES.DELIVERY_PARTNER
            };

            let updateData = {
                status: ORDER_STATUS.OTP_VERIFIED_AND_COMPLETED_THE_ORDER,
                $push: {
                    logs: logEntry
                },
                otpVerificationStatus: true
            };


            const updatedData = await Order.findByIdAndUpdate(
                {
                    _id: orderId,
                    deliveryPartnerId: userId,
                },
                updateData,
                {
                    new: true,
                    runValidators: true
                }
            )

            if(updatedData) {

                finalResponseFormat.status = true;
                finalResponseFormat.message = "oreder status updated";
                finalResponseFormat.data = updatedData;
                return finalResponseFormat;
            } else {
                finalResponseFormat.message = "oreder with given ID is not found";
                return finalResponseFormat;
            }
            
        } catch(error) {
            console.error("Error in ownerCompletedThePrepartionUpdate (from service file):", error);
            finalResponseFormat.message = error.message?? "Inernal error occured";
            return finalResponseFormat;
        }
    }
}