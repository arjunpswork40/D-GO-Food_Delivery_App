const { param, validationResult } = require('express-validator');
const {makeJsonResponse} = require("../../../utils/response")
const deleteCartItemValidator = [
    
    
    param('cartId')
        .notEmpty().withMessage('Cart ID is required.')
        .isMongoId().withMessage("Invalid Cart ID format."),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {

            response = makeJsonResponse(`Validation error.`, {}, errors.array(), 400, false);
            return res.status(400).json(response);
        }
        next();
    }
];

module.exports = { deleteCartItemValidator };
