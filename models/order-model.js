const mongoose = require("mongoose")
const Schema = mongoose.Schema

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
        }
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

        items: [
            {
                type: Array,
                required: true,
            },
        ],

        address: addressSchema,

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
                'customer_placed_order',
                'owner_started_preparation',
                'delivery_partner_accepted_order',
                'owner_completed_the_preparation',
                'delivery_partner_picked_up_the_order',
                'OTP_verified_and_completed_the_order'
            ],
            type: String,
        },
        
        logs: [logSchema]
    }
)

module.exports = mongoose.model("Order", orderSchema)