const { body, validationResult } = require('express-validator');
const {makeJsonResponse} = require("../../../utils/response")
const customerAdressDeleteValidator = [
    body('addressId')
        .notEmpty().withMessage('Address Id is required.')
        .isMongoId().withMessage('addressId must be a valid MongoDB ObjectId.'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {

            response = makeJsonResponse(`Validation error.`, {}, errors.array(), 400, false);
            return res.status(400).json(response);
        }
        next();
    }
];

module.exports = { customerAdressDeleteValidator };
