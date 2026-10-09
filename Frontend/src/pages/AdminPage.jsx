import React, { useState, useEffect, useCallback } from 'react';
import Pagination from '@mui/material/Pagination';
import api from '../data/api';

const ROWS_PER_PAGE = 10;

// ── Toast ────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  const colours = { success: 'bg-success', error: 'bg-danger', info: 'bg-primary', warning: 'bg-warning text-dark' };
  return (
    <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
      <div className={`toast show text-white ${colours[type] || 'bg-secondary'} rounded-3 shadow px-3 py-2`}>
        {message}
        <button className="btn-close btn-close-white ms-2 float-end" onClick={onClose}></button>
      </div>
    </div>
  );
};

// ── Status Badge ─────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    requested: { cls: 'bg-warning text-dark', label: '🕐 Pending' },
    approved:  { cls: 'bg-success text-white', label: '✅ Approved' },
    modified:  { cls: 'bg-info text-white',   label: '✏️ Modified' },
  };
  const s = map[status] || map.requested;
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
};

// ── Star display ──────────────────────────────────────────────────
const Stars = ({ value }) => (
  <span className="text-warning">
    {'★'.repeat(Math.round(value))}{'☆'.repeat(5 - Math.round(value))}
    <span className="text-muted ms-1" style={{ fontSize: '0.75rem' }}>({Number(value).toFixed(1)})</span>
  </span>
);

// ── Simple Bar Chart (pure CSS/HTML) ─────────────────────────────
const BarChart = ({ data, color = '#dc3545', label = 'count', valueKey = 'count', nameKey = 'month' }) => {
  if (!data || data.length === 0) return <p className="text-muted text-center py-3">No data yet</p>;
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div className="d-flex align-items-end gap-2 mt-3" style={{ height: 140 }}>
      {data.map((d, i) => (
        <div key={i} className="d-flex flex-column align-items-center flex-grow-1" style={{ minWidth: 0 }}>
          <span className="fw-bold small" style={{ fontSize: '0.7rem', color }}>{d[valueKey]}</span>
          <div
            style={{
              width: '100%',
              height: Math.max((d[valueKey] / max) * 110, 4),
              background: color,
              borderRadius: '4px 4px 0 0',
              opacity: 0.85,
              transition: 'height 0.4s',
            }}
          />
          <span className="text-muted text-center" style={{ fontSize: '0.65rem', marginTop: 3 }}>{d[nameKey]}</span>
        </div>
      ))}
    </div>
  );
};

