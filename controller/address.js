const { makeJsonResponse } = require("../utils/response")
const {USER_TYPES} = require("../constants/user/user-constants")

class address {
    static async addressList(req, res, next) {
        try{
          const user = req.user;
          let addressData = {};
          if(user.role === USER_TYPES.OWNER) {
            addressData = user.hotelDetails.location;
            addressData.phone = user.hotelDetails.contactNumber;
            addressData.email = user.email;
          } else if(user.role === USER_TYPES.DELIVERY_PARTNER) {
            addressData = user.deliveryPartnerDetails.currentLocation;
            addressData.email = user.email;
            addressData.phone = user.phone;
          } else if(user.role === USER_TYPES.CUSTOMER) {
            addressData = user.customerDetails.savedAddresses;
            addressData.email = user.email;
            addressData.phone = user.phone;
          }
    
          return res.status(200).json(
              makeJsonResponse(
                'Address list fetched successfuly.',
                  {
                    addressData
                  },
                  {},
                  200,
                  true
              )
          );
          
        } catch(error) {
          console.error(`Error addressList (controller function): ${error.code || ''} - ${error.message}`);
          return res.status(500).json(
            makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false)
          );
        }
      }
}

module.exports = address
