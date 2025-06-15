const { body, validationResult } = require('express-validator');
const {makeJsonResponse} = require("../../../../utils/response")
const addOrRemoveFavoriteListValidator = [
    body('restaurantId')
        .notEmpty().withMessage('Restaurant Id is required.')
        .isMongoId().withMessage('restaurantId must be a valid MongoDB ObjectId.'),
        
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {

            response = makeJsonResponse(`Validation error.`, {}, errors.array(), 400, false);
            return res.status(400).json(response);
        }
        next();
    }
];

module.exports = { addOrRemoveFavoriteListValidator };
