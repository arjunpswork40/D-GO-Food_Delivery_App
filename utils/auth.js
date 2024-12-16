const bcrypt = require('bcrypt');
require('dotenv').config();
const { makeJsonResponse } = require('./response');

module.exports = {
    hashPassword: async (password) => {

        console.log('utility reached ==> ');
        console.log(`hhh=> ${password}`)
        const saltValueFromEnv = process.env.PASSWORD_HASH_SALT || 10;
        console.log(saltValueFromEnv)
        try {
            const salt = await new Promise((resolve, reject) => {
                bcrypt.genSalt(Number(saltValueFromEnv), (err, salt) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(salt);
                    }
                });
            });
            console.log('7777777')
            const hash = await new Promise((resolve, reject) => {
                bcrypt.hash(password, salt, (err, hash) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(hash);
                    }
                });
            });
            console.log('------')
            console.log(hash)

            return makeJsonResponse('Password hashed successfully', { hashedValue: hash }, {}, 200, true);
        } catch (error) {
            return makeJsonResponse('Some Error Occured', {}, error, 500, false);
        }



    }
}