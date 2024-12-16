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
  getPopularBrands
} = require("./services/customer/hotel-related-services");
const {
  getAdminBannersAndServicesByPagination,
  getMainCategory
} = require("./services/admin/admin-related-services")
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
      
      return res.status(200).json(makeJsonResponse('Success',  { message: "Home details", data:finalResult }, {}, 200, false));
      
    } catch (error) {
      console.error(`Error foods:3 ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error3', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }

  static async CustomeraddressAdd(req, res, next) {
    const { body } = req;
    const customerId = req.params.id;

    // Extracting fields from the request body
    const {
        customerlabel,
        customerlat,
        customerlng,
        customeraddress,
        customercity,
        customerstate,
        customercountry,
        customerpincode
    } = body;

    try {
        // Validate required fields for the address
        if (
            !customerlabel ||
            !customerlat ||
            !customerlng ||
            !customeraddress ||
            !customercity ||
            !customerstate ||
            !customercountry ||
            !customerpincode
        ) {
            return res.status(400).json(
                makeJsonResponse('Bad Request', {}, { message: "Please fill all required fields" }, 400, false)
            );
        }

        // Fetch the customer profile using the customer ID
        const customerProfile = await User.findById(customerId);

        if (!customerProfile) {
            return res.status(404).json(
                makeJsonResponse('Not Found', {}, { message: "Customer not found" }, 404, false)
            );
        }

        // Create a new address object
        const newAddress = {
            label: customerlabel, // e.g., "Home", "Work"
            coordinates: {
                lat: parseFloat(customerlat),
                lng: parseFloat(customerlng),
            },
            address: customeraddress,
            city: customercity,
            state: customerstate,
            country: customercountry,
            pincode: customerpincode,
        };

        // Append the new address to the savedAddresses array
        customerProfile.savedAddresses = [...(customerProfile.savedAddresses || []), newAddress];

        // Save the updated customer profile
        await customerProfile.save();

        // Return success response
        return res.status(200).json(
            makeJsonResponse(
                'Success',
                { message: "Address added successfully", user: customerProfile },
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