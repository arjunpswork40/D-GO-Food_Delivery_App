const { body, validationResult } = require('express-validator');
const {makeJsonResponse} = require("../../../utils/response")
const BankdetailsValidationRules = [


    body('accountName')
        .notEmpty().withMessage('Account name is required.'),
    body('accountNumber')
        .notEmpty().withMessage('Account number is required.')
        .isNumeric().withMessage('Account number must be numeric.'),
    body('bankName')
        .notEmpty().withMessage('Bank name is required.'),
    body('ifscCode')
        .notEmpty().withMessage('IFSC code is required.')
        .isLength({ min: 11, max: 11 }).withMessage('IFSC code must be 11 characters long.'),

    (req, res, next) => {
    
        const errors = validationResult(req);
        if (!errors.isEmpty()) {

            response = makeJsonResponse(`Validation error.`, {}, errors.array(), 400, false);
            return res.status(400).json(response);
        }
        next();
    }
];

module.exports = { BankdetailsValidationRules };
