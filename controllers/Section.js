const Section = require("../models/Section");
const Course = require("../models/Course");
const SubSection = require("../models/SubSection");

// Create a new section
exports.createSection = async (req, res) => {
    try {
        // Fetch data
        const {sectionName, courseId} = req.body;

        // Data validation
        if(!sectionName || !courseId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // Create Section
        const newSection = await Section.create({sectionName});

        // Update course with section ObjectId
        const updatedCourseDetails = await Course.findByIdAndUpdate(
                                                            courseId,
                                                            {
                                                                $push: {
                                                                    courseContent: newSection._id 
                                                                }
                                                            },
                                                            {new: true},
                                                        ).populate({
                                                            path: "courseContent",
                                                            populate: {
                                                                path: "subSection",
                                                            }
                                                        }).exec();
        
        // return response                                                
        return res.status(200).json({
            success: true,
            message: "Section created successfully",
            updatedCourseDetails,
        });

    } catch(error) {
        return res.status(501).json({
            success:  false,
            message: "Error in section creation, please try again",
            error: error.message,
        });
    }
};

// update section
exports.updateSection = async (req, res) => {
    try {
        // Fetch data 
        const {sectionName, sectionId, courseId} = req.body;

        // Validation
        if(!sectionName || !sectionId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }
        
        // Updated section data
        const updatedSection = await Section.findByIdAndUpdate(sectionId,{sectionName: sectionName},{new: true});

        // Updated course
        const updatedCourse = await Course.findById(courseId).populate({
                                                                    path: "courseContent",
                                                                    populate: {
                                                                        path: "subSection"
                                                                    }
                                                                }).exec();                                          
        
        console.log(updatedCourse);

        return res.status(200).json({
            success: true,
            message: "Section updated successfully",
            data: updatedCourse,
        });

    } catch(error) {
        return res.status(501).json({
            success:  false,
            message: "Error in section updation, please try again",
            error: error.message,
        });
    }
};

// Delete section data
exports.deleteSection = async (req, res) => {
    try {
        // Fetdh sectionId
        const {sectionId, courseId} = req.body;

        const sectionDetails = await Section.findById(sectionId);
        // validation 
        if(!sectionDetails) {
            return res.status(400).json({
                success: false,
                message: "Section missing"
            });
        }

        // Delete corresponding subSections in the section
        await SubSection.deleteMany({_id: {$in: sectionDetails.subSection}});

        // delete section from course
        await Course.findByIdAndUpdate(couseId, {
            $pull: {
                courseContent: sectionId,
            }
        });

        // find and delete Section
        await Section.findByIdAndDelete(sectionId);

        // return updated Course
        const updatedCourse = await Course.findById(courseId)
                                                    .populate({
                                                        path: "courseContent",
                                                        populate: {
                                                            path: "subSection",
                                                        }
                                                    }).exec();

        // return response
        return res.status(200).json({
            success: true,
            message: "Section deleted successfully",
            data: updatedCourse,
        });

    } catch(error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong in section deletion",
            error: error.message,
        });
    }
};