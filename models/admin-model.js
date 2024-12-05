const mongoose = require("mongoose")
const Schema = mongoose.Schema

const adminBannerSchema = new Schema(
    {
        heading: {
            type: String,
            required: false,
        },
        description: {
            type: String,
            required: false
        },
        image: {
            type: String,
            required: false
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true
    }
)

const adminServiceSchema = new Schema(
    {
        heading: {
            type: String,
            required: false,
        },
        description: {
            type: String,
            required: false
        },
        image: {
            type: String,
            required: false
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true
    }
)

const adminSchema = new Schema(
    {

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

        password: {
        type: String,
        required: [true, "Password is required"]
        },

        role: {
             type: String,
             trim: true,
             enum: ["super_admin", "sub_admin","admin"],
             default: "super_admin"
        },
        banners: [adminBannerSchema],
        services: [adminServiceSchema],
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    
    {
        timestamps: true
    }
)

adminSchema.index({ email: 1, role: 1 }, { unique: true });

module.exports = mongoose.model('Admins', adminSchema)