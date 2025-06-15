const User = require("../models/user-model");
const Food = require("../models/food-model");
const Order = require("../models/order-model");
const Cart = require("../models/cart-model");
const notificationsModel = require("../models/notifications-model");
const { makeJsonResponse } = require("../utils/response");
const { USER_TYPES } = require("../constants/user/user-constants");
const { ORDER_STATUS } = require("../constants/order/order-statuses");
const mongoose = require('mongoose');

const {
    placeOrder,
    prepareOrderStatusUpdate,
    acceptOrRejectOrderUpdate,
    ownerCompletedThePrepartionUpdate,
    orderPickedUpUpdate,
    deliveryCompletedUpdate
} = require("../controller/services/order/order-related-services");

const {
    storeOrUpdateToCart,
} = require("./services/customer/cart-services");
class order {
    static async checkout(req, res, next) {
        try {
            const { user } = req;
            const { cartId, addressId, phone, paidThrough } = req.body;

            if (user.role != USER_TYPES.CUSTOMER) {
                return res.status(409).json(makeJsonResponse('Customer can only place order', {}, {}, 409, false));
            }

            // Check if an order already exists for the given cart
            const existingOrder = await Order.findOne({ customerId: user._id, cartId });
            if (existingOrder) {
                return res.status(409).json(makeJsonResponse('Order already placed', {}, {}, 409, false));
            }

            // Fetch cart details
            const cartItem = await Cart.findOne({ _id: cartId, userId: user._id });
            if (!cartItem) {
                return res.status(404).json(makeJsonResponse('Cart not found', {}, {}, 404, false));
            }

            // Find address from user's saved addresses
            const addressDetails = user.customerDetails.savedAddresses.find(addr => addr._id.toString() === addressId);
            if (!addressDetails) {
                return res.status(404).json(makeJsonResponse('Address not found in saved addresses', {}, {}, 404, false));
            }

            // Place the order
            const orderPlaced = await placeOrder(cartItem, addressDetails, phone, paidThrough, user, false);
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
            if (orderPlaced) {
                return res.status(201).json(makeJsonResponse('Order placed successfully', { orderDetails }, {}, 201, true));
            } else {
                return res.status(500).json(makeJsonResponse('Order placed failed', { orderDetails }, {}, 500, true));
            }
        } catch (error) {
            console.log("error from controller checkout function => ", error)
            return res.status(500).json(makeJsonResponse('Order Failed', {}, { error: error.message || "Internal error occurred" }, 500, false));
        }
    }

    static async ownerPlaceOwner(req, res, next) {
        try {
            const { user } = req;
            const { 
                foodId,
                qty,
                addressId,
                phone,
                paidThrough,
                customerId
            } = req.body;

            if (user.role != USER_TYPES.OWNER) {
                return res.status(409).json(makeJsonResponse('Owner can only place order DIRECTLY', {}, {}, 409, false));
            }

            const customer = await User.findOne({ _id: customerId });

            if (!customer) {
                return res.status(404).json(makeJsonResponse('Customer not found', {}, {}, 404, false));
            }

            
            // Find address from user's saved addresses
            const addressDetails = customer.customerDetails.savedAddresses.find(addr => addr._id.toString() === addressId);
            if (!addressDetails) {
                return res.status(404).json(makeJsonResponse('Address not found in saved addresses', {}, {}, 404, false));
            }

            const addToCart = await storeOrUpdateToCart(user._id, foodId, qty, customer);

            if(addToCart.status) {



              

                // Place the order
                const orderPlaced = await placeOrder(addToCart.cartData, addressDetails, phone, paidThrough, customer, true);
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
                if (orderPlaced) {


                    const restaurantLocation = await User.findById(user._id).select("hotelDetails.location hotelDetails.coordinates hotelDetails.name");

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

                    await Order.findByIdAndUpdate(orderPlaced._id,{deliveryPartnerId: nearbyDeliveryPartners._id},{
                        new: true,
                        runValidators: true
                    })

                    const nearbyDeliveryPartnersData = {
                        userId: nearbyDeliveryPartners._id,
                        name: nearbyDeliveryPartners.name,
                        email: nearbyDeliveryPartners.email,
                        phone: nearbyDeliveryPartners.phone,    
                    };

                    return res.status(201).json(makeJsonResponse('Order placed successfully by OWNER', { orderDetails, nearbyDeliveryPartnersData }, {}, 201, true));
                } else {
                    return res.status(500).json(makeJsonResponse('Order placed failed by OWNER', { orderDetails }, {}, 500, true));
                }

            } else {
                return res.status(400).json(makeJsonResponse('Failed to add food to cart', {}, {}, 400, false));
            }










            // // Check if an order already exists for the given cart
            // const existingOrder = await Order.findOne({ customerId: user._id, cartId });
            // if (existingOrder) {
            //     return res.status(409).json(makeJsonResponse('Order already placed', {}, {}, 409, false));
            // }

            // // Fetch cart details
            // const cartItem = await Cart.findOne({ _id: cartId, userId: user._id });
            // if (!cartItem) {
            //     return res.status(404).json(makeJsonResponse('Cart not found', {}, {}, 404, false));
            // }

            // // Find address from user's saved addresses
            // const addressDetails = user.customerDetails.savedAddresses.find(addr => addr._id.toString() === addressId);
            // if (!addressDetails) {
            //     return res.status(404).json(makeJsonResponse('Address not found in saved addresses', {}, {}, 404, false));
            // }

            // // Place the order
            // const orderPlaced = await placeOrder(cartItem, addressDetails, phone, paidThrough, user, true);
            // const orderDetails = {
            //     cartId: orderPlaced.cartId,
            //     customerId: orderPlaced.customerId,
            //     restaurantId: orderPlaced.restaurantId,
            //     items: orderPlaced.items,
            //     address: orderPlaced.address,
            //     phone: orderPlaced.phone,
            //     totalAmount: orderPlaced.totalAmount,
            //     orderDate: orderPlaced.orderDate,
            //     paidThrough: orderPlaced.paidThrough,
            //     status: orderPlaced.status,
            //     _id: orderPlaced._id

            // }
            // if (orderPlaced) {
            //     return res.status(201).json(makeJsonResponse('Order placed successfully', { orderDetails }, {}, 201, true));
            // } else {
            //     return res.status(500).json(makeJsonResponse('Order placed failed', { orderDetails }, {}, 500, true));
            // }
        } catch (error) {
            console.log("error from controller checkout function => ", error)
            return res.status(500).json(makeJsonResponse('Order Failed', {}, { error: error.message || "Internal error occurred" }, 500, false));
        }
    }

