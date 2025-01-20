const Cart = require("../models/cart-model")
const Food = require("../models/food-model")
const { makeJsonResponse } = require("../utils/response")
const {
  storeToCart,
  updateCart,
  deleteCartItem
} = require("./services/customer/order-services")
class CartClass {

  static async addToCart(req, res, next) {
    try {
      const {
              foodId,
              itemCount
            } = req.body;
      const user = req.user;
      
      const addToCart = await storeToCart(foodId, itemCount, user);
    
      return res.status(200).json(makeJsonResponse('Success', { message: "item added to cart", data: addToCart }, {}, 200, true));
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
              itemCount
            } = req.body;
      const user = req.user;
      
      const updateCartData = await updateCart(cartId, foodId, itemCount, user);
    
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
      const findUsersCart = await Cart.find({userId: user._id})
      // return res.status(200).json(findUsersCart)
      return res.status(200).json(makeJsonResponse('Success', { message: "All cart",findUsersCart},{}, 200, true));
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