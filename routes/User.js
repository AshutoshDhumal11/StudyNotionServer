const express = require("express")
const router = express.Router()




// ************* Import Controllers *************

const { login, signUp, sendOTP, changePassword } = require("../controllers/Auth")
const { resetPasswordToken, resetPassword } = require("../controllers/ResetPassword")
const { auth } = require("../middlewares/auth")




// ************* Define Routes *************

// Route for user login
router.post("/login", login)

// Route for user signup
router.post("/signup", signUp)

// Route for sending OTP to the user's email
router.post("/sendotp", sendOTP)

// Route for Changing the password
router.post("/changepassword", auth, changePassword)


// Route for generating a reset password token
router.post("/reset-password-token", resetPasswordToken)

// Route for resetting user's password after verification
router.post("/reset-password", resetPassword)




// ************* Export *************
module.exports = router