    static async orderHistroy(req, res, next) {
        const user = req.user
        const page = parseInt(req.params.page) || 1;
        const limit = parseInt(req.params.limit) || 10;
        const skip = (page - 1) * limit;

        if (user.role != USER_TYPES.CUSTOMER) {
            return res.status(409).json(makeJsonResponse('Customer can only view order history', {}, {}, 409, false));
        }
        const orders = await Order.find({ customerId: user._id })
            .sort({ orderDate: -1 }) // Sort by order date in descending order
            .skip(skip)
            .limit(limit)
            .lean(); // Convert to plain objects for better performance

        const totalOrders = await Order.countDocuments({ customerId: user._id });

        const totalPages = Math.ceil(totalOrders / limit);

        const paginationObject = {
            currentPage: page,
            limit,
            totalItems: totalOrders,
            totalPages,
        }


        if (!orders.length) {
            return res.status(200).json(makeJsonResponse('No orders found', { orders: [], pagination: paginationObject }, {}, 200, true));
        }

        // Extract all foodIds from order items
        const foodIds = orders.flatMap(order => order.items.map(item => item.foodId));


        // Fetch food details from Food model
        const foodDetails = await Food.find(
            { "foodItems._id": { $in: foodIds } },
            { "foodItems.$": 1, hotelId: 1 } // Retrieve only matching food items
        ).lean();

        // Map food details back to orders
        const ordersWithFoodDetails = orders.map(order => ({
            ...order,
            items: order.items.map(item => ({
                ...item,
                foodDetails: foodDetails.find(food =>
                    food.foodItems.some(fItem => fItem._id.equals(item.foodId))
                )?.foodItems.find(fItem => fItem._id.equals(item.foodId)) || null
            }))
        }));

        let lastEntry = [];

        for (let item of ordersWithFoodDetails) {
            let finalResult = {
                _id: item._id,
                user: {
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    userId: user._id
                },
                cartId: item.cartId,
                customerId: item.customerId,
                restaurantId: item.restaurantId,
                deliveryPartnerId: item.deliveryPartnerId,
                address: item.address,
                phone: item.phone,
                totalAmount: item.totalAmount,
                orderDate: item.orderDate,
                paidThrough: item.paidThrough,
                status: item.status,
                items: [] // Initialize array to store items
            };

            for (let entry of item.items ?? []) {
                let foodDetailsEntryObject = {
                    _id: entry._id,
                    foodId: entry.foodId,
                    qty: entry.qty,
                    price: entry.price,
                    foodDetails: [] // Initialize food details array
                };

                if (entry.foodDetails) {
                    let foodDetail = {
                        image: entry.foodDetails.images?.[0] ?? '',
                        foodId: entry.foodDetails._id,
                        name: entry.foodDetails.name,
                        description: entry.foodDetails.description,
                        category: entry.foodDetails.category,
                    };
                    foodDetailsEntryObject.foodDetails.push(foodDetail);
                }

                finalResult.items.push(foodDetailsEntryObject);
            }

            lastEntry.push(finalResult);
        }

        return res.status(200).json(makeJsonResponse('Order list fetched successfully', { orders: lastEntry, pagination: paginationObject }, {}, 200, true));

    }

