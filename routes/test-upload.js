const express = require("express");
const multer = require("multer");

const router = express.Router();

const storage = multer.memoryStorage(); // ✅ use memoryStorage
const upload = multer({ storage });

router.post("/upload-test", upload.any(), (req, res) => {
  console.log("🧾 DEBUG FILE UPLOAD OUTPUT:");
  console.log("req.files =", req.files);
  console.log("req.body =", req.body);

  res.status(200).json({
    message: "✅ Upload received",
    files: req.files,
    body: req.body,
  });
});

module.exports = router;
