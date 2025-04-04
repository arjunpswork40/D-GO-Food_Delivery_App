const { makeJsonResponse } = require("../utils/response")
const {USER_TYPES} = require("../constants/user/user-constants")
const User = require("../models/user-model")
const bcrypt = require("bcrypt");
const { BCRYPT_SALT } = require("../config/index")
const nodemailer = require("nodemailer");

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
  }
});


const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

class deliveryPartner {

      static async changePassword(req, res, next) { 
        const { 
          currentPassword,
          newPassword,
          confirmPassword
         } = req.body;
        const user = req.user;
        try {
            console.log(user.role)
          if( user.role !== USER_TYPES.DELIVERY_PARTNER) {
            return res.status(400).json(makeJsonResponse('User not founxd', {}, { role:user.role, email: user.email }, 400, false)); 
          }
          const userData = await User.findById(user._id);
          if(!userData) {
            return res.status(400).json(makeJsonResponse('User not found', {}, { email: user.email }, 400, false));
          }
    
          const isMatch = bcrypt.compareSync(currentPassword, userData.password);
          if (!isMatch) {
            return res.status(400).json(makeJsonResponse('Current password is incorrect', {}, { email: user.email }, 400, false));
          }
    
          if (newPassword !== confirmPassword) {
            return res.status(400).json(makeJsonResponse('New passwords do not match', {}, { email: user.email }, 400, false));
          }
    
          userData.password = bcrypt.hashSync(newPassword, BCRYPT_SALT);
          await userData.save();
    
          return res.status(200).json(makeJsonResponse('Password updated successfully', { email: user.email }, {}, 200, true));
      
        } catch (error) {
          console.log(error)
          console.error(`Error foods:4 ${error.code} - ${error.message}`);
          return res.status(500).json(makeJsonResponse('Internal Error4', {}, { message: error.message || "Internal error occurred" }, 500, false));
        }
      }

      static async forgotPassword(req, res, next) {
          const { email, role } = req.body;
      
          try {
            const user = await User.findOne({ email,role });
      
            if (!user) {
              return res.status(404).json(makeJsonResponse('User not found',  { email }, {}, 404, false));
            }
        
            const otp = generateOTP();
            console.log(otp);
            const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 mins
            console.log(otpExpires);
            await User.updateOne({ email }, { forgot_password_otp:otp, otpExpires });
        
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Password Reset OTP",
                text: `Your OTP for password reset is ${otp}. It will expire in 10 minutes.`
            };
        
            transporter.sendMail(mailOptions, (err, info) => {
              console.log(err)
                if (err) return res.status(500).json({ message: "Error sending email" });
                return res.status(200).json(makeJsonResponse('Password Reset OTP send successfuly',  { email }, {}, 200, true));
            });
        
        
          }
          catch (error) { 
            console.error(`Error foods:5 ${error.code} - ${error.message}`);
            return res.status(500).json(makeJsonResponse('Internal Error5', {}, { message: error.message || "Internal error occurred" }, 500, false));
          }
        }
      
        static async resetPassword(req, res, next) {
          const { email, otp, newPassword, role } = req.body;
          try {
            const user = await User.findOne({ email, role });
            console.log(user.otp !== otp );
      
            if (!user || user.forgot_password_otp !== Number(otp) || new Date() > user.otpExpires) {
                return res.status(401).json(makeJsonResponse('Invalid or expired OTP',  { email,otp }, {}, 401, false));
                
            }
        
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await User.updateOne({ email }, { password: hashedPassword, otp: null, otpExpires: null });
        
            return res.status(200).json(makeJsonResponse('Password updated successfully',  { email,otp }, {}, 200, true));
        
        
          }
          catch (error) { 
            console.error(`Error foods:5 ${error.code} - ${error.message}`);
            return res.status(500).json(makeJsonResponse('Internal Error5', {}, { message: error.message || "Internal error occurred" }, 500, false));
          }
        }
}

module.exports = deliveryPartner
