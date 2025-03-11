const { body, validationResult } = require('express-validator');
const {makeJsonResponse} = require("../../utils/response")

const resetPasswordValidator = [
    
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long'),
    body('confirmPassword')
        .custom((value, { req }) => value === req.body.newPassword)
        .withMessage('Passwords do not match'),
    body('email')
            .notEmpty().withMessage('Email is required.')
            .isEmail().withMessage('Email must be a valid email address.'),
    body('otp')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be 6 characters long'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            response = makeJsonResponse(`Validation error.`, {}, errors.array(), 400, false);
            return res.status(400).json(response);
        }
        next();
    }
];

module.exports = {resetPasswordValidator};
