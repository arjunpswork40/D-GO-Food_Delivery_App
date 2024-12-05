const mongoose = require("mongoose")
const Schema = mongoose.Schema


const offerSchema = new Schema(
    {
        deductionAmount: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
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
  
module.exports = mongoose.model('Offer', offerSchema)