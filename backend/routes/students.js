const express = require('express');
const axios = require('axios');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

const router = express.Router();
const PYTHON_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

// GET /api/students
router.get('/', protect, async (req, res) => {
  const { search, department, page = 1, limit = 20 } = req.query;
  const query = { isActive: true };
  if (department) query.department = department;
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { studentId: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];
  const skip = (page - 1) * limit;
  const [students, total] = await Promise.all([
    Student.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Student.countDocuments(query),
  ]);
  res.json({ students, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// GET /api/students/:id
router.get('/:id', protect, async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(student);
});

// POST /api/students  – create + optionally register face
router.post('/', protect, async (req, res) => {
  const { name, studentId, email, department, year, phone, photo } = req.body;

  const exists = await Student.findOne({ $or: [{ studentId }, { email }] });
  if (exists) return res.status(409).json({ message: 'Student ID or email already registered' });

  const student = await Student.create({ name, studentId, email, department, year, phone, photo });

  // Register face in Python service if photo provided
  if (photo) {
    try {
      const pyRes = await axios.post(`${PYTHON_URL}/register-face`, {
        student_id: student._id.toString(),
        image_base64: photo,
      });
      if (pyRes.data.success) {
        student.faceRegistered = true;
        await student.save();
      }
    } catch (e) {
      console.warn('Python face registration failed:', e.message);
    }
  }

  res.status(201).json(student);
});

// PUT /api/students/:id
router.put('/:id', protect, async (req, res) => {
  const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  if (!student) return res.status(404).json({ message: 'Student not found' });

  // Re-register face if new photo
  if (req.body.photo) {
    try {
      await axios.post(`${PYTHON_URL}/register-face`, {
        student_id: student._id.toString(),
        image_base64: req.body.photo,
      });
      student.faceRegistered = true;
      await student.save();
    } catch (e) {
      console.warn('Python face re-registration failed:', e.message);
    }
  }

  res.json(student);
});

// DELETE /api/students/:id (soft delete)
router.delete('/:id', protect, async (req, res) => {
  const student = await Student.findByIdAndUpdate(
    req.params.id, { isActive: false }, { new: true }
  );
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json({ message: 'Student removed' });
});

// GET /api/students/meta/departments
router.get('/meta/departments', protect, async (req, res) => {
  const depts = await Student.distinct('department');
  res.json(depts);
});

module.exports = router;
