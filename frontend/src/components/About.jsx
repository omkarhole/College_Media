export default function About() {
  return (
    <section id="about" className="about">
      <div className="container">
        <div className="about-container">
          <div className="about-content">
            <h2>What Makes ProjectX Different?</h2>
            <p>
              We're not just another platform. ProjectX was built from the ground up
              with developers in mind, combining cutting-edge technology with intuitive design.
            </p>
            <p>
              Our mission is to empower creators and businesses to bring their ideas to life
              without the usual technical barriers and complexity.
            </p>

            <div className="stats">
              <div className="stat">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Active Users</div>
              </div>
              <div className="stat">
                <div className="stat-number">99.9%</div>
                <div className="stat-label">Uptime</div>
              </div>
              <div className="stat">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Support</div>
              </div>
            </div>
          </div>

          <div className="about-image">
            <img
              src="https://placehold.co/600x400/1e1b4b/ffffff?text=ProjectX+Dashboard"
              alt="ProjectX Dashboard"
            />
            <div className="floating-circle bottom-right" />
          </div>
        </div>
      </div>
    </section>
  );
}
