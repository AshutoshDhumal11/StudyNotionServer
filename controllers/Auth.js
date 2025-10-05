const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const Profile = require("../models/Profile");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// SendOTP
exports.sendOTP = async (req, res) => {
  try {
    // fetch email from req.body
    const { email } = req.body;

    // check if user exist
    const checkUserPresent = await User.findOne({ email });

    // if user already exists
    if (checkUserPresent) {
      return res.status(401).send({
        success: false,
        message: "User already registered",
      });
    }

    // Generate OTP
    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // check unique otp or not
    let result = await OTP.findOne({ otp: otp });

    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({ otp: otp });
    }

    const otpPayload = { email, otp };

    // create an entry for otp in database
    const otpBody = await OTP.create(otpPayload);

    // return response
    res.status(200).json({
      success: true,
      message: "OTP send successfully",
      otp,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error in sending otp",
    });
  }
};

// Singup
exports.signUp = async (req, res) => {
  try {
    // fetch data from req body
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNo,
      otp,
    } = req.body;

    // do validation on data
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the details",
      });
    }

    // check 2 passwords are getting match or not
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Password and Confirm Password values does not match, ensure that the values are correct",
      });
    }

    // check if user is already exist
    const exstingUser = await User.findOne({ email });

    if (exstingUser) {
      return res.status(400).json({
        success: false,
        message: "User already registered",
      });
    }

    // if user not registered
    // find the most recent OTP stored for the user
    const recentOTP = await OTP.find({ email })
      .sort({ createdAt: -1 })
      .limit(1);
    console.log(recentOTP);

    // validate otp
    if (recentOTP.length === 0) {
      // OTP not found
      return res.status(400).json({
        success: false,
        message: "OTP is not valid",
      });
    } else if (otp !== recentOTP[0].otp) {
      // Invalid OTP
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    let approved = "";
    approved === "Instructor" ? (approved = false) : (approved = true);

    // additional profile for user
    const profileDetails = await Profile.create({
      gender: null,
      dateofBirth: null,
      about: null,
      contactNo: null,
    });

    // create entry in database
    const user = await User.create({
      firstName,
      lastName,
      email,
      contactNo,
      password: hashedPassword,
      accountType: accountType,
      approved: approved,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/9.x/initials/svg?seed=${firstName} ${lastName}`,
    });

    // return response
    return res.status(200).json({
      success: true,
      message: "Sign up successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "User cannot be registered, try again",
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    // fetch data
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the details",
      });
    }

    // check user is exist or not
    const userExist = await User.findOne({ email: email }).populate(
      "additionalDetails"
    );

    if (!userExist) {
      return res.status(400).json({
        success: false,
        message: "User is not registered, please signup first",
      });
    }

    // Generate JWT token after password gets match
    if (await bcrypt.compare(password, userExist.password)) {
      // Create payload
      // const payload = {
      //     email: userExist.email,
      //     id: userExist._id,
      //     accountType: userExist.accountType,
      // };

      // Create token
      const token = jwt.sign(
        {
          email: userExist.email,
          id: userExist._id,
          accountType: userExist.accountType,
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      // userExist.toObject();
      // save token to user data in database
      userExist.token = token;
      userExist.password = undefined;

      // Create options to pass in cookie
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };
      // Create cookie and send response
      res.cookie("token", token, options).status(200).json({
        success: true,
        userExist,
        token,
        message: "Logged in successfully",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Password is incorrect",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Logging failure, please try again",
    });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    // get user data from req.user
    const userDetails = await User.findById(req.user.id);

    // fetch data from req body
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Validate old password
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    );

    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Password is incorrect",
      });
    }

    // update password in database after hashing it
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUserDetails = await User.findByIdAndUpdate(
      req.user.id,
      { password: hashedPassword },
      { new: true }
    );

    // send notification email of password updation
    try {
      const emailResponse = await mailSender(
        updatedUserDetails.email,
        "Password for your account has been successfully updated",
        passwordUpdated(
          updatedUserDetails.email,
          `${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
        )
      );

      console.log("Email sent successfully:", emailResponse.response);
    } catch (error) {
      console.error("Error occured while sending email");
      res.status(500).json({
        success: false,
        message: "Error occured while sending email",
      });
    }

    // Return successful response
    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Password does not change, please try again",
      error: error.message,
    });
  }
};
