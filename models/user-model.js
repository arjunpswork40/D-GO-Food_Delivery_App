const mongoose = require("mongoose")
const Schema = mongoose.Schema

const userSchema = new Schema(
    {  
        hotelDetails: {
            partnerBrand: {type: Boolean, default: false, required: false},
            priorityIndex: { type: Number,default: 0 },
            name: { type: String, required: false, validate: {
                validator: (value) => {
                    return /^[a-zA-Z]{2,15}$/.test(value)
                },
                message: problem => `${problem.value} is not a valid name`
                } },
            description: { type: String },
            location: {
              address: { type: String, required: false },
              city: { type: String, required: false },
              state: { type: String, required: false },
              country: { type: String, required: false },
              zipcode: { type: String, required: false },
              type: { type: String, default: "Point" },  // GeoJSON type, always 'Point'
              coordinates: { type: [Number], index: "2dsphere" },  // [Longitude, Latitude]
            },
            contactNumber: { type: String, required: false },
            openingHours: {
              open: { type: String, required: false }, // Example: "09:00"
              close: { type: String, required: false }, // Example: "22:00"
            },
            images: {
              hotelImages: [{ type: String }], // URLs or paths to hotel images
              menuImages: [{ type: String }], 
              hotelMainImage: [{ type: String }],
            },
        },
        bankDetails: {
            accountName: { type: String, required: false },
            accountNumber: { type: String, required: false },
            bankName: { type: String, required: false },
            ifscCode: { type: String, required: false },
        },
        ratings: {
            averageRating: { type: Number, default: 0 },
            totalRatings: { type: Number, default: 0 },
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        name: {
            type: String,
            trim: true,
            required: [true, "Name is required"],
            validate: {
                validator: (value) => {
                    return /^[a-zA-Z]{2,15}$/.test(value)
                },
                message: problem => `${problem.value} is not a valid name`
                }
        },

        email: {
            type: String,
            trim: true,
            required: [true, "Email is required"],
            validate: {
                validator: (value) => {
                    return /^([\w-.]{3,})+@([\w-.]{3,15})+.([a-zA-Z]{2,3})$/.test(value)
                },
                message: problem => `${problem.value} is not valid`
                }
        },

        address: {
            street: { type: String },
            city: { type: String },
            state: { type: String },
            country: { type: String },
            pincode: { type: String },
          },

        phone: {
            type: Number,
            validate: {
                validator: (value) => {
                    if (typeof value === 'null' || 'undefined' || ' ') {
                        let value = 2341234567890
                        return /^(\d{3})+(\d{3})+(\d{3})+(\d{4})$/.test(value)
                    } else {
                        return /^(\d{3})+(\d{3})+(\d{3})+(\d{4})$/.test(value)
                    }
                },
                message: problem => `${problem.value} is not valid`
            }
        },

        password: {
            type: String,
            required: [true, "Password is required"]
        },

        cart: [
            {
                type: Schema.Types.ObjectId,
                ref: "Cart"
            }
        ],

        deliveryPartnerDetails: {
            vehicleType: { type: String, enum: ['bike', 'car', 'bicycle'], default: 'bike' },
            vehicleNumber: { type: String },
            licenseNumber: { type: String },
            currentLocation: {
              type: { type: String, default: "Point" },  // GeoJSON type, always 'Point'
              coordinates: { type: [Number], index: "2dsphere" },  // [Longitude, Latitude]
            },
            status: {
              type: String,
              enum: ['active', 'inactive'],
              default: 'active',
            },
            totalDeliveries: { type: Number, default: 0 },
            earnings: { type: Number, default: 0 },
          },
        customerDetails: {
            favoriteRestaurants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // References to Owner Users
            savedAddresses: [
              {
                label: { type: String }, // e.g., "Home", "Work"
                type: { type: String, default: "Point" },  // GeoJSON type, always 'Point'
                coordinates: { type: [Number], index: "2dsphere" },  // [Longitude, Latitude]
                address: { type: String },
                city: { type: String },
                state: { type: String },
                country: { type: String },
                pincode: { type: String },
              },
            ],
            orders: [
              {
                orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
                orderDate: { type: Date },
                status: { type: String, enum: ['pending', 'completed', 'cancelled'] },
              },
            ],
            currentLocation: {
              type: { type: String, default: "Point" },  // GeoJSON type, always 'Point'
              coordinates: { type: [Number], index: "2dsphere" },  // [Longitude, Latitude]
            },
          },

        order: [
            {
                type: Schema.Types.ObjectId,
                ref: "Order"
            },
        ],
        
        role: {
             type: String,
             trim: true,
             enum: ["customer", "owner", "delivery_partner", "admin"],
             default: "customer"
        }
    },
    
    {
        timestamps: true
    }
)

userSchema.index({ email: 1, role: 1 }, { unique: true });

module.exports = mongoose.model('Users', userSchema)