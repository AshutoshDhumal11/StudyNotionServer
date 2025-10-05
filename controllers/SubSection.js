const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
require("dotenv").config();

// Create subsection
exports.createSubSection = async (req, res) => {
  try {
    // Fetch data
    const { sectionId, title, description } = req.body;

    // Extract video file
    const video = req.files.videoFile;

    // Validation
    if (!sectionId || !title || !description || !video) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // upload video to cloudinary then we get secure_url
    const uploadDetails = await uploadImageToCloudinary(
      video,
      process.env.FOLDER_NAME
    );
    console.log(uploadDetails);

    // Create a subsection
    const subSectionDetails = await SubSection.create({
      title: title,
      timeDuration: `${uploadDetails.duration}`,
      description: description,
      videoUrl: uploadDetails.secure_url,
    });

    // update corresponding section with this new subSection
    const updatedSectionDetails = await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $push: {
          subSection: subSectionDetails._id,
        },
      },
      { new: true }
    ).populate("subSection");
    // .exec(); // not required because we are using await

    console.log(updatedSectionDetails);

    // return response
    return res.status(200).json({
      success: true,
      message: "Sub Section created successfully",
      data: updatedSectionDetails,
    });
  } catch (error) {
    console.error(error);
    return res.status(501).json({
      success: false,
      message: "Error in SubSection creation",
      error: error.message,
    });
  }
};

// Update subsection
exports.updateSubSection = async (req, res) => {
  try {
    // Fetch data
    const { title, sectionId, description, subSectionId } = req.body;

    // Extract file video
    const video = req.files.videoFile;

    // get subSection details
    const subSection = await SubSection.findById(subSectionId);

    if (!subSection) {
      return res.status(404).json({
        success: false,
        message: "SubSection not found",
      });
    }

    // Validation
    if (!title || !description || !video) {
      return res.status(400).json({
        success: false,
        message: "All fields are necessary",
      });
    }

    // upload video to cloudinary
    const uploadDetails = await uploadImageToCloudinary(
      video,
      process.env.FOLDER_NAME
    );

    // update SubSection
    const updatedSubSection = await SubSection.findByIdAndUpdate(
      subSectionId,
      {
        title: title,
        description: description,
        timeDuration: `${uploadDetails.duration}`,
        videoUrl: uploadDetails.secure_url,
      },
      { new: true }
    )
      .populate()
      .exec();

    console.log(updatedSubSection);

    // find section
    const updatedSection = await Section.findById(sectionId).populate(
      "subSection"
    );

    // return response
    return res.status(200).json({
      success: true,
      message: "Sub section updated successfully",
      data: updatedSection,
    });
  } catch (error) {
    console.error(error);
    return res.status(501).json({
      success: false,
      message: "Error in SubSection updation",
      error: error.message,
    });
  }
};

// Delete subsection
exports.deleteSubSection = async (req, res) => {
  try {
    // fetch data
    const { sectionId, subSectionId } = req.body;

    // delete subSection form section
    await Section.findByIdAndUpdate(
      { sectionId },
      {
        $pull: {
          subSection: subSectionId,
        },
      },
      { new: true }
    );

    // Validation
    if (!subSectionId) {
      return res.status(400).json({
        success: false,
        message: "subSection Id missing",
      });
    }

    // check subSection is present or not
    const subSection = await SubSection.findOne(subSectionId);
    if (!subSection) {
      return res.status(404).json({
        success: false,
        message: "SubSection not found",
      });
    }

    await SubSection.findByIdAndDelete(subSectionId);

    // get updatedSection and return it
    const updatedSection = await Section.findById(sectionId).populate(
      "subSection"
    );

    return res.status(200).json({
      success: true,
      message: "SubSection deleted successfully",
      data: updatedSection,
    });
  } catch (error) {
    console.error(error);
    return res.status(501).json({
      success: false,
      message: "Error in SubSection deletion",
      error: error.message,
    });
  }
};
