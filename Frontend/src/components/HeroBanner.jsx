import React from 'react';
import { Link } from 'react-router-dom';

const HeroBanner = ({ isLoggedIn }) => {
  return (
    <section className="hero-section">
      <div className="container position-relative" style={{ zIndex: 2 }}>
        <div className="row align-items-center gy-5">

          {/* Left Side */}
          <div className="col-lg-7 text-center text-lg-start">
            <h1 className="hero-title mb-3">
              Welcome to<br />
              <i><span className="hero-highlight">Cravings World</span></i>
            </h1>

            <p className="hero-subtitle mb-4 mx-auto mx-lg-0">
              <i>---"Explore a world of flavor, preserve your palate, and lead the gastronomic conversation."</i>
            </p>

            <div className="d-flex flex-wrap justify-content-center justify-content-lg-start gap-3">
              {isLoggedIn ? (
                <Link to="/create-recipe" className="btn btn-light btn-lg fw-bold rounded-pill px-4 shadow">
                  Add Your Recipe
                </Link>
              ) : (
                <>
                  <Link to="/signup" className="btn btn-light btn-lg fw-bold rounded-pill px-4 shadow">
                    Get Started
                  </Link>
                  <Link to="/login" className="btn btn-outline-light btn-lg fw-semibold rounded-pill px-4">
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right Side: 2x2 Grid */}
          <div className="col-lg-5">
            <div className="row g-3">

              {[
                { label: 'Recipes', num: '100+', icon: 'bi-book-fill' },
                { label: 'Categories', num: '6', icon: 'bi-grid-fill' },
                { label: 'Chefs', num: '500+', icon: 'bi-people-fill' },
                { label: 'Forever', num: 'Free', icon: 'bi-star-fill' }
              ].map((stat, idx) => (
                <div className="col-6" key={idx}>
                  <div className="hero-stat-card">
                    <i className={`bi ${stat.icon} fs-3 mb-2 d-block text-white-50`}></i>
                    <div className="hero-stat-number">{stat.num}</div>
                    <div className="hero-stat-label text-uppercase">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroBanner;