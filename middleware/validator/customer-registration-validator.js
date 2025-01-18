const { body, validationResult } = require('express-validator');
const {makeJsonResponse} = require("../../utils/response")
const customerRegistrationValidator = [
    // Customer Details Validation
    body('name')
        .notEmpty().withMessage('Owner name is required.')
        .isLength({ min: 3 }).withMessage('Owner name must be at least 3 characters long.'),
    body('email')
        .notEmpty().withMessage('Email is required.')
        .isEmail().withMessage('Invalid email format.'),
    body('phone')
        .notEmpty().withMessage('Phone number is required.')
        .isMobilePhone().withMessage('Invalid phone number.'),
    body('password')
        .notEmpty().withMessage('Password is required.')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),

    // Customer Details Validation
    
    body('locationCoordinatesLat')
        .notEmpty().withMessage('Latitude is required.')
        .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90.'),
    body('locationCoordinatesLng')
        .notEmpty().withMessage('Longitude is required.')
        .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180.'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {

            response = makeJsonResponse(`Validation error.`, {}, errors.array(), 400, false);
            return res.status(400).json(response);
        }
        next();
    }
];

module.exports = { customerRegistrationValidator };
