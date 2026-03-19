import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import './Dashboard.css';

const StatCard = ({ label, value, sub, color }) => (
  <div className="stat-card card">
    <div className="stat-label">{label}</div>
    <div className="stat-value" style={{ color }}>{value}</div>
    {sub && <div className="stat-sub">{sub}</div>}
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/attendance/stats'),
      api.get('/attendance/today'),
    ]).then(([s, t]) => {
      setStats(s.data);
      setRecent(t.data.slice(0, 8));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}>
      <div className="spinner" />
    </div>
  );

  const pct = stats ? Math.round((stats.presentToday / (stats.total || 1)) * 100) : 0;

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-desc">Overview for {new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
        </div>
        <div className="header-actions">
          <Link to="/live" className="btn btn-primary">◉ Go Live</Link>
          <Link to="/students/register" className="btn btn-secondary">⊕ Register Student</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard label="Total Students" value={stats?.total ?? 0} sub="Registered" color="var(--text)" />
        <StatCard label="Present Today" value={stats?.presentToday ?? 0} sub={`${pct}% attendance`} color="var(--accent)" />
        <StatCard label="Absent Today" value={stats?.absentToday ?? 0} sub="Not marked" color="var(--accent3)" />
        <StatCard label="Late Arrivals" value={stats?.lateToday ?? 0} sub="After 9:15 AM" color="var(--yellow)" />
      </div>

      <div className="dash-grid">
        {/* Chart */}
        <div className="card chart-card">
          <div className="card-header">
            <h3>7-Day Attendance Trend</h3>
            <span className="card-tag">Last 7 Days</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats?.trend || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3de8c8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3de8c8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7a99' }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7a99' }} />
              <Tooltip
                contentStyle={{ background: '#111520', border: '1px solid rgba(99,200,255,0.12)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#e8f0ff' }}
                itemStyle={{ color: '#3de8c8' }}
              />
              <Area type="monotone" dataKey="count" stroke="#3de8c8" strokeWidth={2} fill="url(#colorAtt)" name="Present" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance ring */}
        <div className="card ring-card">
          <div className="card-header">
            <h3>Today's Rate</h3>
          </div>
          <div className="ring-wrap">
            <svg viewBox="0 0 120 120" className="ring-svg">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(99,200,255,0.1)" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="50" fill="none"
                stroke="#3de8c8" strokeWidth="10"
                strokeDasharray={`${(pct / 100) * 314} 314`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
            </svg>
            <div className="ring-label">
              <div className="ring-pct">{pct}%</div>
              <div className="ring-sub">Attendance</div>
            </div>
          </div>
          <div className="ring-legend">
            <div className="legend-item"><span style={{background:'var(--accent)'}} />Present</div>
            <div className="legend-item"><span style={{background:'var(--accent3)'}} />Absent</div>
            <div className="legend-item"><span style={{background:'var(--yellow)'}} />Late</div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card">
        <div className="card-header">
          <h3>Recent Activity</h3>
          <Link to="/history" className="btn btn-secondary btn-sm">View All</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>ID</th>
                <th>Department</th>
                <th>Time</th>
                <th>Status</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--muted)', padding:'2rem' }}>No attendance recorded today yet</td></tr>
              ) : recent.map(r => (
                <tr key={r._id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.7rem' }}>
                      <div className="avatar">
                        {r.student?.photo
                          ? <img src={r.student.photo} alt={r.student.name} />
                          : r.student?.name?.charAt(0)}
                      </div>
                      {r.student?.name}
                    </div>
                  </td>
                  <td style={{ fontFamily:'var(--font-mono)', fontSize:'0.8rem', color:'var(--muted)' }}>{r.student?.studentId}</td>
                  <td style={{ color:'var(--muted)' }}>{r.student?.department}</td>
                  <td style={{ fontFamily:'var(--font-mono)', fontSize:'0.8rem' }}>{r.timeIn}</td>
                  <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                  <td><span className={`badge ${r.method === 'face' ? 'badge-present' : 'badge-manual'}`}>{r.method}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
