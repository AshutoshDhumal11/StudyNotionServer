const express = require("express");
const router = express.Router();

// ************* Import Controllers *************

const { auth, isInstructor } = require("../middlewares/auth");
const {
  deleteAccount,
  updateProfile,
  getAllUserDetails,
  updateProfilePicture,
  getEnrolledCourses,
  instructorDashboard,
} = require("../controllers/Profile");

// ************* Define Routes *************

// Delet User Account
router.delete("/deleteProfile", auth, deleteAccount);
router.put("/updateProfile", auth, updateProfile);
router.get("/getUserDetails", auth, getAllUserDetails);

// Get Enrolled Courses
router.get("/getEnrolledCourses", auth, getEnrolledCourses);
router.put("/updateDisplayPicture", auth, updateProfilePicture);
router.get("/instructorDashboard", auth, isInstructor, instructorDashboard);

// ************* Export *************
module.exports = router;
