const mongodb = require("mongodb")
const binary = mongodb.Binary
const Food = require("../models/food-model")
const User = require("../models/user-model")
const Admin = require("../models/admin-model")
const { makeJsonResponse } = require("../utils/response")
const passAuth = require("../middleware/passwordHash-middleware")
const auth = require("../middleware/auth-middleware")
const Coupon = require('../models/coupon-model');
const AvailedCoupon = require('../models/availed_coupon.model');

class controller {

  constructor() {
    this.generateCouponCode = this.generateCouponCode.bind(this);
  }

  generateCouponCode(prefix) {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${randomPart}`;
  }

  async generateUniqueCouponCode(prefix, maxRetries = 5) {
    // for (let i = 0; i < maxRetries; i++) {  // if  coupons 
    const code = this.generateCouponCode(prefix);
    const exists = await Coupon.findOne({ code });
    if (!exists) {
      return code;
    }
    // }
    throw new Error(`Failed to generate unique coupon code after ${maxRetries} attempts.`);
  }

  // from admin side-------------------------------------------------------------------
  static async createCoupons(req, res, next) {

    const {
      numberOfCoupons = 100,  // default if not sent
      type = 'general',
      value = 4,
      discount_type = 'amount',
      issuedTo = null,
      expiry = null
    } = req.body;

    try {

      const coupons = [];

      for (let i = 0; i < numberOfCoupons; i++) {
        const code = await this.generateUniqueCouponCode(prefix);
        coupons.push({
          code,
          type,
          value,
          discount_type,
          issuedTo: type === 'general' ? null : issuedTo,
          expiry,
        });
      }

      const newCoupons = await Coupon.insertMany(coupons);

      return res.status(200).json(makeJsonResponse('Coupons Created', { message: "Coupons created successfully" }, {}, 200, true));
    } catch (error) {
      console.log(error);
      return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message ?? "Internal error occured" }, 500, false));
    }
  }

  static async getAllCoupons(req, res, next) {
    try {
      const { type, isRedeemed, is_active } = req.query; // using query params for filtering

      const filter = {};

      if (type) filter.type = type.toLowerCase();
      if (isRedeemed !== undefined) filter.isRedeemed = isRedeemed === 'true';
      if (is_active !== undefined) filter.is_active = is_active === 'true';

      const coupons = await Coupon.find(filter).sort({ createdAt: -1 }); // newest first

      return res.status(200).json(
        makeJsonResponse(
          'Fetched Coupons',
          { total: coupons.length, coupons },
          {},
          200,
          true
        )
      );
    } catch (error) {
      console.error(error);
      return res.status(500).json(
        makeJsonResponse(
          'Internal Error',
          {},
          { message: error.message ?? "Internal error occurred" },
          500,
          false
        )
      );
    }
  }

  // delete coupons 

  //admin side end-------------------------------------------------------------------



  //user side side end-------------------------------------------------------------------


  static async verifyCoupons(req, res, next) {
    try {
      const { code, userId } = req.body;

      if (!code) {
        return res.status(400).json(
          makeJsonResponse('Invalid Request', {}, { message: 'Coupon code is required' }, 400, false)
        );
      }

      const coupon = await Coupon.findOne({ code: code.toUpperCase() });

      if (!coupon) {
        return res.status(404).json(
          makeJsonResponse('Invalid Coupon', {}, { message: 'Coupon does not exist' }, 404, false)
        );
      }

      if (!coupon.is_active) {
        return res.status(403).json(
          makeJsonResponse('Inactive Coupon', {}, { message: 'coupon is not active' }, 403, false)
        );
      }

      if (coupon.expiry && new Date(coupon.expiry) < new Date()) {
        return res.status(403).json(
          makeJsonResponse('Expired Coupon', {}, { message: 'coupon expired' }, 403, false)
        );
      }

      if (coupon.isRedeemed) {
        return res.status(403).json(
          makeJsonResponse('Coupon Already Redeemed', {}, { message: 'This coupon has already been redeemed' }, 403, false)
        );
      }

      // if coupon is not general.
      // if (coupon.issuedTo && userId && coupon.issuedTo.toString() !== userId) {
      //   return res.status(403).json(
      //     makeJsonResponse('Unauthorized', {}, { message: 'This coupon was not issued to this user' }, 403, false)
      //   );
      // }

      return res.status(200).json(
        makeJsonResponse('Coupon Verified', { coupon }, {}, 200, true)
      );
    } catch (error) {
      console.log(error);
      return res.status(500).json(
        makeJsonResponse('Internal Error', {}, { message: error.message ?? "Internal error occurred" }, 500, false)
      );
    }
  }


  // after payment-->>>  
  static async redeemCoupons(req, res, next) {
    try {
      const { code, userId } = req.body;

      if (!code || !userId) {
        return res.status(400).json(
          makeJsonResponse('Invalid Request', {}, { message: 'Coupon code and userId are required' }, 400, false)
        );
      }

      const coupon = await Coupon.findOne({ code: code.toUpperCase() });

      if (!coupon) {
        return res.status(404).json(
          makeJsonResponse('Coupon Not Found', {}, { message: 'No such coupon exists' }, 404, false)
        );
      }

      if (coupon.isRedeemed) {
        return res.status(409).json(
          makeJsonResponse('Already Redeemed', {}, { message: 'Coupon already redeemed' }, 409, false)
        );
      }

      if (!coupon.is_active) {
        return res.status(403).json(
          makeJsonResponse('Inactive Coupon', {}, { message: 'Coupon is inactive' }, 403, false)
        );
      }

      if (coupon.expiry && new Date(coupon.expiry) < new Date()) {
        return res.status(403).json(
          makeJsonResponse('Expired Coupon', {}, { message: 'Coupon has expired' }, 403, false)
        );
      }

      if (coupon.issuedTo && coupon.issuedTo.toString() !== userId) {
        return res.status(403).json(
          makeJsonResponse('Unauthorized', {}, { message: 'Coupon not issued to this user' }, 403, false)
        );
      }

      coupon.isRedeemed = true;
      await coupon.save();

      await AvailedCoupon.create({
        coupon: coupon._id,
        user: userId,
      });

      return res.status(200).json(
        makeJsonResponse('Coupon Redeemed', {
          message: 'Coupon redeemed successfully',
          couponCode: coupon.code,
        }, {}, 200, true)
      );

    } catch (error) {
      console.log(error);
      return res.status(500).json(
        makeJsonResponse('Internal Error', {}, { message: error.message ?? "Internal error occurred" }, 500, false)
      );
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