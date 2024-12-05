const mongoose = require("mongoose")
const Schema = mongoose.Schema


const addsSchema = new Schema(
    {
    type: {
        type: String,
        enum: ['banner', 'words', 'video'],
        default: 'banner',
    },
    images: [{
        type: String,
        required: false
    }],
    tagline: {
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
        timestamps: true,
    }
)

module.exports = mongoose.model('Add', addsSchema)