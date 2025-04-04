const User = require("../models/user-model");
const mongoose = require('mongoose');
const { makeJsonResponse } = require("../utils/response");
const userModel = require("../models/user-model");
const { USER_TYPES } = require("../constants/user/user-constants");
const bcrypt = require("bcrypt");
const { BCRYPT_SALT } = require("../config/index");
const foodModel = require("../models/food-model");
const { getHomeDetailsWithOrderData } = require("./services/owner/home-details-service");
const { getAllFoodList,getAvailableAllFoodList,getUnAvailableAllFoodList,removeFoodItemByOwnerAction } = require("./services/food/food-service");
const nodemailer = require("nodemailer");


// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
  }
});
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

class Owner {

    // static async userProfile(req, res, next) {
    //     const { id } = req.params;

    //     // Validate if the ID is a valid MongoDB ObjectId
    //     if (!mongoose.Types.ObjectId.isValid(id)) {
    //         return res.status(400).json(makeJsonResponse('Validation Error', {}, { message: "Please give a valid ID" }, 400, false));
    //     }

    //     try {
    //         // Find the user and select only 'name' and 'email', convert to plain object with .lean()
    //         const owner = await User.findOne({_id:id,role:'owner'}, "name email phone address role hotelDetails bankDetails ratings status").lean();

    //         // Check if the user exists
    //         if (!owner) {
    //             return res.status(404).json(makeJsonResponse('User not found', {}, { message: "No user found with the provided ID" }, 404, false));
    //         }

    //         // Send the response
    //         return res.status(200).json(makeJsonResponse('Owner profile', { message: "Profile details", data: owner }, {}, 200, false));

    //     } catch (err) {
    //         console.error(err);
    //         return res.status(500).json(makeJsonResponse('Server Error', {}, { message: "An error occurred while fetching the profile" }, 500, false));
    //     }
    // }

    static async deleteUser(req, res, next) {
        const { id } = req.params;

        // Validate if the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json(makeJsonResponse('Validation Error', {}, { message: "Please give a valid ID" }, 400, false));
        }