    static async customerCompletedOrders(req, res, next) {
        try {
            const user = req.user
            const page = parseInt(req.params.page) || 1;
            const limit = parseInt(req.params.limit) || 10;
            const skip = (page - 1) * limit;

            if (user.role != USER_TYPES.CUSTOMER) {
                return res.status(409).json(makeJsonResponse('Customer can only view order history', {}, {}, 409, false));
            }
            const orders = await Order.find({ customerId: user._id, status: ORDER_STATUS.OTP_VERIFIED_AND_COMPLETED_THE_ORDER })
                .sort({ orderDate: -1 }) // Sort by order date in descending order
                .skip(skip)
                .limit(limit)
                .lean(); // Convert to plain objects for better performance

            const totalOrders = await Order.countDocuments({ customerId: user._id, status: ORDER_STATUS.OTP_VERIFIED_AND_COMPLETED_THE_ORDER });

            const totalPages = Math.ceil(totalOrders / limit);

            const paginationObject = {
                currentPage: page,
                limit,
                totalItems: totalOrders,
                totalPages,
            }

            if (!orders.length) {
                return res.status(200).json(makeJsonResponse('No orders found', { orders: [], pagination: paginationObject }, {}, 200, true));
            }

            // Extract all foodIds from order items
            const foodIds = orders.flatMap(order => order.items.map(item => item.foodId));


            // Fetch food details from Food model
            const foodDetails = await Food.find(
                { "foodItems._id": { $in: foodIds } },
                { "foodItems.$": 1, hotelId: 1 } // Retrieve only matching food items
            ).lean();

            // Map food details back to orders
            const ordersWithFoodDetails = orders.map(order => ({
                ...order,
                items: order.items.map(item => ({
                    ...item,
                    foodDetails: foodDetails.find(food =>
                        food.foodItems.some(fItem => fItem._id.equals(item.foodId))
                    )?.foodItems.find(fItem => fItem._id.equals(item.foodId)) || null
                }))
            }));

            let lastEntry = [];

            for (let item of ordersWithFoodDetails) {
                let finalResult = {
                    _id: item._id,
                    user: {
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        userId: user._id
                    },
                    cartId: item.cartId,
                    customerId: item.customerId,
                    restaurantId: item.restaurantId,
                    deliveryPartnerId: item.deliveryPartnerId,
                    address: item.address,
                    phone: item.phone,
                    totalAmount: item.totalAmount,
                    orderDate: item.orderDate,
                    paidThrough: item.paidThrough,
                    status: item.status,
                    items: [] // Initialize array to store items
                };

                for (let entry of item.items ?? []) {
                    let foodDetailsEntryObject = {
                        _id: entry._id,
                        foodId: entry.foodId,
                        qty: entry.qty,
                        price: entry.price,
                        foodDetails: [] // Initialize food details array
                    };

                    if (entry.foodDetails) {
                        let foodDetail = {
                            image: entry.foodDetails.images?.[0] ?? '',
                            foodId: entry.foodDetails._id,
                            name: entry.foodDetails.name,
                            description: entry.foodDetails.description,
                            category: entry.foodDetails.category,
                        };
                        foodDetailsEntryObject.foodDetails.push(foodDetail);
                    }

                    finalResult.items.push(foodDetailsEntryObject);
                }

                lastEntry.push(finalResult);
            }



            return res.status(200).json(makeJsonResponse('Completed Order list fetched successfully', { orders: lastEntry, pagination: paginationObject, }, {}, 200, true));
        } catch (error) {
            console.log("error from controller customerCompletedOrders function => ", error)
            return res.status(500).json(makeJsonResponse('Completed Order list fetch Failed', {}, { error: error.message || "Internal error occurred" }, 500, false));
        }

    }

    static async customerCancelledOrders(req, res, next) {
        try {
            const user = req.user
            const page = parseInt(req.params.page) || 1;
            const limit = parseInt(req.params.limit) || 10;
            const skip = (page - 1) * limit;

            if (user.role != USER_TYPES.CUSTOMER) {
                return res.status(409).json(makeJsonResponse('Customer can only view this data', {}, {}, 409, false));
            }
            const orders = await Order.find({ customerId: user._id, status: ORDER_STATUS.ORDER_CANCELLED })
                .sort({ orderDate: -1 }) // Sort by order date in descending order
                .skip(skip)
                .limit(limit)
                .lean(); // Convert to plain objects for better performance

            const totalOrders = await Order.countDocuments({ customerId: user._id, status: ORDER_STATUS.ORDER_CANCELLED });

            const totalPages = Math.ceil(totalOrders / limit);

            const paginationObject = {
                currentPage: page,
                limit,
                totalItems: totalOrders,
                totalPages,
            }

            if (!orders.length) {
                return res.status(200).json(makeJsonResponse('No orders found', { orders: [], pagination: paginationObject }, {}, 200, true));
            }

            // Extract all foodIds from order items
            const foodIds = orders.flatMap(order => order.items.map(item => item.foodId));


            // Fetch food details from Food model
            const foodDetails = await Food.find(
                { "foodItems._id": { $in: foodIds } },
                { "foodItems.$": 1, hotelId: 1 } // Retrieve only matching food items
            ).lean();

            // Map food details back to orders
            const ordersWithFoodDetails = orders.map(order => ({
                ...order,
                items: order.items.map(item => ({
                    ...item,
                    foodDetails: foodDetails.find(food =>
                        food.foodItems.some(fItem => fItem._id.equals(item.foodId))
                    )?.foodItems.find(fItem => fItem._id.equals(item.foodId)) || null
                }))
            }));

            let lastEntry = [];

            for (let item of ordersWithFoodDetails) {
                let finalResult = {
                    _id: item._id,
                    user: {
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        userId: user._id
                    },
                    cartId: item.cartId,
                    customerId: item.customerId,
                    restaurantId: item.restaurantId,
                    deliveryPartnerId: item.deliveryPartnerId,
                    address: item.address,
                    phone: item.phone,
                    totalAmount: item.totalAmount,
                    orderDate: item.orderDate,
                    paidThrough: item.paidThrough,
                    status: item.status,
                    items: [] // Initialize array to store items
                };

                for (let entry of item.items ?? []) {
                    let foodDetailsEntryObject = {
                        _id: entry._id,
                        foodId: entry.foodId,
                        qty: entry.qty,
                        price: entry.price,
                        foodDetails: [] // Initialize food details array
                    };

                    if (entry.foodDetails) {
                        let foodDetail = {
                            image: entry.foodDetails.images?.[0] ?? '',
                            foodId: entry.foodDetails._id,
                            name: entry.foodDetails.name,
                            description: entry.foodDetails.description,
                            category: entry.foodDetails.category,
                        };
                        foodDetailsEntryObject.foodDetails.push(foodDetail);
                    }

                    finalResult.items.push(foodDetailsEntryObject);
                }

                lastEntry.push(finalResult);
            }



            return res.status(200).json(makeJsonResponse('Cancelled Order list fetched successfully', { orders: lastEntry, pagination: paginationObject, }, {}, 200, true));
        } catch (error) {
            console.log("error from controller customer Cancelled Orders function => ", error)
            return res.status(500).json(makeJsonResponse('Cancelled Order list fetch Failed', {}, { error: error.message || "Internal error occurred" }, 500, false));
        }

    }

