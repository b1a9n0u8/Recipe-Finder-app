import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../data/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';

// Status badge helper
const StatusBadge = ({ status }) => {
  const map = {
    requested: { bg: 'bg-warning text-dark',  icon: 'bi-hourglass-split',   label: 'Pending Approval' },
    approved:  { bg: 'bg-success text-white',  icon: 'bi-check-circle-fill', label: 'Approved' },
    modified:  { bg: 'bg-info text-white',     icon: 'bi-pencil-square',     label: 'Modified & Approved' },
  };
  const s = map[status] || map.requested;
  return (
    <span className={`badge ${s.bg} d-inline-flex align-items-center gap-1 px-2 py-1`} style={{ fontSize: '0.75rem' }}>
      <i className={`bi ${s.icon}`}></i>
      {s.label}
    </span>
  );
};

const MyRecipesPage = () => {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [recipes,  setRecipes]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const fetchMyRecipes = async () => {
      setLoading(true);
      try {
        const response = await api.get('/recipes/my');
        setRecipes(response.data);
      } catch {
        setToast({ message: 'Failed to load your recipes', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchMyRecipes();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recipe?')) return;
    setDeleting(id);
    try {
      await api.delete(`/recipes/${id}`);
      setRecipes(prev => prev.filter(r => r._id !== id));
      setToast({ message: 'Recipe deleted!', type: 'success' });
    } catch {
      setToast({ message: 'Failed to delete recipe', type: 'error' });
    } finally {
      setDeleting(null);
    }
  };

  // approved or modified → user can edit/delete
  const isApproved = (recipe) =>
    recipe.status === 'approved' || recipe.status === 'modified';

  return (
    <div className="container py-4">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h1 className="fw-bold d-flex align-items-center gap-2 mb-1" style={{ fontSize: '1.8rem' }}>
            <i className="bi bi-journal-richtext text-danger"></i>
            My Recipes
          </h1>
          <p className="text-muted mb-0">
            {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} created
          </p>
        </div>
        <Link to="/create-recipe" className="btn btn-danger d-flex align-items-center gap-2">
          <i className="bi bi-plus-circle-fill"></i>
          Add New Recipe
        </Link>
      </div>

      {/* Info banner */}
      <div className="alert alert-info d-flex align-items-center gap-2 mb-4 py-2" style={{ fontSize: '0.88rem' }}>
        <i className="bi bi-info-circle-fill"></i>
        Recipes need <strong>&nbsp;Admin Approval&nbsp;</strong> before they appear publicly.
        Only <strong>Approved</strong> recipes can be edited or deleted.
        Once approved, editing will re-submit the recipe for approval.
      </div>

      {loading ? (
        <LoadingSpinner message="Loading your recipes..." />
      ) : recipes.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-journal-x" style={{ fontSize: '3rem' }}></i>
          <p className="mt-2">No recipes yet. <Link to="/create-recipe">Create one!</Link></p>
        </div>
      ) : (
        <div className="row g-3">
          {recipes.map((recipe) => (
            <div key={recipe._id} className="col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm border-0 rounded-4 overflow-hidden">

                {/* Image */}
                <div className="position-relative">
                  <img
                    src={recipe.image || 'https://placehold.co/400x220/f8f5f2/e8470a?text=No+Image'}
                    alt={recipe.title}
                    className="card-img-top"
                    style={{ height: '180px', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = 'https://placehold.co/400x220/f8f5f2/e8470a?text=No+Image'; }}
                  />
                  {/* Lock overlay for pending recipes */}
                  {!isApproved(recipe) && (
                    <div
                      className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                      style={{ background: 'rgba(0,0,0,0.45)', borderRadius: '0' }}
                    >
                      <div className="text-center text-white">
                        <i className="bi bi-hourglass-split" style={{ fontSize: '2rem' }}></i>
                        <p className="mb-0 small fw-semibold mt-1">Waiting for Approval</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="card-body d-flex flex-column gap-2">
                  {/* Status badge */}
                  <StatusBadge status={recipe.status} />

                  <h6 className="fw-bold mb-0">{recipe.title}</h6>
                  <p className="text-muted small mb-0" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {recipe.description}
                  </p>

                  {/* Meta */}
                  <div className="d-flex gap-2 flex-wrap">
                    <span className="badge bg-light text-dark border"><i className="bi bi-tag-fill text-danger me-1"></i>{recipe.category}</span>
                    <span className="badge bg-light text-dark border"><i className="bi bi-clock-fill text-danger me-1"></i>{recipe.cookTime} min</span>
                  </div>

                  {/* Approval date */}
                  {recipe.approvalDate && (
                    <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>
                      <i className="bi bi-calendar-check text-success me-1"></i>
                      Approved on {new Date(recipe.approvalDate).toLocaleDateString()}
                    </p>
                  )}

                  {/* Pending notice */}
                  {!isApproved(recipe) && (
                    <div className="alert alert-warning py-1 px-2 mb-0 d-flex align-items-center gap-1" style={{ fontSize: '0.78rem' }}>
                      <i className="bi bi-lock-fill"></i>
                      Admin approval pending — editing locked
                    </div>
                  )}

                  {/* Actions */}
                  <div className="d-flex flex-column gap-2 mt-auto pt-2">

                    {/* View Recipe — always show, only clickable if approved */}
                    <Link
                      to={isApproved(recipe) ? `/recipe/${recipe._id}` : '#'}
                      className={`btn btn-sm d-flex align-items-center justify-content-center gap-1 ${isApproved(recipe) ? 'btn-danger' : 'btn-secondary disabled'}`}
                      title={isApproved(recipe) ? 'View Recipe' : 'Available after approval'}
                      onClick={e => { if (!isApproved(recipe)) e.preventDefault(); }}
                    >
                      <i className="bi bi-eye-fill"></i> View Recipe
                    </Link>

                    <div className="d-flex gap-2">
                      {/* Edit — only if approved */}
                      {isApproved(recipe) ? (
                        <button
                          className="btn btn-outline-secondary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1"
                          onClick={() => navigate(`/edit-recipe/${recipe._id}`)}
                        >
                          <i className="bi bi-pencil-fill"></i> Edit
                        </button>
                      ) : (
                        <button
                          className="btn btn-outline-secondary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1"
                          disabled
                          title="Waiting for admin approval"
                        >
                          <i className="bi bi-lock-fill"></i> Edit
                        </button>
                      )}

                      {/* Delete — only if approved */}
                      {isApproved(recipe) ? (
                        <button
                          className="btn btn-outline-danger btn-sm flex-fill d-flex align-items-center justify-content-center gap-1"
                          onClick={() => handleDelete(recipe._id)}
                          disabled={deleting === recipe._id}
                        >
                          {deleting === recipe._id
                            ? <span className="spinner-border spinner-border-sm"></span>
                            : <><i className="bi bi-trash3-fill"></i> Delete</>
                          }
                        </button>
                      ) : (
                        <button
                          className="btn btn-outline-danger btn-sm flex-fill d-flex align-items-center justify-content-center gap-1"
                          disabled
                          title="Waiting for admin approval"
                        >
                          <i className="bi bi-lock-fill"></i> Delete
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default MyRecipesPage;