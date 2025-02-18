const { body, validationResult } = require('express-validator');
const {makeJsonResponse} = require("../../../utils/response")
const createPaymentValidator = [
    
     // Currency validation
     body('currency')
     .notEmpty().withMessage('Currency is required.')
     .isString().withMessage('Currency must be a string.')
     .isIn(['usd', 'eur', 'gbp', 'inr']).withMessage('Invalid currency. Allowed: USD, EUR, GBP, INR.'),

    // Amount validation
    body('amount')
        .notEmpty().withMessage('Amount is required.')
        .isNumeric().withMessage('Amount must be a number.')
        .custom(value => value > 0).withMessage('Amount must be greater than 0.'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {

            response = makeJsonResponse(`Validation error.`, {}, errors.array(), 400, false);
            return res.status(400).json(response);
        }
        next();
    }
];

module.exports = { createPaymentValidator };
