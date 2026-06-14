require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

mongoose.connect(process.env.MONGO_URI);

async function createAdmin() {
  const hash = await bcrypt.hash("admin123", 10);

  await Admin.create({
    username: "admin",
    password: hash
  });

  console.log("✅ Admin Created");
  process.exit();
}

createAdmin();