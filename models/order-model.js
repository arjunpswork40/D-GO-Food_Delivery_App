const mongoose = require("mongoose")
const Schema = mongoose.Schema
const {ORDER_STATUS} = require("../constants/order/order-statuses")
const {USER_TYPES} = require("../constants/user/user-constants")

const addressSchema = new Schema(
    {
        label: { type: String }, 
        type: {
        type: String,
        enum: ['Point'],  // This defines that the type is a Point (for geospatial data)
        required: false,  // This makes it optional
        },
        coordinates: {
        type: [Number],  // [longitude, latitude]
        required: false,
        },
        street: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String },
        zipCode: { type: String },
        lat: { type: Number, required: false }, 
        lng: { type: Number, required: false }, 
    },
    {
        timestamps: true
    }
  )

const logSchema = new Schema(
    {
        status: {
            type: String,
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
        userType: {
            enum: [
                USER_TYPES.OWNER,
                USER_TYPES.ADMIN,
                USER_TYPES.SUB_ADMIN,
                USER_TYPES.SUPER_ADMIN,
                USER_TYPES.DELIVERY_PARTNER,
                USER_TYPES.CUSTOMER,
            ],
            type: String,
        },
    },

    {
        timestamps: true
    }
)

const orderSchema = new Schema(
    {
        cartId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Cart',
            required: true,
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required: false,
        },
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required: false,
        },
        deliveryPartnerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required: false,
        },
        items: {
                type: Array,
                required: true,
        },
        rejectedDeliveryPartners: {
            type: Array,
            required: true,
        },
        address: addressSchema,

        OTP: {
            type: String,
            required: false
        },

        otpVerificationStatus: {
            type: Boolean,
            required: false
        },

        phone: {
            type: String,
            required: true
        },
        
        totalAmount: {
            type: Number,
            required: true,
        },
        
        orderDate: {
            type: Date,
        },
        
        paidThrough: {
            enum: [
                'card',
                'UPI',
                'net_banking',
                'cash',
                'online'
            ],
            type: String,
        },

        status: {
            enum: [
                ORDER_STATUS.CUSTOMER_PLACED_ORDER,
                ORDER_STATUS.OWNER_STARTED_PREPARATION,
                ORDER_STATUS.DELIVERY_PARTNER_ACCEPTED_ORDER,
                ORDER_STATUS.DELIVERY_PARTNER_REJECTED_ORDER,
                ORDER_STATUS.OWNER_COMPLETED_THE_PREPARATION,
                ORDER_STATUS.DELIVERY_PARTNER_PICKED_UP_THE_ORDER,
                ORDER_STATUS.OTP_VERIFIED_AND_COMPLETED_THE_ORDER
            ],
            type: String,
        },
        
        logs: [logSchema]
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model("Order", orderSchema)