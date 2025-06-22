const mongodb = require("mongodb")
const binary = mongodb.Binary
const Food = require("../models/food-model")
const User = require("../models/user-model")
const Admin = require("../models/admin-model")
const { makeJsonResponse } = require("../utils/response")
const passAuth = require("../middleware/passwordHash-middleware")
const auth = require("../middleware/auth-middleware")

class controller {


  static async createCoupons(req, res, next) {
    const { email, password } = req.body
    try {
    //   const user = await Admin.findOne({ "email": email })
    //   if (!user) {
    //     return res.status(401).json(makeJsonResponse('Authentication Error', {}, { message: "This user doesn't exists" }, 401, false));
    //   }
      return res.status(200).json(makeJsonResponse('Authenticated', { message: "Authentication successful", user: "userJson" }, {}, 200, true));
    } catch (error) {
      console.log(error);
      return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message ?? "Internal error occured" }, 500, false));
    }
  }

    static async getAllCoupons(req, res, next) {
    const { email, password } = req.body
    try {
    //   const user = await Admin.findOne({ "email": email })
    //   if (!user) {
    //     return res.status(401).json(makeJsonResponse('Authentication Error', {}, { message: "This user doesn't exists" }, 401, false));
    //   }
      return res.status(200).json(makeJsonResponse('Authenticated', { message: "Authentication successful", user: "userJson" }, {}, 200, true));
    } catch (error) {
      console.log(error);
      return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message ?? "Internal error occured" }, 500, false));
    }
  }

    static async redeemCoupons(req, res, next) {
    const { email, password } = req.body
    try {
    //   const user = await Admin.findOne({ "email": email })
    //   if (!user) {
    //     return res.status(401).json(makeJsonResponse('Authentication Error', {}, { message: "This user doesn't exists" }, 401, false));
    //   }
      return res.status(200).json(makeJsonResponse('Authenticated', { message: "Authentication successful", user: "userJson" }, {}, 200, true));
    } catch (error) {
      console.log(error);
      return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message ?? "Internal error occured" }, 500, false));
    }
  }

    static async createInvitationCoupons(req, res, next) {
    const { email, password } = req.body
    try {
    //   const user = await Admin.findOne({ "email": email })
    //   if (!user) {
    //     return res.status(401).json(makeJsonResponse('Authentication Error', {}, { message: "This user doesn't exists" }, 401, false));
    //   }
      return res.status(200).json(makeJsonResponse('Authenticated', { message: "Authentication successful", user: "userJson" }, {}, 200, true));
    } catch (error) {
      console.log(error);
      return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message ?? "Internal error occured" }, 500, false));
    }
  }

    static async createHotelCoupons(req, res, next) {
    const { email, password } = req.body
    try {
    //   const user = await Admin.findOne({ "email": email })
    //   if (!user) {
    //     return res.status(401).json(makeJsonResponse('Authentication Error', {}, { message: "This user doesn't exists" }, 401, false));
    //   }
      return res.status(200).json(makeJsonResponse('Authenticated', { message: "Authentication successful", user: "userJson" }, {}, 200, true));
    } catch (error) {
      console.log(error);
      return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message ?? "Internal error occured" }, 500, false));
    }
  }



}


module.exports = controller