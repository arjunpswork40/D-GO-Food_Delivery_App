const { body, validationResult } = require('express-validator');
const {makeJsonResponse} = require("../../../utils/response")
const acceptOrRejectOrderValidator = [

    body('orderId')
        .notEmpty().withMessage('Order Id is required.')
        .isMongoId().withMessage('Order Id must be a valid MongoDB ObjectId.'),
    body('status')
        .notEmpty().withMessage('status is required.')
        .isBoolean().withMessage('status must be a boolean value.')
        .toBoolean(), // Converts string values like "true"/"false" to actual boolean
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {

            response = makeJsonResponse(`Validation error.`, {}, errors.array(), 400, false);
            return res.status(400).json(response);
        }
        next();
    }
];

module.exports = { acceptOrRejectOrderValidator };
