const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// ResetPasswordToken and send Email
exports.resetPasswordToken = async (req, res) => {
  try {
    // Fetch email from req.body
    const email = req.body.email;

    // Check user exist for this email
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: `This Email ${email} is not registered with us`,
      });
    }

    console.log("token not generated");
    // Generate token
    const token = crypto.randomBytes(20).toString("hex");
    console.log("token generated");

    // Update user by adding token and expiration time
    const updatedDetails = await User.findOneAndUpdate(
      { email: email },
      {
        token: token,
        resetPasswordExpires: Date.now() + 3600000,
      },
      { new: true }
    );
    console.log("Details", updatedDetails);

    // Generate frontend url
    const url = `http://localhost:3000/update-password/${token}`;
    // we have to update url after deployment

    // Send email to user containing the url
    await mailSender(
      email,
      "Password Reset",
      `Your link for email verification is ${url}, please click on it to reset your password.`
    );

    // return response
    return res.json({
      success: true,
      message:
        "Email sent successfully, please the check email and change password",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error in sending password reset email",
    });
  }
};

// Reset Password in database
exports.resetPassword = async (req, res) => {
  try {
    // Fetch user data
    const { password, confirmPassword, token } = req.body;

    // Validation
    if (password != confirmPassword) {
      return res.status(200).json({
        success: false,
        message: "Password does not match, please fill the correct password",
      });
    }

    // Get user details from database using token
    const userDetails = await User.findOne({ token: token });

    // if no entry then token is invalid
    if (!userDetails) {
      return res.status(200).json({
        success: false,
        message: "Token is invalid",
      });
    }

    // check token time
    if (userDetails.resetPasswordExpires < Date.now()) {
      return res.status(200).json({
        success: false,
        message: "Token is expired, please regenerate token",
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // update password
    const updatedPassword = await User.findOneAndUpdate(
      { token: token },
      { password: hashedPassword },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      success: false,
      message: "Something went wrong while reseting the password",
    });
  }
};
