const Footer = () => {
  return (
    <footer className="footer text-white pt-4 pb-3 mt-5">
      <div className="container">
        <div className="row text-center text-md-start">

          {/* App Info */}
          <div className="col-md-4 mb-3">
            <h5 className="fw-bold">Aura & Aroma</h5>
            <p className="small">
              Explore. Create. Share your favorite recipes 🍲
            </p>
          </div>

          {/* Contact Info */}
          <div className="col-md-4 mb-3">
            <h6 className="fw-bold">Contact</h6>
            <p className="small mb-1">
              <i className="bi bi-envelope-fill me-2"></i>
              support@auraandaroma.com
            </p>
            <p className="small mb-1">
              <i className="bi bi-telephone-fill me-2"></i>
              +91 98765 43210
            </p>
            <p className="small">
              <i className="bi bi-geo-alt-fill me-2"></i>
              Chennai, India
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-md-4 mb-3">
            <h6 className="fw-bold">Quick Links</h6>
            <p className="small mb-1">Home</p>
            <p className="small mb-1">Recipes</p>
            <p className="small mb-1">Contact</p>
          </div>

        </div>

        <hr className="border-light" />

        <div className="text-center small">
          © 2026 Aura & Aroma | All Rights Reserved
        </div>
      </div>
    </footer>
  );
};

export default Footer;