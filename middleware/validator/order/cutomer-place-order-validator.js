const { body, validationResult } = require('express-validator');
const {makeJsonResponse} = require("../../../utils/response")
const customerPlaceOrderValidator = [

    body('cartId')
        .notEmpty().withMessage('cart Id is required.')
        .isMongoId().withMessage('cart Id must be a valid MongoDB ObjectId.'),
        body('addressId')
        .notEmpty().withMessage('address Id is required.')
        .isMongoId().withMessage('address Id must be a valid MongoDB ObjectId.'),
    body('phone')
        .notEmpty().withMessage('Phone number is required.')
        .isMobilePhone().withMessage('Invalid phone number.'),
    body('paidThrough')
        .notEmpty().withMessage('paidThrough is required.')
        .isIn([
            'card', 
            'UPI', 
            'net_banking', 
            'cash',
            'online'
        ])
        .withMessage('Invalid paidThrough value. It should be any of card, UPI, net_banking, cash and online'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {

            response = makeJsonResponse(`Validation error.`, {}, errors.array(), 400, false);
            return res.status(400).json(response);
        }
        next();
    }
];

module.exports = { customerPlaceOrderValidator };
