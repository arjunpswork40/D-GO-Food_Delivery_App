const { body, validationResult } = require('express-validator');
const { makeJsonResponse } = require("../../../utils/response")
const confirmPaymentValidator = [

    body('payment_intent_id')
        .notEmpty().withMessage('Payment method ID is required.')
        .isString().withMessage('Payment method ID must be a string.'),

    body('payment_method_id')
        .notEmpty().withMessage('Payment method ID is required.')
        .isString().withMessage('Payment method ID must be a string.'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {

            response = makeJsonResponse(`Validation error.`, {}, errors.array(), 400, false);
            return res.status(400).json(response);
        }
        next();
    }
];

module.exports = { confirmPaymentValidator };