    static async ownerOrderHistroy(req, res, next) {
        const user = req.user
        const page = parseInt(req.params.page) || 1;
        const limit = parseInt(req.params.limit) || 10;
        const skip = (page - 1) * limit;

        if (user.role != USER_TYPES.OWNER) {
            return res.status(409).json(makeJsonResponse('Restaurant owner can only view order history', {}, {}, 409, false));
        }
        const orders = await Order.find({ restaurantId: user._id })
            .sort({ orderDate: -1 }) // Sort by order date in descending order
            .skip(skip)
            .limit(limit)
            .lean(); // Convert to plain objects for better performance

        const totalOrders = await Order.countDocuments({ restaurantId: user._id });

        const totalPages = Math.ceil(totalOrders / limit);

        const paginationObject = {
            currentPage: page,
            limit,
            totalItems: totalOrders,
            totalPages,
        }

        if (!orders.length) {
            return res.status(200).json(makeJsonResponse('No orders found', { orders: [], pagination: paginationObject }, {}, 200, true));
        }

        // Extract all foodIds from order items
        const foodIds = orders.flatMap(order => order.items.map(item => item.foodId));


        // Fetch food details from Food model
        const foodDetails = await Food.find(
            { "foodItems._id": { $in: foodIds } },
            { "foodItems.$": 1, hotelId: 1 } // Retrieve only matching food items
        ).lean();

        // Map food details back to orders
        const ordersWithFoodDetails = orders.map(order => ({
            ...order,
            items: order.items.map(item => ({
                ...item,
                foodDetails: foodDetails.find(food =>
                    food.foodItems.some(fItem => fItem._id.equals(item.foodId))
                )?.foodItems.find(fItem => fItem._id.equals(item.foodId)) || null
            }))
        }));

        let lastEntry = [];

        for (let item of ordersWithFoodDetails) {
            let finalResult = {
                _id: item._id,
                cartId: item.cartId,
                customerId: item.customerId,
                restaurantId: item.restaurantId,
                deliveryPartnerId: item.deliveryPartnerId,
                address: item.address,
                phone: item.phone,
                totalAmount: item.totalAmount,
                orderDate: item.orderDate,
                paidThrough: item.paidThrough,
                status: item.status,
                items: [] // Initialize array to store items
            };

            for (let entry of item.items ?? []) {
                let foodDetailsEntryObject = {
                    _id: entry._id,
                    foodId: entry.foodId,
                    qty: entry.qty,
                    price: entry.price,
                    foodDetails: [] // Initialize food details array
                };

                if (entry.foodDetails) {
                    let foodDetail = {
                        image: entry.foodDetails.images?.[0] ?? '',
                        foodId: entry.foodDetails._id,
                        name: entry.foodDetails.name,
                        description: entry.foodDetails.description,
                        category: entry.foodDetails.category,
                    };
                    foodDetailsEntryObject.foodDetails.push(foodDetail);
                }

                finalResult.items.push(foodDetailsEntryObject);
            }

            lastEntry.push(finalResult);
        }

        return res.status(200).json(makeJsonResponse('Order list fetched successfully', { orders: lastEntry, pagination: paginationObject }, {}, 200, true));

    }

