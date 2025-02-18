const applicationStaticModel = require("../models/application-static-model");
const Food = require("../models/food-model");
const serviceCategoryModel = require("../models/serviceCategory-model");
const User = require("../models/user-model")
const { makeJsonResponse } = require("../utils/response");
const mongoose = require("mongoose");

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
const { hotelDetailsValidator } = require("../middleware/validator/owner-hotel-details-validator");
class customerController {

  static async allFoods(req, res, next) {
    try {
      const allFoods = await Food.find({ available: true })
      // return res.status(200).json(allFoods)
      return res.status(200).json(makeJsonResponse('All foos', { ...allFoods }, {}, 200, true));
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

      return res.status(200).json(makeJsonResponse('Search result', { result }, {}, 200, true));
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

      return res.status(200).json(makeJsonResponse('Offers', { result }, {}, 200, true));
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

      let highlightedRestaurants = await getHighlightedHotels(page, limit);
      let restaurantList = await getHotelByFilter(page, limit, user.customerDetails.currentLocation.coordinates, offersNearYou, bestSellers, fastDelivery, sortByRating, sortOrder);

      restaurantList = restaurantList.map(item =>  ({
          _id: item._id,
          image: item.hotelDetails.images.hotelMainImage[0],
          name: item.hotelDetails.name,
          description: item.hotelDetails.description,
          ratings: item.ratings.averageRating,
          orderCount: item.orderCount
      }))

      highlightedRestaurants = highlightedRestaurants.map(item => ({
          _id: item._id,
          image: item.hotelDetails.images.hotelMainImage[0],
          name: item.hotelDetails.name,
          description: item.hotelDetails.description,
      }))

      const finalResult = {
        restaurantList: restaurantList,
        highlightedRestaurants: highlightedRestaurants,
      }
      return res.status(200).json(makeJsonResponse('Success', { ...finalResult }, {}, 200, true));
    } catch (error) {
      console.log(error)
      console.error(`Error foods:12 ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error2', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }

  static async restaurantDetails(req, res, next) {
    try {
      const userId = req.params.restaurantId; // Get userId from request params
      const page = parseInt(req.params.page) || 1;
      const limit = parseInt(req.params.limit) || 10;
      const skip = (page - 1) * limit;

      // Convert userId to ObjectId if it's a string
      const objectId = new mongoose.Types.ObjectId(userId);

      // Fetch user details
      const user = await User.findById(objectId).lean();
      if (!user) {
        return res.status(404).json(makeJsonResponse('User not found', {}, {}, 404, false));
      }

      // Fetch paginated food items where hotelId = userId
      
        const foodItems = await Food.findOne(
          { hotelId: objectId }, 
          { 
              foodItems: { $slice: [skip, limit] }, // Apply pagination on foodItems array
              _id: 1, // Optional: Keep necessary fields
              hotelId: 1, 
              createdAt: 1 
          }
      ).lean();


      const totalFoodItems = await Food.aggregate([
        { $match: { hotelId: objectId } },
        { $project: { total: { $size: "$foodItems" } } } // Count total foodItems in the array
    ]);

    const totalItems = totalFoodItems.length > 0 ? totalFoodItems[0].total : 0;


        let updatedFoodItems = [];

        if(foodItems.foodItems.length > 0) {
          for(let item of foodItems?.foodItems) {
            
              const foodEntry = {
                image: item?.images[0] ?? '',
                foodId: item._id,
                name: item.name,
                description: item.description,
                category: item.category,
                price: item.price
              }
            updatedFoodItems.push(foodEntry);
          }
        }

        const restaurantDetails = {
          userId: user._id,
          restaurantName: user.hotelDetails.name,
          description: user.hotelDetails.description,
          location: user.hotelDetails.location,
          contactNumber: user.hotelDetails.contactNumber,
          openingHours: user.hotelDetails.openingHours,
          images: user.hotelDetails.images,
          ratings: user.ratings.averageRating,
          email: user.email,
          phone: user.phone,
          foodItems: updatedFoodItems,
          pagination: {
            currentPage: page,
            limit,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
          }
        }

        return res.status(200).json(makeJsonResponse('Success', { ...restaurantDetails }, {}, 200, true));

    } catch(error) {
      console.log(error)
      console.error(`Error restaurantDetails:12 ${error.code} - ${error.message}`);
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

      return res.status(200).json(makeJsonResponse('Success', { ...accountDetails }, {}, 200, true));
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

      return res.status(200).json(makeJsonResponse('Customer Profile', { ...customerprofile }, {}, 200, true));
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
      const maxDistance = process.env.NEAR_BY_MAX_DISTANCE || "5000";
      let topPicks = [];
      let allRestaurantsNearBy = [];
      let popularBrands = [];
      try {
        if (user.customerDetails.currentLocation.coordinates) {
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

      const mainCategories = await getMainCategory(page, limit);

      const popularRestaurants = await getPopularHotels(page, limit);

      const topOffers = await getOffersWithHotelDetails(page, limit);

      const finalResult = {
        topData: applicationDetails,
        serviceCategoryDetails: serviceCategoryDetails,
        topPicks: topPicks,
        adds: adds,
        mainFoodCategories: mainFoodCategories,
        spotlight: spotlight,
        adminBanners: adminBannersAndSerivces ? adminBannersAndSerivces.banners : [],
        adminServices: adminBannersAndSerivces ? adminBannersAndSerivces.services : [],
        popularCategories: mainCategories,
        allRestaurantsNearBy: allRestaurantsNearBy,
        popularBrands: popularBrands,
        popularRestaurants: popularRestaurants,
        topOffers: topOffers
      }
      
      return res.status(200).json(makeJsonResponse('Home details',  { ...finalResult }, {}, 200, true));
      
    } catch (error) {
      console.error(`Error foods:3 ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error3', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }

  static async CustomeraddressAdd(req, res, next) {
    const { body } = req;
    const { user } = req;
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
        lng: body.lng,
        lat: body.lat
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
            address._id ? 'Address updated successfully' : 'Address added successfully',
              {
                savedAddresses: updatedUser.customerDetails.savedAddresses,
                userId: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email
              },
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



  static async updateBankDetails(req, res, next) {
    const { body } = req;
    const user = req.user; // Assuming the authenticated user details are in req.user

    // Extracting fields from the request body
    const {
      accountName,
      accountNumber,
      bankName,
      ifscCode,
    } = body;
    try {

      // Fetch the user profile using the authenticated user's ID
      const userProfile = await User.findById(user.id);

      if (!userProfile) {
        return res.status(404).json(
          makeJsonResponse('Not Found', {}, { message: "User not found" }, 404, false)
        );
      }

      // Update the bank details
      userProfile.bankDetails = {
        accountName,
        accountNumber,
        bankName,
        ifscCode,
      };

      // Save the updated user profile
      await userProfile.save();

      // Return success response
      return res.status(200).json(
        makeJsonResponse(
          'Bank details updated successfully',
          { 
            bankDetails: userProfile.bankDetails,
            name: userProfile.name,
            userId: userProfile._id,
            email: userProfile.email
          },
          {},
          200,
          true
        )
      );
    } catch (error) {
      console.error(`Error updating bank details: ${error.code || ''} - ${error.message}`);
      return res.status(500).json(
        makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false)
      );
    }
  }


}

module.exports = customerController