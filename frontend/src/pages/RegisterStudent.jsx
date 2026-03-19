import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import './RegisterStudent.css';

const DEPARTMENTS = ['Computer Science','Information Technology','Electronics','Mechanical','Civil','Electrical','MBA','MCA','Other'];
const YEARS = ['1st','2nd','3rd','4th','N/A'];

export default function RegisterStudent() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { addToast } = useToast();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [form, setForm] = useState({ name:'', studentId:'', email:'', department:'Computer Science', year:'1st', phone:'', photo:'' });
  const [cameraOn, setCameraOn] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      api.get(`/students/${id}`).then(({ data }) => {
        setForm({ name: data.name, studentId: data.studentId, email: data.email, department: data.department, year: data.year, phone: data.phone || '', photo: data.photo || '' });
        if (data.photo) setCaptured(true);
      });
    }
    return () => stopCamera();
  }, [id]);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setCameraOn(true);
      setCaptured(false);
    } catch { addToast('Camera access denied', 'error'); }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraOn(false);
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    canvas.width = 320; canvas.height = 240;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0, 320, 240);
    const b64 = canvas.toDataURL('image/jpeg', 0.85);
    setForm(f => ({ ...f, photo: b64 }));
    setCaptured(true);
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setForm(f => ({ ...f, photo: ev.target.result }));
      setCaptured(true);
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.studentId.trim()) e.studentId = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    if (!form.photo) e.photo = 'Capture or upload a face photo';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/students/${id}`, form);
        addToast('Student updated!', 'success');
      } else {
        await api.post('/students', form);
        addToast('Student registered!', 'success');
      }
      navigate('/students');
    } catch (err) {
      addToast(err.response?.data?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="register-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Student' : 'Register Student'}</h1>
          <p className="page-desc">{isEdit ? 'Update student details and face data' : 'Add a new student and capture their face for recognition'}</p>
        </div>
      </div>

      <form onSubmit={submit}>
        <div className="reg-layout">
          {/* Left — form fields */}
          <div className="reg-fields card">
            <h3 className="section-sub">Personal Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className={`form-input ${errors.name ? 'input-error' : ''}`} name="name" placeholder="Arjun Kumar" value={form.name} onChange={handle} />
                {errors.name && <span className="field-err">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Student / Employee ID *</label>
                <input className={`form-input ${errors.studentId ? 'input-error' : ''}`} name="studentId" placeholder="CS2024001" value={form.studentId} onChange={handle} />
                {errors.studentId && <span className="field-err">{errors.studentId}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className={`form-input ${errors.email ? 'input-error' : ''}`} name="email" type="email" placeholder="student@college.edu" value={form.email} onChange={handle} />
                {errors.email && <span className="field-err">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" name="phone" placeholder="+91 98765 43210" value={form.phone} onChange={handle} />
              </div>
              <div className="form-group">
                <label className="form-label">Department *</label>
                <select className="form-select" name="department" value={form.department} onChange={handle}>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <select className="form-select" name="year" value={form.year} onChange={handle}>
                  {YEARS.map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : isEdit ? '✓ Update Student' : '⊕ Register Student'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/students')}>Cancel</button>
            </div>
          </div>

          {/* Right — face capture */}
          <div className="reg-camera card">
            <h3 className="section-sub">Face Photo *</h3>
            {errors.photo && <div className="field-err" style={{ marginBottom:'0.8rem' }}>{errors.photo}</div>}

            <div className="face-preview">
              {!cameraOn && !form.photo && (
                <div className="face-empty">
                  <div style={{ fontSize:'3rem', opacity:0.3 }}>◉</div>
                  <p>No photo captured</p>
                </div>
              )}
              {cameraOn && (
                <video ref={videoRef} autoPlay playsInline muted className="reg-video" style={{ transform: 'scaleX(-1)' }} />
              )}
              {!cameraOn && form.photo && (
                <img src={form.photo} alt="Captured" className="reg-photo" />
              )}
            </div>

            <canvas ref={canvasRef} style={{ display:'none' }} />

            <div className="face-actions">
              {!cameraOn ? (
                <>
                  <button type="button" className="btn btn-primary" onClick={startCamera}>◉ Open Camera</button>
                  <label className="btn btn-secondary" style={{ cursor:'pointer' }}>
                    ↑ Upload Photo
                    <input type="file" accept="image/*" style={{ display:'none' }} onChange={handleFileUpload} />
                  </label>
                </>
              ) : (
                <>
                  <button type="button" className="btn btn-primary" onClick={capturePhoto}>📸 Capture</button>
                  <button type="button" className="btn btn-secondary" onClick={stopCamera}>✕ Cancel</button>
                </>
              )}
              {captured && !cameraOn && (
                <button type="button" className="btn btn-secondary" onClick={startCamera}>↺ Retake</button>
              )}
            </div>

            <p className="camera-hint">Ensure good lighting and a clear front-facing photo. The face will be encoded and stored in the recognition database.</p>
          </div>
        </div>
      </form>
    </div>
  );
}
