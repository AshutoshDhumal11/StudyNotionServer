const cloudinary = require("cloudinary").v2;

// Cloudinary connection for uploading media files.

exports.cloudinaryConnect = () => {
	try {
		cloudinary.config({
			cloud_name: process.env.CLOUD_NAME,
			api_key: process.env.API_KEY,
			api_secret: process.env.API_SECRET,
		});

		console.log("Cloudinary connection successful");
	} catch (error) {
		console.log(error);
		console.log("Cloudinary connection failed");
	}
};