const addsModel = require("../../../models/adds-model");
const applicationStaticModel = require("../../../models/application-static-model");
const foodMainCategory = require("../../../models/food-main-category");
const offer = require("../../../models/offer");
const serviceCategoryModel = require("../../../models/serviceCategory-model");
const userModel = require("../../../models/user-model");
const OWNER = require("../../../utils/userRoles")
module.exports = {
    getNearByHotelsWithPaginationAndCurrentLocation: async (userLocation, maxDistance, page, limit) => {
        try {
            
            const skip = (page - 1) * limit;

            const nearbyHotels = await userModel.aggregate([
                {
                    $geoNear: {
                        near: {
                            type: "Point",
                            coordinates: userLocation,  // [Longitude, Latitude] of the user's current location
                        },
                        distanceField: "hotelDetails.distance",  // Store the calculated distance in hotelDetails.distance
                        maxDistance: maxDistance,  // Maximum search radius in meters
                        spherical: true,  // Use spherical geometry for distance calculation
                        key: "hotelDetails.location.coordinates", // Specify the 2dsphere index field explicitly
                        query: {
                            role: "owner", // Filter users with role as 'owner'
                        },
                    },
                },
                {
                    // Unwind hotelDetails to deal with individual locations
                    $unwind: "$hotelDetails",
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
    getAllNearByHotels: async (userLocation, maxDistance, page, limit) => {
        try {
            
            const skip = (page - 1) * limit;

            const nearbyHotels = await userModel.aggregate([
                {
                    $geoNear: {
                        near: {
                            type: "Point",
                            coordinates: userLocation,  // [Longitude, Latitude] of the user's current location
                        },
                        distanceField: "hotelDetails.distance",  // Store the calculated distance in hotelDetails.distance
                        maxDistance: maxDistance,  // Maximum search radius in meters
                        spherical: true,  // Use spherical geometry for distance calculation
                        key: "hotelDetails.location.coordinates", // Specify the 2dsphere index field explicitly
                        query: {
                            role: "owner", // Filter users with role as 'owner'
                        },
                    },
                },
                {
                    // Unwind hotelDetails to deal with individual locations
                    $unwind: "$hotelDetails",
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
                        name: 1,  // Include the user name
                        "hotelDetails.name": 1,  // Include the hotel name from hotelDetails
                        "hotelDetails._id": 1,  // Include the hotel id
                        "hotelDetails.distance": 1,  // Include the calculated distance
                        "hotelDetails.location": 1,  // Include the location field
                        "hotelDetails.images.hotelMainImage": 1,
                        mainOffer: 1,
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
                                               .select("images type tagline");
            return addsByCount;
        } catch (err) {
            console.error("Error getAddsByCount (from service file):", err);
            return false;
        }
    },
    getMainFoodCategoryListByCount: async (count) => {
        try {
            const mainFoodCategoryByCountData = await foodMainCategory.find({})
                                               .sort({createdAt: -1})
                                               .limit(count || 10)
                                               .select("name description images");
            return mainFoodCategoryByCountData;
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
                limit: Number(limit)
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
            
            return spotlights;
        } catch (err) {
            console.error("Error getSpotlights (from service file):", err);
            return false;
        }
    },
    getPopularBrands: async (userLocation, maxDistance, page, limit) => {
        try {   
            const skip = (page - 1) * limit;

            const nearbyHotels = await userModel.aggregate([
                {
                    $geoNear: {
                        near: {
                            type: "Point",
                            coordinates: userLocation,  // [Longitude, Latitude] of the user's current location
                        },
                        distanceField: "hotelDetails.distance",  // Store the calculated distance in hotelDetails.distance
                        maxDistance: maxDistance,  // Maximum search radius in meters
                        spherical: true,  // Use spherical geometry for distance calculation
                        key: "hotelDetails.location.coordinates", // Specify the 2dsphere index field explicitly
                        query: {
                            role: "owner", // Filter users with role as 'owner'
                        },
                    },
                },
                {
                    // Unwind hotelDetails to deal with individual locations
                    $unwind: "$hotelDetails",
                },
                {
                    $sort: {
                        "ratings.averageRating": -1
                    }
                },
                {
                    $project: {
                        name: 1,  // Include the user name
                        "hotelDetails.name": 1,  // Include the hotel name from hotelDetails
                        "hotelDetails._id": 1,  // Include the hotel id
                        "hotelDetails.distance": 1,  // Include the calculated distance
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
    getPopularHotels: async (page, limit) => {
        
        const query = {
            role: OWNER,
        };

        const options = {
            skip: (page - 1) * limit,
            limit: Number(limit)
        }
        try {

            const popularHotels = await userModel.aggregate([
                {
                    $match: query, // Apply filters for users based on role, partnerBrand, etc.
                },
                {
                    $sort: { "ratings.averageRating": -1 }, // Sort by averageRating in descending order
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
            return popularHotels;
        } catch (err) {
            console.error("Error getMainFoodCategoryListByCount (from service file):", err);
            return false;
        }
    },
    getOffersWithHotelDetails: async (page, limit) => {
        try {
            // Convert limit and page to numbers to avoid BSON error
            limit = Number(limit); // Ensure limit is a number
            page = Number(page); // Ensure page is a number
    
            // Calculate the number of documents to skip for pagination
            const skip = (page - 1) * limit;
    
            // Fetch offers with the specified user role
            const offersData = await offer.find()
                .sort({ deductionAmount: -1 }) // Sort by highest deduction amount
                .skip(skip) // Skip documents for pagination
                .limit(limit) // Limit the number of results per page
                .populate({
                    path: 'ownerId', // Populate ownerId with hotel details from userModel model
                    match: { role: 'owner' }, // Filter users by role
                    select: 'hotelDetails.name hotelDetails.description hotelDetails.location hotelDetails.images.hotelMainImage role', // Specify fields to include
                })
                .lean(); // Optimize query performance
    
            // Filter out offers where no matching user was found (due to role mismatch)
            const filteredOffers = offersData.filter((offer) => offer.ownerId);
    
            // Count total matching offers
            const totalDocuments = await offer.countDocuments()
                .populate({
                    path: 'ownerId',
                    match: { role: 'owner' },
                });
    
            // Prepare pagination metadata
            const totalPages = Math.ceil(totalDocuments / limit);
    
            return {
                currentPage: page,
                totalPages,
                limit,
                totalDocuments,
                offers: filteredOffers,
            };
        } catch (err) {
            console.error("Error fetching offers with hotel details:", err);
            return {
                currentPage: page,
                totalPages: 0,
                limit,
                totalDocuments: 0,
                offers: [],
            };
        }
    },
    
}