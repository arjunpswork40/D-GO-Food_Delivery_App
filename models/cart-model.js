const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const itemSchema = new Schema(
   {
      foodId: {
         type: Schema.Types.ObjectId,
         required: true,
         ref: 'Food' 
      },
      qty: {
         type: Number,
         required: true 
      },
      price: {
         type: Number,
         required: true 
      }
   },
   { _id: true,timestamps: true }
);

const cartSchema = new Schema(
   {
      userId: {
         type: Schema.Types.ObjectId,
         required: true,
         ref: 'User'
      },
      restaurantId: {
         type: Schema.Types.ObjectId,
         required: true,
         ref: 'User' 
      },
      foodItems: [itemSchema],
      totalPrice: {
         type: Number,
         required: true 
      }
   },
   { timestamps: true } 
);

module.exports = mongoose.model('Cart', cartSchema);
