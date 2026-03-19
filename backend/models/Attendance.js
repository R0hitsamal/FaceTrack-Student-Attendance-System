const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  date: { type: String, required: true },           // "YYYY-MM-DD"
  timeIn: { type: String, required: true },         // "HH:MM:SS"
  status: { type: String, enum: ['present', 'late', 'absent'], default: 'present' },
  method: { type: String, enum: ['face', 'manual'], default: 'face' },
  confidence: { type: Number, default: 0 },         // face match confidence %
}, { timestamps: true });

// Prevent duplicate attendance per student per day
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
