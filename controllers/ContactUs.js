const { contactUsEmail } = require("../mail/templates/contactFormRes");
const mailSender = require("../utils/mailSender");

exports.contactUsController = async (req, res) => {
  // fetch data from req body
  const { email, firstName, lastName, message, phoneNo, countrycode } =
    req.body;
  console.log(req.body);

  try {
    const emailResponse = await mailSender(
      email,
      "Your Data send successfully",
      contactUsEmail(email, firstName, lastName, message, phoneNo, countrycode)
    );
    console.log("Email response is ", emailResponse);

    // return
    return res.status(200).json({
      success: true,
      message: "Email send successfully",
    });
  } catch (error) {
    console.log("Error message :", error.message);
    return res.status(200).json({
      success: false,
      message: "Something went wrong while sending email to StudyNotion",
    });
  }
};
