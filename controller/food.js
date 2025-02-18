const Food = require("../models/food-model")
const { makeJsonResponse } = require("../utils/response")
const {
  getFoodDetail
} = require("../controller/services/food/food-service")
class foodController{
  static async allFoods(req, res, next) {
    try {
      const allFoods = await Food.find({available: true})
      // return res.status(200).json(allFoods)

       return res.status(200).json(makeJsonResponse('Success', { message: "All foos ",allFoods },{}, 200, true));


    } catch (error) {
      console.error(`Error foods: ${error.code} - ${error.message}`);
            return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }

  static async aFoodDetails(req, res, next) {
    try {
      const foodId = req.params.id;
      const foodDetails = await Food.findById(foodId)
      // return res.status(200).json(foodDetails)

      return res.status(200).json(makeJsonResponse('Success', { message: "foodDetails",foodDetails },{}, 200, true));
    } catch(error) {
      console.error(`Error foods: ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }

  static async foodDetail(req, res, next) {
    try {
      const foodId = req.params.foodId;
      const foodDetails = await getFoodDetail(foodId)
      let finalData = foodDetails.data;

      if(foodDetails.status){
        finalData = finalData[0];

        const finalResult = {
          _id: finalData._id,
          image: finalData.images[0],
          name: finalData.name,
          description: finalData.description,
          category: finalData.category,
          price: finalData.price
        }

        finalData.images = finalData.images[0];
        finalData.image = finalData.images[0];
        return res.status(200).json(makeJsonResponse(foodDetails.message, { foodDetails: finalResult },{}, 200, true));
      } else {
        return res.status(401).json(makeJsonResponse(foodDetails.message, { ...finalData },{}, 401, true));
      }
    } catch(error) {
      console.error(`Error foods: ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }
}

module.exports = foodController