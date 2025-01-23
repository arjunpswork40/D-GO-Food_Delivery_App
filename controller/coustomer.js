const applicationStaticModel = require("../models/application-static-model");
const Food = require("../models/food-model");
const serviceCategoryModel = require("../models/serviceCategory-model");
const User = require("../models/user-model")
const { makeJsonResponse } = require("../utils/response");
const { 
  getNearByHotelsWithPaginationAndCurrentLocation,
  getSpotlights,
  getMainFoodCategoryListByCount, 
  getServiceCategoryDetails, 
  getApplicationBasicDetails, 
  getAddsByCount,
  getAllNearByHotels,
  getPopularHotels,
  getOffersWithHotelDetails,
  getPopularBrands,
  searchHotelsByKeyword,
  getOfferDetails,
  getHighlightedHotels,
  getHotelByFilter,
  getAccountDetails
} = require("./services/customer/hotel-related-services");
const {
  getAdminBannersAndServicesByPagination,
  getMainCategory
} = require("./services/admin/admin-related-services");
const userModel = require("../models/user-model");
class customerController {

  static async allFoods(req, res, next) {
    try {
      const allFoods = await Food.find({ available: true })
      // return res.status(200).json(allFoods)
      return res.status(200).json(makeJsonResponse('Success', { message: "All foos ", allFoods }, {}, 200, true));
    } catch (error) {
      console.error(`Error foods:1 ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }

  static async search(req, res, next) {
    try {
      const {
            page,
            limit,
            } = req.params;
      const { keyword } = req.query;      
      const user = req.user;
      const result = await searchHotelsByKeyword(keyword, page, limit, user.customerDetails.currentLocation);

      return res.status(200).json(makeJsonResponse('Success', { message: "customerprofile", data: result }, {}, 200, true));
    } catch (error) {
      console.log(error)
      console.error(`Error foods:12 ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error2', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }

  static async restaurantOffers(req, res, next) {
    try {
      const {
            page,
            limit,
            } = req.params;

      const result = await getOfferDetails(page, limit);

      return res.status(200).json(makeJsonResponse('Success', { message: "customerprofile", data: result }, {}, 200, true));
    } catch (error) {
      console.log(error)
      console.error(`Error foods:12 ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error2', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }
  
  static async restaurantList(req, res, next) {
    try {
      const {
              page,
              limit,
            } = req.params;

      const {
              offersNearYou,
              bestSellers,
              sortByRating,
              fastDelivery,
              sortOrder
            } = req.query;

      const user = req.user;

      const highlightedHotels = await getHighlightedHotels(page, limit);
      const restaurantList = await getHotelByFilter(page, limit, user.customerDetails.currentLocation.coordinates, offersNearYou, bestSellers, fastDelivery, sortByRating, sortOrder);

      const finalResult = {
        restaurantList: restaurantList,
        highlightedHotels: highlightedHotels,
      }
      return res.status(200).json(makeJsonResponse('Success', { message: "customerprofile", data: finalResult }, {}, 200, true));
    } catch (error) {
      console.log(error)
      console.error(`Error foods:12 ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error2', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }

  static async accountDetails(req, res, next) {
    try {
      const {
              page,
              limit,
            } = req.params;
      const user = req.user;
      const accountDetails = await getAccountDetails(user, page, limit);
    
      return res.status(200).json(makeJsonResponse('Success', { message: "customerprofile", data: accountDetails }, {}, 200, true));
    } catch (error) {
      console.log(error)
      console.error(`Error foods:12 ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error2', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }


  static async customerprofile(req, res, next) {
    try {
      const customerId = req.params.id;
      const customerprofile = await User.findById(customerId, "name _id")
      // return res.status(200).json(foodDetails)

      return res.status(200).json(makeJsonResponse('Success', { message: "customerprofile", customerprofile }, {}, 200, true));
    } catch (error) {
      console.error(`Error foods:2 ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error2', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }

  static async getHomeDetails(req, res, next) {
    const page = Number(req.params.page || 1);
    const limit = Number(req.params.limit || 10);

    try {
      const user = req.user;
      const applicationDetails = await getApplicationBasicDetails();
      const serviceCategoryDetails = await getServiceCategoryDetails();
      const maxDistance  = process.env.NEAR_BY_MAX_DISTANCE || "5000";
      let topPicks = [];
      let allRestaurantsNearBy = [];
      let popularBrands = [];
      try {
        if(user.customerDetails.currentLocation.coordinates){
          // fetching hotel by priority index, location and rating
          topPicks = await getNearByHotelsWithPaginationAndCurrentLocation(user.customerDetails.currentLocation.coordinates, Number(maxDistance), page, limit)

          // fetching hotels along with offer details based on currentLocation of user
          allRestaurantsNearBy = await getAllNearByHotels(user.customerDetails.currentLocation.coordinates, Number(maxDistance), page, limit)

          popularBrands = await getPopularBrands(user.customerDetails.currentLocation.coordinates, Number(maxDistance), page, limit);

        }
      } catch (err) {
        console.error("Error finding nearby hotels:", err);
      }

      const adds = await getAddsByCount(Number(process.env.HOMEPAGE_ADDS_COUNT || 10));
      
      const mainFoodCategories = await getMainFoodCategoryListByCount(Number(process.env.HOMEPAGE_MAIN_CATEGORY_LIST_COUNT || 10));
      
      const spotlight = await getSpotlights(page, limit)

      const adminBannersAndSerivces = await getAdminBannersAndServicesByPagination(page, limit);

      const mainCategories = await getMainCategory(page,limit);

      const popularRestaurants = await getPopularHotels(page, limit);

      const topOffers = await getOffersWithHotelDetails(page,limit);
      
      const finalResult = {
        topData: applicationDetails,
        serviceCategoryDetails: serviceCategoryDetails,
        topPicks: topPicks,
        adds: adds,
        mainFoodCategories: mainFoodCategories,
        spotlight: spotlight,
        adminBanners: adminBannersAndSerivces ?  adminBannersAndSerivces.banners : [],
        adminServices: adminBannersAndSerivces ? adminBannersAndSerivces.services: [],
        popularCategories: mainCategories,
        allRestaurantsNearBy: allRestaurantsNearBy,
        popularBrands: popularBrands,
        popularRestaurants: popularRestaurants,
        topOffers: topOffers
      }
      
      return res.status(200).json(makeJsonResponse('Success',  { message: "Home details", data:finalResult }, {}, 200, true));
      
    } catch (error) {
      console.error(`Error foods:3 ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error3', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }

  static async CustomeraddressAdd(req, res, next) {
    const { body } = req;
    const { user } = req;
    console.log(user._id)
    try {

      const address = {
        _id: body._id, // Use the _id if updating an existing address
        label: body.label,
        type: 'Point',
        coordinates: [body.lng, body.lat], // Example: Bangalore coordinates
        street: body.street,
        city: body.city,
        state: body.state,
        country: body.country,
        zipCode: body.zipCode,
      }
      const userData = await userModel.findById(user._id);

      if(!userData) {
        return res.status(400).json(makeJsonResponse('Failed', {}, { message: "User not found", data:body }, 400, false));
      }

      if(body._id) {
          // If _id exists, find the address by _id and update it
          const existingAddress = userData.customerDetails.savedAddresses.id(address._id);

          if (existingAddress) {
            // Update the fields of the existing address
            Object.assign(existingAddress, address);
          } else {
            return res.status(400).json(makeJsonResponse('Failed', {}, { message: "Address with the provided _id not found", data:body }, 400, false));
          }
      } else {
        userData.customerDetails.savedAddresses.push(address);
      }
       
      const updatedUser = await userData.save();

      // Return success response
      return res.status(200).json(
          makeJsonResponse(
              'Success',
              { message: "Address added successfully", data: {
                savedAddresses: updatedUser.customerDetails.savedAddresses,
                userId: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email
              } },
              {},
              200,
              true
          )
      );
    } catch (error) {
        console.error(`Error adding customer address: ${error.code || ''} - ${error.message}`);
        return res.status(500).json(
            makeJsonResponse('Internal Error4', {}, { message: error.message || "Internal error occurred" }, 500, false)
        );
    }
  }

}

module.exports = customerController