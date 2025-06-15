const { body, validationResult } = require('express-validator');
const {makeJsonResponse} = require("../../../utils/response")
const customerAdressUpdateValidator = [
    body('_id')
        .optional() // Make the _id field optional
        .isMongoId().withMessage('_id must be a valid MongoDB ObjectId.'),
    body('label')
        .notEmpty().withMessage('Address label is required (eg: Home, Work).')
        .isLength({ min: 3 }).withMessage('Name must be at least 3 characters long.'),
    body('street')
        .notEmpty().withMessage('Address is required.'),
    body('city')
        .notEmpty().withMessage('City is required.'),
    body('state')
        .notEmpty().withMessage('State is required.'),
    body('country')
        .notEmpty().withMessage('Country is required.'),
    body('zipCode')
        .notEmpty().withMessage('ZipCode is required.'),
    body('lat')
        .notEmpty().withMessage('Latitude is required.')
        .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90.'),
    body('lng')
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

module.exports = { customerAdressUpdateValidator };
