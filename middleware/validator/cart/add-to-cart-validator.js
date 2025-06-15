const { body, validationResult } = require('express-validator');
const {makeJsonResponse} = require("../../../utils/response")
const addToCartValidator = [
    
   
    body("restaurantId")
        .notEmpty().withMessage("Restaurant ID is required.")
        .isMongoId().withMessage("Invalid Restaurant ID format."),

    body("foodId")
        .notEmpty().withMessage("Food ID is required.")
        .isMongoId().withMessage("Invalid Food ID format."),

    body("qty")
        .notEmpty().withMessage("Quantity is required.")
        .isInt({ gt: 0 }).withMessage("Quantity must be a positive integer."),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {

            response = makeJsonResponse(`Validation error.`, {}, errors.array(), 400, false);
            return res.status(400).json(response);
        }
        next();
    }
];

module.exports = { addToCartValidator };
