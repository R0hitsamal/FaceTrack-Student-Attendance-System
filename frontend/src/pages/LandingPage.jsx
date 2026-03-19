import { Link } from 'react-router-dom';
import './LandingPage.css';

const features = [
  { icon: '◉', title: 'Real-Time Recognition', desc: 'Sub-second face detection and identification via webcam feed.' },
  { icon: '🛡', title: 'Anti-Proxy System', desc: 'Liveness detection ensures only the real person gets marked.' },
  { icon: '📊', title: 'Analytics Dashboard', desc: 'Trend charts, attendance rates, and department-wise reports.' },
  { icon: '⚡', title: 'Instant Records', desc: 'MongoDB stores every attendance stamp with date, time & confidence.' },
  { icon: '🔒', title: 'JWT Auth', desc: 'Secure admin login with role-based access control.' },
  { icon: '📤', title: 'Export Reports', desc: 'Filter and export attendance history by date range or student.' },
];

const steps = [
  { num: '01', title: 'Capture', desc: 'Webcam captures a live frame from the camera stream.' },
  { num: '02', title: 'Detect', desc: 'OpenCV locates face(s) within the frame using HOG model.' },
  { num: '03', title: 'Extract', desc: 'face_recognition encodes 128-point facial landmark vector.' },
  { num: '04', title: 'Match', desc: 'Vector compared against MongoDB-linked face encodings.' },
  { num: '05', title: 'Record', desc: 'Attendance stamped with date, time & confidence score.' },
];

export default function LandingPage() {
  return (
    <div className="landing">
      {/* ── Nav ── */}
      <nav className="land-nav">
        <div className="land-logo">
          <div className="land-logo-mark" />
          FaceTrack
        </div>
        <div className="land-nav-links">
          <a href="#features">Features</a>
          <a href="#how">How It Works</a>
          <a href="#stack">Stack</a>
          <Link to="/login" className="btn btn-primary btn-sm">Admin Login →</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-badge">
          <span className="badge-pulse" />AI-POWERED ATTENDANCE
        </div>
        <div className="scanner-anim">
          <div className="scan-face">
            <svg viewBox="0 0 100 100" fill="none">
              <ellipse cx="50" cy="46" rx="27" ry="32" stroke="rgba(61,232,200,0.5)" strokeWidth="1.5"/>
              <ellipse cx="38" cy="39" rx="5" ry="6" stroke="rgba(61,232,200,0.7)" strokeWidth="1.2"/>
              <ellipse cx="62" cy="39" rx="5" ry="6" stroke="rgba(61,232,200,0.7)" strokeWidth="1.2"/>
              <circle cx="38" cy="39" r="2.5" fill="rgba(61,232,200,0.9)"/>
              <circle cx="62" cy="39" r="2.5" fill="rgba(61,232,200,0.9)"/>
              <path d="M46 52 L43 62 L57 62" stroke="rgba(61,232,200,0.4)" strokeWidth="1" fill="none"/>
              <path d="M40 69 Q50 76 60 69" stroke="rgba(61,232,200,0.6)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <path d="M32 33 Q38 30 44 32" stroke="rgba(61,232,200,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <path d="M56 32 Q62 30 68 33" stroke="rgba(61,232,200,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
            <div className="scan-line" />
            <div className="corner tl"/><div className="corner tr"/>
            <div className="corner bl"/><div className="corner br"/>
          </div>
          <div className="scan-status" id="scanStatus">SCANNING...</div>
        </div>

        <h1 className="hero-title">Attendance,<br /><span>Reimagined</span></h1>
        <p className="hero-sub">Full-stack MERN + Python face recognition system. No registers, no errors, no proxies.</p>
        <div className="hero-btns">
          <Link to="/login" className="btn btn-primary">Get Started →</Link>
          <a href="#how" className="btn btn-secondary">See How It Works</a>
        </div>
        <div className="hero-stats">
          {[['99.7%','Accuracy'],['<0.3s','Recognition'],['0','Manual Errors'],['24/7','Uptime']].map(([n,l]) => (
            <div key={l} className="h-stat">
              <div className="h-stat-num">{n}</div>
              <div className="h-stat-label">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="land-section">
        <div className="section-tag">Capabilities</div>
        <h2 className="section-h">Everything Built In</h2>
        <div className="feat-grid">
          {features.map(f => (
            <div key={f.title} className="feat-card">
              <div className="feat-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" className="land-section">
        <div className="section-tag">Process</div>
        <h2 className="section-h">How It Works</h2>
        <div className="steps-row">
          {steps.map((s, i) => (
            <div key={s.num} className="step-box">
              <div className="step-num">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              {i < steps.length - 1 && <div className="step-arrow">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── Stack ── */}
      <section id="stack" className="land-section">
        <div className="section-tag">Technology</div>
        <h2 className="section-h">MERN + Python Stack</h2>
        <div className="stack-grid">
          {[['⚛️','React 18','Frontend UI'],['🟢','Node.js','Runtime'],['🚂','Express','REST API'],['🍃','MongoDB','Database'],['🐍','Python','Face Engine'],['👁️','OpenCV','Vision'],['🤖','face_recognition','ML'],['🔑','JWT','Auth']].map(([i,n,r]) => (
            <div key={n} className="stack-card">
              <div className="stack-icon">{i}</div>
              <div className="stack-name">{n}</div>
              <div className="stack-role">{r}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="land-cta">
        <h2>Ready to automate attendance?</h2>
        <p>Log in to the admin panel to register students, go live, and view reports.</p>
        <Link to="/login" className="btn btn-primary">Open Admin Panel →</Link>
      </section>

      <footer className="land-footer">
        <span>© 2025 FaceTrack — Face Recognition Attendance System</span>
        <div className="footer-links">
          <a href="#features">Features</a>
          <a href="#how">How It Works</a>
          <a href="#stack">Stack</a>
        </div>
      </footer>
    </div>
  );
}
