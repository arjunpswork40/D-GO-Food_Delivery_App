const { body, validationResult } = require('express-validator');
const {makeJsonResponse} = require("../../../utils/response")
const removeFoodItemByOwnerValidator = [
    
    
    body('foodId')
        .notEmpty().withMessage('food ID is required.')
        .isMongoId().withMessage("Invalid food ID format."),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {

            response = makeJsonResponse(`Validation error.`, {}, errors.array(), 400, false);
            return res.status(400).json(response);
        }
        next();
    }
];

module.exports = { removeFoodItemByOwnerValidator };
