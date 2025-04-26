const { body, validationResult } = require('express-validator');
const { makeJsonResponse } = require("../../utils/response");

const emailValidator = [
    body('email')
        .notEmpty().withMessage('Email is required.')
        .isEmail().withMessage('Email must be a valid email address.'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const response = makeJsonResponse(`Validation error.`, {}, errors.array(), 400, false);
            return res.status(400).json(response);
        }
        next();
    }
];

module.exports = { emailValidator };