// ── Horizontal Bar ────────────────────────────────────────────────
const HorizBar = ({ items, nameKey, valueKey, color = '#dc3545' }) => {
  if (!items || items.length === 0) return <p className="text-muted py-3 text-center">No data yet</p>;
  const max = Math.max(...items.map(d => d[valueKey]), 1);
  return (
    <div className="d-flex flex-column gap-2 mt-2">
      {items.map((item, i) => (
        <div key={i}>
          <div className="d-flex justify-content-between small mb-1">
            <span className="text-capitalize fw-semibold" style={{ fontSize: '0.82rem' }}>{item[nameKey]}</span>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>{item[valueKey]}</span>
          </div>
          <div className="bg-light rounded" style={{ height: 8 }}>
            <div
              style={{
                width: `${(item[valueKey] / max) * 100}%`,
                height: '100%',
                background: color,
                borderRadius: 4,
                transition: 'width 0.5s',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Donut / Pie via CSS ───────────────────────────────────────────
const CategoryPie = ({ data }) => {
  if (!data || data.length === 0) return <p className="text-muted py-3 text-center">No data</p>;
  const total = data.reduce((a, d) => a + d.count, 0);
  const COLORS = ['#dc3545','#fd7e14','#ffc107','#198754','#0d6efd','#6f42c1','#20c997','#0dcaf0'];
  return (
    <div className="d-flex flex-wrap gap-2 mt-3 justify-content-center">
      {data.map((d, i) => (
        <div key={i} className="d-flex align-items-center gap-1 px-2 py-1 rounded-pill border" style={{ fontSize: '0.78rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'inline-block' }} />
          <span className="fw-semibold">{d.category}</span>
          <span className="text-muted">({((d.count / total) * 100).toFixed(0)}%)</span>
        </div>
      ))}
    </div>
  );
};

// ── Recipe Modal (create / edit) ─────────────────────────────────
const RecipeModal = ({ recipe, onClose, onSave }) => {
  const isEdit = !!recipe?._id;
  const empty  = { title: '', description: '', image: '', category: 'Breakfast', cookTime: '', servings: '', difficulty: 'Easy', ingredients: '', steps: '', tags: '' };
  const [form, setForm] = useState(
    isEdit
      ? { ...recipe, ingredients: recipe.ingredients.join('\n'), steps: recipe.steps.join('\n'), tags: (recipe.tags || []).join(', ') }
      : empty
  );
  const [saving, setSaving] = useState(false);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.category) return alert('Fill required fields');
    setSaving(true);
    try {
      const payload = {
        ...form,
        cookTime:    Number(form.cookTime),
        servings:    Number(form.servings),
        ingredients: form.ingredients.split('\n').map(s => s.trim()).filter(Boolean),
        steps:       form.steps.split('\n').map(s => s.trim()).filter(Boolean),
        tags:        form.tags.split(',').map(s => s.trim()).filter(Boolean),
      };
      if (isEdit) {
        await api.put(`/admin/recipes/${recipe._id}`, payload);
      } else {
        await api.post('/admin/recipes', payload);
      }
      onSave(isEdit ? 'Recipe updated!' : 'Recipe created!');
    } catch (err) {
      alert('Error saving recipe: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const cls = 'form-control form-control-sm mb-2';
  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', position: 'fixed', inset: 0, zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable" style={{ marginTop: '60px' }}>
        <div className="modal-content rounded-4 shadow border-0">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">
              <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-plus-circle'} me-2 text-danger`}></i>
              {isEdit ? 'Edit Recipe' : 'Add New Recipe'}
            </h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body pt-2">
            <div className="row g-2">
              <div className="col-12">
                <label className="form-label fw-semibold small">Title *</label>
                <input className={cls} name="title" value={form.title} onChange={handleChange} placeholder="Recipe title" />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold small">Description *</label>
                <textarea className={cls} name="description" value={form.description} onChange={handleChange} rows={2} placeholder="Short description" />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold small">Image URL</label>
                <input className={cls} name="image" value={form.image} onChange={handleChange} placeholder="https://..." />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold small">Category *</label>
                <select className={cls} name="category" value={form.category} onChange={handleChange}>
                  {['Breakfast','Lunch','Dinner','Snack','Dessert','Drink'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold small">Cook Time (min)</label>
                <input className={cls} type="number" name="cookTime" value={form.cookTime} onChange={handleChange} placeholder="30" />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold small">Servings</label>
                <input className={cls} type="number" name="servings" value={form.servings} onChange={handleChange} placeholder="4" />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold small">Difficulty</label>
                <select className={cls} name="difficulty" value={form.difficulty} onChange={handleChange}>
                  <option>Easy</option><option>Medium</option><option>Hard</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold small">Ingredients * (one per line)</label>
                <textarea className={cls} name="ingredients" value={form.ingredients} onChange={handleChange} rows={4} placeholder="2 cups flour&#10;1 tsp salt&#10;..." />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold small">Steps * (one per line)</label>
                <textarea className={cls} name="steps" value={form.steps} onChange={handleChange} rows={4} placeholder="Mix dry ingredients&#10;Add wet ingredients&#10;..." />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold small">Tags (comma separated)</label>
                <input className={cls} name="tags" value={form.tags} onChange={handleChange} placeholder="quick, healthy, vegan" />
              </div>
            </div>
          </div>
          <div className="modal-footer border-0">
            <button className="btn btn-light rounded-3 px-4" onClick={onClose}>Cancel</button>
            <button className="btn btn-danger rounded-3 px-4" onClick={handleSubmit} disabled={saving}>
              {saving ? <><span className="spinner-border spinner-border-sm me-1"></span>Saving...</> : (isEdit ? 'Update' : 'Create')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  AdminPage
// ═══════════════════════════════════════════════════════════════
const AdminPage = () => {
  const [tab,     setTab]    = useState('dashboard');
  const [stats,   setStats]  = useState(null);
  const [users,   setUsers]  = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]  = useState(null);
  const [modalRecipe,   setModalRecipe]   = useState(undefined);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [userFilter,   setUserFilter]   = useState(null);
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');
  const [reviewModal,  setReviewModal]  = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const [recipePage, setRecipePage] = useState(1);
  const [userPage,   setUserPage]   = useState(1);

  // ── Trending & Analytics state ───────────────────────────────
  const [trending,   setTrending]   = useState(null);
  const [analytics,  setAnalytics]  = useState(null);
  const [topRated,   setTopRated]   = useState([]);
  const [credits,    setCredits]    = useState([]);
  const [trendTab,   setTrendTab]   = useState('today');
  const [trendLoading, setTrendLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const showToast = useCallback((message, type = 'success') => setToast({ message, type }), []);

  const fetchStats = async () => {
    setLoading(true);
    try { const r = await api.get('/admin/stats'); setStats(r.data); }
    catch { showToast('Error fetching stats', 'error'); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try { const r = await api.get('/admin/users'); setUsers(r.data); }
    catch { showToast('Error fetching users', 'error'); }
    finally { setLoading(false); }
  };

  const fetchRecipes = async (opts = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const uid  = opts.userId   ?? userFilter?._id ?? '';
      const from = opts.dateFrom ?? dateFrom;
      const to   = opts.dateTo   ?? dateTo;
      if (uid)  params.set('userId',   uid);
      if (from) params.set('dateFrom', from);
      if (to)   params.set('dateTo',   to);
      const r = await api.get(`/admin/recipes${params.toString() ? '?' + params.toString() : ''}`);
      setRecipes(r.data);
    }
    catch { showToast('Error fetching recipes', 'error'); }
    finally { setLoading(false); }
  };

  const fetchPendingReviews = async () => {
    setLoading(true);
    try { const r = await api.get('/admin/reviews/pending'); setPendingReviews(r.data); }
    catch { showToast('Error fetching reviews', 'error'); }
    finally { setLoading(false); }
  };

  const fetchTrending = async () => {
    setTrendLoading(true);
    try {
      const [tr, top, cr] = await Promise.all([
        api.get('/admin/trending'),
        api.get('/admin/top-rated'),
        api.get('/admin/credits'),
      ]);
      setTrending(tr.data);
      setTopRated(top.data);
      setCredits(cr.data);
    } catch { showToast('Error fetching trending data', 'error'); }
    finally { setTrendLoading(false); }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try { const r = await api.get('/admin/analytics'); setAnalytics(r.data); }
    catch { showToast('Error fetching analytics', 'error'); }
    finally { setAnalyticsLoading(false); }
  };

  useEffect(() => {
    if (tab === 'dashboard') fetchStats();
    if (tab === 'users')     fetchUsers();
    if (tab === 'recipes')   fetchRecipes();
    if (tab === 'reviews')   fetchPendingReviews();
    if (tab === 'trending')  fetchTrending();
  }, [tab]); // eslint-disable-line

  const handleApprove = async (recipeId) => {
    setActionLoading(recipeId);
    try {
      const res = await api.patch(`/admin/recipes/${recipeId}/status`, { status: 'approved' });
      setRecipes(prev => prev.map(r => r._id === recipeId ? { ...r, status: 'approved', approvalDate: new Date() } : r));
      showToast(res.data.message || 'Recipe approved! +10 credit points awarded.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Error approving', 'error');
    } finally { setActionLoading(null); }
  };

  const handleApproveReview = async (recipeId, reviewId) => {
    setActionLoading(reviewId);
    try {
      await api.patch(`/admin/reviews/${recipeId}/${reviewId}/approve`);
      setPendingReviews(prev => prev.filter(r => r.reviewId !== reviewId));
      showToast('Review approved!');
    } catch { showToast('Error approving review', 'error'); }
    finally { setActionLoading(null); }
  };

  const handleRejectReview = async (recipeId, reviewId) => {
    setActionLoading(reviewId + '_reject');
    try {
      await api.delete(`/admin/reviews/${recipeId}/${reviewId}/reject`);
      setPendingReviews(prev => prev.filter(r => r.reviewId !== reviewId));
      showToast('Review rejected', 'info');
    } catch { showToast('Error rejecting review', 'error'); }
    finally { setActionLoading(null); }
  };

  const filteredRecipes = recipes.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  const pagedRecipes    = filteredRecipes.slice((recipePage - 1) * ROWS_PER_PAGE, recipePage * ROWS_PER_PAGE);
  const recipePageCount = Math.ceil(filteredRecipes.length / ROWS_PER_PAGE);
  const pagedUsers      = users.slice((userPage - 1) * ROWS_PER_PAGE, userPage * ROWS_PER_PAGE);
  const userPageCount   = Math.ceil(users.length / ROWS_PER_PAGE);

  const handleDelete = async () => {
    try {
      if (confirmDelete.type === 'user') {
        await api.delete(`/admin/users/${confirmDelete.id}`);
        const updated = users.filter(x => x._id !== confirmDelete.id);
        setUsers(updated);
        const maxPage = Math.ceil(updated.length / ROWS_PER_PAGE) || 1;
        if (userPage > maxPage) setUserPage(maxPage);
        showToast('User deleted');
      } else {
        await api.delete(`/admin/recipes/${confirmDelete.id}`);
        const updated = recipes.filter(x => x._id !== confirmDelete.id);
        setRecipes(updated);
        const maxPage = Math.ceil(updated.length / ROWS_PER_PAGE) || 1;
        if (recipePage > maxPage) setRecipePage(maxPage);
        showToast('Recipe deleted');
      }
    } catch { showToast('Error deleting', 'error'); }
    finally { setConfirmDelete(null); }
  };

  const handleModalSave = (msg) => {
    setModalRecipe(undefined);
    fetchRecipes();
    showToast(msg);
  };

  const handleViewUserRecipes = (user) => {
    setUserFilter(user);
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setRecipePage(1);
    setTab('recipes');
    fetchRecipes({ userId: user._id });
  };

  const handleDeleteReview = async (recipeId, reviewId) => {
    try {
      await api.delete(`/recipes/${recipeId}/reviews/${reviewId}`);
      if (reviewModal) {
        setReviewModal(prev => ({ ...prev, reviews: prev.reviews.filter(r => r._id !== reviewId) }));
      }
      showToast('Review removed');
    } catch { showToast('Error removing review', 'error'); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const tabs = [
    { id: 'dashboard', label: 'Dashboard',  icon: 'bi-speedometer2' },
    { id: 'recipes',   label: 'Recipes',    icon: 'bi-journal-richtext' },
    { id: 'users',     label: 'Users',      icon: 'bi-people-fill' },
    { id: 'reviews',   label: 'Reviews',    icon: 'bi-chat-dots-fill' },
    { id: 'trending',  label: 'Trending',   icon: 'bi-graph-up-arrow' },
  ];

  const pendingCount = recipes.filter(r => r.status === 'requested').length;

  return (
    <div className="container-fluid py-4 px-3 px-md-4" style={{ maxWidth: 1200 }}>

      <div className="d-flex align-items-center gap-2 mb-4">
        <i className="bi bi-shield-lock-fill fs-3 text-warning"></i>
        <div>
          <h3 className="mb-0 fw-bold">Admin Dashboard</h3>
          <p className="text-muted small mb-0">Manage recipes, users, reviews and analytics</p>
        </div>
      </div>

      {/* ── Tab Nav ── */}
      <ul className="nav nav-pills gap-2 mb-4 flex-wrap">
        {tabs.map(t => (
          <li key={t.id} className="nav-item">
            <button
              className={`nav-link d-flex align-items-center gap-1 ${tab === t.id ? 'active bg-danger' : 'text-dark border'}`}
              style={{ borderRadius: 8 }}
              onClick={() => setTab(t.id)}
            >
              <i className={`bi ${t.icon}`}></i>
              {t.label}
              {t.id === 'recipes' && pendingCount > 0 && (
                <span className="badge bg-warning text-dark ms-1" style={{ fontSize: '0.65rem' }}>{pendingCount}</span>
              )}
              {t.id === 'reviews' && pendingReviews.length > 0 && tab !== 'reviews' && (
                <span className="badge bg-warning text-dark ms-1" style={{ fontSize: '0.65rem' }}>{pendingReviews.length}</span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {/* ══════════════════════════════════════════════════════
          DASHBOARD TAB
      ══════════════════════════════════════════════════════ */}
      {tab === 'dashboard' && (
        <div>
          <div className="row g-3 mb-4">
            {[
              { label: 'Total Users',      value: stats?.totalUsers      ?? '—', icon: 'bi-people-fill',      color: 'text-primary',  bg: 'rgba(13,110,253,0.08)'  },
              { label: 'Total Recipes',    value: stats?.totalRecipes    ?? '—', icon: 'bi-journal-richtext',  color: 'text-danger',   bg: 'rgba(220,53,69,0.08)'   },
              { label: 'Pending Approval', value: stats?.pendingCount    ?? '—', icon: 'bi-hourglass-split',   color: 'text-warning',  bg: 'rgba(255,193,7,0.1)'    },
              { label: 'Monthly Uploads',  value: stats?.monthlyUploads  ?? '—', icon: 'bi-cloud-upload-fill', color: 'text-success',  bg: 'rgba(25,135,84,0.08)'   },
            ].map(s => (
              <div key={s.label} className="col-6 col-md-3">
                <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ background: s.bg }}>
                  <i className={`bi ${s.icon} fs-2 ${s.color}`}></i>
                  <div className="fs-1 fw-bold mt-1">{s.value}</div>
                  <div className="text-muted small">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <div className="card border-0 shadow-sm rounded-4 p-3">
                <h6 className="fw-bold mb-3"><i className="bi bi-people me-2 text-primary"></i>Recent Users</h6>
                {(stats?.recentUsers || []).map(u => (
                  <div key={u._id} className="d-flex align-items-center gap-2 py-2 border-bottom">
                    <i className="bi bi-person-circle fs-5 text-secondary"></i>
                    <div>
                      <div className="fw-semibold small">{u.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{u.email}</div>
                    </div>
                    <div className="ms-auto d-flex flex-column align-items-end gap-1">
                      <span className={`badge ${u.role === 'admin' ? 'bg-warning text-dark' : 'bg-secondary'}`}>{u.role}</span>
                      {u.creditPoints > 0 && (
                        <span className="badge bg-success" style={{ fontSize: '0.65rem' }}>
                          <i className="bi bi-star-fill me-1"></i>{u.creditPoints} pts
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-md-6">
              <div className="card border-0 shadow-sm rounded-4 p-3">
                <h6 className="fw-bold mb-3"><i className="bi bi-journal-richtext me-2 text-danger"></i>Recent Recipes</h6>
                {(stats?.recentRecipes || []).map(r => (
                  <div key={r._id} className="d-flex align-items-center gap-2 py-2 border-bottom">
                    <i className="bi bi-egg-fried fs-5 text-secondary"></i>
                    <div>
                      <div className="fw-semibold small">{r.title}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>by {r.createdBy?.name || 'Admin'}</div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          RECIPES TAB
      ══════════════════════════════════════════════════════ */}
      {tab === 'recipes' && (
        <div>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h6 className="fw-bold mb-0">
                All Recipes <span className="badge bg-danger ms-1">{filteredRecipes.length}</span>
              </h6>
              <select className="form-select form-select-sm rounded-3" style={{ width: 'auto' }}
                value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setRecipePage(1); }}>
                <option value="all">All Status</option>
                <option value="requested">Pending</option>
                <option value="approved">Approved</option>
                <option value="modified">Modified</option>
              </select>

              {/* Date-wise filter */}
              <input type="date" className="form-control form-control-sm rounded-3" style={{ width: 'auto' }}
                value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                title="From date" />
              <span className="text-muted small">to</span>
              <input type="date" className="form-control form-control-sm rounded-3" style={{ width: 'auto' }}
                value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                title="To date" />
              <button className="btn btn-sm btn-outline-danger rounded-3"
                onClick={() => { setRecipePage(1); fetchRecipes(); }}>
                <i className="bi bi-funnel-fill me-1"></i>Apply
              </button>
              {(dateFrom || dateTo || userFilter) && (
                <button className="btn btn-sm btn-outline-secondary rounded-3"
                  onClick={() => {
                    setDateFrom(''); setDateTo(''); setUserFilter(null); setRecipePage(1);
                    fetchRecipes({ userId: '', dateFrom: '', dateTo: '' });
                  }}>
                  <i className="bi bi-x-circle me-1"></i>Clear
                </button>
              )}

              {userFilter && (
                <span className="badge bg-primary d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                  <i className="bi bi-person-fill"></i> {userFilter.name}
                  <button className="btn-close btn-close-white ms-1" style={{ fontSize: '0.55rem' }}
                    onClick={() => { setUserFilter(null); setRecipePage(1); fetchRecipes({ userId: '' }); }} />
                </span>
              )}
            </div>
            <button className="btn btn-danger btn-sm rounded-3 d-flex align-items-center gap-1" onClick={() => setModalRecipe(null)}>
              <i className="bi bi-plus-lg"></i> Add Recipe
            </button>
          </div>

          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-danger"></div></div>
          ) : (
            <>
              <div className="table-responsive rounded-4 shadow-sm">
                <table className="table table-hover align-middle mb-0 bg-white">
                  <thead className="table-light">
                    <tr>
                      <th>Title</th>
                      <th className="d-none d-md-table-cell">Category</th>
                      <th className="d-none d-md-table-cell">Submitted By</th>
                      <th>Status</th>
                      <th className="d-none d-lg-table-cell">Approval Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRecipes.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-4 text-muted">No recipes found</td></tr>
                    ) : pagedRecipes.map(r => (
                      <tr key={r._id} className={r.status === 'requested' ? 'table-warning' : ''}>
                        <td>
                          <div className="fw-semibold small">{r.title}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{r.difficulty} · {r.cookTime} min</div>
                        </td>
                        <td className="d-none d-md-table-cell">
                          <span className="badge bg-light text-dark border">{r.category}</span>
                        </td>
                        <td className="d-none d-md-table-cell text-muted small">{r.createdBy?.name || '—'}</td>
                        <td><StatusBadge status={r.status} /></td>
                        <td className="d-none d-lg-table-cell text-muted small">
                          {r.approvalDate ? (
                            <span className="text-success">
                              <i className="bi bi-calendar-check me-1"></i>{fmtDate(r.approvalDate)}
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          <div className="d-flex gap-1 flex-wrap">
                            {r.status !== 'approved' && (
                              <button className="btn btn-sm btn-success rounded-2 d-flex align-items-center gap-1"
                                onClick={() => handleApprove(r._id)} disabled={actionLoading === r._id} title="Approve">
                                {actionLoading === r._id
                                  ? <span className="spinner-border spinner-border-sm"></span>
                                  : <><i className="bi bi-check-lg"></i> Approve</>}
                              </button>
                            )}
                            {r.reviews?.length > 0 && (
                              <button className="btn btn-sm btn-outline-secondary rounded-2"
                                title={`Reviews (${r.reviews.length})`} onClick={() => setReviewModal(r)}>
                                <i className="bi bi-chat-dots"></i>
                                <span className="badge bg-secondary ms-1" style={{ fontSize: '0.65rem' }}>{r.reviews.length}</span>
                              </button>
                            )}
                            <button className="btn btn-sm btn-outline-secondary rounded-2" title="Edit"
                              onClick={() => setModalRecipe(r)}>
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-danger rounded-2" title="Delete"
                              onClick={() => setConfirmDelete({ type: 'recipe', id: r._id, name: r.title })}>
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-3 px-1">
                  <span className="text-muted small">
                    Showing {filteredRecipes.length === 0 ? 0 : (recipePage - 1) * ROWS_PER_PAGE + 1}–{Math.min(recipePage * ROWS_PER_PAGE, filteredRecipes.length)} of {filteredRecipes.length}
                  </span>
                  {recipePageCount > 1 && (
                    <Pagination count={recipePageCount} page={recipePage} onChange={(_, v) => setRecipePage(v)} color="error" shape="rounded" size="small" />
                  )}
                </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          USERS TAB
      ══════════════════════════════════════════════════════ */}
      {tab === 'users' && (
        <div>
          <h6 className="fw-bold mb-3">All Users <span className="badge bg-primary ms-1">{users.length}</span></h6>
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : (
            <>
              <div className="table-responsive rounded-4 shadow-sm">
                <table className="table table-hover align-middle mb-0 bg-white">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th className="d-none d-md-table-cell">Email</th>
                      <th>Role</th>
                      <th className="d-none d-sm-table-cell">Credit Points</th>
                      <th className="d-none d-sm-table-cell">Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedUsers.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-4 text-muted">No users found</td></tr>
                    ) : pagedUsers.map(u => (
                      <tr key={u._id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-person-circle fs-5 text-secondary"></i>
                            <span className="fw-semibold small">{u.name}</span>
                          </div>
                        </td>
                        <td className="d-none d-md-table-cell text-muted small">{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === 'admin' ? 'bg-warning text-dark' : 'bg-secondary'}`}>{u.role}</span>
                        </td>
                        <td className="d-none d-sm-table-cell">
                          {u.creditPoints > 0 ? (
                            <span className="badge bg-success">
                              <i className="bi bi-star-fill me-1"></i>{u.creditPoints} pts
                            </span>
                          ) : <span className="text-muted small">0</span>}
                        </td>
                        <td className="d-none d-sm-table-cell text-muted small">{fmtDate(u.createdAt)}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-outline-primary rounded-2" title="View recipes"
                              onClick={() => handleViewUserRecipes(u)}>
                              <i className="bi bi-journal-richtext"></i>
                            </button>
                            {u.role !== 'admin' && (
                              <button className="btn btn-sm btn-outline-danger rounded-2" title="Delete user"
                                onClick={() => setConfirmDelete({ type: 'user', id: u._id, name: u.name })}>
                                <i className="bi bi-trash"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-3 px-1">
                  <span className="text-muted small">
                    Showing {users.length === 0 ? 0 : (userPage - 1) * ROWS_PER_PAGE + 1}–{Math.min(userPage * ROWS_PER_PAGE, users.length)} of {users.length}
                  </span>
                  {userPageCount > 1 && (
                    <Pagination count={userPageCount} page={userPage} onChange={(_, v) => setUserPage(v)} color="primary" shape="rounded" size="small" />
                  )}
                </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          REVIEWS TAB
      ══════════════════════════════════════════════════════ */}
      {tab === 'reviews' && (
        <div className="card border-0 rounded-4 shadow-sm p-4">
          <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
            <i className="bi bi-chat-dots-fill text-danger"></i>
            Pending Reviews
            <span className="badge bg-warning text-dark ms-1">{pendingReviews.length}</span>
          </h5>
          {loading ? (
            <div className="text-center py-5 text-muted">
              <div className="spinner-border spinner-border-sm me-2"></div> Loading...
            </div>
          ) : pendingReviews.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-check-circle-fill text-success fs-3 d-block mb-2"></i>
              No pending reviews — all caught up!
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {pendingReviews.map((rv) => (
                <div key={rv.reviewId} className="card border-0 rounded-4 shadow-sm p-3">
                  <div className="d-flex justify-content-between align-items-start gap-3">
                    <div className="flex-grow-1">
                      <p className="fw-bold mb-1 small d-flex align-items-center gap-2">
                        <i className="bi bi-person-circle text-secondary"></i>
                        {rv.name}
                        <Stars value={rv.rating} />
                        <span className="badge bg-warning text-dark" style={{ fontSize: '0.65rem' }}>Pending</span>
                      </p>
                      <p className="mb-1 text-muted" style={{ fontSize: '0.88rem' }}>{rv.comment}</p>
                      <p className="mb-0 text-muted" style={{ fontSize: '0.75rem' }}>
                        <i className="bi bi-journal-text me-1"></i>
                        Recipe: <strong>{rv.recipeTitle}</strong>
                        &nbsp;·&nbsp;
                        {new Date(rv.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="d-flex gap-2 flex-shrink-0">
                      <button className="btn btn-sm btn-success rounded-3 d-flex align-items-center gap-1"
                        onClick={() => handleApproveReview(rv.recipeId, rv.reviewId)}
                        disabled={actionLoading === rv.reviewId}>
                        {actionLoading === rv.reviewId
                          ? <span className="spinner-border spinner-border-sm"></span>
                          : <><i className="bi bi-check-lg"></i> Approve</>}
                      </button>
                      <button className="btn btn-sm btn-outline-danger rounded-3 d-flex align-items-center gap-1"
                        onClick={() => handleRejectReview(rv.recipeId, rv.reviewId)}
                        disabled={actionLoading === rv.reviewId + '_reject'}>
                        {actionLoading === rv.reviewId + '_reject'
                          ? <span className="spinner-border spinner-border-sm"></span>
                          : <><i className="bi bi-x-lg"></i> Reject</>}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TRENDING TAB  🔥
      ══════════════════════════════════════════════════════ */}
      {tab === 'trending' && (
        <div>
          {trendLoading ? (
            <div className="text-center py-5"><div className="spinner-border text-danger"></div></div>
          ) : (
            <>
              {/* ── Sub-tabs ── */}
              <ul className="nav nav-pills gap-2 mb-4">
                {[
                  { id: 'today',     label: 'Trending Today',  icon: 'bi-fire' },
                  { id: 'viewed',    label: 'Most Viewed',     icon: 'bi-eye-fill' },
                  { id: 'liked',     label: 'Most Liked',      icon: 'bi-heart-fill' },
                  { id: 'toprated',  label: 'Top Rated',       icon: 'bi-star-fill' },
                  { id: 'credits',   label: 'Credit Leaders',  icon: 'bi-trophy-fill' },
                ].map(t => (
                  <li key={t.id} className="nav-item">
                    <button
                      className={`nav-link d-flex align-items-center gap-1 ${trendTab === t.id ? 'active bg-danger' : 'text-dark border'}`}
                      style={{ borderRadius: 8, fontSize: '0.85rem' }}
                      onClick={() => setTrendTab(t.id)}
                    >
                      <i className={`bi ${t.icon}`}></i> {t.label}
                    </button>
                  </li>
                ))}
              </ul>

              {/* Trending Today */}
              {trendTab === 'today' && (
                <div>
                  <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <i className="bi bi-fire text-danger"></i> Trending Today
                    <span className="badge bg-danger ms-1">{trending?.trendingToday?.length || 0}</span>
                  </h6>
                  {(!trending?.trendingToday?.length) ? (
                    <div className="text-center py-5 text-muted">
                      <i className="bi bi-clock-history fs-2 d-block mb-2"></i>
                      No trending data yet for today. Recipes get tracked as users view them.
                    </div>
                  ) : (
                    <div className="row g-3">
                      {trending.trendingToday.map((r, i) => (
                        <div key={r._id} className="col-md-6 col-lg-4">
                          <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
                            <div className="position-relative">
                              <img src={r.image?.startsWith('http') ? r.image : `http://localhost:5000${r.image}`}
                                alt={r.title} className="w-100" style={{ height: 140, objectFit: 'cover' }}
                                onError={(e) => { e.target.src = 'https://placehold.co/400x140/f8f5f2/e8470a?text=No+Image'; }} />
                              <span className="position-absolute top-0 start-0 m-2 badge bg-danger">#{i + 1}</span>
                              <span className="position-absolute top-0 end-0 m-2 badge bg-dark bg-opacity-75">
                                <i className="bi bi-eye me-1"></i>{r.viewedToday} today
                              </span>
                            </div>
                            <div className="p-3">
                              <div className="fw-bold small mb-1">{r.title}</div>
                              <div className="d-flex gap-2 text-muted" style={{ fontSize: '0.78rem' }}>
                                <span><i className="bi bi-eye me-1"></i>{r.viewCount} total views</span>
                                <span><i className="bi bi-heart-fill text-danger me-1"></i>{r.likes?.length || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Most Viewed */}
              {trendTab === 'viewed' && (
                <div>
                  <h6 className="fw-bold mb-3"><i className="bi bi-eye-fill text-primary me-2"></i>Most Viewed Recipes</h6>
                  <div className="table-responsive rounded-4 shadow-sm">
                    <table className="table table-hover align-middle mb-0 bg-white">
                      <thead className="table-light">
                        <tr><th>#</th><th>Recipe</th><th>Category</th><th>Views</th><th>Likes</th></tr>
                      </thead>
                      <tbody>
                        {(trending?.mostViewed || []).map((r, i) => (
                          <tr key={r._id}>
                            <td><span className="badge bg-primary">{i + 1}</span></td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <img src={r.image?.startsWith('http') ? r.image : `http://localhost:5000${r.image}`}
                                  alt={r.title} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8 }}
                                  onError={(e) => { e.target.src = 'https://placehold.co/40x40/eee/999?text=?'; }} />
                                <span className="fw-semibold small">{r.title}</span>
                              </div>
                            </td>
                            <td><span className="badge bg-light text-dark border">{r.category}</span></td>
                            <td><span className="fw-bold text-primary">{r.viewCount}</span></td>
                            <td><span className="text-danger"><i className="bi bi-heart-fill me-1"></i>{r.likes?.length || 0}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Most Liked */}
              {trendTab === 'liked' && (
                <div>
                  <h6 className="fw-bold mb-3"><i className="bi bi-heart-fill text-danger me-2"></i>Most Liked Recipes</h6>
                  <div className="table-responsive rounded-4 shadow-sm">
                    <table className="table table-hover align-middle mb-0 bg-white">
                      <thead className="table-light">
                        <tr><th>#</th><th>Recipe</th><th>Category</th><th>Likes</th><th>Views</th></tr>
                      </thead>
                      <tbody>
                        {(trending?.mostLiked || []).map((r, i) => (
                          <tr key={r._id}>
                            <td><span className="badge bg-danger">{i + 1}</span></td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <img src={r.image?.startsWith('http') ? r.image : `http://localhost:5000${r.image}`}
                                  alt={r.title} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8 }}
                                  onError={(e) => { e.target.src = 'https://placehold.co/40x40/eee/999?text=?'; }} />
                                <span className="fw-semibold small">{r.title}</span>
                              </div>
                            </td>
                            <td><span className="badge bg-light text-dark border">{r.category}</span></td>
                            <td><span className="fw-bold text-danger"><i className="bi bi-heart-fill me-1"></i>{r.likes?.length || 0}</span></td>
                            <td><span className="text-muted small">{r.viewCount}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Top Rated */}
              {trendTab === 'toprated' && (
                <div>
                  <h6 className="fw-bold mb-3"><i className="bi bi-star-fill text-warning me-2"></i>Top Rated Recipes</h6>
                  {topRated.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <i className="bi bi-star fs-2 d-block mb-2"></i>No rated recipes yet.
                    </div>
                  ) : (
                    <div className="table-responsive rounded-4 shadow-sm">
                      <table className="table table-hover align-middle mb-0 bg-white">
                        <thead className="table-light">
                          <tr><th>#</th><th>Recipe</th><th>Category</th><th>Avg Rating</th><th>Reviews</th><th>Likes</th></tr>
                        </thead>
                        <tbody>
                          {topRated.map((r, i) => (
                            <tr key={r._id}>
                              <td>
                                <span className={`badge ${i === 0 ? 'bg-warning text-dark' : i === 1 ? 'bg-secondary' : 'bg-light text-dark border'}`}>
                                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                </span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <img src={r.image?.startsWith('http') ? r.image : `http://localhost:5000${r.image}`}
                                    alt={r.title} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8 }}
                                    onError={(e) => { e.target.src = 'https://placehold.co/40x40/eee/999?text=?'; }} />
                                  <div>
                                    <div className="fw-semibold small">{r.title}</div>
                                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>by {r.createdBy?.name}</div>
                                  </div>
                                </div>
                              </td>
                              <td><span className="badge bg-light text-dark border">{r.category}</span></td>
                              <td><Stars value={r.computedAvg} /></td>
                              <td><span className="badge bg-info text-dark">{r.approvedReviewCount}</span></td>
                              <td><span className="text-danger"><i className="bi bi-heart-fill me-1"></i>{r.likes?.length || 0}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Credit Leaders */}
              {trendTab === 'credits' && (
                <div>
                  <h6 className="fw-bold mb-3"><i className="bi bi-trophy-fill text-warning me-2"></i>Credit Points Leaderboard</h6>
                  <p className="text-muted small mb-3">Users earn <strong>10 credit points</strong> each time an admin approves their recipe.</p>
                  {credits.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <i className="bi bi-trophy fs-2 d-block mb-2"></i>No credit points awarded yet.
                    </div>
                  ) : (
                    <div className="row g-3">
                      {credits.map((u, i) => (
                        <div key={u._id} className="col-md-6 col-lg-4">
                          <div className={`card border-0 shadow-sm rounded-4 p-3 ${i === 0 ? 'border-warning border-2' : ''}`}
                            style={{ background: i === 0 ? 'rgba(255,193,7,0.08)' : '' }}>
                            <div className="d-flex align-items-center gap-3">
                              <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold`}
                                style={{
                                  width: 44, height: 44,
                                  background: i === 0 ? '#ffc107' : i === 1 ? '#adb5bd' : i === 2 ? '#cd7f32' : '#e9ecef',
                                  color: i < 3 ? '#fff' : '#555',
                                  fontSize: '1.1rem',
                                }}>
                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                              </div>
                              <div className="flex-grow-1">
                                <div className="fw-bold">{u.name}</div>
                                <div className="text-muted" style={{ fontSize: '0.78rem' }}>{u.email}</div>
                              </div>
                              <div className="text-end">
                                <div className="fw-bold text-success fs-5">{u.creditPoints}</div>
                                <div className="text-muted" style={{ fontSize: '0.72rem' }}>points</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Recipe Modal ── */}
      {modalRecipe !== undefined && (
        <RecipeModal recipe={modalRecipe} onClose={() => setModalRecipe(undefined)} onSave={handleModalSave} />
      )}

      {/* ── Confirm Delete Modal ── */}
      {confirmDelete && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', position: 'fixed', inset: 0, zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-body text-center py-4">
                <i className="bi bi-exclamation-triangle-fill text-danger fs-1"></i>
                <h5 className="fw-bold mt-2">Delete {confirmDelete.type === 'user' ? 'User' : 'Recipe'}?</h5>
                <p className="text-muted mb-1"><strong>{confirmDelete.name}</strong> will be permanently deleted.</p>
                {confirmDelete.type === 'user' && (
                  <p className="text-muted small">All their recipes will also be removed.</p>
                )}
              </div>
              <div className="modal-footer border-0 justify-content-center gap-2">
                <button className="btn btn-light rounded-3 px-4" onClick={() => setConfirmDelete(null)}>Cancel</button>
                <button className="btn btn-danger rounded-3 px-4" onClick={handleDelete}>Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Review Moderation Modal ── */}
      {reviewModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', position: 'fixed', inset: 0, zIndex: 1070 }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable" style={{ marginTop: '60px' }}>
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-chat-dots-fill me-2 text-secondary"></i>
                  Reviews — <span className="text-muted fw-normal">{reviewModal.title}</span>
                </h5>
                <button className="btn-close" onClick={() => setReviewModal(null)}></button>
              </div>
              <div className="modal-body pt-0">
                {!reviewModal.reviews?.length ? (
                  <p className="text-muted text-center py-4">No reviews.</p>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {reviewModal.reviews.map((rv) => (
                      <div key={rv._id} className="card border-0 rounded-4 shadow-sm p-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <p className="fw-bold mb-1 small">
                              <i className="bi bi-person-circle text-secondary me-1"></i>
                              {rv.name}
                              <Stars value={rv.rating} />
                              {rv.status === 'pending' && (
                                <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '0.65rem' }}>Pending</span>
                              )}
                            </p>
                            <p className="mb-0 text-muted" style={{ fontSize: '0.88rem' }}>{rv.comment}</p>
                          </div>
                          <button className="btn btn-sm btn-danger rounded-3 ms-2 flex-shrink-0"
                            onClick={() => handleDeleteReview(reviewModal._id, rv._id)}>
                            <i className="bi bi-trash3-fill"></i> Remove
                          </button>
                        </div>
                        <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.72rem' }}>
                          {new Date(rv.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-light rounded-3" onClick={() => setReviewModal(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AdminPage;