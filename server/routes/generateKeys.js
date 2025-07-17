const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

router.get("/", (req, res) => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "pkcs1",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs1",
      format: "pem",
    },
  });

  const fingerprint = crypto
    .createHash("sha256")
    .update(publicKey)
    .digest("hex");

  const keyDir = path.join(__dirname, "../user_keys/");
  fs.writeFileSync(`${keyDir}public-${fingerprint}.pem`, publicKey);
  fs.writeFileSync(`${keyDir}private-${fingerprint}.pem`, privateKey);

  res.json({
    message: "Key pair generated!",
    fingerprint,
    publicKey,
    privateKey,
  });
});

module.exports = router;
