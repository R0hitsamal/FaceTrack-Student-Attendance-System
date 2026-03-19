const express = require('express');
const axios = require('axios');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

const router = express.Router();
const PYTHON_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

const todayStr = () => new Date().toISOString().split('T')[0];
const timeStr = () => new Date().toLocaleTimeString('en-GB');

// GET /api/attendance/today
router.get('/today', protect, async (req, res) => {
  const records = await Attendance.find({ date: todayStr() })
    .populate('student', 'name studentId department photo')
    .sort({ createdAt: -1 });
  res.json(records);
});

// GET /api/attendance  – filterable
router.get('/', protect, async (req, res) => {
  const { from, to, studentId, status, page = 1, limit = 30 } = req.query;
  const query = {};
  if (from && to) query.date = { $gte: from, $lte: to };
  else if (from) query.date = { $gte: from };
  else if (to) query.date = { $lte: to };
  if (studentId) query.student = studentId;
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const [records, total] = await Promise.all([
    Attendance.find(query)
      .populate('student', 'name studentId department photo')
      .sort({ date: -1, timeIn: -1 })
      .skip(skip).limit(Number(limit)),
    Attendance.countDocuments(query),
  ]);
  res.json({ records, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// POST /api/attendance/recognize  – from live camera frame
router.post('/recognize', protect, async (req, res) => {
  const { image_base64 } = req.body;
  if (!image_base64) return res.status(400).json({ message: 'No image provided' });

  let studentMongoId, confidence;
  try {
    const pyRes = await axios.post(`${PYTHON_URL}/recognize`, { image_base64 });
    if (!pyRes.data.matched) return res.json({ matched: false, message: 'No face matched' });
    studentMongoId = pyRes.data.student_id;
    confidence = pyRes.data.confidence;
  } catch (e) {
    return res.status(502).json({ message: 'Face service unavailable', error: e.message });
  }

  const student = await Student.findById(studentMongoId);
  if (!student) return res.status(404).json({ message: 'Student record not found' });

  const date = todayStr();
  const now = new Date();
  const cutoff = new Date();
  cutoff.setHours(9, 15, 0, 0); // 09:15 AM cutoff for "late"
  const status = now > cutoff ? 'late' : 'present';

  let record;
  try {
    record = await Attendance.create({
      student: student._id, date,
      timeIn: timeStr(), status, method: 'face', confidence,
    });
  } catch (e) {
    if (e.code === 11000) {
      record = await Attendance.findOne({ student: student._id, date }).populate('student', 'name studentId department photo');
      return res.json({ matched: true, alreadyMarked: true, record });
    }
    throw e;
  }

  await record.populate('student', 'name studentId department photo');
  res.json({ matched: true, alreadyMarked: false, record });
});

// POST /api/attendance/manual  – admin manually marks attendance
router.post('/manual', protect, async (req, res) => {
  const { studentId, date, status } = req.body;
  const student = await Student.findById(studentId);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const record = await Attendance.findOneAndUpdate(
    { student: student._id, date: date || todayStr() },
    { student: student._id, date: date || todayStr(), timeIn: timeStr(), status: status || 'present', method: 'manual' },
    { upsert: true, new: true }
  );
  await record.populate('student', 'name studentId department photo');
  res.json(record);
});

// GET /api/attendance/stats
router.get('/stats', protect, async (req, res) => {
  const today = todayStr();
  const total = await Student.countDocuments({ isActive: true });
  const presentToday = await Attendance.countDocuments({ date: today, status: { $in: ['present', 'late'] } });
  const lateToday = await Attendance.countDocuments({ date: today, status: 'late' });

  // Last 7 days trend
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const count = await Attendance.countDocuments({ date: ds, status: { $in: ['present', 'late'] } });
    days.push({ date: ds, count });
  }

  res.json({ total, presentToday, absentToday: total - presentToday, lateToday, trend: days });
});

// DELETE /api/attendance/:id
router.delete('/:id', protect, async (req, res) => {
  await Attendance.findByIdAndDelete(req.params.id);
  res.json({ message: 'Record deleted' });
});

module.exports = router;
