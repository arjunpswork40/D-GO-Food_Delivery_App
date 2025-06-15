const { body, validationResult } = require('express-validator');
const {makeJsonResponse} = require("../../../utils/response")
const orderCompletedValidator = [

    body('orderId')
        .notEmpty().withMessage('Order Id is required.')
        .isMongoId().withMessage('Order Id must be a valid MongoDB ObjectId.'),
    body('otp')
        .isLength({ min: 6, max: 6 }) 
        .isNumeric()
        .withMessage('OTP must be a 6-digit numeric value'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {

            response = makeJsonResponse(`Validation error.`, {}, errors.array(), 400, false);
            return res.status(400).json(response);
        }
        next();
    }
];

module.exports = { orderCompletedValidator };
