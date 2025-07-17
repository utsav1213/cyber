const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const QRCode = require("qrcode");

// Multer setup: handle only the file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage }).single("file");

// Signing endpoint
router.post("/", upload, async (req, res) => {
  try {
    console.log("=== NEW SIGN ROUTE ===");
    console.log("File received:", req.file?.originalname || "No file");
    console.log(
      "Body keys:",
      Object.keys(req.body).map((k) => `"${k}"`)
    );
    console.log(
      "Private key length:",
      req.body.privateKey?.length || "Missing"
    );
    console.log("Public key length:", req.body.publicKey?.length || "Missing");
    console.log("=====================");

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    if (!req.body.privateKey || !req.body.publicKey) {
      return res
        .status(400)
        .json({ error: "Both privateKey and publicKey are required" });
    }

    const filePath = req.file.path;
    const privateKey = req.body.privateKey.trim();
    const publicKey = req.body.publicKey.trim();

    // Read and hash file
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    // Sign hash using private key
    const sign = crypto.createSign("SHA256");
    sign.update(fileBuffer);
    sign.end();
    const signature = sign.sign(privateKey, "hex");

    // Save signature file
    const sigPath = filePath + ".sig";
    fs.writeFileSync(sigPath, signature);

    // Generate QR from hash
    const qrPath = `uploads/qr-${Date.now()}.png`;
    await QRCode.toFile(qrPath, hash);

    res.json({
      message: "File signed successfully",
      signaturePath: sigPath,
      hash,
      qrPath,
    });
  } catch (err) {
    console.error("Error in /sign:", err.message);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Signing failed: " + err.message });
  }
});

// Verify endpoint
router.post("/verify", upload, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    if (!req.body.signature || !req.body.publicKey) {
      return res
        .status(400)
        .json({ error: "Both signature and publicKey are required" });
    }

    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    const signature = req.body.signature.trim();
    const publicKey = req.body.publicKey.trim();

    const verify = crypto.createVerify("SHA256");
    verify.update(fileBuffer);
    verify.end();

    const isValid = verify.verify(publicKey, signature, "hex");
    const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    fs.unlinkSync(filePath);

    res.json({
      message: isValid ? "Signature is valid" : "Signature is invalid",
      isValid,
      hash,
    });
  } catch (err) {
    console.error("Error in /verify:", err.message);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Verification failed: " + err.message });
  }
});

// Generate RSA key pair
router.post("/generate-keys", (req, res) => {
  try {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    res.json({ publicKey, privateKey });
  } catch (err) {
    res.status(500).json({ error: "Key generation failed: " + err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "OK", time: new Date().toISOString() });
});

module.exports = router;
