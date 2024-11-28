const User = require("../models/user-model");
const mongoose = require('mongoose');
const { makeJsonResponse } = require("../utils/response");

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
}

module.exports = Owner;
