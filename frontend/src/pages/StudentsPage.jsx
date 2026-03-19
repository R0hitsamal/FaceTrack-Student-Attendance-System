import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import './StudentsPage.css';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [depts, setDepts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const { addToast } = useToast();

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.append('search', search);
      if (dept) params.append('department', dept);
      const { data } = await api.get(`/students?${params}`);
      setStudents(data.students);
      setTotal(data.total);
      setPages(data.pages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, [page, dept]);

  useEffect(() => {
    api.get('/students/meta/departments').then(r => setDepts(r.data));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const remove = async (id, name) => {
    if (!confirm(`Remove ${name}?`)) return;
    try {
      await api.delete(`/students/${id}`);
      addToast(`${name} removed`, 'success');
      fetchStudents();
    } catch { addToast('Failed to remove student', 'error'); }
  };

  return (
    <div className="students-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-desc">{total} registered students</p>
        </div>
        <Link to="/students/register" className="btn btn-primary">⊕ Register New</Link>
      </div>

      {/* Filters */}
      <div className="card filters-bar">
        <form onSubmit={handleSearch} className="filters-form">
          <input
            className="form-input"
            placeholder="Search name, ID, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <select className="form-select" value={dept} onChange={e => { setDept(e.target.value); setPage(1); }} style={{ width: 180 }}>
            <option value="">All Departments</option>
            {depts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button className="btn btn-secondary" type="submit">Search</button>
        </form>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>ID</th>
                <th>Department</th>
                <th>Year</th>
                <th>Face</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:'3rem' }}><div className="spinner" style={{ margin:'0 auto' }} /></td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--muted)', padding:'3rem' }}>No students found</td></tr>
              ) : students.map(s => (
                <tr key={s._id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.7rem' }}>
                      <div className="avatar">
                        {s.photo ? <img src={s.photo} alt={s.name} /> : s.name?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{s.name}</div>
                        <div style={{ fontSize:'0.75rem', color:'var(--muted)' }}>{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily:'var(--font-mono)', fontSize:'0.8rem', color:'var(--muted)' }}>{s.studentId}</td>
                  <td>{s.department}</td>
                  <td style={{ color:'var(--muted)' }}>{s.year}</td>
                  <td>
                    <span className={`badge ${s.faceRegistered ? 'badge-present' : 'badge-absent'}`}>
                      {s.faceRegistered ? '✓ Registered' : '✕ Not set'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:'0.5rem' }}>
                      <Link to={`/students/edit/${s._id}`} className="btn btn-secondary btn-sm">Edit</Link>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(s._id, s.name)}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="pagination">
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ fontSize:'0.85rem', color:'var(--muted)' }}>Page {page} of {pages}</span>
            <button className="btn btn-secondary btn-sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
