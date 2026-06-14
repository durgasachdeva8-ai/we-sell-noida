require("dotenv").config();
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const Admin = require("./models/Admin");
const Property = require("./models/Property");
const Lead = require("./models/Lead");
const app = express();
const nodemailer = require("nodemailer");
const ExcelJS = require("exceljs");
const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }

});

const upload = multer({ storage });

// MongoDB Connection
mongoose.connect(
"mongodb+srv://durgasachdeva8_db_user:Diksha12345@cluster0.brhoidi.mongodb.net/realestate?retryWrites=true&w=majority&appName=Cluster0"
)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ Error:", err));

// Middleware
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: "durga-secret-key",
  resave: false,
  saveUninitialized: false
}));

// EJS Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Home Page
app.get("/", async (req, res) => {

  let filter = {};

  if (req.query.location) {
    filter.location = {
      $regex: req.query.location,
      $options: "i"
    };
  }

  if (req.query.bhk) {
    filter.bhk = req.query.bhk;
  }
if (req.query.propertyType) {
  filter.propertyType = req.query.propertyType;
}
if (req.query.maxPrice) {
  filter.price = {
    $lte: req.query.maxPrice
  };
}
  const properties = await Property.find(filter);
  console.log(properties);
  const featuredProperties = await Property.find({
  featured: true
});
  res.render("home", {
  properties,
  featuredProperties,
  propertiesMap: properties
});

});

// Admin Login Page
app.get("/admin", (req, res) => {
  res.render("login");
});

// Login Process
app.post("/admin/login", async (req, res) => {

  const { username, password } = req.body;

  const admin = await Admin.findOne({ username });

  if (!admin) {
    return res.send("❌ Admin not found");
  }

  const match = await bcrypt.compare(password, admin.password);

  if (!match) {
    return res.send("❌ Wrong Password");
  }

  req.session.admin = admin._id;

  res.redirect("/dashboard");
});

// Dashboard
app.get("/dashboard", async (req, res) => {

  if (!req.session.admin) {
    return res.redirect("/admin");
  }

const totalProperties = await Property.countDocuments();
const totalLeads = await Lead.countDocuments();

const featuredProperties = await Property.countDocuments({
  featured: true
});

const availableProperties = await Property.countDocuments({
  status: "Available"
});

const soldProperties = await Property.countDocuments({
  status: "Sold"
});
const recentLeads = await Lead.find()
.sort({ createdAt: -1 })
.limit(5);
const recentProperties = await Property.find()
.sort({ createdAt: -1 })
.limit(5);
const monthlyLeads = await Lead.aggregate([

{
  $group: {
    _id: {
      month: { $month: "$createdAt" }
    },
    total: { $sum: 1 }
  }
},
{
  $sort: {
    "_id.month": 1
  }
}
]);
console.log(monthlyLeads);
const topProperty = await Property.findOne()
.sort({ views: -1 });
app.get("/property/:id", async (req, res) => {

  const property = await Property.findById(req.params.id);

  res.render("property-details", {
    property
  });

});
res.render("dashboard", {
  totalProperties,
  totalLeads,
  featuredProperties,
  availableProperties,
  soldProperties,
  recentLeads,
  recentProperties,
  topProperty,
  monthlyLeads
});
});
app.get("/properties", async (req, res) => {

  if (!req.session.admin) {
    return res.redirect("/admin");
  }

  const properties = await Property.find();

  res.render("all-properties", {
    properties
  });
});
// Add Property Page
app.get("/add-property", (req, res) => {

  if (!req.session.admin) {
    return res.redirect("/admin");
  }

  res.render("add-property");
});
app.get("/property/:id", async (req, res) => {

  const property = await Property.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  );

  res.render("property-details", {
    property
  });

});
app.get("/about", (req, res) => {
  res.render("about");
});
app.get("/contact", (req, res) => {
  res.render("contact");
});
app.get("/properties-list", async (req, res) => {

  const properties = await Property.find();

  res.render("properties-list", {
    properties
  });

});
// Save Property
app.post("/add-property",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "gallery", maxCount: 10 }
  ]),
  async (req, res) => {
  console.log("BODY =", req.body);
  console.log("FILES =", req.files);
  try {

    await Property.create({
      title: req.body.title,
      price: req.body.price,
      location: req.body.location,
      bhk: req.body.bhk,
      area: req.body.area,
      image: "/uploads/" + req.files.image[0].filename,

     gallery: req.files.gallery
  ? req.files.gallery.map(
      file => "/uploads/" + file.filename
    )
  : [],
      description: req.body.description,
      mapLink: req.body.mapLink,
      propertyType: req.body.propertyType,
      status: req.body.status,
      featured: req.body.featured ? true : false,

      latitude: req.body.latitude,
      longitude: req.body.longitude,
    });

    res.send("✅ Property Saved Successfully");

  } catch (err) {

    console.log(err);
    res.send("❌ Error Saving Property");

  }

});

