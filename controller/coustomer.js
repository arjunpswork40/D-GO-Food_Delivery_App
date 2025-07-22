const applicationStaticModel = require("../models/application-static-model");
const Food = require("../models/food-model");
const serviceCategoryModel = require("../models/serviceCategory-model");
const User = require("../models/user-model")
const OfferModel = require("../models/offer")
const { makeJsonResponse } = require("../utils/response");
const mongoose = require("mongoose");
const { BCRYPT_SALT } = require("../config/index");
const bcrypt = require("bcrypt");
const Cart = require("../models/cart-model");
const Order = require("../models/order-model");
const FoodMainCategory = require("../models/food-main-category")

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
const nodemailer = require("nodemailer");


const { USER_TYPES } = require("../constants/user/user-constants");

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
  }
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

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
      const result = await searchHotelsByKeyword(keyword, page, limit, user?.customerDetails?.currentLocation);

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
      let restaurantList = await getHotelByFilter(page, limit, user?.customerDetails?.currentLocation.coordinates, offersNearYou, bestSellers, fastDelivery, sortByRating, sortOrder);
      let favoriteRestaurantIds = await User.findById(user?._id, "customerDetails.favoriteRestaurants").lean();
      favoriteRestaurantIds = favoriteRestaurantIds?.customerDetails.favoriteRestaurants || [];
      console.log(favoriteRestaurantIds)
      restaurantList = restaurantList ? restaurantList.map(item => ({
          _id: item._id,
          image: item.hotelDetails.images.hotelMainImage[0],
          name: item.hotelDetails.name,
          description: item.hotelDetails.description,
          ratings: item.ratings.averageRating,
          orderCount: item.orderCount,
          isFavorite: favoriteRestaurantIds.map(id => id.toString()).includes(item._id.toString()) // Add isFavorite flag
      })) : [];

      highlightedRestaurants = highlightedRestaurants.map(item => ({
          _id: item._id,
          image: item.hotelDetails.images.hotelMainImage[0],
          name: item.hotelDetails.name,
          description: item.hotelDetails.description,
          isFavorite: favoriteRestaurantIds.map(id => id.toString()).includes(item._id.toString()) // Add isFavorite flag

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

        if(foodItems && foodItems.foodItems.length > 0) {
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

   static async deActivateAccount(req, res, next) {
     const user = req.user;

        // Validate if the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(user._id)) {
            return res.status(400).json(makeJsonResponse('Validation Error', {}, { message: "Please give a valid ID" }, 400, false));
        }

        try {
            // Fetch the user by id and check if the role is 'customer'
            const customer = await User.findOne({ _id: user._id, role: 'customer' }, "_id").lean();


            // Check if the user exists
            if (!customer) {
                return res.status(404).json(makeJsonResponse('User not found', {}, { message: "No user found with the provided ID" }, 404, false));
            }


            // Perform the deletion
            const deletedUser = await User.findByIdAndDelete(customer._id);
            // Delete cart data for this user
            await Cart.deleteMany({ userId: customer._id });

            await Order.deleteMany({ userId: customer._id });

            // Check if the deletion was successful
            if (!deletedUser) {
                return res.status(500).json(makeJsonResponse('Error', {}, { message: "Failed to delete the user" }, 500, false));
            }

            // Send success response
            return res.status(200).json(makeJsonResponse('User deleted', { message: "User has been successfully deleted" }, {}, 200, false));

        } catch (err) {
            console.error(err);
            return res.status(500).json(makeJsonResponse('Server Error', {}, { message: "An error occurred while deleting the user" }, 500, false));
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

  static async getFoodByCategory(req, res, next) {
    try {
      const { categoryId } = req.params;
      const { page = 1, limit = 10 } = req.query;

              // 1. Fetch the category name using the ID
        const categoryDoc = await FoodMainCategory.findById(categoryId);
        if (!categoryDoc) {
            return res.status(404).json({ message: "Category not found" });
        }
        const categoryName = categoryDoc.name;

        // 2. Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

         // 3. Aggregate foodItems matching the category name
        const results = await Food.aggregate([
            { $unwind: "$foodItems" },  // Unwind foodItems array
            { $match: { "foodItems.category": categoryName } },
            {
                $lookup: {
                    from: "users", // collection name of the User model
                    localField: "hotelId", // field in Food
                    foreignField: "_id", // field in User
                    as: "userData"
                }
            },
             { $unwind: "$userData" }, 
            {
                $project: {
                    _id: 0,
                    hotelId: 1,
                    foodItem: "$foodItems",
                    user: {
                        userName: "$userData.name", // adjust according to fields in User
                        email: "$userData.email",
                        phone: "$userData.phone",
                        restaurantName: "$userData.hotelDetails.name"
                    }
                }
            },
            { $skip: skip },
            { $limit: parseInt(limit) }
        ]);


      return res.status(200).json(makeJsonResponse('Food items under ' + categoryName, { results,currentPage: parseInt(page),limit: parseInt(limit) }, {}, 200, true));
    } catch (error) {
      console.error(`getFoodByCategory:2 ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('getFoodByCategory', {}, { message: error.message || "getFoodByCategory" }, 500, false));
    }
  }

  static async getHomeDetails(req, res, next) {
    const page = Number(req.params.page || 1);
    const limit = Number(req.params.limit || 10);
    const lat = parseFloat(req.query.lat ?? 38.7169);  // Lisbon's latitude
    const lng = parseFloat(req.query.lng ?? -9.1399); // Lisbon's longitude
    console.log(`Page: ${page}, Limit: ${limit}, Lat: ${lat}, Lng: ${lng}`);
    try {
      const user = req.user;
      console.log("Loc:::=>",user?.customerDetails.currentLocation.coordinates)
      const applicationDetails = await getApplicationBasicDetails();
      const serviceCategoryDetails = await getServiceCategoryDetails();
      const maxDistance = process.env.NEAR_BY_MAX_DISTANCE || "5000";
      let topPicks = [];
      let allRestaurantsNearBy = [];
      let popularBrands = [];
      try {
        if (user?.customerDetails.currentLocation.coordinates) {
          // fetching hotel by priority index, location and rating
          topPicks = await getNearByHotelsWithPaginationAndCurrentLocation(user.customerDetails.currentLocation.coordinates, Number(maxDistance), page, limit)

          // fetching hotels along with offer details based on currentLocation of user
          allRestaurantsNearBy = await getAllNearByHotels(user.customerDetails.currentLocation.coordinates, Number(maxDistance), page, limit)

          popularBrands = await getPopularBrands(user.customerDetails.currentLocation.coordinates, Number(maxDistance), page, limit);

        } else {
          // If no current location is set, fetch all hotels without location filter
          topPicks = await getNearByHotelsWithPaginationAndCurrentLocation([lng,lat], Number(maxDistance), page, limit);
          allRestaurantsNearBy = await getAllNearByHotels([lng,lat], Number(maxDistance), page, limit);
          popularBrands = await getPopularBrands([lng,lat], Number(maxDistance), page, limit);
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

  static async changePassword(req, res, next) { 
    const { 
      currentPassword,
      newPassword,
      confirmPassword
     } = req.body;
    const user = req.user;
    try {

      if( user.role !== USER_TYPES.CUSTOMER) {
        return res.status(400).json(makeJsonResponse('User not found', {}, { email: user.email }, 400, false)); 
      }
      const userData = await userModel.findById(user._id);
      if(!userData) {
        return res.status(400).json(makeJsonResponse('User not found', {}, { email: user.email }, 400, false));
      }

      const isMatch = bcrypt.compareSync(currentPassword, userData.password);
      if (!isMatch) {
        return res.status(400).json(makeJsonResponse('Current password is incorrect', {}, { email: user.email }, 400, false));
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json(makeJsonResponse('New passwords do not match', {}, { email: user.email }, 400, false));
      }

      userData.password = bcrypt.hashSync(newPassword, BCRYPT_SALT);
      await userData.save();

      return res.status(200).json(makeJsonResponse('Password updated successfully', { email: user.email }, {}, 200, true));
  
    } catch (error) {
      console.log(error)
      console.error(`Error foods:4 ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error4', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }

  static async forgotPassword(req, res, next) {
    const { email, role } = req.body;

    try {
      const user = await User.findOne({ email, role });

      if (!user) {
        return res.status(404).json(makeJsonResponse('User not found',  { email }, {}, 404, false));
      }
  
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 mins
  
      await User.updateOne({ email, role }, { forgot_password_otp:otp, otpExpires });
  
      const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Password Reset OTP",
          text: `Your OTP for password reset is ${otp}. It will expire in 10 minutes.`
      };
  
      transporter.sendMail(mailOptions, (err, info) => {
        console.log(err)
          if (err) return res.status(500).json({ message: "Error sending email" });
          return res.status(200).json(makeJsonResponse('Password Reset OTP send successfuly',  { email }, {}, 200, true));
      });
  
  
    }
    catch (error) { 
      console.error(`Error foods:5 ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error5', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }

  static async resetPassword(req, res, next) {
    const { email, otp, newPassword, role } = req.body;
    try {
      const user = await User.findOne({ email, role });
      console.log(user.otp !== otp );

      if (!user || user.forgot_password_otp !== Number(otp) || new Date() > user.otpExpires) {
          return res.status(401).json(makeJsonResponse('Invalid or expired OTP',  { email,otp }, {}, 401, false));
          
      }
  
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.updateOne({ email, role }, { password: hashedPassword, otp: null, otpExpires: null });
  
      return res.status(200).json(makeJsonResponse('Password updated successfully',  { email,otp }, {}, 200, true));
  
  
    }
    catch (error) { 
      console.error(`Error foods:5 ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error5', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }

  static async getOffers(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.params;
      const skip = (page - 1) * limit;

      const offers = await OfferModel.find()
        .skip(skip)
        .limit(parseInt(limit))
        .populate({
          path: 'ownerId',
          select: 'name email phone hotelDetails', // Specify the fields to fetch from the user model
        })
        .lean();

      // Rename ownerId to restaurantDetails in the resulting offers
      offers.forEach(offer => {
        if (offer.ownerId) {
          offer.restaurantDetails = offer.ownerId;
          delete offer.ownerId;
        }
      });

      const totalOffers = await OfferModel.countDocuments();

      const totalPages = Math.ceil(totalOffers / limit);

      return res.status(200).json(
        makeJsonResponse(
          'Offers fetched successfully',
          {
            offers,
            pagination: {
              currentPage: page,
              limit,
              totalItems: totalOffers,
              totalPages,
            },
          },
          {},
          200,
          true
        )
      );
    } catch (error) {
      console.error(`Error fetching offers: ${error.code || ''} - ${error.message}`);
      return res.status(500).json(
        makeJsonResponse('Internal Error', {}, { message: error.message || 'Internal error occurred' }, 500, false)
      );
    }
  }

  static async getOfferById(req, res, next) {
    try {
      const { offerId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(offerId)) {
        return res.status(400).json(
          makeJsonResponse('Invalid Offer ID', {}, { message: 'The provided offer ID is not valid' }, 400, false)
        );
      }

      const offer = await OfferModel.findById(offerId)
        .populate({
          path: 'ownerId',
          select: 'name email phone hotelDetails', // Specify the fields to fetch from the user model
        })
        .lean();

      if (!offer) {
        return res.status(404).json(
          makeJsonResponse('Offer not found', {}, { message: 'No offer found with the provided ID' }, 404, false)
        );
      }

      // Rename ownerId to restaurantDetails in the resulting offer
      if (offer.ownerId) {
        offer.restaurantDetails = offer.ownerId;
        delete offer.ownerId;
      }

      return res.status(200).json(
        makeJsonResponse(
          'Offer fetched successfully',
          { offer },
          {},
          200,
          true
        )
      );
    } catch (error) {
      console.error(`Error fetching offer by ID: ${error.code || ''} - ${error.message}`);
      return res.status(500).json(
        makeJsonResponse('Internal Error', {}, { message: error.message || 'Internal error occurred' }, 500, false)
      );
    }
  }
  static async addOrRemoveFromFavoriteList(req, res, next) {
    const user = req.user;
    const { restaurantId } = req.body;

    if (user.role !== USER_TYPES.CUSTOMER) {
      return res.status(403).json(makeJsonResponse('Forbidden', {}, { message: 'User is not authorized to perform this action' }, 403, false));
    }

    const restaurantOwner = await User.findById(restaurantId);
    
    if (!restaurantOwner || restaurantOwner.role !== USER_TYPES.OWNER) {
      return res.status(403).json(makeJsonResponse('Forbidden', {}, { message: 'User is not authorized to perform this action' }, 403, false));
    }
    try {
      const userData = await User.findById(user._id);

      if (!userData) {
          return res.status(401).json(makeJsonResponse('User not found',  { email,otp }, {}, 401, false));
      }
      
      const { restaurantId } = req.body;

      if (!restaurantId) {
        return res.status(400).json(makeJsonResponse('Restaurant ID is required', {}, {}, 400, false));
      }

      const favoriteRestaurants = userData.customerDetails.favoriteRestaurants || [];
      const restaurantIndex = favoriteRestaurants.indexOf(restaurantId);

      if (restaurantIndex > -1) {
        // If restaurantId exists, remove it
        favoriteRestaurants.splice(restaurantIndex, 1);
      } else {
        // If restaurantId does not exist, add it
        favoriteRestaurants.push(restaurantId);
      }

      userData.customerDetails.favoriteRestaurants = favoriteRestaurants;
      await userData.save();

      const favoriteRestaurantsDetails = await User.find(
        { _id: { $in: favoriteRestaurants } },
        { name: 1, email: 1, phone: 1, hotelDetails: 1 } // Specify the fields you want to retrieve
      ).lean();

      return res.status(200).json(makeJsonResponse('Favorite list updated successfully', { favoriteRestaurantsDetails }, {}, 200, true));

    }
    catch (error) { 
      console.error(`Error foods:5 ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error5', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }

  static async getFavoriteList(req, res, next) {
    const user = req.user;

    if (user.role !== USER_TYPES.CUSTOMER) {
      return res.status(403).json(makeJsonResponse('Forbidden', {}, { message: 'User is not authorized to perform this action' }, 403, false));
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    try {
      const userData = await User.findById(user._id).populate({
          path: 'customerDetails.favoriteRestaurants',
          select: 'name email phone hotelDetails', // Specify the fields to fetch
          options: {
        skip: parseInt(skip),
        limit: parseInt(limit)
          }
      });

      if (!userData) {
      return res.status(404).json(makeJsonResponse('User not found', {}, {}, 404, false));
      }

      const favoriteRestaurants = userData.customerDetails.favoriteRestaurants;

      const totalFavorites = await User.countDocuments({
        _id: { $in: user.customerDetails.favoriteRestaurants }
        });

      const totalPages = Math.ceil(totalFavorites / limit);

      return res.status(200).json(makeJsonResponse('Favorite list fetched successfully', {
      favoriteRestaurants,
      pagination: {
        currentPage: page,
        limit,
        totalItems: totalFavorites,
        totalPages
      }
      }, {}, 200, true));
    } catch (error) {
      console.error(`Error fetching favorite list: ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false));
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
        lat: body.lat,
        primaryAddress: body.primaryAddress || false
      }
      const userData = await userModel.findById(user._id);

      if (!userData) {
        return res.status(400).json(makeJsonResponse('Failed', {}, { message: "User not found", data: body }, 400, false));
      }

      if (body.primaryAddress) {
        // If primaryAddress is true, set all other addresses' primaryAddress to false
        userData.customerDetails.savedAddresses.forEach(addr => {
          addr.primaryAddress = false;
        });
      }

      if (body._id) {
        // If _id exists, find the address by _id and update it
        const existingAddress = userData.customerDetails.savedAddresses.id(address._id);

        if (existingAddress) {
          // Update the fields of the existing address
          Object.assign(existingAddress, address);
        } else {
          return res.status(400).json(makeJsonResponse('Failed', {}, { message: "Address with the provided _id not found", data: body }, 400, false));
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

  static async CustomeraddressDelete(req, res, next) {
    const { body } = req;
    const { user } = req;
    try {
      const addressId = body.addressId;
      const userData = await userModel.findById(user._id);

      if (!userData) {
        return res.status(400).json(makeJsonResponse('Failed', {}, { message: "User not found", data: body }, 400, false));
      }

      const addressIndex = userData.customerDetails.savedAddresses.findIndex(addr => addr._id.toString() === addressId);

      if (addressIndex === -1) {
        return res.status(400).json(makeJsonResponse('Failed', {}, { message: "Address not found", data: body }, 400, false));
      }

      userData.customerDetails.savedAddresses.splice(addressIndex, 1);

      const updatedUser = await userData.save();

      return res.status(200).json(
        makeJsonResponse(
          'Address deleted successfully',
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