    static async deliveryPartnerOrderList(req, res, next) {
        const user = req.user;

        try {
            const page = parseInt(req.params.page) || 1;
            const limit = parseInt(req.params.limit) || 10;
            const skip = (page - 1) * limit;

            if (user.role != USER_TYPES.DELIVERY_PARTNER) {
                return res.status(409).json(makeJsonResponse('Delivery partner can only view order history', {}, {}, 409, false));
            }
            // Fetch orders assigned to the delivery partner
            const orderList = await Order.find({ deliveryPartnerId: user._id })
                .sort({ orderDate: -1 }) // Sort latest orders first
                .skip(skip)
                .limit(limit)
                .lean(); // Convert to plain objects for better performance

            const totalOrders = await Order.countDocuments({ deliveryPartnerId: user._id });

            const totalPages = Math.ceil(totalOrders / limit);

            const paginationObject = {
                currentPage: page,
                limit,
                totalItems: totalOrders,
                totalPages,
            }

            if (!orderList.length) {
                return res.status(200).json(makeJsonResponse('No orders found', { orderList: [], pagination: paginationObject }, {}, 200, true));
            }

            // Extract all foodIds from order items
            const foodIds = orderList.flatMap(order => order.items.map(item => item.foodId));


            // Fetch food details from Food model
            const foodDetails = await Food.find(
                { "foodItems._id": { $in: foodIds } },
                { "foodItems.$": 1, hotelId: 1 } // Retrieve only matching food items
            ).lean();

            // Map food details back to orders
            const ordersWithFoodDetails = orderList.map(order => ({
                ...order,
                items: order.items.map(item => ({
                    ...item,
                    foodDetails: foodDetails.find(food =>
                        food.foodItems.some(fItem => fItem._id.equals(item.foodId))
                    )?.foodItems.find(fItem => fItem._id.equals(item.foodId)) || null
                }))
            }));

            let lastEntry = [];

            for (let item of ordersWithFoodDetails) {
                let finalResult = {
                    _id: item._id,
                    cartId: item.cartId,
                    customerId: item.customerId,
                    restaurantId: item.restaurantId,
                    deliveryPartnerId: item.deliveryPartnerId,
                    address: item.address,
                    phone: item.phone,
                    totalAmount: item.totalAmount,
                    orderDate: item.orderDate,
                    paidThrough: item.paidThrough,
                    status: item.status,
                    items: [] // Initialize array to store items
                };

                for (let entry of item.items ?? []) {
                    let foodDetailsEntryObject = {
                        _id: entry._id,
                        foodId: entry.foodId,
                        qty: entry.qty,
                        price: entry.price,
                        foodDetails: [] // Initialize food details array
                    };

                    if (entry.foodDetails) {
                        let foodDetail = {
                            image: entry.foodDetails.images?.[0] ?? '',
                            foodId: entry.foodDetails._id,
                            name: entry.foodDetails.name,
                            description: entry.foodDetails.description,
                            category: entry.foodDetails.category,
                        };
                        foodDetailsEntryObject.foodDetails.push(foodDetail);
                    }

                    finalResult.items.push(foodDetailsEntryObject);
                }

                lastEntry.push(finalResult);
            }

            return res.status(200).json(makeJsonResponse('Order list fetched successfully', { orderList: lastEntry, pagination: paginationObject }, {}, 200, true));

        } catch (error) {
            console.log("Error from controller deliveryPartnerOrderList function => ", error);
            return res.status(500).json(makeJsonResponse('Order List Fetch Failed', {}, { error: error.message || "Internal error occurred" }, 500, false));
        }
    }

    static async deliveryPartnerCompletedOrders(req, res, next) {
        const user = req.user;

        try {
            const page = parseInt(req.params.page) || 1;
            const limit = parseInt(req.params.limit) || 10;
            const skip = (page - 1) * limit;

            if (user.role != USER_TYPES.DELIVERY_PARTNER) {
                return res.status(409).json(makeJsonResponse('Delivery partner can only view this data', {}, {}, 409, false));
            }
            // Fetch orders assigned to the delivery partner
            const orderList = await Order.find({ deliveryPartnerId: user._id, status: ORDER_STATUS.OTP_VERIFIED_AND_COMPLETED_THE_ORDER })
                .sort({ orderDate: -1 }) // Sort latest orders first
                .skip(skip)
                .limit(limit)
                .lean(); // Convert to plain objects for better performance

            const totalOrders = await Order.countDocuments({ deliveryPartnerId: user._id, status: ORDER_STATUS.OTP_VERIFIED_AND_COMPLETED_THE_ORDER });

            const totalPages = Math.ceil(totalOrders / limit);

            const paginationObject = {
                currentPage: page,
                limit,
                totalItems: totalOrders,
                totalPages,
            }

            if (!orderList.length) {
                return res.status(200).json(makeJsonResponse('No completed orders found', { orderList: [], pagination: paginationObject }, {}, 200, true));
            }

            // Extract all foodIds from order items
            const foodIds = orderList.flatMap(order => order.items.map(item => item.foodId));


            // Fetch food details from Food model
            const foodDetails = await Food.find(
                { "foodItems._id": { $in: foodIds } },
                { "foodItems.$": 1, hotelId: 1 } // Retrieve only matching food items
            ).lean();

            // Map food details back to orders
            const ordersWithFoodDetails = orderList.map(order => ({
                ...order,
                items: order.items.map(item => ({
                    ...item,
                    foodDetails: foodDetails.find(food =>
                        food.foodItems.some(fItem => fItem._id.equals(item.foodId))
                    )?.foodItems.find(fItem => fItem._id.equals(item.foodId)) || null
                }))
            }));

            let lastEntry = [];

            for (let item of ordersWithFoodDetails) {
                let finalResult = {
                    _id: item._id,
                    cartId: item.cartId,
                    customerId: item.customerId,
                    restaurantId: item.restaurantId,
                    deliveryPartnerId: item.deliveryPartnerId,
                    address: item.address,
                    phone: item.phone,
                    totalAmount: item.totalAmount,
                    orderDate: item.orderDate,
                    paidThrough: item.paidThrough,
                    status: item.status,
                    items: [] // Initialize array to store items
                };

                for (let entry of item.items ?? []) {
                    let foodDetailsEntryObject = {
                        _id: entry._id,
                        foodId: entry.foodId,
                        qty: entry.qty,
                        price: entry.price,
                        foodDetails: [] // Initialize food details array
                    };

                    if (entry.foodDetails) {
                        let foodDetail = {
                            image: entry.foodDetails.images?.[0] ?? '',
                            foodId: entry.foodDetails._id,
                            name: entry.foodDetails.name,
                            description: entry.foodDetails.description,
                            category: entry.foodDetails.category,
                        };
                        foodDetailsEntryObject.foodDetails.push(foodDetail);
                    }

                    finalResult.items.push(foodDetailsEntryObject);
                }

                lastEntry.push(finalResult);
            }

            return res.status(200).json(makeJsonResponse('Completed Order list fetched successfully', { orderList: lastEntry, pagination: paginationObject }, {}, 200, true));

        } catch (error) {
            console.log("Error from controller deliveryPartnerCompletedOrders function => ", error);
            return res.status(500).json(makeJsonResponse('Completed Order List Fetch Failed', {}, { error: error.message || "Internal error occurred" }, 500, false));
        }
    }


