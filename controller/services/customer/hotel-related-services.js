const addsModel = require("../../../models/adds-model");
const applicationStaticModel = require("../../../models/application-static-model");
const serviceCategoryModel = require("../../../models/serviceCategory-model");
const userModel = require("../../../models/user-model");
const User = require("../../../models/user-model");
const OWNER = require("../../../utils/userRoles")
module.exports = {
    getNearByHotelsWithPaginationAndCurrentLocation: async (userLocation, maxDistance, page, limit) => {
        try {
            const skip = (page - 1) * limit;

            const nearbyHotels = await User.aggregate([
            {
                // Unwind hotelDetails to deal with individual locations
                $unwind: "$hotelDetails",
            },
            {
                $geoNear: {
                    near: {
                        type: "Point",
                        coordinates: userLocation,  // [Longitude, Latitude] of the user's current location
                    },
                    distanceField: "hotelDetails.distance",  // Store the calculated distance in hotelDetails.distance
                    maxDistance: maxDistance,  // Maximum search radius in meters
                    spherical: true,  // Use spherical geometry for distance calculation
                },
            },
            {
                $sort: {
                    "hotelDetails.priorityIndex": -1,
                    "ratings.averageRating": -1
                }
            },
            {
                $project: {
                    name: 1,  // Include the user name
                    "hotelDetails.name": 1,  // Include the hotel name from hotelDetails
                    "hotelDetails._id": 1,  // Include the hotel id
                    "hotelDetails.distance": 1,  // Include the calculated distance
                    "hotelDetails.location": 1,  // Include the location field
                    "hotelDetails.images.hotelMainImage": 1,
                },
            },
            {
                $group: {
                    _id: "$_id",  // Group by the user's ID (or another unique identifier)
                    name: { $first: "$name" },  // Get the user's name (if needed)
                    hotelDetails: { $push: "$hotelDetails" },  // Reconstruct the hotelDetails array with distance
                },
            },
            {
                // Slice the hotelDetails array to get the first `limit` items based on pagination
                $project: {
                    name: 1,
                    hotelDetails: { $slice: ["$hotelDetails", skip, limit] },  // Skip and limit for pagination
                },
            },
            ]);

            return nearbyHotels;
        } catch (err) {
            console.error("Error finding nearby hotels (from service file):", err);
            return false;
        }
    },
    getApplicationBasicDetails: async () => {
        try {
            const getApplicationBasicDetails = await applicationStaticModel.findOne().select("description heading");
            return getApplicationBasicDetails;
        } catch (err) {
            console.error("Error getApplicationBasicDetails (from service file):", err);
            return false;
        }
    },
    getServiceCategoryDetails: async () => {
        try {
            const getServiceCategoryModel = await serviceCategoryModel.findOne().select("title description main_image");
            return getServiceCategoryModel;
        } catch (err) {
            console.error("Error getApplicationBasicDetails (from service file):", err);
            return false;
        }
    },
    getAddsByCount: async (count) => {
        try {
            const addsByCount = await addsModel.find({})
                                               .sort({createdAt: -1})
                                               .limit(count || 10)
                                               .select("images type tagline")
                                               .toArray();
            return addsByCount;
        } catch (err) {
            console.error("Error getAddsByCount (from service file):", err);
            return false;
        }
    },
    getMainFoodCategoryListByCount: async (count) => {
        try {
            const mainFoodCategoryByCount = await mainFoodCategoryByCount.find({})
                                               .sort({createdAt: -1})
                                               .limit(count || 10)
                                               .select("name description images")
                                               .toArray();
            return mainFoodCategoryByCount;
        } catch (err) {
            console.error("Error getMainFoodCategoryListByCount (from service file):", err);
            return false;
        }
    },
    getSpotlights: async (page, limit) => {
        try {

            const query = {
                role: OWNER,
                "hotelDetails.partnerBrand": true,
            };

            const options = {
                skip: (page - 1) * limit,
                limit: limit
            }

            const spotlights = await userModel.aggregate([
                {
                    $match: query, // Apply filters for users based on role, partnerBrand, etc.
                },
                {
                    $sort: { "hotelDetails.priorityIndex": -1 }, // Sort by priorityIndex in descending order
                },
                {
                    $skip: options.skip, // Pagination: Skip the first 'n' documents
                },
                {
                    $limit: options.limit, // Pagination: Limit the number of documents
                },
                {
                    $lookup: {
                        from: "offers", // Name of the Offer collection
                        localField: "_id", // Match user's `_id` field
                        foreignField: "ownerId", // Field in the Offer collection referencing the user
                        as: "mainOffer", // Output array field to store the main offer
                        pipeline: [
                            {
                                $match: {
                                    mainOffer: true, // Filter offers where mainOffer is true
                                },
                            },
                            {
                                $limit: 1, // Ensure only one offer is retrieved
                            },
                        ],
                    },
                },
                {
                    $unwind: {
                        path: "$mainOffer",
                        preserveNullAndEmptyArrays: true, // Allow users without a main offer
                    },
                },
                {
                    $project: {
                        "hotelDetails.name": 1,
                        "hotelDetails.images.hotelMainImage": 1,
                        "hotelDetails.description": 1,
                        "ratings.averageRating": 1,
                        mainOffer: 1, // Include the single main offer in the output
                    },
                },
            ]);
            
            return mainFoodCategoryByCount;
        } catch (err) {
            console.error("Error getMainFoodCategoryListByCount (from service file):", err);
            return false;
        }
    },
    
}