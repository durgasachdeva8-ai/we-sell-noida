const mongoose = require("mongoose");

const LeadSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,

  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property"
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("Lead", LeadSchema);