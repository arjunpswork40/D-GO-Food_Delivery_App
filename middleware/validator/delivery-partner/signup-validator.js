const { body, validationResult } = require('express-validator');
const {makeJsonResponse} = require("../../../utils/response")

const signupValidator = [
    body('name').notEmpty().withMessage('Name is required').isLength({ min: 1, max: 60 }).withMessage('Delivery Partner name must be between 1 and 60 characters long.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('email').isEmail().withMessage('Invalid email address'),
    body('phone').isMobilePhone().withMessage('Invalid phone number'),
    body('deliveryPartnerstreet').notEmpty().withMessage('Street is required'),
    body('deliveryPartnercity').notEmpty().withMessage('City is required'),
    body('deliveryPartnerstate').notEmpty().withMessage('State is required'),
    body('deliveryPartnercountry').notEmpty().withMessage('Country is required'),
    body('deliveryPartnerpincode').isPostalCode('any').withMessage('Invalid pincode'),
    body('deliveryPartnervehicleType').notEmpty().withMessage('Vehicle type is required'),
    body('deliveryPartnervehicleNumber').notEmpty().withMessage('Vehicle number is required'),
    body('deliveryPartnerlicenseNumber').notEmpty().withMessage('License number is required'),
    body('deliveryPartnerlat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('deliveryPartnerlng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            response = makeJsonResponse(`Validation error.`, {}, errors.array(), 400, false);
            return res.status(400).json(response);
        }
        next();
    }
];

module.exports = signupValidator;