app.get("/property/:id", async (req, res) => {

  const property = await Property.findById(req.params.id);

  res.render("property-details", {
    property
  });

});
app.get("/delete-property/:id", async (req, res) => {

  if (!req.session.admin) {
    return res.redirect("/admin");
  }

  await Property.findByIdAndDelete(req.params.id);

  res.redirect("/properties");

});
app.get("/edit-property/:id", async (req, res) => {

  if (!req.session.admin) {
    return res.redirect("/admin");
  }

  const property = await Property.findById(req.params.id);

  res.render("edit-property", {
    property
  });

});
app.post("/edit-property/:id", async (req, res) => {
  console.log("BODY DATA =", req.body);
  await Property.findByIdAndUpdate(
    req.params.id,
    {
      title: req.body.title,
      price: req.body.price,
      location: req.body.location,
      bhk: req.body.bhk,
      area: req.body.area,
      image: req.body.image,
      description: req.body.description,
      mapLink: req.body.mapLink,
      propertyType: req.body.propertyType,
      status: req.body.status,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      featured: req.body.featured ? true : false,
    }
  );

  res.redirect("/properties");

});
app.get("/leads", async (req, res) => {

  if (!req.session.admin) {
    return res.redirect("/admin");
  }

  const leads = await Lead.find()
    .populate("propertyId")
    .sort({ createdAt: -1 });

  console.log(leads);

  res.render("leads", {
    leads
  });

});
app.get("/delete-lead/:id", async (req, res) => {

  if (!req.session.admin) {
    return res.redirect("/admin");
  }

  await Lead.findByIdAndDelete(req.params.id);

  res.redirect("/leads");

});
app.post("/send-lead", async (req, res) => {
const property = await Property.findById(req.body.propertyId);
console.log("PROPERTY =", property);
  try {

    await Lead.create({
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      propertyId: req.body.propertyId
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "🏠 New Property Lead Received",
      html: `
         <h2>🏠 New Property Lead Received</h2>

  <hr>

  <h3>Customer Details</h3>

  <p><b>Name:</b> ${req.body.name}</p>
  <p><b>Phone:</b> ${req.body.phone}</p>
  <p><b>Email:</b> ${req.body.email}</p>

  <hr>

  <h3>Property Details</h3>

  <p><b>Title:</b> ${property.title}</p>
  <p><b>Location:</b> ${property.location}</p>
  <p><b>Price:</b> ₹ ${property.price}</p>
  <p><b>Type:</b> ${property.propertyType}</p>
  <p><b>Status:</b> ${property.status}</p>

  <hr>

  <p>
    <b>Property Link:</b>
    <a href="http://localhost:3000/property/${property._id}">
      View Property
    </a>
  </p>

      `
    });

    res.send("✅ Inquiry Sent Successfully");

  } catch (err) {

    console.log(err);
    res.send("❌ Error Sending Inquiry");

  }

});
app.get("/export-leads", async (req, res) => {

  if (!req.session.admin) {
    return res.redirect("/admin");
  }

  const leads = await Lead.find()
    .populate("propertyId");

  const workbook = new ExcelJS.Workbook();

  const worksheet =
    workbook.addWorksheet("Leads");

  worksheet.columns = [
    {
      header: "Name",
      key: "name",
      width: 25
    },
    {
      header: "Phone",
      key: "phone",
      width: 20
    },
    {
      header: "Email",
      key: "email",
      width: 35
    },
    {
      header: "Property",
      key: "property",
      width: 30
    }
  ];

  leads.forEach((lead) => {

    worksheet.addRow({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      property: lead.propertyId
        ? lead.propertyId.title
        : "N/A"
    });

  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=leads.xlsx"
  );

  await workbook.xlsx.write(res);

  res.end();

});
// Logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin");
});

// Server
app.listen(process.env.PORT || 3000, () => {
  console.log(`🚀 Server running on http://localhost:${process.env.PORT || 3000}`);
});