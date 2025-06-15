const { body, validationResult } = require('express-validator');
const {makeJsonResponse} = require("../../utils/response")
const hotelDetailsValidator = [
    
    // Hotel Details Validation
    body('hotelName')
        .notEmpty().withMessage('Hotel name is required.'),
    body('hotelLocationAddress')
        .notEmpty().withMessage('Address is required.'),
    body('hotelLocationCity')
        .notEmpty().withMessage('City is required.'),
    body('hotelLocationState')
        .notEmpty().withMessage('State is required.'),
    body('hotelLocationCountry')
        .notEmpty().withMessage('Country is required.'),
    body('hotelLocationZipCode')
        .notEmpty().withMessage('ZipCode is required.'),
    body('hotelLocationCoordinatesLat')
        .notEmpty().withMessage('Latitude is required.')
        .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90.'),
    body('hotelLocationCoordinatesLng')
        .notEmpty().withMessage('Longitude is required.')
        .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180.'),
    body('hotelContactNumber')
        .notEmpty().withMessage('Hotel contact number is required.')
        .isMobilePhone().withMessage('Invalid phone number.'),
    body('openingHours')
        .notEmpty().withMessage('Opening hours is required.'),
    body('closingHours')
        .notEmpty().withMessage('Closing hours is required.'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {

            response = makeJsonResponse(`Validation error.`, {}, errors.array(), 400, false);
            return res.status(400).json(response);
        }
        next();
    }
];

module.exports = { hotelDetailsValidator };