        try {
            // Fetch the user by id and check if the role is 'owner'
            const owner = await User.findOne({ _id: id, role: 'owner' }, "_id").lean();


            // Check if the user exists
            if (!owner) {
                return res.status(404).json(makeJsonResponse('User not found', {}, { message: "No user found with the provided ID" }, 404, false));
            }


            // Perform the deletion
            const deletedUser = await User.findByIdAndDelete(owner._id);

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

    static async updateBankDetails(req, res, next) {
        const {
            bankDetailsAccountName,
            bankDetailsAccountNumber,
            bankDetailsBankName,
            bankDetailsIfscCode
        } = req.body

        const user = req.user;

        try {
            const updateData = {
                bankDetails: {
                    accountName: bankDetailsAccountName,
                    accountNumber: bankDetailsAccountNumber,
                    bankName: bankDetailsBankName,
                    ifscCode: bankDetailsIfscCode,
                },
            }

            const updatedUser = await userModel.findByIdAndUpdate(
                user._id,
                {
                    $set: updateData
                },
                {
                    new: true,
                    runValidators: true
                }
            )

            if (!updatedUser) {
                console.log('User not found');
                return res.status(404).json(
                    makeJsonResponse(
                        'User Not Found',
                        {
                            message: "User not found"
                        },
                        {},
                        404,
                        false
                    )
                );
            }
            return res.status(200).json(
                makeJsonResponse(
                    'Success',
                    {
                        message: "Hotel owner's bank detail updated successfuly",
                        data: updateData,
                        user: {
                            name: user.name,
                            _id: user._id
                        }
                    },
                    {},
                    200,
                    true
                )
            );
        } catch (error) {
            console.log("error in updateBankDetails(controller) :: ", error)
            return res.status(500).json(
                makeJsonResponse(
                    'Error',
                    {
                        message: error.message || "Internal error occurred",
                    },
                    {},
                    500,
                    false
                )
            );
        }
    }
    static async updateRestaurantDetails(req, res, next) {
        const {
            hotelName,
            hotelDescription,
            hotelLocationAddress,
            hotelLocationCity,
            hotelLocationState,
            hotelLocationCountry,
            hotelLocationZipCode,
            hotelLocationCoordinatesLat,
            hotelLocationCoordinatesLng,
            hotelContactNumber,
            closingHours,
            openingHours,
        } = req.body;

        const hotelImages = req.files?.hotelImages?.map(item => item.path) || [];
        const menuImages = req.files?.menuImages?.map(item => item.path) || [];
        const hotelMainImage = req.files?.hotelMainImage?.map(item => item.path) || [];

        const user = req.user;

        try {
            // Fetch the existing user document
            const existingUser = await userModel.findById(user._id);
            if (!existingUser) {
                console.log('User not found');
                return res.status(404).json(
                    makeJsonResponse(
                        'User Not Found',
                        { message: "User not found" },
                        {},
                        404,
                        false
                    )
                );
            }

            // Merge existing and new images
            const updatedHotelImages = [...(existingUser.hotelDetails?.images?.hotelImages || []), ...hotelImages];
            const updatedMenuImages = [...(existingUser.hotelDetails?.images?.menuImages || []), ...menuImages];
            const updatedMainImage = [...(existingUser.hotelDetails?.images?.hotelMainImage || []), ...hotelMainImage];

            // Prepare update data
            const updateData = {
                hotelDetails: {
                    name: hotelName || existingUser.hotelDetails?.name,
                    description: hotelDescription || existingUser.hotelDetails?.description,
                    location: {
                        address: hotelLocationAddress || existingUser.hotelDetails?.location?.address,
                        city: hotelLocationCity || existingUser.hotelDetails?.location?.city,
                        state: hotelLocationState || existingUser.hotelDetails?.location?.state,
                        country: hotelLocationCountry || existingUser.hotelDetails?.location?.country,
                        zipcode: hotelLocationZipCode || existingUser.hotelDetails?.location?.zipcode,
                        type: "Point",
                        coordinates: [
                            parseFloat(hotelLocationCoordinatesLat || existingUser.hotelDetails?.location?.coordinates?.lat),
                            parseFloat(hotelLocationCoordinatesLng || existingUser.hotelDetails?.location?.coordinates?.lng),
                        ],
                    },
                    contactNumber: hotelContactNumber || existingUser.hotelDetails?.contactNumber,
                    openingHours: {
                        open: openingHours || existingUser.hotelDetails?.openingHours?.open,
                        close: closingHours || existingUser.hotelDetails?.openingHours?.close,
                    },
                    images: {
                        hotelImages: updatedHotelImages,
                        menuImages: updatedMenuImages,
                        hotelMainImage: updatedMainImage,
                    },
                },
            };

            // Update user document
            const updatedUser = await userModel.findByIdAndUpdate(
                user._id,
                { $set: updateData },
                { new: true, runValidators: true }
            );

            if (!updatedUser) {
                console.log('User not found');
                return res.status(404).json(
                    makeJsonResponse(
                        'User Not Found',
                        { message: "User not found" },
                        {},
                        404,
                        false
                    )
                );
            }

            return res.status(200).json(
                makeJsonResponse(
                    'Success',
                    {
                        message: "Hotel details updated successfully",
                        data: updateData,
                        user: {
                            name: user.name,
                            _id: user._id,
                        },
                    },
                    {},
                    200,
                    true
                )
            );
        } catch (error) {
            console.log("Error in updateHotelDetails(controller) :: ", error);
            return res.status(500).json(
                makeJsonResponse(
                    'Error',
                    { message: error.message || "Internal error occurred" },
                    {},
                    500,
                    false
                )
            );
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

            if (user.role !== USER_TYPES.OWNER) {
                return res.status(400).json(makeJsonResponse('User not found', {}, { email: user.email }, 400, false));
            }
            const userData = await userModel.findById(user._id);
            if (!userData) {
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
      
          await User.updateOne({ email }, { forgot_password_otp:otp, otpExpires });
      
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
          await User.updateOne({ email }, { password: hashedPassword, otp: null, otpExpires: null });
      
          return res.status(200).json(makeJsonResponse('Password updated successfully',  { email,otp }, {}, 200, true));
      
      
        }
        catch (error) { 
          console.error(`Error foods:5 ${error.code} - ${error.message}`);
          return res.status(500).json(makeJsonResponse('Internal Error5', {}, { message: error.message || "Internal error occurred" }, 500, false));
        }
      }

    static async profileDetails(req, res, next) {

        const user = req.user;

        if (user.role !== USER_TYPES.OWNER) {
            return res.status(400).json(makeJsonResponse('User not found', {}, { email: user.email }, 400, false));
        }
        try {
            const userData = await userModel.findById(user._id).select('name email phone profile_image').lean();
            if (!userData) {
                return res.status(400).json(makeJsonResponse('User not found', {}, { email: user.email }, 400, false));
            }
            return res.status(200).json(makeJsonResponse('User details', { ...userData }, {}, 200, true));
        } catch (error) {
            console.error(`Error foods:4 ${error.code} - ${error.message}`);
            return res.status(500).json(makeJsonResponse('Internal Error4', {}, { message: error.message || "Internal error occurred" }, 500, false));
        }
    }

    static async restaurantDetails(req, res, next) {

        const user = req.user;

        if (user.role !== USER_TYPES.OWNER) {
            return res.status(400).json(makeJsonResponse('Restaurant details not found', {}, { email: user.email }, 400, false));
        }
        try {
            const userData = await userModel.findById(user._id).select('hotelDetails.name hotelDetails.description hotelDetails.location hotelDetails.contactNumber hotelDetails.openingHours hotelDetails.images ratings').lean();
            if (!userData) {
                return res.status(400).json(makeJsonResponse('Restaurant details not found', {}, { email: user.email }, 400, false));
            }
            const finalResult = {
                name: userData.hotelDetails.name,
                description: userData.hotelDetails.description,
                location: userData.hotelDetails.location,
                contactNumber: userData.hotelDetails.contactNumber,
                openingHours: userData.hotelDetails.openingHours,
                images: userData.hotelDetails.images,
                ratings: userData.ratings
            };
            return res.status(200).json(makeJsonResponse('Restaurant details details', { ...finalResult }, {}, 200, true));
        } catch (error) {
            console.error(`Error foods:4 ${error.code} - ${error.message}`);
            return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false));
        }
    }

