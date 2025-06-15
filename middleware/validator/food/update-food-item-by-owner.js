const { body, validationResult } = require('express-validator');
const {makeJsonResponse} = require("../../../utils/response")
const updateFoodItemByOwnerValidator = [
    
    
    body('foodId')
        .notEmpty().withMessage('food ID is required.')
        .isMongoId().withMessage("Invalid food ID format."),
    body('name')
        .notEmpty().withMessage('Name is required.'),
    body('description')
        .notEmpty().withMessage('Description is required.'),
    body('available')
        .isBoolean().withMessage('Available must be a boolean.'),
    body('category')
        .notEmpty().withMessage('Category is required.'),
    body('price')
        .notEmpty().withMessage('Price is required.')
        .isFloat({ gt: 0 }).withMessage('Price must be a positive number.'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {

            response = makeJsonResponse(`Validation error.`, {}, errors.array(), 400, false);
            return res.status(400).json(response);
        }
        next();
    }
];

module.exports = { updateFoodItemByOwnerValidator };
