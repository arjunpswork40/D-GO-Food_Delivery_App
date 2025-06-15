const { body, validationResult } = require('express-validator');
const {makeJsonResponse} = require("../../../utils/response")
const updateCartValidator = [
    body('foodId')
        .notEmpty().withMessage('Food ID is required.')
        .isMongoId().withMessage("Invalid Food ID format."),
    body('cartId')
        .notEmpty().withMessage('Cart ID is required.')
        .isMongoId().withMessage("Invalid Cart ID format."),
    body('qty')
        .notEmpty().withMessage('Item count is required.')
        .isInt({ min: 0 }).withMessage('Item count must be a non-negative integer.'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            response = makeJsonResponse(`Validation error.`, {}, errors.array(), 400, false);
            return res.status(400).json(response);
        }
        next();
    }
];

module.exports = { updateCartValidator };
