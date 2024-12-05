const mongoose = require("mongoose")
const Schema = mongoose.Schema


const foodSubCategorySchema = new Schema(
  {
    name: {
        type: String,
        required: true
    },
    description: {
      type: String,
      required: true
    },
    mainCategoryId: {
        type: Schema.Types.ObjectId,
        ref:'FoodMainCategory',
        required: true,
    },
    ownerId: {
        type: Schema.Types.ObjectId,
        ref:'User',
        required: true,
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

module.exports = mongoose.model('FoodSubCategory', foodSubCategorySchema)