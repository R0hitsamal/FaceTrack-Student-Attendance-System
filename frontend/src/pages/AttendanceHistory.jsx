import { useEffect, useState } from 'react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import './AttendanceHistory.css';

export default function AttendanceHistory() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({ from: '', to: '', studentId: '', status: '' });
  const { addToast } = useToast();

  useEffect(() => {
    api.get('/students?limit=200').then(r => setStudents(r.data.students));
  }, []);

  const fetchRecords = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      if (filters.studentId) params.append('studentId', filters.studentId);
      if (filters.status) params.append('status', filters.status);
      const { data } = await api.get(`/attendance?${params}`);
      setRecords(data.records);
      setTotal(data.total);
      setPages(data.pages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(page); }, [page]);

  const applyFilters = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRecords(1);
  };

  const resetFilters = () => {
    setFilters({ from: '', to: '', studentId: '', status: '' });
    setPage(1);
    setTimeout(() => fetchRecords(1), 0);
  };

  const deleteRecord = async (id) => {
    if (!confirm('Delete this attendance record?')) return;
    try {
      await api.delete(`/attendance/${id}`);
      addToast('Record deleted', 'success');
      fetchRecords(page);
    } catch { addToast('Failed to delete', 'error'); }
  };

  const exportCSV = () => {
    if (!records.length) return;
    const headers = ['Name', 'Student ID', 'Department', 'Date', 'Time In', 'Status', 'Method', 'Confidence'];
    const rows = records.map(r => [
      r.student?.name, r.student?.studentId, r.student?.department,
      r.date, r.timeIn, r.status, r.method, r.confidence?.toFixed(1) + '%'
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    addToast('CSV exported!', 'success');
  };

  return (
    <div className="history-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance History</h1>
          <p className="page-desc">{total} records found</p>
        </div>
        <button className="btn btn-secondary" onClick={exportCSV}>↓ Export CSV</button>
      </div>

      {/* Filters */}
      <div className="card">
        <form onSubmit={applyFilters} className="history-filters">
          <div className="form-group">
            <label className="form-label">From Date</label>
            <input className="form-input" type="date" value={filters.from}
              onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">To Date</label>
            <input className="form-input" type="date" value={filters.to}
              onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Student</label>
            <select className="form-select" value={filters.studentId}
              onChange={e => setFilters(f => ({ ...f, studentId: e.target.value }))}>
              <option value="">All Students</option>
              {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.studentId})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">All</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
            </select>
          </div>
          <div className="filter-btns">
            <button className="btn btn-primary" type="submit">Apply Filters</button>
            <button className="btn btn-secondary" type="button" onClick={resetFilters}>Reset</button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Student ID</th>
                <th>Department</th>
                <th>Date</th>
                <th>Time In</th>
                <th>Status</th>
                <th>Method</th>
                <th>Confidence</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign:'center', padding:'3rem' }}>
                  <div className="spinner" style={{ margin:'0 auto' }} />
                </td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign:'center', color:'var(--muted)', padding:'3rem' }}>
                  No records found for the selected filters
                </td></tr>
              ) : records.map(r => (
                <tr key={r._id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.7rem' }}>
                      <div className="avatar">
                        {r.student?.photo
                          ? <img src={r.student.photo} alt={r.student?.name} />
                          : r.student?.name?.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600 }}>{r.student?.name || '—'}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily:'var(--font-mono)', fontSize:'0.78rem', color:'var(--muted)' }}>
                    {r.student?.studentId}
                  </td>
                  <td style={{ color:'var(--muted)', fontSize:'0.85rem' }}>{r.student?.department}</td>
                  <td style={{ fontFamily:'var(--font-mono)', fontSize:'0.8rem' }}>{r.date}</td>
                  <td style={{ fontFamily:'var(--font-mono)', fontSize:'0.8rem' }}>{r.timeIn}</td>
                  <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                  <td><span className={`badge ${r.method === 'face' ? 'badge-present' : 'badge-manual'}`}>{r.method}</span></td>
                  <td style={{ fontFamily:'var(--font-mono)', fontSize:'0.78rem', color:'var(--muted)' }}>
                    {r.method === 'face' ? `${r.confidence?.toFixed(1)}%` : '—'}
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteRecord(r._id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="pagination">
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ fontSize:'0.85rem', color:'var(--muted)' }}>Page {page} of {pages} · {total} records</span>
            <button className="btn btn-secondary btn-sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
