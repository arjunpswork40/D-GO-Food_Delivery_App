const addsModel = require("../../../models/adds-model");
const applicationStaticModel = require("../../../models/application-static-model");
const foodMainCategory = require("../../../models/food-main-category");
const offer = require("../../../models/offer");
const serviceCategoryModel = require("../../../models/serviceCategory-model");
const userModel = require("../../../models/user-model");
const {OWNER} = require("../../../utils/userRoles")
module.exports = {
    getNearByHotelsWithPaginationAndCurrentLocation: async (userLocation, maxDistance, page, limit) => {
        try {
            
            const options = {
                skip: (page - 1) * limit,
                limit: Number(limit)
            }

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
                    $skip: options.skip, // Pagination: Skip the first 'n' documents
                },
                {
                    $limit: options.limit, // Pagination: Limit the number of documents
                },
                {
                    // Slice the hotelDetails array to get the first `limit` items based on pagination
                    $project: {
                        name: 1,
                        hotelDetails: { $slice: ["$hotelDetails", options.skip, options.limit] },  // Skip and limit for pagination
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

    getOfferDetails: async (page, limit) => {
        try {
            const query = {
                role: OWNER,
            };
    
            const options = {
                skip: (page - 1) * limit,
                limit: Number(limit),
            };

            let offersData = await offer.find()
                                        .skip(options.skip)
                                        .limit(options.limit)
                                        .select("deductionAmount name ownerId mainOffer tag_line")
                                        .populate("ownerId", "name hotelDetails.name hotelDetails.description hotelDetails.images.hotelMainImage");

            return offersData;
        } catch(error) {
            console.error("Error getOfferDetails (from service file):", error);
            return false;
        }
    },

    getHighlightedHotels: async (page, limit) => {
        try {
            const query = {
                role: OWNER,
            };
    
            const options = {
                skip: (page - 1) * limit,
                limit: Number(limit),
            };

            let result = await userModel.aggregate([
                {
                    $match: {
                        "hotelDetails" : {
                            $exists: true
                        }
                    } // Ensure documents have hotelDetails.
                },
                {
                    $sort: {
                        "hotelDetails.partnerBrand": -1, // True (1) comes first, False (0) later
                        "hotelDetails.priorityIndex": 1 // Ascending order of priorityIndex
                    }
                },
                {
                    $skip: options.skip // Skip documents for pagination
                },
                {
                    $limit: options.limit // Limit the number of documents per page
                },
                { 
                    $project: { 
                        "hotelDetails.name": 1,
                        "hotelDetails.images.hotelMainImage": 1,
                        "hotelDetails.description": 1,
                    }
                }
            ]);

            return result;
        } catch(error) {
            console.error("Error getHighlightedHotels (from service file):", error);
            return false;
        }
    },

    getAccountDetails: async(user, page, limit) => {
        try {

            const userData = await userModel.findById(user._id);
            
            let addressData = userData.customerDetails.savedAddresses;

            let finalResult = {
                name: userData.name,
                phone: userData.phone,
                email: userData.email,
                bankDetails: userData.bankDetails,
                address: addressData
            }
            console.log(addressData)

            let totalOrders = userData.customerDetails.orders;

            const startIndex = (page - 1) * limit; // Calculate the starting index
            const endIndex = startIndex + limit;       // Calculate the ending index
            const paginatedOrders =  totalOrders.slice(startIndex, endIndex);  // Slice the array
            finalResult.orders = paginatedOrders;

            return finalResult;
            
        } catch(error) {
            console.error("Error getAccountDetails (from service file):", error);
            return false;
        }
    },

    getHotelByFilter: async (page, limit, userCoordinates, offersNearYou, bestSellers, fastDelivery, sortByRating, sortOrder) => {
        try {
            const query = {
                role: OWNER,
            };
    
            const options = {
                skip: (page - 1) * limit,
                limit: Number(limit),
            };
            console.log(userCoordinates)
            // Aggregation pipeline
            const pipeline = [];

            // GeoNear stage for calculating distance
            if ((offersNearYou === "true" || fastDelivery === "true") && userCoordinates.length > 0) {
                const maxDistance = fastDelivery ? 2000 : 10000; // 2 km for fastDelivery, 10 km for offersNearYou
                const minDistance = offersNearYou ? 5000 : 0; // 5 km for offersNearYou, 0 for fastDelivery

                pipeline.push({
                    $geoNear: {
                        near: {
                            type: "Point",
                            coordinates: userCoordinates, // [longitude, latitude]
                        },
                        distanceField: "distance", // Field to store calculated distance
                        spherical: true, // Perform spherical calculation
                        maxDistance: maxDistance,
                        minDistance: minDistance,
                        key: "hotelDetails.location.coordinates"
                    },
                });
            } else {
                // Match stage for other filters
                pipeline.push({ $match: query });
            }

            // Add sorting
            const sort = {
                "hotelDetails.priorityIndex": -1, // Default sorting by priority index
            };
            if (sortByRating === "true") {
                console.log('p')
                sort["ratings.averageRating"] = -1; // Sort by average rating
            }
            if (sortOrder === "true") {
                sort["hotelDetails.name"] = sortOrder === "a-z" ? 1 : -1; // Sort by name
            }
            if (bestSellers === "true") {
                sort["order.length"] = -1; // Sort by order count
            }

            // Sorting stage
            pipeline.push({ $sort: sort });

            // Add pagination
            pipeline.push({ $skip: options.skip });
            pipeline.push({ $limit: options.limit });

            // Projection stage
            pipeline.push({
                $project: {
                    "hotelDetails.name": 1,
                    "hotelDetails.description": 1,
                    "hotelDetails.images.hotelMainImage": 1,
                    ratings: 1,
                    orderCount: { $size: "$order" }, // Include order count
                    distance: 1, // Include calculated distance
                },
            });

            // Execute the aggregation pipeline
            const result = await userModel.aggregate(pipeline);

            return result;
        } catch(error) {
            console.error("Error getHotelByFilter (from service file):", error);
            return false;
        }
    },

    searchHotelsByKeyword: async (keyword, page, limit, customerLocation) => {
        try {
            const query = {
                role: OWNER,
            };
    
            const options = {
                skip: (page - 1) * limit,
                limit: Number(limit),
            };

            const regex = new RegExp(keyword, "i");
            // Initialize the aggregation pipeline
                const pipeline = [];

                // Conditionally add $geoNear stage if customerLocation.coordinates is provided
                if (customerLocation.coordinates.length > 0) {
                    pipeline.push({
                        $geoNear: {
                            near: {
                                $geometry: {
                                    type: "Point",
                                    coordinates: customerLocation.coordinates, // [longitude, latitude]
                                },
                            },
                            distanceField: "distance", // Field to store the calculated distance
                            spherical: true, // Use spherical geometry
                            key: "hotelDetails.location",
                        },
                    });
                }

        // Add $lookup stage
        pipeline.push({
            $lookup: {
                from: "foods", // The name of the Food collection
                localField: "_id", // The User model's primary key
                foreignField: "hotelId", // The field in Food that links to User
                as: "foodItems", // Output array name for the joined food items
            },
        });

        // Add $unwind stages
        pipeline.push(
            { $unwind: "$foodItems" }, // Unwind the foodItems array from $lookup
            { $unwind: "$foodItems.foodItems" } // Unwind the embedded foodItems array within each food document
        );

        // Add $facet stage for hotels and foodItems
        pipeline.push({
            $facet: {
                restaurants: [
                    {
                        $match: {
                            "hotelDetails.name": { $regex: regex },
                            role: OWNER,
                        },
                    },
                    {
                        $project: {
                            _id: "$_id",
                            restaurantName: "$hotelDetails.name",
                            restaurantDescription: "$hotelDetails.description",
                            location: "$hotelDetails.location",
                            images: "$hotelDetails.images.hotelMainImage",
                            distance: 1, // Include the calculated distance
                        },
                    },
                    { $skip: options.skip }, // Skip documents for pagination
                    { $limit: options.limit }, // Limit the number of documents
                ],
                foodItems: [
                    {
                        $match: {
                            "foodItems.foodItems.name": { $regex: regex }, // Match food item names with the keyword
                        },
                    },
                    {
                        $project: {
                            restaurantId: "$_id",
                            restaurantName: "$hotelDetails.name",
                            foodId: "$foodItems.foodItems._id",
                            foodItemName: "$foodItems.foodItems.name",
                            foodDescription: "$foodItems.foodItems.description",
                            price: "$foodItems.foodItems.price",
                            images: "$foodItems.foodItems.images"
                        },
                    },
                    { $skip: options.skip }, // Skip documents for pagination
                    { $limit: options.limit }, // Limit the number of documents
                ],
            },
        });

        // Execute the aggregation pipeline
        const results = await userModel.aggregate(pipeline);
    
            return results;
        } catch (error) {
            console.error("Error searchHotelsByKeyword (from service file):", error);
            return false;
        }
    },
    
    

    // searchHotelsByKeyword: async (keyword, page, limit, currentLocation) => {
    //     try {
    //         const query = {
    //             role: "owner", // Search only for users with the 'OWNER' role
    //         };
    
    //         const options = {
    //             skip: (page - 1) * limit,
    //             limit: Number(limit),
    //         };
    
    //         const regex = new RegExp(keyword, "i");
    
    //         // MongoDB expects the location as a { type: "Point", coordinates: [longitude, latitude] } format
    //         const location = { 
    //             type: "Point", 
    //             coordinates: currentLocation.coordinates
    //         };
    
    //         const results = await userModel.aggregate([
    //             {
    //                 // First, we add the geoNear stage to calculate distance for hotels
    //                 $geoNear: {
    //                     near: location, // The user's current location
    //                     distanceField: "distance", // The field to store the calculated distance
    //                     spherical: true, // Use spherical geometry for accurate distance calculations
    //                     query: { 
    //                         "role": "owner", // Ensure we only search for owners
    //                         "hotelDetails.name": { $regex: regex }, // Filter hotels by keyword search
    //                         "hotelDetails.location.coordinates" :  { $exists: true }
    //                     },
    //                 },
    //             },
    //             {
    //                 $lookup: {
    //                     from: "foods", // The name of the Food collection
    //                     localField: "_id", // The User model's primary key
    //                     foreignField: "hotelId", // The field in Food that links to User
    //                     as: "foodItems", // Output array name for the joined food items
    //                 },
    //             },
    //             {
    //                 $unwind: "$foodItems", // Unwind the foodItems array from $lookup
    //             },
    //             {
    //                 $unwind: "$foodItems.foodItems", // Unwind the embedded foodItems array within each food document
    //             },
    //             {
    //                 $facet: {
    //                     hotels: [
    //                         {
    //                             $project: {
    //                                 _id: "$_id",
    //                                 hotelName: "$hotelDetails.name",
    //                                 hotelDescription: "$hotelDetails.description",
    //                                 location: "$hotelDetails.location",
    //                                 distance: 1, // Include distance in the result
    //                             },
    //                         },
    //                         { $skip: options.skip }, // Skip documents for pagination
    //                         { $limit: options.limit }, // Limit the number of documents
    //                         {
    //                             $group: {
    //                                 _id: "$_id", // Group by hotel ID
    //                                 hotelName: { $first: "$hotelName" },
    //                                 hotelDescription: { $first: "$hotelDescription" },
    //                                 location: { $first: "$location" },
    //                                 distance: { $first: "$distance" }, // Include the distance in the result
    //                             },
    //                         },
    //                     ],
    //                     foodItems: [
    //                         {
    //                             $match: {
    //                                 "foodItems.foodItems.name": { $regex: regex }, // Match food item names with the keyword
    //                                 role: "owner", // Ensure we only search for owners
    //                             },
    //                         },
    //                         {
    //                             $lookup: {
    //                                 from: "users", // Lookup the hotel owner information
    //                                 localField: "hotelId", // The Food's hotelId field
    //                                 foreignField: "_id", // The User model's primary key
    //                                 as: "hotelOwner", // Name for the output array
    //                             },
    //                         },
    //                         // Unwind the hotel owner information to filter by location and role
    //                         {
    //                             $unwind: "$hotelOwner",
    //                         },
    //                         {
    //                             $match: {
    //                                 "hotelOwner.role": "owner", // Filter by OWNER role of hotel owner
    //                                 "hotelOwner.hotelDetails.location.coordinates": {
    //                                     $geoWithin: { $centerSphere: [location.coordinates, 5 / 3963] }, // Check if the food item is within a 5-mile radius
    //                                 },
    //                             },
    //                         },
    //                         {
    //                             $project: {
    //                                 _id: "$_id",
    //                                 hotelName: "$foodItems.hotelDetails.name",
    //                                 foodItemName: "$foodItems.foodItems.name",
    //                                 foodDescription: "$foodItems.foodItems.description",
    //                                 price: "$foodItems.foodItems.price",
    //                             },
    //                         },
    //                         { $skip: options.skip }, // Skip documents for pagination
    //                         { $limit: options.limit }, // Limit the number of documents
    //                         {
    //                             $group: {
    //                                 _id: "$_id", // Group by hotel ID to avoid duplicate hotels
    //                                 hotelName: { $first: "$hotelName" },
    //                                 foodItemName: { $first: "$foodItemName" },
    //                                 foodDescription: { $first: "$foodDescription" },
    //                                 price: { $first: "$price" },
    //                             },
    //                         },
    //                     ],
    //                 },
    //             },
    //         ]);
    
    //         return results;
    //     } catch (error) {
    //         console.error("Error searchHotelsByKeyword (from service file):", error);
    //         return false;
    //     }
    // },
    
    
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