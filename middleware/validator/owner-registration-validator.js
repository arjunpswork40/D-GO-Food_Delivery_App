const { body, validationResult } = require('express-validator');
const {makeJsonResponse} = require("../../utils/response")
const hotelOwnerValidationRules = [
    // Owner Details Validation
    body('name')
        .notEmpty().withMessage('Owner name is required.')
        .isLength({ min: 1, max: 60 }).withMessage('Owner name must be between 1 and 60 characters long.'),
    body('email')
        .notEmpty().withMessage('Email is required.')
        .isEmail().withMessage('Invalid email format.'),
    body('phone')
        .notEmpty().withMessage('Phone number is required.')
        .isMobilePhone().withMessage('Invalid phone number.'),
    body('password')
        .notEmpty().withMessage('Password is required.')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),

    // Hotel Details Validation
    body('hotelName')
        .notEmpty().withMessage('Hotel name is required.'),
    // body('hotelLocationAddress')
    //     .notEmpty().withMessage('Address is required.'),
    // body('hotelLocationCity')
    //     .notEmpty().withMessage('City is required.'),
    // body('hotelLocationState')
    //     .notEmpty().withMessage('State is required.'),
    // body('hotelLocationCountry')
    //     .notEmpty().withMessage('Country is required.'),
    // body('hotelLocationZipCode')
    //     .notEmpty().withMessage('ZipCode is required.'),
    body('hotelLocationCoordinatesLat')
        .notEmpty().withMessage('Latitude is required.')
        .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90.'),
    body('hotelLocationCoordinatesLng')
        .notEmpty().withMessage('Longitude is required.')
        .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180.'),
    // body('hotelContactNumber')
    //     .notEmpty().withMessage('Hotel contact number is required.')
    //     .isMobilePhone().withMessage('Invalid phone number.'),
    // body('openingHours')
    //     .notEmpty().withMessage('Opening hours is required.'),
    // body('closingHours')
    //     .notEmpty().withMessage('Closing hours is required.'),
        
    // // Bank Details Validation
    // body('bankDetailsAccountName')
    //     .notEmpty().withMessage('Account name is required.'),
    // body('bankDetailsAccountNumber')
    //     .notEmpty().withMessage('Account number is required.')
    //     .isNumeric().withMessage('Account number must be numeric.'),
    // body('bankDetailsBankName')
    //     .notEmpty().withMessage('Bank name is required.'),
    // body('bankDetailsIfscCode')
    //     .notEmpty().withMessage('IFSC code is required.')
    //     .isLength({ min: 11, max: 11 }).withMessage('IFSC code must be 11 characters long.'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {

            response = makeJsonResponse(`Validation error.`, {}, errors.array(), 400, false);
            return res.status(400).json(response);
        }
        next();
    }
];

module.exports = { hotelOwnerValidationRules };
