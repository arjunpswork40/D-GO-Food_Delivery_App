const Food = require("../models/food-model")
const User = require("../models/user-model")
const { makeJsonResponse } = require("../utils/response")
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


  static async getallhotels(req, res, next) {
    try {
      // Query the database for all users with role "owner"
      const customerProfiles = await User.find(
        { role: "owner" }, // Filter condition
        "name _id hotelDetails ratings" // Projection: fields to include
      );
 const response={ 
  hotel_name:customerProfiles.hotelDetails.name,
  hotel_description:customerProfiles.hotelDetails.description,
  hotel_rating:ratings.averageRating,


 }
  
      // If no results are found, return an appropriate response
      if (!customerProfiles || customerProfiles.length === 0) {
        return res.status(404).json(
          makeJsonResponse('Not Found', {}, { message: "No hotels found with role owner" }, 404, false)
        );
      }
  
      // Return the list of customer profiles
      return res.status(200).json(
        makeJsonResponse('Success', { message: "Hotels retrieved successfully", customerProfiles }, {}, 200, true)
      );
    } catch (error) {
      console.error(`Error fetching hotels: ${error.code} - ${error.message}`);
      return res.status(500).json(
        makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false)
      );
    }
  }
}

module.exports = customerController