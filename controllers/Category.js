const Category = require("../models/Category");
const { Mongoose } = require("mongoose");

// function for getting random integer in a given limit
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

// Create tag handler function
exports.createCategory = async (req, res) => {
  try {
    // Fetch data
    const { name, description } = req.body;

    //validation
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "All fields are nacessary",
      });
    }

    // Create entry in database
    const categoryDetails = await Category.create({
      name: name,
      description: description,
    });
    console.log(categoryDetails);

    // return response
    return res.status(200).json({
      success: true,
      message: "Category Created Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(501).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all tags handler function
exports.showAllCategories = async (req, res) => {
  try {
    const allCategorires = await Category.find({});

    // return response
    return res.status(200).json({
      success: true,
      message: "All Cateorires returned successfully",
      data: allCategorires,
    });
  } catch (error) {
    return res.status(501).json({
      success: false,
      message: "error in fetching categories",
    });
  }
};

// Category page details
exports.categoryPageDetails = async (req, res) => {
  try {
    // get category id
    const { categoryId } = req.body;

    // fetch all courses for specified category id
    const selectedCategory = await Category.findById(categoryId)
      .populate({
        path: "courses",
        match: { status: "Published" },
        populate: "ratingAndReviews",
      })
      .exec();
    // .exec() is not reqruired because we are using async await

    // validation
    if (!selectedCategory) {
      return res.status(404).json({
        success: false,
        message: "Category data not found",
      });
    }

    // if the category is get but data not found in the given category
    if (selectedCategory.length === 0) {
      console.log("No courses found for selected category");
      return res.status(404).json({
        success: false,
        message: "No courses found for the selected category",
      });
    }

    // get courses for all other categories different from givenCategory

    // this gives ids array other than the selected categoryId
    const differentCategoriesId = await Category.find({
      _id: { $ne: categoryId },
    });

    // get one category data other than the selected category
    let differentCategoryDetails = await Category.findOne(
      differentCategoriesId[getRandomInt(differentCategoriesId.length)]._id
    )
      .populate({
        path: "courses",
        match: { status: "Published" },
      })
      .exec();

    console.log("Different category data", differentCategoryDetails);

    // get most selling courses for all the categories :-

    const allCategories = await Category.find()
      .populate({
        path: "courses",
        match: { status: "Published" },
        populate: {
          path: "instructor",
        },
      })
      .exec();

    const allCourses = allCategories.flatMap((category) => category.courses);
    const mostSellingCourses = allCourses
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10);

    // return response
    return res.status(200).json({
      success: true,
      data: {
        selectedCategory,
        differentCategoryDetails,
        mostSellingCourses,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