    static async deliveryPartnerCancelledOrders(req, res, next) {
        const user = req.user;

        try {
            const page = parseInt(req.params.page) || 1;
            const limit = parseInt(req.params.limit) || 10;
            const skip = (page - 1) * limit;

            if (user.role != USER_TYPES.DELIVERY_PARTNER) {
                return res.status(409).json(makeJsonResponse('Delivery partner can only view this data', {}, {}, 409, false));
            }
            // Fetch orders assigned to the delivery partner
            const orderList = await Order.find({ deliveryPartnerId: user._id, status: ORDER_STATUS.ORDER_CANCELLED })
                .sort({ orderDate: -1 }) // Sort latest orders first
                .skip(skip)
                .limit(limit)
                .lean(); // Convert to plain objects for better performance

            const totalOrders = await Order.countDocuments({ deliveryPartnerId: user._id, status: ORDER_STATUS.ORDER_CANCELLED });

            const totalPages = Math.ceil(totalOrders / limit);

            const paginationObject = {
                currentPage: page,
                limit,
                totalItems: totalOrders,
                totalPages,
            }

            if (!orderList.length) {
                return res.status(200).json(makeJsonResponse('No cancelled orders found', { orderList: [], pagination: paginationObject }, {}, 200, true));
            }

            // Extract all foodIds from order items
            const foodIds = orderList.flatMap(order => order.items.map(item => item.foodId));


            // Fetch food details from Food model
            const foodDetails = await Food.find(
                { "foodItems._id": { $in: foodIds } },
                { "foodItems.$": 1, hotelId: 1 } // Retrieve only matching food items
            ).lean();

            // Map food details back to orders
            const ordersWithFoodDetails = orderList.map(order => ({
                ...order,
                items: order.items.map(item => ({
                    ...item,
                    foodDetails: foodDetails.find(food =>
                        food.foodItems.some(fItem => fItem._id.equals(item.foodId))
                    )?.foodItems.find(fItem => fItem._id.equals(item.foodId)) || null
                }))
            }));

            let lastEntry = [];

            for (let item of ordersWithFoodDetails) {
                let finalResult = {
                    _id: item._id,
                    cartId: item.cartId,
                    customerId: item.customerId,
                    restaurantId: item.restaurantId,
                    deliveryPartnerId: item.deliveryPartnerId,
                    address: item.address,
                    phone: item.phone,
                    totalAmount: item.totalAmount,
                    orderDate: item.orderDate,
                    paidThrough: item.paidThrough,
                    status: item.status,
                    items: [] // Initialize array to store items
                };

                for (let entry of item.items ?? []) {
                    let foodDetailsEntryObject = {
                        _id: entry._id,
                        foodId: entry.foodId,
                        qty: entry.qty,
                        price: entry.price,
                        foodDetails: [] // Initialize food details array
                    };

                    if (entry.foodDetails) {
                        let foodDetail = {
                            image: entry.foodDetails.images?.[0] ?? '',
                            foodId: entry.foodDetails._id,
                            name: entry.foodDetails.name,
                            description: entry.foodDetails.description,
                            category: entry.foodDetails.category,
                        };
                        foodDetailsEntryObject.foodDetails.push(foodDetail);
                    }

                    finalResult.items.push(foodDetailsEntryObject);
                }

                lastEntry.push(finalResult);
            }

            return res.status(200).json(makeJsonResponse('Cancelled Order list fetched successfully', { orderList: lastEntry, pagination: paginationObject }, {}, 200, true));

        } catch (error) {
            console.log("Error from controller deliveryPartnerCancelledOrders function => ", error);
            return res.status(500).json(makeJsonResponse('Cancelled Order List Fetch Failed', {}, { error: error.message || "Internal error occurred" }, 500, false));
        }
    }

