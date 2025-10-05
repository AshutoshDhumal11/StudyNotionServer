const express = require("express");
const router = express.Router();

// ************* Import Controllers *************

const { contactUsController } = require("../controllers/ContactUs");

// ************* Define Routes *************

router.post("/contact", contactUsController);

// ************* Export *************

module.exports = router;
