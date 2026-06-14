const mongoose = require("mongoose");

const PropertySchema = new mongoose.Schema({

  title: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  location: {
    type: String,
    required: true
  },

  bhk: {
    type: Number,
    required: true
  },

  area: {
    type: String,
    required: true
  },

  image: {
    type: String,
    required: true
  },
  gallery: [{
    type: String
}],
  description: {
    type: String,
    required: true
  },

  mapLink: {
    type: String
  },

  propertyType: {
    type: String,
    enum: ["Apartment", "Villa", "Plot", "Commercial"],
    default: "Apartment"
  },

  status: {
    type: String,
    enum: ["Available", "Sold"],
    default: "Available"
  },

  featured: {
    type: Boolean,
    default: false
  },

  latitude: {
  type: Number
},

longitude: {
  type: Number
},

views: {
  type: Number,
  default: 0
}

}, {
  timestamps: true
});

module.exports = mongoose.model("Property", PropertySchema);