const express = require("express");
const app = express();

const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payments");
const courseRoutes = require("./routes/Course");
const contactUsRoute = require("./routes/Contact");

const { dbConnect } = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");

// Load environment file configuration
const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT || 4000;

//database connection
dbConnect();

//middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "https://studynotion-0q1s.onrender.com",
    credentials: true,
  })
);

// middleware for uploading media files
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp",
  })
);

//cloudinary connection
cloudinaryConnect();

// mount routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/reach", contactUsRoute);

app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "Your server is running successfully.",
  });
});

// Start server on port
app.listen(PORT, () => {
  console.log(`App is running at ${PORT}`);
});
