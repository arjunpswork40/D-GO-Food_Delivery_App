const mongoose = require("mongoose")
const Schema = mongoose.Schema


const foodMainCategorySchema = new Schema(
  {
    name: {
        type: String,
        required: true
    },
    description: {
      type: String,
      required: true
    },
    images: [
        {
            type: String,
            required: false
        }
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('FoodMainCategory', foodMainCategorySchema)