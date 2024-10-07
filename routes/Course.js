const express = require("express")
const router = express.Router()





// ************* Import Controllers *************

// Import Course Controllers
const {createCourse, showAllCourses, getCourseDetails, getFullCourseDetails,
  editCourse, getInstructorCourses, deleteCourse} = require("../controllers/Course")


// Import Categories Controllers
const {showAllCategories, createCategory, categoryPageDetails} = require("../controllers/Category")

// Import Sections Controllers
const { createSection, updateSection, deleteSection} = require("../controllers/Section")

// Import Sub-Sections Controllers
const { createSubSection, updateSubSection, deleteSubSection} = require("../controllers/SubSection")

// Import Rating Controllers
const {createRatingAndReview, getAverageRating, getAllRatingAndReviews} = require("../controllers/RatingAndReview")

const { updateCourseProgress } = require("../controllers/CourseProgress");

// Importing Middlewares
const { auth, isInstructor, isStudent, isAdmin } = require("../middlewares/auth")







// ************* Define Routes *************

// Courses can Only be Created by Instructors
router.post("/createCourse", auth, isInstructor, createCourse)
//Add a Section to a Course
router.post("/addSection", auth, isInstructor, createSection)
// Update a Section
router.post("/updateSection", auth, isInstructor, updateSection)
// Delete a Section
router.post("/deleteSection", auth, isInstructor, deleteSection)
// Edit Sub Section
router.post("/updateSubSection", auth, isInstructor, updateSubSection)
// Delete Sub Section
router.post("/deleteSubSection", auth, isInstructor, deleteSubSection)
// Add a Sub Section to a Section
router.post("/addSubSection", auth, isInstructor, createSubSection)
// Get all Registered Courses
router.get("/getAllCourses", showAllCourses)
// Get Details for a Specific Courses
router.post("/getCourseDetails", getCourseDetails)
// Get Details for a Specific Courses
router.post("/getFullCourseDetails", auth, getFullCourseDetails)
// Edit Course routes
router.post("/editCourse", auth, isInstructor, editCourse)
// Get all Courses Under a Specific Instructor
router.get("/getInstructorCourses", auth, isInstructor, getInstructorCourses)
// Delete a Course
router.delete("/deleteCourse", deleteCourse)

router.post("/updateCourseProgress", auth, isStudent, updateCourseProgress);





// Category can Only be Created by Admin
router.post("/createCategory", auth, isAdmin, createCategory)
router.get("/showAllCategories", showAllCategories)
router.post("/getCategoryPageDetails", categoryPageDetails)




router.post("/createRating", auth, isStudent, createRatingAndReview)
router.post("/getAverageRating", getAverageRating)
router.get("/getReviews", getAllRatingAndReviews)



// ************* Export *************
module.exports = router