    static async deliveryPartnerRejectedOrders(req, res, next) {
        const user = req.user;

        try {
            const page = parseInt(req.params.page) || 1;
            const limit = parseInt(req.params.limit) || 10;
            const skip = (page - 1) * limit;

            if (user.role != USER_TYPES.DELIVERY_PARTNER) {
                return res.status(409).json(makeJsonResponse('Delivery partner can only view this data', {}, {}, 409, false));
            }
            // Fetch orders assigned to the delivery partner
            const orderList = await Order.find({ deliveryPartnerId: user._id, status: ORDER_STATUS.DELIVERY_PARTNER_REJECTED_ORDER })
                .sort({ orderDate: -1 }) // Sort latest orders first
                .skip(skip)
                .limit(limit)
                .lean(); // Convert to plain objects for better performance

            const totalOrders = await Order.countDocuments({ deliveryPartnerId: user._id, status: ORDER_STATUS.DELIVERY_PARTNER_REJECTED_ORDER });

            const totalPages = Math.ceil(totalOrders / limit);

            const paginationObject = {
                currentPage: page,
                limit,
                totalItems: totalOrders,
                totalPages,
            }

            if (!orderList.length) {
                return res.status(200).json(makeJsonResponse('No rejected orders found', { orderList: [], pagination: paginationObject }, {}, 200, true));
            }

            // Extract all foodIds from order items
            const foodIds = orderList.flatMap(order => order.items.map(item => item.foodId));


            // Fetch food details from Food model
            const foodDetails = await Food.find(
                { "foodItems._id": { $in: foodIds } },
                { "foodItems.$": 1, hotelId: 1 } // Retrieve only matching food items
            ).lean();

            // Map food details back to orders
            const ordersWithFoodDetails = orderList.map(order => ({
                ...order,
                items: order.items.map(item => ({
                    ...item,
                    foodDetails: foodDetails.find(food =>
                        food.foodItems.some(fItem => fItem._id.equals(item.foodId))
                    )?.foodItems.find(fItem => fItem._id.equals(item.foodId)) || null
                }))
            }));

            let lastEntry = [];

            for (let item of ordersWithFoodDetails) {
                let finalResult = {
                    _id: item._id,
                    cartId: item.cartId,
                    customerId: item.customerId,
                    restaurantId: item.restaurantId,
                    deliveryPartnerId: item.deliveryPartnerId,
                    address: item.address,
                    phone: item.phone,
                    totalAmount: item.totalAmount,
                    orderDate: item.orderDate,
                    paidThrough: item.paidThrough,
                    status: item.status,
                    items: [] // Initialize array to store items
                };

                for (let entry of item.items ?? []) {
                    let foodDetailsEntryObject = {
                        _id: entry._id,
                        foodId: entry.foodId,
                        qty: entry.qty,
                        price: entry.price,
                        foodDetails: [] // Initialize food details array
                    };

                    if (entry.foodDetails) {
                        let foodDetail = {
                            image: entry.foodDetails.images?.[0] ?? '',
                            foodId: entry.foodDetails._id,
                            name: entry.foodDetails.name,
                            description: entry.foodDetails.description,
                            category: entry.foodDetails.category,
                        };
                        foodDetailsEntryObject.foodDetails.push(foodDetail);
                    }

                    finalResult.items.push(foodDetailsEntryObject);
                }

                lastEntry.push(finalResult);
            }

            return res.status(200).json(makeJsonResponse('Rejected Order list fetched successfully', { orderList: lastEntry, pagination: paginationObject }, {}, 200, true));

        } catch (error) {
            console.log("Error from controller deliveryPartnerRejectedOrders function => ", error);
            return res.status(500).json(makeJsonResponse('Rejected Order List Fetch Failed', {}, { error: error.message || "Internal error occurred" }, 500, false));
        }
    }

