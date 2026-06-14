const mongoose = require("mongoose");

const LeadSchema = new mongoose.Schema({

  name: String,

  phone: String,

  email: String,

  propertyId: String

}, {
  timestamps: true
});

module.exports = mongoose.model("Lead", LeadSchema);