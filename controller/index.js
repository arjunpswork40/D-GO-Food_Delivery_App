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

const addsModel = require("../models/adds-model");
const applicationStaticModel = require("../models/application-static-model");
const foodMainCategory = require("../models/food-main-category");
const offerModel = require("../models/offer");
const serviceCategoryModel = require("../models/serviceCategory-model");
const adminModel = require("../models/admin-model");
const { faker } = require('@faker-js/faker');
const foodSubCategory = require("../models/food-sub-category")
const userModel = require("../models/user-model")
const foodModel = require("../models/food-model")

class controller {
        static getRandomImage() {
            return `hotel/${faker.string.uuid()}.${faker.system.commonFileExt()}`;
        }
        static generateValidName() {
            let name = faker.person.firstName();
            // Ensure name contains only alphabets and is between 2-15 characters
            while (!/^[a-zA-Z]{2,15}$/.test(name)) {
                name = faker.person.firstName();
            }
            return name;
        };

        static generateValidCompanyName() {
            let name = faker.person.firstName();
            // Ensure name contains only alphabets and is between 2-15 characters
            while (!/^[a-zA-Z]{2,15}$/.test(name)) {
                name = faker.company.name()
            }
            return name;
        };

        static getRandomCoordinates (baseCoordinates, maxDistanceInKm) {
            const getRandomOffset = () => (Math.random() - 0.5) * maxDistanceInKm * 0.009; // Approx 1km = 0.009°
            return [
                baseCoordinates[0] + getRandomOffset(),
                baseCoordinates[1] + getRandomOffset()
            ];
        }
        static async dummyData(req,res,next) {

            try{

                const users = await userModel.find({role: "owner"}).limit(20);

                let foodData = [];
                for (let owner of users) { // Use for...of to iterate over the user objects
                    let foodItem = [];
                    for (let i = 0; i < 10; i++) {
                        let foodName = faker.commerce.productName();
                        while (!foodName || foodItem.some(item => item.name === foodName)) {
                            // Generate a new name if it's null or already exists in the current hotel's food items
                            foodName = faker.commerce.productName();
                        }
                        let food = {
                            name: foodName,
                            description: faker.commerce.productDescription(),
                            available: faker.datatype.boolean(),
                            category: faker.commerce.department(),
                            price: faker.commerce.price(10, 100, 2), // Price between 10 and 100 with 2 decimal points
                            images: Array.from({ length: 4 }, () => controller.getRandomImage()), // Generate 4 random food image URLs
                        };
                        foodItem.push(food);
                    }
                    let foodEntry = new foodModel({
                        hotelId: owner._id, // Access owner._id properly
                        foodItems: foodItem,
                    });
                    foodData.push(foodEntry);
                }
                

                await foodModel.insertMany(foodData);
                console.log('foodModel data saved');

            // const generateValidName = () => {
            //     let name = faker.person.firstName();
            //     // Ensure name contains only alphabets and is between 2-15 characters
            //     while (!/^[a-zA-Z]{2,15}$/.test(name)) {
            //         name = faker.person.firstName();
            //     }
            //     return name;
            // };
            
            // const generateValidCompanyName = () => {
            //     let name = faker.person.firstName();
            //     // Ensure name contains only alphabets and is between 2-15 characters
            //     while (!/^[a-zA-Z]{2,15}$/.test(name)) {
            //         name = faker.company.name();
            //     }
            //     return name;
            // };
            // const generateUniqueEmail = (index) => {
            //     return faker.internet.email(faker.person.firstName(), faker.lorem.text());
            // };

            // let owners = [];
            // let offers = [];
            // let baseCoordinates = [11.399340, 75.956032]; // Reference latitude and longitude
            // let addsData = [];
            // let foodMainCategoryData = [];
            // let appStaticaDataDummy = [];
            // let serviceCategoryDummy = [];
            // let subCategories = [];
            // // Generate Owners
            // for (let i = 0; i < 30; i++) {
            //     const partnerBrand = Math.random() > 0.5;
            //     const coordinates = controller.getRandomCoordinates(baseCoordinates, 10);
                
            //     const addsDataExp = new addsModel({
            //         type: 'banner',
            //         images: Array.from({ length: 4 }, controller.getRandomImage),
            //         tagline: faker.lorem.sentence(),
            //     })
            //     addsData.push(addsDataExp)
            //     const foodMainCategoryExp = new foodMainCategory({
            //         name:generateValidCompanyName(),
            //         description: faker.lorem.sentence(),
            //         images: Array.from({ length: 4 }, controller.getRandomImage),
            //     })
            //     foodMainCategoryData.push(foodMainCategoryExp);

            //     const appStaticaDataExp = new applicationStaticModel({
            //         heading: faker.company.catchPhrase(),
            //         description: faker.lorem.sentence(),
            //     })
            //     appStaticaDataDummy.push(appStaticaDataExp)
            //     const owner = new User({
            //         hotelDetails: {
            //             partnerBrand,
            //             priorityIndex: faker.number.int({ min: 1, max: 100 }),
            //             name: generateValidName(),
            //             description: faker.lorem.sentence(),
            //             location: {
            //                 address: faker.address.streetAddress(),
            //                 city: faker.address.city(),
            //                 state: faker.address.state(),
            //                 zipcode: faker.address.zipCode(),
            //                 type: 'Point',
            //                 coordinates
            //             },
            //             contactNumber: faker.phone.number(),
            //             openingHours: {
            //                 open: '10:00 AM',
            //                 close: '10:00 PM'
            //             },
            //             images: {
            //                 hotelImages: Array.from({ length: 4 }, controller.getRandomImage),
            //                 menuImages: Array.from({ length: 3 }, controller.getRandomImage),
            //                 hotelMainImage: Array.from({ length: 2 }, controller.getRandomImage),
            //             }
            //         },
            //         ratings: {
            //             averageRating: faker.number.float({ min: 1, max: 5 }),
            //             totalRatings: faker.number.float({ min: 0, max: 2 }),
            //         },
            //         status: 'approved',
            //         name: generateValidName(),
            //         email: generateUniqueEmail(),
            //         password: passAuth.hashPassword('1234'),
            //         role: 'owner'
            //     });
            //     owners.push(owner);
            //     const serviceCategoryExp =new serviceCategoryModel({
            //         title: faker.company.catchPhrase(),
            //         description: faker.lorem.sentence(),
            //         main_image: 'hotel/lll.jpg',
            //     })
            //     serviceCategoryDummy.push(serviceCategoryExp)
            //     console.log('loop = '+i)
            // }
            // const uniqueOwners = Array.from(new Set(owners.map(a => a.email)))
            // .map(email => owners.find(a => a.email === email));
            // const savedOwners = await User.insertMany(uniqueOwners);
            // console.log('owners saved');

            // // Generate Offers
            // savedOwners.forEach(owner => {
            //     const numberOfOffers = faker.number.int({ min: 1, max: 5 }); // Random number of offers per owner (1 to 5)
            //     for (let j = 0; j < numberOfOffers; j++) {
            //         const offer = new offerModel({
            //             deductionAmount: faker.number.int({ min: 10, max: 500 }),
            //             name: faker.commerce.productName(),
            //             ownerId: owner._id,
            //             mainOffer: Math.random() > 0.5,
            //         });
            //         offers.push(offer);
            //     }
            // });
            // const savedMainCategory = await foodMainCategory.insertMany(foodMainCategoryData)
            // console.log('food main category saved');

            // for (let i = 0; i < 30; i++) {
            //     const owner = faker.helpers.arrayElement(savedOwners);
            //     const mainCategory = faker.helpers.arrayElement(savedMainCategory);
            //     const subCategory = new foodSubCategory({
            //         name: faker.commerce.productName(),
            //         description: faker.lorem.sentence(),
            //         mainCategoryId: mainCategory._id,
            //         ownerId: owner._id,
            //         images: Array.from({ length: 3 }, controller.getRandomImage),
            //     });
    
            //     subCategories.push(subCategory);
            // }
            
            

            // await foodSubCategory.insertMany(subCategories);    
            // await offerModel.insertMany(offers);
            // console.log('offers saved');
            // await addsModel.insertMany(addsData);
            // console.log('adds saved');
            // await applicationStaticModel.insertMany(appStaticaDataDummy);
            
            // console.log('static data saved');
            // await serviceCategoryModel.insertMany(serviceCategoryDummy)
            // console.log('service category data saved');
            // let cc = new User({
            //     name: 'Arjusnss',
            //     email: 'arj@arj.com',
            //     password: passAuth.hashPassword('1234'),
            //     role: 'customer',
            //     customerDetails: {
            //         currentLocation: {
            //             type: 'Point',
            //             coordinates: [11.399340, 75.956032],
            //         }
            //     }
            // });
            // await cc.save();

            return res.status(200).json(makeJsonResponse('Success', {}, { message: "completed" }, 200, true));
        
        } catch (error) {
            console.log(error);

            return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message ?? "Internal error occured" }, 500, false));
        }
    }


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
}

module.exports = controller