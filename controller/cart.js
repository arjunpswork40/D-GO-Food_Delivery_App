const Cart = require("../models/cart-model")
const mongoose = require("mongoose");
const Food = require("../models/food-model")
const { makeJsonResponse } = require("../utils/response")
const {
  storeOrUpdateToCart,
  updateCart,
  deleteCartItem,
  removeOrDeleteFromCart
} = require("./services/customer/cart-services")
class CartClass {

  static async addToCart(req, res, next) {
    try {
      let {
              restaurantId,
              foodId,
              qty,
            } = req.body;
      const user = req.user;
      const addToCart = await storeOrUpdateToCart(restaurantId, foodId, qty, user);
      let result = makeJsonResponse(addToCart.message ?? "item updated in cart", addToCart.cartData, {}, 200, true)
      if(!addToCart.status) {
        result = makeJsonResponse(addToCart.message ?? "Internal error occured", {},addToCart.cartData, 500, false)
      }
      return res.status(addToCart.status ? 200 : 500).json(result);
    } catch (error) {
      console.log(error)
      console.error(`Error foods:12 ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error2', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }

  static async removeOrDeleteCartEntry(req, res, next) {
    try {
      let {
              restaurantId,
              foodId,
              qty,
            } = req.body;
      const user = req.user;
      const addToCart = await removeOrDeleteFromCart(restaurantId, foodId, qty, user);
      let result = makeJsonResponse(addToCart.message ?? "item updated in cart", addToCart.cartData, {}, 200, true)
      if(!addToCart.status) {
        result = makeJsonResponse(addToCart.message ?? "Internal error occured", {},addToCart.cartData, 500, false)
      }
      return res.status(addToCart.status ? 200 : 500).json(result);
    } catch (error) {
      console.log(error)
      console.error(`Error foods:12 ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error2', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }

  static async updateCart(req, res, next) {
    try {
      const {
              cartId,
              foodId,
              qty
            } = req.body;
      const user = req.user;
      
      const updateCartData = await updateCart(cartId, foodId, qty, user);
    
      return res.status(200).json(makeJsonResponse('Success', { message: "item updated in cart", data: updateCartData }, {}, 200, true));
    } catch (error) {
      console.log(error)
      console.error(`Error foods:123 ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error2', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }

  static async deleteCart(req, res, next) {
    try {
      const {
            cartId
            } = req.params;
      const user = req.user;
      
      const deleteCartItemData = await deleteCartItem(cartId,user);
    
      return res.status(200).json(makeJsonResponse('Success', { message: "item deleted from cart", data: deleteCartItemData }, {}, 200, true));
    } catch (error) {
      console.log(error)
      console.error(`Error foods:123 ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error2', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }
  static async addToCart2(req, res, next) {
    try {
      const userId = req.user
      const foodToAddToCart = req.params.id.toString()
      let qty = req.params.qty

      const foundFood = await Food.findById(foodToAddToCart)
      
      const findUsersCart = await Cart.find({userId: userId._id})
      
      const checkCart = findUsersCart.filter((eachItemInUserCart) => {
        return eachItemInUserCart.foodId.toString() === foundFood._id.toString()
      })

      if (checkCart == 0) {
        if ( foundFood._id.toString() === foodToAddToCart && qty <= 0 || null || undefined ) {
          qty = 1
        }
        if ( foundFood._id.toString() === foodToAddToCart && qty >= 1) {
          await new Cart({
            userId: userId._id,
            foodId: foundFood,
            qty: qty
          }).save()
          // return res.status(201).json(`${foundFood.name} was added successfully`) 

     return res.status(200).json(makeJsonResponse('Success', { message: `${foundFood.name}was added successfully`},{}, 200, true));


        }
      }

      return res.status(501).json(`this isnt implemented as you have ${foundFood.name} in your cart before`)
    
    } catch (error) {
      console.error(`Error foods: ${error.code} - ${error.message}`);
            return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }

  static async allCartItem(req, res, next) {
    try {
      const user = req.user
      const cartResult = await Cart.aggregate([
          // Lookup restaurant (User) details using restaurantId
          {
              $lookup: {
                  from: "users",
                  localField: "restaurantId",
                  foreignField: "_id",
                  as: "restaurantDetails"
              }
          },
          { $unwind: "$restaurantDetails" }, // Expand restaurant details
          
          // Lookup all Food documents where any foodItem in the cart exists
          {
              $lookup: {
                  from: "foods", // Food collection
                  localField: "foodItems.foodId",
                  foreignField: "foodItems._id",
                  as: "foodDetails"
              }
          },

          // Map and restructure foodItems with matched food details
          {
              $addFields: {
                  foodItems: {
                      $map: {
                          input: "$foodItems",
                          as: "cartItem",
                          in: {
                              _id: "$$cartItem._id",
                              foodId: "$$cartItem.foodId",
                              qty: "$$cartItem.qty",
                              price: "$$cartItem.price",
                              foodDetails: {
                                  $arrayElemAt: [
                                      {
                                          $filter: {
                                              input: {
                                                  $reduce: {
                                                      input: "$foodDetails",
                                                      initialValue: [],
                                                      in: { $concatArrays: ["$$value", "$$this.foodItems"] }
                                                  }
                                              },
                                              as: "foodItem",
                                              cond: { $eq: ["$$foodItem._id", "$$cartItem.foodId"] }
                                          }
                                      },
                                      0
                                  ]
                              }
                          }
                      }
                  }
              }
          },

          // Final projection to include restaurant and structured food details
          {
              $project: {
                  "userId": 1,
                  "restaurantId": 1,
                  "restaurantDetails.name": 1,
                  "restaurantDetails.email": 1,
                  "restaurantDetails.phone": 1,
                  "foodItems": 1,
                  "totalPrice": 1,
                  "createdAt": 1,
                  "updatedAt": 1
              }
          }
      ]);

      let cartItems = [];

      for (let cart of cartResult) {
          let entry = {
            _id: cart._id,
            customerId: cart.userId,
            restaurantId: cart.restaurantId,
            totalPrice: cart.totalPrice,
            createdAt: cart.createdAt,
            restaurantDetails: {
              name: cart.restaurantDetails.name
            },
          }
          let updatedFoodItems = [];
          for(let food of cart.foodItems) {
            let foodEntry = {
              _id: food._id,
              foodId: food.foodId,
              qty: food.qty,
              price: food.price,
              foodDetails: {
                image: food.foodDetails?.images[0] ?? '',
                name: food.foodDetails?.name,
                description: food.foodDetails?.description,
                category: food.foodDetails?.category,
              }
            }
            updatedFoodItems.push(foodEntry);
          }
          entry.foodItems = updatedFoodItems;
          cartItems.push(entry);
      }

      return res.status(200).json(makeJsonResponse('All cart items', { cartItems},{}, 200, true));
    } catch (error) {
      console.error(`Error foods: ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }

  static async editCart(req, res, next) {
    try {
      const userId = req.user
      const foodItemToUpdate = req.params.id
      let newQty = req.params.qty

      const findCart = await Cart.findById(foodItemToUpdate)

      if (findCart.userId.toString() == userId._id.toString() && findCart.qty.toString() !== newQty.toString()) {
        if ( newQty <= 0 || null || undefined ) {
          return res.status(501).json("Item can not be less then ONE, so not implemented")
        }
        if (newQty >= 1) {
          await findCart.updateOne({
            qty: newQty
          })
        //  return res.status(201).json(`${findCart.foodId} qty was updated to ${newQty}`)

         return res.status(200).json(makeJsonResponse('Success', { message: `${findCart.foodId} qty was updated to ${newQty}`},{}, 200, true));

        }
      }
      return res.status(200).json("in it really state nothing happened")
    } catch (error) {
      console.error(`Error foods: ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }

  static async removeFromCart(req, res, next) {
    try {
      const userId = req.user
      const foodItemToRemove = req.params.id     
      const findUsersCart = await Cart.find({userId: userId._id})
     
      const checkCart = findUsersCart.filter((eachItemInUserCart) => {
        return eachItemInUserCart._id.toString() === foodItemToRemove.toString()
      })

      if (checkCart.length !== 0 && checkCart !== undefined && checkCart !== null) {
        await Cart.deleteOne({_id : checkCart[0]._id.toString()})
        // return res.status(201).json(`${checkCart[0].foodId} was removed from cart`)


        return res.status(200).json(makeJsonResponse('Success', { message: `${checkCart[0].foodId} was removed from cart`},{}, 200, true));
      }
     
      return res.status(200).json("looks like the item was not found")
    } catch (error) {
      console.error(`Error foods: ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  } 
}

module.exports = CartClass