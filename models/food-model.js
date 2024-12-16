const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Food schema (unchanged)
const foodSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    available: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    images: {
      type: [String], // Using array of strings for image URLs
      default: [],
    },
  },
);

// Hotel schema (stores food items in an array)
const hotelSchema = new Schema(
  {
    hotelId: {
        type: Schema.Types.ObjectId,  // Foreign key reference to the Hotel collection
        ref: 'User.',                  // The model that this foreign key references
        required: true,
    },
    foodItems: {
      type: [foodSchema], // Embed food items as an array
      default: [],
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
    timestamps: true, // Automatically manages createdAt and updatedAt fields
  }
);

// Export the Hotel model
module.exports = mongoose.model("Food", hotelSchema);
