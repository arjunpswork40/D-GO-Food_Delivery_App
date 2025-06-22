const { body, validationResult } = require('express-validator');
const { makeJsonResponse } = require("../../utils/response");

const stipeAccounIdValidator = [
    body('stripAccountId')
        .notEmpty().withMessage('Stripe Account ID is required.')
        .isString().withMessage('Stripe Account ID must be a valid string.'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const response = makeJsonResponse(`Validation error.`, {}, errors.array(), 400, false);
            return res.status(400).json(response);
        }
        next();
    }
];

module.exports = { stipeAccounIdValidator };
