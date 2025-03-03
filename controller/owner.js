const User = require("../models/user-model");
const mongoose = require('mongoose');
const { makeJsonResponse } = require("../utils/response");
const userModel = require("../models/user-model");
const { USER_TYPES } = require("../constants/user/user-constants");
const bcrypt = require("bcrypt");
const { BCRYPT_SALT } = require("../config/index");
class Owner {

    static async userProfile(req, res, next) {
        const { id } = req.params;

        // Validate if the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json(makeJsonResponse('Validation Error', {}, { message: "Please give a valid ID" }, 400, false));
        }

        try {
            // Find the user and select only 'name' and 'email', convert to plain object with .lean()
            const owner = await User.findOne({_id:id,role:'owner'}, "name email phone address role hotelDetails bankDetails ratings status").lean();

            // Check if the user exists
            if (!owner) {
                return res.status(404).json(makeJsonResponse('User not found', {}, { message: "No user found with the provided ID" }, 404, false));
            }

            // Send the response
            return res.status(200).json(makeJsonResponse('Owner profile', { message: "Profile details", data: owner }, {}, 200, false));

        } catch (err) {
            console.error(err);
            return res.status(500).json(makeJsonResponse('Server Error', {}, { message: "An error occurred while fetching the profile" }, 500, false));
        }
    }

    static async deleteUser(req, res, next) {
        const { id } = req.params;

        // Validate if the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json(makeJsonResponse('Validation Error', {}, { message: "Please give a valid ID" }, 400, false));
        }

        try {
            // Fetch the user by id and check if the role is 'owner'
            const owner = await User.findOne({_id:id,role:'owner'}, "_id").lean();


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
            } catch(error) {
                console.log("error in updateBankDetails(controller) :: ",error)
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
    static async updateHotelDetails(req, res, next) {
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

    static async forgotPassword(req, res, next) { 
        const { 
          currentPassword,
          newPassword,
          confirmPassword
         } = req.body;
        const user = req.user;
        try {
    
          if( user.role !== USER_TYPES.OWNER) {
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
    
}

module.exports = Owner;
