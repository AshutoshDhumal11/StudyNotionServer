const express = require("express")
const router = express.Router()


// ************* Import Controllers *************
const { capturePayment, verifyPayment, sendPaymentSuccessfulEmail } = require("../controllers/Payments")
const { auth, isInstructor, isStudent, isAdmin } = require("../middlewares/auth")





// ************* Define Routes *************
router.post("/capturePayment", auth, isStudent, capturePayment)
router.post("/verifyPayment",auth, isStudent, verifyPayment)
router.post("/sendPaymentSuccessfulEmail", auth, isStudent, sendPaymentSuccessfulEmail);




// ************* Export *************

module.exports = router