    static async bankDetails(req, res, next) {

        const user = req.user;

        if (user.role !== USER_TYPES.OWNER) {
            return res.status(400).json(makeJsonResponse('Bank details not found', {}, { email: user.email }, 400, false));
        }
        try {
            const userData = await userModel.findById(user._id).select('bankDetails email name phone').lean();
            if (!userData) {
                return res.status(400).json(makeJsonResponse('Bank details not found', {}, { email: user.email }, 400, false));
            }
            return res.status(200).json(makeJsonResponse('Bank details', { bankDetails: userData }, {}, 200, true));
        } catch (error) {
            console.error(`Error foods:4 ${error.code} - ${error.message}`);
            return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false));
        }
    }

    static async addFoodByOwner(req, res, next) {
        const files = req.files;
        const user = req.user;
        if (user.role !== USER_TYPES.OWNER) {
            return res.status(400).json(makeJsonResponse('Owner can only add food', {}, { email: user.email }, 400, false));
        }

        const { name, description, available, category, price } = req.body;
        try {
            const food = {
                name,
                description,
                available,
                category,
                price,
                images: files?.foodImage?.map(item => item.path) || []
            }

            let updateFood = await foodModel.findOneAndUpdate(
                { hotelId: user._id },
                {
                    $push: { foodItems: food }
                },
                {
                    new: true,
                    runValidators: true
                }
            );

            if (!updateFood) {
                // If no foodModel entry found, create a new one
                updateFood = new foodModel({
                    hotelId: user._id,
                    foodItems: [food]
                });
                await updateFood.save();
            }

            const addedFood = updateFood.foodItems[updateFood.foodItems.length - 1];

            return res.status(200).json(
                makeJsonResponse(
                    'Food added successfully',
                    {
                        foodDetails: addedFood,
                        user: {
                            name: user.name,
                            _id: user._id,
                            email: user.email
                        }
                    },
                    {},
                    200,
                    true
                )
            );
        } catch (error) {
            console.log("error in addFoodByOwner(controller) :: ", error)
            return res.status(500).json(
                makeJsonResponse(
                    'Error',
                    { message: error.message || "Internal error occurred" },
                    {},
                    500,
                    false
                )
            );
        }
    }

    static async homeDetails(req, res, next) {
        const user = req.user;
        if (user.role !== USER_TYPES.OWNER) {
            return res.status(400).json(makeJsonResponse('Owner can only access this data', {}, { email: user.email }, 400, false));
        }

        try {
            const latestUserDetails = await getHomeDetailsWithOrderData(user);
            if (!latestUserDetails.status) {
                return res.status(400).json(makeJsonResponse('Home details not found', {}, { email: user.email }, 400, false));
            }
            return res.status(200).json(makeJsonResponse('Home details', { ...latestUserDetails.data }, {}, 200, true));
        } catch (error) {
            console.log("error in homeDetails(controller) :: ", error)
            return res.status(500).json(
                makeJsonResponse(
                    'Error',
                    { message: error.message || "Internal error occurred" },
                    {},
                    500,
                    false
                )
            );
        }
    }

    static async getFoodList(req, res, next) {
        
        const user = req.user;
        const page = parseInt(req.params.page) || 1;
        const limit = parseInt(req.params.limit) || 10;
        const skip = (page - 1) * limit;

        if (user.role !== USER_TYPES.OWNER) {
            return res.status(400).json(makeJsonResponse('Owner can only access this data', {}, { email: user.email }, 400, false));
        }

        try {
            const foddList = await getAllFoodList(user._id, skip, limit);
            if (!foddList.status) {
                return res.status(400).json(makeJsonResponse('Home details not found', {}, { email: user.email }, 400, false));
            }
            return res.status(200).json(makeJsonResponse('Home details', { ...foddList.data[0] }, {}, 200, true));
        } catch (error) {
            console.log("error in homeDetails(controller) :: ", error)
            return res.status(500).json(
                makeJsonResponse(
                    'Error',
                    { message: error.message || "Internal error occurred" },
                    {},
                    500,
                    false
                )
            );
        }
    }

    static async getAvailableFoodList(req, res, next) {
        
        const user = req.user;
        const page = parseInt(req.params.page) || 1;
        const limit = parseInt(req.params.limit) || 10;
        const skip = (page - 1) * limit;

        if (user.role !== USER_TYPES.OWNER) {
            return res.status(400).json(makeJsonResponse('Owner can only access this data', {}, { email: user.email }, 400, false));
        }

        try {
            const foddList = await getAvailableAllFoodList(user._id, skip, limit);
            if (!foddList.status) {
                return res.status(400).json(makeJsonResponse('Available foods details not found', {}, { email: user.email }, 400, false));
            }
            return res.status(200).json(makeJsonResponse('Available food details', { ...foddList.data[0] }, {}, 200, true));
        } catch (error) {
            console.log("error in getAvailableFoodList(controller) :: ", error)
            return res.status(500).json(
                makeJsonResponse(
                    'Error',
                    { message: error.message || "Internal error occurred" },
                    {},
                    500,
                    false
                )
            );
        }
    }

    static async getUnAvailableFoodList(req, res, next) {
        
        const user = req.user;
        const page = parseInt(req.params.page) || 1;
        const limit = parseInt(req.params.limit) || 10;
        const skip = (page - 1) * limit;

        if (user.role !== USER_TYPES.OWNER) {
            return res.status(400).json(makeJsonResponse('Owner can only access this data', {}, { email: user.email }, 400, false));
        }

        try {
            const foddList = await getUnAvailableAllFoodList(user._id, skip, limit);
            if (!foddList.status) {
                return res.status(400).json(makeJsonResponse('Unavailable foods not found', {}, { email: user.email }, 400, false));
            }
            return res.status(200).json(makeJsonResponse('Unavailable food details', { ...foddList.data[0] }, {}, 200, true));
        } catch (error) {
            console.log("error in getUnAvailableFoodList(controller) :: ", error)
            return res.status(500).json(
                makeJsonResponse(
                    'Error',
                    { message: error.message || "Internal error occurred" },
                    {},
                    500,
                    false
                )
            );
        }
    }

    static async removeFoodItemByOwner(req, res, next) {
        
        const user = req.user;
        const foodId = req.body.foodId;

        if (user.role !== USER_TYPES.OWNER) {
            return res.status(400).json(makeJsonResponse('Owner can only remove food from his list', {}, { email: user.email }, 400, false));
        }

        try {
            const foddList = await removeFoodItemByOwnerAction(user._id, foodId);
            if (!foddList.status) {
                return res.status(400).json(makeJsonResponse('food not found', {}, { email: user.email }, 400, false));
            }
            return res.status(200).json(makeJsonResponse('Food removed successfuly', { ...foddList.data }, {}, 200, true));
        } catch (error) {
            console.log("error in removeFoodItemByOwner(controller) :: ", error)
            return res.status(500).json(
                makeJsonResponse(
                    'Error',
                    { message: error.message || "Internal error occurred" },
                    {},
                    500,
                    false
                )
            );
        }
    }

    static async updateFoodItemByOwner(req, res, next) {
        const user = req.user;
        const { foodId, name, description, available, category, price } = req.body;
        const images = req.files.foodImages?.map(item => item.path) || [];

        if (user.role !== USER_TYPES.OWNER) {
            return res.status(400).json(makeJsonResponse('Owner can only update food from his list', {}, { email: user.email }, 400, false));
        }

        try {
            const foodItem = await foodModel.findOneAndUpdate(
                { hotelId: user._id, "foodItems._id": foodId },
                {
                    $set: {
                        "foodItems.$.name": name,
                        "foodItems.$.description": description,
                        "foodItems.$.available": available,
                        "foodItems.$.category": category,
                        "foodItems.$.price": price
                    },
                    $push: {
                        "foodItems.$.images": { $each: images }
                    }
                },
                { new: true, runValidators: true }
            );

            if (!foodItem) {
                return res.status(400).json(makeJsonResponse('Food item not found', {}, { email: user.email }, 400, false));
            }

            return res.status(200).json(makeJsonResponse('Food item updated successfully', { foodItem }, {}, 200, true));
        } catch (error) {
            console.log("error in updateFoodItemByOwner(controller) :: ", error);
            return res.status(500).json(
                makeJsonResponse(
                    'Error',
                    { message: error.message || "Internal error occurred" },
                    {},
                    500,
                    false
                )
            );
        }
    }
}

module.exports = Owner;
