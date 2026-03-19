const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  studentId: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  department: { type: String, required: true },
  year: { type: String, enum: ['1st', '2nd', '3rd', '4th', 'N/A'], default: 'N/A' },
  phone: { type: String, default: '' },
  photo: { type: String, default: '' },           // base64 or URL
  faceRegistered: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
