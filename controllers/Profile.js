const Profile = require("../models/Profile");
const User = require("../models/User");
const Course = require("../models/Course");
const CourseProgress = require("../models/CourseProgress");
const mongoose = require("mongoose");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const { convertSecondsToDuration } = require("../utils/secToDuration");

exports.updateProfile = async (req, res) => {
  try {
    // Fetch data
    const {
      firstName = "",
      lastName = "",
      dateOfBirth = "",
      about = "",
      contactNo,
      gender,
    } = req.body;

    // Get userId
    const userId = req.user.id;
    console.log("userId is : ", userId);

    // Validation
    if (!contactNo || !gender) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // find user
    const userDetails = await User.findById(userId);

    // update userDetails
    const user = await User.findByIdAndUpdate(userId, {
      firstName,
      lastName,
    });

    await user.save();

    // find profile details using profileId
    const profileDetails = await Profile.findById(
      userDetails.additionalDetails
    );

    // update profile
    profileDetails.dateOfBirth = dateOfBirth;
    profileDetails.about = about;
    profileDetails.gender = gender;
    profileDetails.contactNo = contactNo;

    await profileDetails.save();

    // get the updated profileDetails
    const updatedUserDetails = await User.findById(userId)
      .populate("additionalDetails")
      .exec();

    // return response
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      updatedUserDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error occure in profile updation",
      error: error.message,
    });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    // fetch id
    const userId = req.user.id;

    // Validation
    const userDetails = await User.findById(userId);
    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete Profile
    await Profile.findByIdAndDelete({
      _id: new mongoose.Types.ObjectId(userDetails.additionalDetails),
    });
    for (const courseId of userDetails.courses) {
      await Course.findByIdAndUpdate(
        { courseId },
        {
          $pull: {
            studentsEnrolled: userId,
          },
        },
        { new: true }
      );
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    // return response
    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });

    await CourseProgress.deleteMany({ userId: userId });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in account deletion",
      error: error.message,
    });
  }
};

// getAllUserDetails
exports.getAllUserDetails = async (req, res) => {
  try {
    // get id
    const userId = req.user.id;

    // validation and get user details
    const userDetails = await User.findById(userId)
      .populate("additionalDetails")
      .exec();

    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: "userDetails missing",
      });
    }

    // return response
    return res.status(200).json({
      success: true,
      message: "All user details returned successfully",
      userDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error in fetching user details",
    });
  }
};

// Update display picture
exports.updateProfilePicture = async (req, res) => {
  try {
    // get userId
    const userId = req.user.id;

    console.log("userId is : ", userId);

    // get new profile picture
    const profilePicture = req.files.profileImage;

    const uploadImage = await uploadImageToCloudinary(
      profilePicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    );
    console.log(uploadImage);

    const updatedProfile = await User.findByIdAndUpdate(
      { _id: userId },
      { image: uploadImage.secure_url },
      { new: true }
    );

    // send response
    res.send({
      success: true,
      message: "Profile picture updated successfully",
      data: updatedProfile,
    });
  } catch (error) {
    console.log("Error in profile picture updation.");
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get enrolled courses
exports.getEnrolledCourses = async (req, res) => {
  try {
    // get user id
    const userId = req.user.id;

    // fetch user details
    let userDetails = await User.findOne({ _id: userId })
      .populate({
        path: "courses",
        populate: {
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        },
      })
      .exec();

    userDetails = userDetails.toObject();

    var subsectionLength = 0;
    for (var i = 0; i < userDetails.courses.length; i++) {
      let totalDurationInSeconds = 0;
      subsectionLength = 0;
      for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
        totalDurationInSeconds += userDetails.courses[i].courseContent[
          j
        ].subSection.reduce(
          (acc, curr) => acc + parseInt(curr.timeDuration),
          0
        );
        userDetails.courses[i].totalDuration = convertSecondsToDuration(
          totalDurationInSeconds
        );
        subsectionLength +=
          userDetails.courses[i].courseContent[j].subSection.length;
      }
      let courseProgressCount = await CourseProgress.findOne({
        courseID: userDetails.courses[i]._id,
        userId: userId,
      });
      courseProgressCount = courseProgressCount?.completedVideos.length;
      if (subsectionLength === 0) {
        userDetails.courses[i].progressPercentage = 100;
      } else {
        // To make it up to 2 decimal point
        const multiplier = Math.pow(10, 2);
        userDetails.courses[i].progressPercentage =
          Math.round(
            (courseProgressCount / subsectionLength) * 100 * multiplier
          ) / multiplier;
      }
    }

    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: `user with id: ${userId} is not found`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Enrolled courses of ${userDetails.firstName} ${userDetails.lastName} are found successfully`,
      data: userDetails.courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error in fetching enrolled course Information",
    });
  }
};

// Instructor Dashboard :-
exports.instructorDashboard = async (req, res) => {
  try {
    // get user id
    const userId = req.user.id;

    console.log("in instructor dashboard");
    // get CourseDetails
    const coursesDetails = await Course.find({ instructor: userId });

    console.log("mid instructor dashboard");

    const courseData = coursesDetails.map((course) => {
      const totalStudentEnrolled = course?.studentsEnrolled?.length;
      const totalAmountGenerated = totalStudentEnrolled * course.price;

      // create a new object with additional fields
      const courseDataWithStats = {
        _id: course._id,
        courseName: course.courseName,
        courseDescription: course.courseDescription,
        totalStudentEnrolled: totalStudentEnrolled,
        totalAmountGenerated: totalAmountGenerated,
      };

      return courseDataWithStats;
    });
    console.log("out instructor dashboard");

    // return response
    return res.status(200).json({
      success: true,
      message: "Instructor data is fetched successfully",
      data: courseData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error in found instuructor dashboard",
    });
  }
};
