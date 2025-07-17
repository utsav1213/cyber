const express = require("express");
const cors = require("cors");
const path = require("path");
const uploadTestRoutes = require("./routes/test-upload");
const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const generateKeys = require("./routes/generateKeys");
const signRoute = require("./routes/sign");

app.use("/generate-keys", generateKeys);
app.use("/sign", signRoute);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
