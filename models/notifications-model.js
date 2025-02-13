const mongoose = require("mongoose")
const Schema = mongoose.Schema
const {USER_TYPES} = require("../constants/user/user-constants")

const notificationSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Users'
        },
        notification: {
            type: String,
            required: true
        },
        userType: {
            enum: [
                USER_TYPES.ADMIN,
                USER_TYPES.CUSTOMER,
                USER_TYPES.DELIVERY_PARTNER,
                USER_TYPES.OWNER
            ],
            type: String,
        },
    },
    {
        timestamps: true,
    }
    )

module.exports = mongoose.model('Notification', notificationSchema)