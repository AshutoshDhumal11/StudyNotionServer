const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const mongoose = require("mongoose");

// create rating
exports.createRatingAndReview = async (req, res) => {
  try {
    // get user id
    const userId = req.user.id;

    // fetch data from req body
    const { courseId, rating, review } = req.body;

    // check if user is enrolled in course
    const courseDetails = await Course.findOne({
      _id: courseId,
      studentsEnrolled: { $elemMatch: { $eq: userId } },
    });

    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "Student is not enrolled in the course",
      });
    }

    // check if user already gives review
    const alreadyReviewed = await RatingAndReview.findOne({
      user: userId,
      course: courseId,
    });

    if (alreadyReviewed) {
      return res.status(403).json({
        success: false,
        message: "Course is alerady reviewed by the user",
      });
    }

    // create rating and review
    const newRatingReview = await RatingAndReview.create({
      rating,
      review,
      course: courseId,
      user: userId,
    });

    // attach this review with the course
    const updatedCourseDetails = await Course.findByIdAndUpdate(
      courseId,
      {
        $push: {
          ratingAndReviews: newRatingReview._id,
        },
      },
      { new: true }
    );

    // if we not give new: true we have to explicitly save the updatedCourseDetails
    // await updatedCourseDetails.save();

    console.log(updatedCourseDetails);

    // return response
    return res.status(200).json({
      success: true,
      message: "Rating and Review created successfully",
      newRatingReview,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get average rating
exports.getAverageRating = async (req, res) => {
  try {
    // Get course ID
    const courseId = req.body.courseId;

    // calculate average rating
    const result = await RatingAndReview.aggregate([
      {
        $match: {
          course: new mongoose.Types.ObjectId(courseId), // convert courseId to object
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    // return rating
    if (result.lenght > 0) {
      return res.status(200).json({
        success: true,
        averageRating: result[0].averageRating,
      });
    }

    // if no rating review exist
    return res.status(200).json({
      success: true,
      message: "Average rating is 0, no ratings given till now",
      averageRating: 0,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error in finding rating for the course",
      error: error.message,
    });
  }
};

// get all rating and reviews
exports.getAllRatingAndReviews = async (req, res) => {
  try {
    const allReviews = await RatingAndReview.find({})
      .sort({ rating: "desc" })
      .populate({
        path: "User",
        select: "firstname lastname image email", // fields that we want to popualte
      })
      .populate({
        path: "Course",
        select: "courseName",
      })
      .exec();

    // return response
    return res.status(200).json({
      success: true,
      message: "All reviews fetched successfully",
      data: allReviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error in getting reviews for all the courses",
      error: error.message,
    });
  }
};
