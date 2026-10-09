import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const AuthForm = ({ mode, onSubmit, loading, error }) => {
  const isLogin = mode === 'login';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    isLogin ? onSubmit({ email, password }) : onSubmit({ name, email, password });
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-card">
          <div className="text-center mb-4">
            <h2>{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
            <p className="text-muted small">
              {isLogin ? 'Sign in to your RecipeFinder account' : 'Join thousands of food lovers today'}
            </p>
          </div>

          
          {error && (
            <div className="auth-error-alert d-flex align-items-center gap-2 mb-3">
             
              <i className="bi bi-exclamation-triangle-fill"></i>
              {error}
            </div>
          )}

          
          <form onSubmit={handleSubmit}>

            
            {!isLogin && (
              <div className="mb-3">
                <label className="form-label">
                  <i className="bi bi-person me-1"></i>
                  Full Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            
            <div className="mb-3">
              <label className="form-label">
                <i className="bi bi-envelope me-1"></i>
                Email Address
              </label>
              <input
                type="email"
                className="form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            
            <div className="mb-4">
              <label className="form-label">
                <i className="bi bi-lock me-1"></i>
                Password
              </label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder={isLogin ? 'Your password' : 'Min 6 characters'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={isLogin ? 1 : 6}
                />
                
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            
            <button
              type="submit"
              className="btn btn-brand w-100 py-3 d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  Please wait for few seconds...
                </>
              ) : (
                <>
                  
                  <i className={`bi ${isLogin ? 'bi-box-arrow-in-right' : 'bi-person-plus-fill'}`}></i>
                  {isLogin ? 'Login to Account' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          
          <div className="text-center mt-4">
            <p className="text-muted small mb-0">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Link
                to={isLogin ? '/signup' : '/login'}
                className="fw-bold"
                style={{ color: 'var(--brand-primary)' }}
              >
                {isLogin ? 'Sign up here' : 'Login here'}
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthForm;