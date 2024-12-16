const mongodb = require("mongodb")
const binary = mongodb.Binary
const Food = require("../models/food-model")
const User = require("../models/user-model")
const Admin = require("../models/admin-model")
const { makeJsonResponse } = require("../utils/response")
const passAuth = require("../middleware/passwordHash-middleware")
const auth = require("../middleware/auth-middleware")

class controller {
  static async login(req, res, next) {
    const { email, password } = req.body
    try {
      if (!email || !password) {
        return res.status(400).json(makeJsonResponse('Bad Request', {}, { message: "Please input all details" }, 400, false));
      }

      const user = await Admin.findOne({ "email": email })

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
      console.log(error);

      return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message ?? "Internal error occured" }, 500, false));
    }
  }

  // need to remove on deploy
  static async dummyAdmin(req, res, next) {
    const { name, password, email } = req.body;

    try {


      // Hash the password and create the user in one go
      const newUser = new Admin({
        password: passAuth.hashPassword("admin@123.com"), // Hash the password directly in the user creation
        email: "admin@123.com"
      });

      // Save the new user and handle the response
      await newUser.save();

      return res.status(200).json(makeJsonResponse('Success', {}, { message: "User created successfully", user: auth.authJSON(newUser) }, 200, true));

    } catch (error) {
      console.error(`Error creating user: ${error.code} - ${error.message}`);
      return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message || "Internal error occurred" }, 500, false));
    }
  }
  static async newFood(req, res, next) {
    let { name, description, price, category } = req.body
    let files = req.files;

    try {
      if (!name || !price || !description) {
        const err = new Error()
        err.name = "Bad Request"
        err.status = 400
        err.message = "Please fill all required details"
        throw err
      }

      const foundName = await Food.findOne({ "name": name })

      if (foundName) {
        return res.status(406).json(makeJsonResponse('Not Acceptable', {}, { message: "This food name is already exist" }, 406, false));
      }
      const images = files?.length > 0 ? files.map(item => item.path) : [];
      const food = new Food({
        name,
        description,
        price,
        category,
        images: images

      })
      await food.save()

      return res.status(200).json(makeJsonResponse('Success!', { data: food, message: `${food.name} of price ${price} was added successfully` }, {}, 200, false));

    } catch (error) {
      next(error)
    }
  }

  static async allFoods(req, res, next) {
    try {
      let foods = await Food.find()
      return await res.status(200).json(makeJsonResponse('All Foods', { message: "All Foods", foods }, {}, 200, true));
    } catch (error) {
      return await res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message ?? "Internal error occured" }, 500, true));
      next(error)
    }
  }

  static async deleteFood(req, res, next) {
    try {
      let foodId = req.params.id
      let foundFood = await Food.findOne({ _id: foodId })
      if (!foundFood) {
        const err = new Error()
        err.name = "Not Found"
        err.status = 404
        err.message = "The food you looking for wasnt found sir"
        throw err
      }

      const del = await foundFood.deleteOne()
      res.json({ "message": `${del.name} was delete successfully` })
    } catch (error) {
      next(error)
    }
  }

  static async makeAdmin(req, res, next) {
    try {
      if (req.user.role === "admin") {
        const toBeAdmin = req.body.userToBeAdmin
        const findUser = await User.findOne({ email: toBeAdmin })
        if (!findUser) {
          return res.status(404).json("User Not Found, make sure the user is registered")
        }
        if (findUser.role === "admin") {
          return res.status(406).json("Not Acceptable, this user is already an admin")
        }
        await User.findOneAndUpdate(
          {
            email: toBeAdmin
          },
          {
            role: "admin"
          },
          {
            upsert: true
          }
        )
        res.status(200).json(`${toBeAdmin} is now an admin by ${req.user.name}`)
      } else {
        if (req.user.role !== "admin") {
          throw new Error("sorry, you cant access this function")
        }
      }
    } catch (error) {
      next(error)
    }
  }

  static async makeFoodAvailable(req, res, next) {
    try {
      const foodToMakeAvaiableOrNot = req.body.foodName.toString()
      const findFood = await Food.findOne({ name: foodToMakeAvaiableOrNot })

      if (!findFood) {
        return res.status(404).json(`The food with the name ${foodToMakeAvaiableOrNot} is not a food here yet, do well to add the food first`)
      }

      if (findFood.available) {
        await findFood.updateOne(
          {
            available: false
          },
          {
            upsert: true
          }
        )
        return res.status(200).json(`${findFood.name} is no more available for order`)
      }

      if (!findFood.available) {
        await findFood.updateOne(
          {
            available: true
          },
          {
            upsert: true
          }
        )
        return res.status(200).json(`${findFood.name} is now available for ordering`)
      }
    } catch (error) {
      next(error)
    }
  }

  //Delivery Partner list
  static async allpartners(req, res, next) {
    try {
      let Users = await User.find({ role: "delivery_partner" })
      return await res.status(200).json(makeJsonResponse('All delivery partner', { message: "All delivery partner", Users }, {}, 200, true));
    } catch (error) {
      return await res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message ?? "Internal error occured" }, 500, true));
      next(error)
    }
  }


}


module.exports = controller