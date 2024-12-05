const mongoose = require("mongoose")
const Schema = mongoose.Schema


const serviceCategorySchema = new Schema(
    {
        title: {
            type: String,
            required: true
        },
        mainOffer:{
            type: Boolean,
            required: false,
            default: false
        },
        description: {
            type: String,
            required: true
        },
        main_image: {
            type: String,
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
  
module.exports = mongoose.model('ServiceCategory', serviceCategorySchema)