    static async deliveryPartnerAcceptedOrders(req, res, next) {
        const user = req.user;

        try {
            const page = parseInt(req.params.page) || 1;
            const limit = parseInt(req.params.limit) || 10;
            const skip = (page - 1) * limit;

            if (user.role != USER_TYPES.DELIVERY_PARTNER) {
                return res.status(409).json(makeJsonResponse('Delivery partner can only view this data', {}, {}, 409, false));
            }
            // Fetch orders assigned to the delivery partner
            const orderList = await Order.find({ deliveryPartnerId: user._id, status: ORDER_STATUS.DELIVERY_PARTNER_ACCEPTED_ORDER })
                .sort({ orderDate: -1 }) // Sort latest orders first
                .skip(skip)
                .limit(limit)
                .lean(); // Convert to plain objects for better performance

            const totalOrders = await Order.countDocuments({ deliveryPartnerId: user._id, status: ORDER_STATUS.DELIVERY_PARTNER_ACCEPTED_ORDER });

            const totalPages = Math.ceil(totalOrders / limit);

            const paginationObject = {
                currentPage: page,
                limit,
                totalItems: totalOrders,
                totalPages,
            }

            if (!orderList.length) {
                return res.status(200).json(makeJsonResponse('No accepted orders found', { orderList: [], pagination: paginationObject }, {}, 200, true));
            }

            // Extract all foodIds from order items
            const foodIds = orderList.flatMap(order => order.items.map(item => item.foodId));


            // Fetch food details from Food model
            const foodDetails = await Food.find(
                { "foodItems._id": { $in: foodIds } },
                { "foodItems.$": 1, hotelId: 1 } // Retrieve only matching food items
            ).lean();

            // Map food details back to orders
            const ordersWithFoodDetails = orderList.map(order => ({
                ...order,
                items: order.items.map(item => ({
                    ...item,
                    foodDetails: foodDetails.find(food =>
                        food.foodItems.some(fItem => fItem._id.equals(item.foodId))
                    )?.foodItems.find(fItem => fItem._id.equals(item.foodId)) || null
                }))
            }));

            let lastEntry = [];

            for (let item of ordersWithFoodDetails) {
                let finalResult = {
                    _id: item._id,
                    cartId: item.cartId,
                    customerId: item.customerId,
                    restaurantId: item.restaurantId,
                    deliveryPartnerId: item.deliveryPartnerId,
                    address: item.address,
                    phone: item.phone,
                    totalAmount: item.totalAmount,
                    orderDate: item.orderDate,
                    paidThrough: item.paidThrough,
                    status: item.status,
                    items: [] // Initialize array to store items
                };

                for (let entry of item.items ?? []) {
                    let foodDetailsEntryObject = {
                        _id: entry._id,
                        foodId: entry.foodId,
                        qty: entry.qty,
                        price: entry.price,
                        foodDetails: [] // Initialize food details array
                    };

                    if (entry.foodDetails) {
                        let foodDetail = {
                            image: entry.foodDetails.images?.[0] ?? '',
                            foodId: entry.foodDetails._id,
                            name: entry.foodDetails.name,
                            description: entry.foodDetails.description,
                            category: entry.foodDetails.category,
                        };
                        foodDetailsEntryObject.foodDetails.push(foodDetail);
                    }

                    finalResult.items.push(foodDetailsEntryObject);
                }

                lastEntry.push(finalResult);
            }

            return res.status(200).json(makeJsonResponse('Accepted Order list fetched successfully', { orderList: lastEntry, pagination: paginationObject }, {}, 200, true));

        } catch (error) {
            console.log("Error from controller deliveryPartnerAcceptedOrders function => ", error);
            return res.status(500).json(makeJsonResponse('Accepted Order List Fetch Failed', {}, { error: error.message || "Internal error occurred" }, 500, false));
        }
    }

    static async prepareOrder(req, res, next) {
        try {
            const user = req.user;
            const { orderId } = req.body;

            if (user.role != USER_TYPES.OWNER) {
                return res.status(409).json(makeJsonResponse('Restaurant owner can only update order status to start preparation', {}, {}, 409, false));
            }

            const order = await Order.findOne(
                {
                    _id: orderId,
                    status: ORDER_STATUS.CUSTOMER_PLACED_ORDER
                }
            );

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
            if (statusUpdate.status) {
                return res.status(200).json(makeJsonResponse('Order status updated', { ...statusUpdate.data }, {}, 200, true));
            } else {
                return res.status(500).json(makeJsonResponse(statusUpdate.message, {}, {}, 500, false));
            }
        } catch (error) {
            console.log("error from controller prepareOrder function => ", error)
            return res.status(500).json(makeJsonResponse('Order preparetion failed', {}, { error: error.message || "Internal error occurred" }, 500, false));
        }
    }

    static async acceptOrRejectOrder(req, res, next) {
        try {
            const user = req.user;
            const { orderId, status } = req.body;

            if (user.role != USER_TYPES.DELIVERY_PARTNER) {
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

            const statusUpdate = await acceptOrRejectOrderUpdate(orderId, status, user._id);
            if (statusUpdate.status) {
                return res.status(200).json(makeJsonResponse('Order status updated', { statusUpdate }, {}, 200, true));
            } else {
                return res.status(500).json(makeJsonResponse(statusUpdate.message, {}, {}, 500, false));
            }
        } catch (error) {
            console.log("error from controller acceptOrRejectOrder function => ", error)
            return res.status(500).json(makeJsonResponse('Order preparetion failed', {}, { error: error.message || "Internal error occurred" }, 500, false));
        }
    }

    static async ownerCompletedThePrepartion(req, res, next) {
        try {
            const user = req.user;
            const { orderId } = req.body;

            if (user.role != USER_TYPES.OWNER) {
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
            if (statusUpdate.status) {
                return res.status(200).json(makeJsonResponse('Order status updated', { statusUpdate }, {}, 200, true));
            } else {
                return res.status(500).json(makeJsonResponse(statusUpdate.message, {}, {}, 500, false));
            }
        } catch (error) {
            console.log("error from controller ownerCompletedThePrepartion function => ", error)
            return res.status(500).json(makeJsonResponse('Order preparetion failed', {}, { error: error.message || "Internal error occurred" }, 500, false));
        }
    }

    static async orderPickedUp(req, res, next) {
        try {
            const user = req.user;
            const { orderId } = req.body;

            if (user.role != USER_TYPES.DELIVERY_PARTNER) {
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
            if (statusUpdate.status) {
                return res.status(200).json(makeJsonResponse('Order status updated', { statusUpdate }, {}, 200, true));
            } else {
                return res.status(500).json(makeJsonResponse(statusUpdate.message, {}, {}, 500, false));
            }
        } catch (error) {
            console.log("error from controller orderPickedUp function => ", error)
            return res.status(500).json(makeJsonResponse('Order preparetion failed', {}, { error: error.message || "Internal error occurred" }, 500, false));
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

            if (order.status != ORDER_STATUS.DELIVERY_PARTNER_PICKED_UP_THE_ORDER) {
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