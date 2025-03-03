const { makeJsonResponse } = require("../utils/response")
const {USER_TYPES} = require("../constants/user/user-constants")
const User = require("../models/user-model")
const bcrypt = require("bcrypt");
const { BCRYPT_SALT } = require("../config/index")

class deliveryPartner {
      static async forgotPassword(req, res, next) { 
        const { 
          currentPassword,
          newPassword,
          confirmPassword
         } = req.body;
        const user = req.user;
        try {
            console.log(user.role)
          if( user.role !== USER_TYPES.DELIVERY_PARTNER) {
            return res.status(400).json(makeJsonResponse('User not founxd', {}, { role:user.role, email: user.email }, 400, false)); 
          }
          const userData = await User.findById(user._id);
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

module.exports = deliveryPartner
