// components/Navbar.jsx

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar navbar-expand-lg rf-navbar fixed-top shadow-sm">
      <div className="container">

        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <i className="bi bi-fire fs-4"></i>
          Aura & Aroma
        </Link>

        <button
          className="navbar-toggler border-0"
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <i className={`bi ${menuOpen ? 'bi-x-lg' : 'bi-list'} fs-5`}></i>
        </button>

        <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`}>

          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {isLoggedIn && (
              <li className="nav-item">
                <Link
                  className={`nav-link d-flex align-items-center gap-1 ${isActive('/') ? 'active' : ''}`}
                  to="/"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-house-door-fill"></i>
                  Home
                </Link>
              </li>
            )}

            {isLoggedIn && !isAdmin && (
              <>
                <li className="nav-item">
                  <Link
                    className={`nav-link d-flex align-items-center gap-1 ${isActive('/create-recipe') ? 'active' : ''}`}
                    to="/create-recipe"
                    onClick={() => setMenuOpen(false)}
                  >
                    <i className="bi bi-plus-circle-fill"></i>
                    Add Recipe
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    className={`nav-link d-flex align-items-center gap-1 ${isActive('/saved-recipes') ? 'active' : ''}`}
                    to="/saved-recipes"
                    onClick={() => setMenuOpen(false)}
                  >
                    <i className="bi bi-heart-fill"></i>
                    Saved
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    className={`nav-link d-flex align-items-center gap-1 ${isActive('/my-recipes') ? 'active' : ''}`}
                    to="/my-recipes"
                    onClick={() => setMenuOpen(false)}
                  >
                    <i className="bi bi-journal-richtext"></i>
                    My Recipes
                  </Link>
                </li>
              </>
            )}

            {/* ✅ Admin Dashboard link - only for admin users */}
            {isAdmin && (
              <li className="nav-item">
                <Link
                  className={`nav-link d-flex align-items-center gap-1 ${isActive('/admin') ? 'active' : ''}`}
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-shield-lock-fill text-warning"></i>
                  Admin Panel
                </Link>
              </li>
            )}
          </ul>

          <ul className="navbar-nav ms-auto align-items-center gap-2">
            {!isLoggedIn ? (
              <>
                <li className="nav-item">
                  <Link
                    className="btn btn-brand-outline btn-sm d-flex align-items-center gap-1"
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                  >
                    <i className="bi bi-box-arrow-in-right"></i>
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className="btn btn-brand btn-sm d-flex align-items-center gap-1"
                    to="/signup"
                    onClick={() => setMenuOpen(false)}
                  >
                    <i className="bi bi-person-plus-fill"></i>
                    Sign Up
                  </Link>
                </li>
              </>
            ) : (
              <li className="nav-item dropdown">
                <button
                  className="btn btn-light btn-sm d-flex align-items-center gap-2 rounded-pill px-3"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className={`bi ${isAdmin ? 'bi-shield-fill-check text-warning' : 'bi-person-circle text-danger'} fs-5`}></i>
                  <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                    {user.name} {isAdmin && <span className="badge bg-warning text-dark ms-1" style={{fontSize:'0.65rem'}}>Admin</span>}
                  </span>
                  <i className="bi bi-chevron-down small"></i>
                </button>

                <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 mt-1">
                  {isAdmin ? (
                    <li>
                      <Link className="dropdown-item d-flex align-items-center gap-2" to="/admin" onClick={() => setMenuOpen(false)}>
                        <i className="bi bi-shield-lock text-warning"></i>
                        Admin Dashboard
                      </Link>
                    </li>
                  ) : (
                    <>
                      <li>
                        <Link className="dropdown-item d-flex align-items-center gap-2" to="/my-recipes" onClick={() => setMenuOpen(false)}>
                          <i className="bi bi-journal-richtext text-muted"></i>
                          My Recipes
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item d-flex align-items-center gap-2" to="/saved-recipes" onClick={() => setMenuOpen(false)}>
                          <i className="bi bi-heart text-muted"></i>
                          Saved Recipes
                        </Link>
                      </li>
                    </>
                  )}
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button
                      className="dropdown-item d-flex align-items-center gap-2 text-danger"
                      onClick={handleLogout}
                    >
                      <i className="bi bi-box-arrow-right"></i>
                      Logout
                    </button>
                  </li>
                </ul>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;