const jwt = require("jsonwebtoken")
const User = require("../models/user-model")
const { TOKEN_KEY } = require("../config/index")
const { makeJsonResponse } = require("../utils/response");
const { timeZoneChange } = require("../utils/timeZone");
const Admin = require("../models/admin-model");


class authorisation {
    static getToken(req)  {
        let { headers: { authorization }} = req
        let token = req.headers["token"]
        if (token) {
            return token
        } else if (typeof authorization === "undefined") {
            authorization = ""
            return "authorization needed"
        }
        if (authorization && authorization.split(" ")[0] === "Bearer" || authorization.split(' ')[0] === "Token") {
            return authorization.split(" ")[1]
        }
        return null
    }

    static async decodeToken( req, res, next ) {
        const token = await authorisation.getToken(req)
        try {
            const decoded = jwt.verify(token, TOKEN_KEY)
            console.log({"email": decoded.email,"role":decoded.role});
            
            const user = await User.findOne({"email": decoded.email,"role":decoded.role})
            if (!user) {
                let response = makeJsonResponse(`User Doesnt't Exist`, {}, {message: "User Doesnt't Exist"}, 401, false);
                return await res.status(401).json(response);
            }
            if (user._id != decoded._id) {
                let response = makeJsonResponse(`Wrong token, boss get a valid token`, {}, {message: "Wrong token, boss get a valid token"}, 401, false);
                return await res.status(401).json(response);
            }
            req.user = user
            next()
            
        } catch (error) {
            let message = 'Verification failed';
            if (error.name === "TokenExpiredError") {
                message = 'Token has expired';
            } else if (error.name === "JsonWebTokenError") {
                message = 'Invalid token';
            } else if (error.name === "NotBeforeError") {
                message = 'Token not active yet';
            } 
            let response = makeJsonResponse(`Unauthenticated API request`, {}, {message}, 401, false);
            return await res.status(401).json(response);
            // next(error)
        }
    }

    static async decodeTokenAdmin( req, res, next ) {
        const token = await authorisation.getToken(req)

        try {
            const decoded = jwt.verify(token, TOKEN_KEY)
            console.log({"email": decoded.email,"role":decoded.role});
            
            const user = await Admin.findOne({"email": decoded.email,"role":decoded.role})
            if (!user) throw Error("User Doesnt't Exist Boss Mi")
            if (user._id != decoded._id) throw Error("Wrong token, boss get a valid token")
            req.user = user
            next()
            
        } catch (error) {
            let message = 'Verification failed';
            if (error.name === "TokenExpiredError") {
                message = 'Token has expired';
            } else if (error.name === "JsonWebTokenError") {
                message = 'Invalid token';
            } else if (error.name === "NotBeforeError") {
                message = 'Token not active yet';
            } 
            let response = makeJsonResponse(`Unauthenticated API request`, {}, {message}, 401, false);
            return await res.status(401).json(response);
            // next(error)
        }
    }

    static authJSON( user ) {
        return {
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            token: this.genToken(user)
        }
    }

    static genToken( user ) {
        return jwt.sign(
            {
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                _id: user._id
            },
            TOKEN_KEY,
            {
                expiresIn: 86430 * 24 * 60 * 60 // 30 days in seconds00
            }
        )
    }

    static async isAdmin(req, res, next) {
        try {
            const user = req.user.role
            if (user == "admin") {
               return next()
            }
            return res.status(401).json("Authorization Required, please see you have the right authorization.")
        } catch (error) {
            next(error)
        }
    }
}
 
module.exports = authorisation