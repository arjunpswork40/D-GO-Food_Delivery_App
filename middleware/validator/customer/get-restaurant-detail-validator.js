const { param, validationResult } = require('express-validator');
const {makeJsonResponse} = require("../../../utils/response")
const getRestaurantDetailsValidator = [
    
    
    param('restaurantId')
        .notEmpty().withMessage('restaurant ID is required.')
        .isMongoId().withMessage("Invalid restaurant ID format."),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {

            response = makeJsonResponse(`Validation error.`, {}, errors.array(), 400, false);
            return res.status(400).json(response);
        }
        next();
    }
];

module.exports = { getRestaurantDetailsValidator };
