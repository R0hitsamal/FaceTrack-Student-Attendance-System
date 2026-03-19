import { useEffect, useRef, useState, useCallback } from 'react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import './LiveAttendance.css';

export default function LiveAttendance() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [log, setLog] = useState([]);
  const [lastMatch, setLastMatch] = useState(null);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  // Start camera
  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch (e) {
      setError('Camera access denied. Please allow camera permissions.');
    }
  };

  // Stop camera
  const stopCamera = useCallback(() => {
    clearInterval(intervalRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraOn(false);
    setScanning(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // Capture & send frame
  const captureFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = 320;
    canvasRef.current.height = 240;
    ctx.drawImage(videoRef.current, 0, 0, 320, 240);
    const b64 = canvasRef.current.toDataURL('image/jpeg', 0.8);

    try {
      const { data } = await api.post('/attendance/recognize', { image_base64: b64 });
      if (data.matched) {
        const r = data.record;
        const entry = {
          id: r._id,
          name: r.student?.name,
          studentId: r.student?.studentId,
          dept: r.student?.department,
          time: r.timeIn,
          status: r.status,
          confidence: data.record.confidence,
          alreadyMarked: data.alreadyMarked,
          photo: r.student?.photo,
        };
        setLastMatch(entry);
        if (!data.alreadyMarked) {
          setLog(l => [entry, ...l].slice(0, 50));
          addToast(`✓ ${entry.name} marked ${entry.status}`, 'success');
        }
      }
    } catch (e) {
      // Silently ignore frame errors (face service may be busy)
    }
  }, [addToast]);

  const toggleScanning = () => {
    if (scanning) {
      clearInterval(intervalRef.current);
      setScanning(false);
    } else {
      setScanning(true);
      intervalRef.current = setInterval(captureFrame, 2000);
    }
  };

  return (
    <div className="live-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Live Attendance</h1>
          <p className="page-desc">Real-time face recognition — frames sent every 2 seconds</p>
        </div>
      </div>

      <div className="live-layout">
        {/* Camera panel */}
        <div className="camera-panel card">
          <div className="camera-wrap">
            {!cameraOn ? (
              <div className="camera-placeholder">
                <div className="cam-icon">◉</div>
                <p>Camera is off</p>
                <button className="btn btn-primary" onClick={startCamera}>Start Camera</button>
              </div>
            ) : (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="cam-video" />
                {scanning && <div className="scan-overlay"><div className="scan-bar" /></div>}
              </>
            )}
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {error && <div className="cam-error">{error}</div>}

          <div className="cam-controls">
            {cameraOn && (
              <>
                <button
                  className={`btn ${scanning ? 'btn-danger' : 'btn-primary'}`}
                  onClick={toggleScanning}
                >
                  {scanning ? '⏸ Stop Scanning' : '▶ Start Scanning'}
                </button>
                <button className="btn btn-secondary" onClick={stopCamera}>✕ Stop Camera</button>
              </>
            )}
          </div>

          {/* Last match card */}
          {lastMatch && (
            <div className={`match-card ${lastMatch.alreadyMarked ? 'already' : 'new-match'}`}>
              <div className="match-header">
                {lastMatch.alreadyMarked ? '↩ Already Marked' : '✓ Face Recognized'}
              </div>
              <div className="match-body">
                <div className="avatar" style={{ width:48, height:48, fontSize:'1.1rem' }}>
                  {lastMatch.photo ? <img src={lastMatch.photo} alt={lastMatch.name} /> : lastMatch.name?.charAt(0)}
                </div>
                <div>
                  <div className="match-name">{lastMatch.name}</div>
                  <div className="match-meta">{lastMatch.studentId} · {lastMatch.dept}</div>
                  <div className="match-meta">{lastMatch.time} · Confidence: {lastMatch.confidence?.toFixed(1)}%</div>
                </div>
                <span className={`badge badge-${lastMatch.status}`}>{lastMatch.status}</span>
              </div>
            </div>
          )}
        </div>

        {/* Log panel */}
        <div className="log-panel card">
          <div className="card-header">
            <h3>Session Log</h3>
            <span className="card-tag">{log.length} marked</span>
          </div>
          <div className="log-list">
            {log.length === 0 ? (
              <div className="log-empty">No attendance marked yet in this session</div>
            ) : log.map((e, i) => (
              <div key={e.id + i} className="log-item">
                <div className="avatar">
                  {e.photo ? <img src={e.photo} alt={e.name} /> : e.name?.charAt(0)}
                </div>
                <div className="log-info">
                  <div className="log-name">{e.name}</div>
                  <div className="log-meta">{e.studentId} · {e.time}</div>
                </div>
                <span className={`badge badge-${e.status}`}>{e.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
