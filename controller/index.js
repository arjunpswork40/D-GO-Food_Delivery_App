const User = require("../models/user-model")
const Food = require("../models/food-model")
const auth = require("../middleware/auth-middleware")
const passAuth = require("../middleware/passwordHash-middleware")
const Token = require("../models/token-model")
const crypto = require("crypto")
const { url, APP_NAME } = require("../config/index")
const { makeJsonResponse } = require("../utils/response")
const English = require("../utils/multi-language-dictionaries/english")
const Portuguese = require("../utils/multi-language-dictionaries/portuguese")
const AvailableLanguages = require("../utils/multi-language-dictionaries/availableLanguages");

class controller {
    static async changeLanguage(req, res, next) {
        const { language } = req.body
        const availableLanguages = AvailableLanguages.languages;
        if (availableLanguages.includes(language)) {
            try {
                let dictionary = English.language;
                switch (language) {
                    case 'portuguese':
                        dictionary = Portuguese.Portuguese;
                    default:
                        dictionary = dictionary;
                }


                return res.status(200).json(makeJsonResponse('Language Dictinory', {}, { message: `Language dictinory for ${language}`, dictionary }, 200, true));
            } catch (error) {
                console.log(error);

                return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message ?? "Internal error occured" }, 500, false));
            }
        } else {
            return res.status(400).json(makeJsonResponse('Language not supported', {}, { message: `${language} is not available` }, 400, false));
        }

    }
    static async allFoods(req, res, next) {
        try {
            const allFoods = await Food.find({ available: true })
            return res.status(200).json({
                message: `Welcome to this foodOrdering site. <br> Check out https://github.com/innext/foodOrdering.git for the readme.md to know how to acess the endpoints`,
                allFoodsAvailable: allFoods
            })
        } catch (error) {
            next(error)
        }
    }

    static async newCustomer(req, res, next) {
        const { body, files } = req;

        const {
            name,
            password,
            email,
            phone,
            customerlat,
            customerlng,
        } = req.body

        // const hotelImages = req.files?.hotelImages?.length > 0
        //     ? req.files.hotelImages.map(item => item.path)
        //     : [];
        // const menuImages = req.files?.menuImages?.length > 0
        //     ? req.files.menuImages.map(item => item.path)
        //     : [];
        // const hotelMainImage = req.files?.hotelMainImage?.length > 0
        //     ? req.files.hotelMainImage.map(item => item.path)
        //     : [];

        try {
            // Check if required fields are provided
            if (!name || !email || !password) {
                return res.status(400).json(makeJsonResponse('Bad Request', {}, { message: "Please fill all details" }, 400, false));
            }

            // Use a single database call to check for existing user and create a new one if not found
            const existingUser = await User.findOne({ email, role: "customer" });

            if (existingUser) {
                return res.status(406).json(makeJsonResponse('Not Acceptable', {}, { message: "This user already exists" }, 406, false));
            }

            // Hash the password and create the user in one go
            const newUser = new User({
                name,
                password: passAuth.hashPassword(password), // Hash the password directly in the user creation
                email,
                role: "customer",
                phone: phone,
                customerDetails: {
                    savedAddresses: [
                        {
                            coordinates: {
                                lat: customerlat,
                                lng: customerlng,
                            },

                        },
                    ],
                }
            }
            );

            // Save the new user and handle the response
            await newUser.save();

            return res.status(200).json(makeJsonResponse('Success', { message: "customer created successfully", user: auth.authJSON(newUser) }, {}, 200, true));

        } catch (error) {
            console.error(`Error creating user: ${error.code} - ${error.message}`);
            return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false));
        }
    }

    static async newOwner(req, res, next) {
        const { body, files } = req;
        const {
            name,
            password,
            email,
            phone,
            hotelName,
            hotelDescription,
            hotelLocationAddress,
            hotelLocationCity,
            hotelLocationState,
            hotelLocationCountry,
            hotelLocationZipCode,
            hotelLocationCoordinatesLat,
            hotelLocationCoordinatesLng,
            hotelContactNumber,
            closingHours,
            openingHours,
            bankDetailsAccountName,
            bankDetailsAccountNumber,
            bankDetailsBankName,
            bankDetailsIfscCode
        } = req.body

        const hotelImages = req.files?.hotelImages?.length > 0
            ? req.files.hotelImages.map(item => item.path)
            : [];
        const menuImages = req.files?.menuImages?.length > 0
            ? req.files.menuImages.map(item => item.path)
            : [];
        const hotelMainImage = req.files?.hotelMainImage?.length > 0
            ? req.files.hotelMainImage.map(item => item.path)
            : [];

        try {
            // Check if required fields are provided
            if (!name || !email || !password) {
                return res.status(400).json(makeJsonResponse('Bad Request', {}, { message: "Please fill all details" }, 400, false));
            }

            // Use a single database call to check for existing user and create a new one if not found
            const existingUser = await User.findOne({ email, role: "owner" });

            if (existingUser) {
                return res.status(406).json(makeJsonResponse('Not Acceptable', {}, { message: "This user already exists" }, 406, false));
            }

            // Hash the password and create the user in one go
            const newUser = new User({
                name,
                password: passAuth.hashPassword(password), // Hash the password directly in the user creation
                email,
                role: "owner",
                phone: phone,
                bankDetails: {
                    accountName: bankDetailsAccountName,
                    accountNumber: bankDetailsAccountNumber,
                    bankName: bankDetailsBankName,
                    ifscCode: bankDetailsIfscCode,
                },
                hotelDetails: {
                    name: hotelName,
                    description: hotelDescription,
                    location: {
                        address: hotelLocationAddress,
                        city: hotelLocationCity,
                        state: hotelLocationState,
                        country: hotelLocationCountry,
                        zipcode: hotelLocationZipCode,
                        coordinates: {
                            lat: hotelLocationCoordinatesLat,
                            lng: hotelLocationCoordinatesLng,
                        },
                    },
                    contactNumber: hotelContactNumber,
                    openingHours: {
                        open: openingHours,
                        close: closingHours
                    },
                    images: {
                        hotelImages: hotelImages, // URLs or paths to hotel images
                        menuImages: menuImages, // URLs or paths to menu images
                        hotelMainImage: hotelMainImage
                    },
                }
            });

            // Save the new user and handle the response
            await newUser.save();

            return res.status(200).json(makeJsonResponse('Success', { message: "Owner created successfully", user: auth.authJSON(newUser) }, {}, 200, true));

        } catch (error) {
            console.error(`Error creating user: ${error.code} - ${error.message}`);
            return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false));
        }
    }
    static async newDeliveryPartner(req, res, next) {
        const { body, files } = req;

        const {
            name,
            password,
            email,
            phone,
            bankDetailsAccountName,
            bankDetailsAccountNumber,
            bankDetailsBankName,
            bankDetailsIfscCode,
            deliveryPartnerstreet,
            deliveryPartnercity,
            deliveryPartnerstate,
            deliveryPartnercountry,
            deliveryPartnerpincode,
            deliveryPartnervehicleType,
            deliveryPartnervehicleNumber,
            deliveryPartnerlicenseNumber,
            deliveryPartnerlat,
            deliveryPartnerlng,
        } = req.body

        const hotelImages = req.files?.hotelImages?.length > 0
            ? req.files.hotelImages.map(item => item.path)
            : [];
        const menuImages = req.files?.menuImages?.length > 0
            ? req.files.menuImages.map(item => item.path)
            : [];
        const hotelMainImage = req.files?.hotelMainImage?.length > 0
            ? req.files.hotelMainImage.map(item => item.path)
            : [];

        try {
            // Check if required fields are provided
            if (!name || !email || !password) {
                return res.status(400).json(makeJsonResponse('Bad Request', {}, { message: "Please fill all details" }, 400, false));
            }

            // Use a single database call to check for existing user and create a new one if not found
            const existingUser = await User.findOne({ email, role: "delivery_partner" });

            if (existingUser) {
                return res.status(406).json(makeJsonResponse('Not Acceptable', {}, { message: "This user already exists" }, 406, false));
            }

            // Hash the password and create the user in one go
            const newUser = new User({
                name,
                password: passAuth.hashPassword(password), // Hash the password directly in the user creation
                email,
                role: "delivery_partner",
                phone: phone,
                bankDetails: {
                    accountName: bankDetailsAccountName,
                    accountNumber: bankDetailsAccountNumber,
                    bankName: bankDetailsBankName,
                    ifscCode: bankDetailsIfscCode,
                },
                address: {
                    street: deliveryPartnerstreet,
                    city: deliveryPartnercity,
                    state: deliveryPartnerstate,
                    country: deliveryPartnercountry,
                    pincode: deliveryPartnerpincode
                },

                deliveryPartnerDetails: {
                    vehicleType: deliveryPartnervehicleType,
                    vehicleNumber: deliveryPartnervehicleNumber,
                    licenseNumber: deliveryPartnerlicenseNumber,
                    currentLocation: {
                        coordinates: {
                            lat: deliveryPartnerlat,
                            lng: deliveryPartnerlng,
                        },
                    },
                }
            }
            );

            // Save the new user and handle the response
            await newUser.save();

            return res.status(200).json(makeJsonResponse('Success', { message: "Delivery Partner created successfully", user: auth.authJSON(newUser) }, {}, 200, true));

        } catch (error) {
            console.error(`Error creating user: ${error.code} - ${error.message}`);
            return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false));
        }
    }

    static async ownerLogin(req, res, next) {

        const { email, password } = req.body

        try {
            if (!email || !password) {
                return res.status(400).json(makeJsonResponse('Bad Request', {}, { message: "Please input all details" }, 400, false));
            }

            const user = await User.findOne({ "email": email, role: "owner" })

            if (!user) {
                return res.status(401).json(makeJsonResponse('Authentication Error', {}, { message: "This user doesn't exists" }, 401, false));
            }

            const userPW = user.password
            const isMatch = passAuth.compareHash(password, userPW)

            if (!isMatch) {
                return res.status(401).json(makeJsonResponse('Authentication Error', {}, { message: "email or password is correct" }, 401, false));
            }

            const userJson = auth.authJSON(user)
            return res.status(200).json(makeJsonResponse('Authenticated', { message: "Authentication successful", user: userJson }, {}, 200, true));
        } catch (error) {
            return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message ?? "Internal error occured" }, 500, false));
        }
    }
    static async customerLogin(req, res, next) {

        const { email, password } = req.body

        try {
            if (!email || !password) {
                return res.status(400).json(makeJsonResponse('Bad Request', {}, { message: "Please input all details" }, 400, false));
            }

            const user = await User.findOne({ "email": email, role: "customer" })

            if (!user) {
                return res.status(401).json(makeJsonResponse('Authentication Error', {}, { message: "This user doesn't exists" }, 401, false));
            }

            const userPW = user.password
            const isMatch = passAuth.compareHash(password, userPW)

            if (!isMatch) {
                return res.status(401).json(makeJsonResponse('Authentication Error', {}, { message: "email or password is correct" }, 401, false));
            }

            const userJson = auth.authJSON(user)
            return res.status(200).json(makeJsonResponse('Authenticated', { message: "Authentication successful", user: userJson }, {}, 200, true));
        } catch (error) {
            return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message ?? "Internal error occured" }, 500, false));
        }
    }
    static async deliveryPartnerLogin(req, res, next) {
        const { email, password } = req.body
        console.log(email, password);

        try {
            if (!email || !password) {
                return res.status(400).json(makeJsonResponse('Bad Request', {}, { message: "Please input all details" }, 400, false));
            }

            const user = await User.findOne({ "email": email, role: "delivery_partner" })

            if (!user) {
                return res.status(401).json(makeJsonResponse('Authentication Error', {}, { message: "This user doesn't exists" }, 401, false));
            }

            const userPW = user.password
            const isMatch = passAuth.compareHash(password, userPW)

            if (!isMatch) {
                return res.status(401).json(makeJsonResponse('Authentication Error', {}, { message: "email or password is correct" }, 401, false));
            }

            const userJson = auth.authJSON(user)
            return res.status(200).json(makeJsonResponse('Authenticated', { message: "Authentication successful", user: userJson }, {}, 200, true));
        } catch (error) {
            return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message ?? "Internal error occured" }, 500, false));
        }
    }

    static async userUpdate(req, res, next) {
        const user = req.user
        try {
            let { name, address, phone } = req.body
            const update = await User.updateOne(
                { _id: user._id },
                { $set: { name: name, address: address, phone, phone } },
                { new: true }
            )
            return await res.json(update)
        } catch (error) {
            next(error)
        }
    }

    static async userProfile(req, res, next) {
        const user = req.user
        res.json(user)
    }

    static async updatePassword(req, res, next) {
        const user = req.user
        try {
            let password = req.body.password
            let newPassword = req.body.newPassword
            const isCorrect = passAuth.compareHash(password, user.password)

            if (!isCorrect) {
                const err = new Error()
                err.name = "Authentication Error"
                err.status = 401
                err.message = "Passowrd Incorrect"
                throw err
            }

            const hash = passAuth.hashPassword(newPassword)

            await User.updateOne(
                { _id: user._id },
                { $set: { password: hash } },
                { new: true }
            )

            return res.json({
                message: "password reset successful",
                status: 200
            })
        } catch (error) {
            next(error)
        }
    }

    static async requestPasswordReset(req, res, next) {
        try {
            let email = req.body.email
            const user = await User.findOne({ email: email })

            if (!user) {
                const err = new Error()
                err.name = "Authentication Error"
                err.status = 401
                err.message = "This user doesn't exists"
                throw err
            }

            let token = await Token.findOne({ userId: user._id })
            if (token) await token.deleteOne()

            let resetToken = crypto.randomBytes(32).toString("hex")
            const hash = passAuth.hashPassword(resetToken)

            await new Token({
                userId: user._id,
                token: hash,
                createdAt: Date.now()
            }).save()

            const link = `http://${url.CLIENT_URL}/resetpassword?userId=${user._id}&resetToken=${resetToken}`

            return res.json(link)
        } catch (error) {
            next(error)
        }
    }

    static async resetPassword(req, res, next) {
        try {
            const { userId, resetToken } = req.query
            const { password } = req.body

            let user = await Token.findOne({ userId: userId })

            if (!user) {
                const err = new Error()
                err.name = "Authentication Error"
                err.status = 401
                err.message = "Invalid or expired password reset token"
                throw err
            }

            const isValid = passAuth.compareHash(resetToken, user.token)

            if (!isValid) {
                const err = new Error()
                err.name = "Authentication Error"
                err.status = 401
                err.message = "Invalid or expired password reset token"
                throw err
            }

            const hash = passAuth.hashPassword(password)

            await User.updateOne(
                { _id: userId },
                { $set: { password: hash } },
                { new: true }
            )

            await user.deleteOne()

            return await res.json({
                message: "password reset successful",
                status: 200
            })
        } catch (error) {
            next(error)
        }
    }

<<<<<<< HEAD
   
=======
    static async delUser(req, res, next) {
        const user = req.user
        try {
            if (!user) {
                const err = new Error()
                err.name = "Not Acceptable"
                err.status = 406
                err.message = "Could not find the User"
                throw err
            }

            const del = await user.deleteOne()
            return await res.json(del)
        } catch (error) {
            next(error)
        }
    }
>>>>>>> development
}

module.exports = controller