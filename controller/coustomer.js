const applicationStaticModel = require("../models/application-static-model");
const Food = require("../models/food-model");
const serviceCategoryModel = require("../models/serviceCategory-model");
const User = require("../models/user-model")
const { makeJsonResponse } = require("../utils/response");
const { getNearByHotelsWithPaginationAndCurrentLocation, getServiceCategoryDetails, getApplicationBasicDetails } = require("./services/customer/hotel-related-services");
class customerController {
  static async allFoods(req, res, next) {
    try {
      const allFoods = await Food.find({ available: true })
      // return res.status(200).json(allFoods)
      return res.status(200).json(makeJsonResponse('Success', { message: "All foos ", allFoods }, {}, 200, true));
    } catch (error) {
      console.error(`Error foods: ${error.code} - ${error.message}`);
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
      console.error(`Error foods: ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }

  static async getHomeDetails(req, res, next) {
    const page = req.params.page || 1;
    const limit = req.params.limit || 10;

    try {
      const user = req.user;
      const applicationDetails = await getApplicationBasicDetails();
      const serviceCategoryDetails = await getServiceCategoryDetails();

      const maxDistance  = process.env.NEAR_BY_MAX_DISTANCE || "5000";
      let topPicks = [];
      try {
        
        // fetching hotel by priority index, location and rating
        topPicks = await getNearByHotelsWithPaginationAndCurrentLocation(user.customerDetails.currentLocation.coordinates, maxDistance, page, limit)

      } catch (err) {
        console.error("Error finding nearby hotels:", err);
      }

      const adds = await getAddsByCount(process.env.HOMEPAGE_ADDS_COUNT || 10);

      const mainFoodCategories = await getMainFoodCategoryListByCount(process.env.HOMEPAGE_MAIN_CATEGORY_LIST_COUNT || 10)
      
      const spotlight = await getSpotlights(page, limit)

      const adminBannersAndSerivces = await getAdminBannersAndServicesByPagination(page, limit);

      const mainCategories = await getMainCategory(page,limit);

      const finalResult = {
        topData: applicationDetails,
        serviceCategoryDetails: serviceCategoryDetails,
        topPicks: topPicks,
        adds: adds,
        mainFoodCategories: mainFoodCategories,
        spotlight: spotlight,
        adminBanners: adminBannersAndSerivces.banners,
        adminServices: adminBannersAndSerivces.services,
        popularCategories: mainCategories
      }
      return res.status(200).json(makeJsonResponse('Success',  { message: "Home details", data:finalResult }, {}, 500, false));
      
    } catch (error) {
      console.error(`Error foods: ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false));
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
            makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false)
        );
    }
  }




}

module.exports = customerController