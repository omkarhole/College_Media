const features = [
  { icon: "⚡", title: "Lightning Fast", desc: "Optimized performance with instant loading times and smooth interactions." },
  { icon: "🌐", title: "Global Scale", desc: "Deploy worldwide with automatic CDN and edge computing capabilities." },
  { icon: "🛡️", title: "Enterprise Security", desc: "Bank-grade security with end-to-end encryption and compliance." },
  { icon: "👥", title: "Collaborative", desc: "Real-time collaboration tools for teams of any size." },
  { icon: "🏆", title: "Award Winning", desc: "Recognized by industry leaders for innovation and excellence." },
  { icon: "💻", title: "Developer First", desc: "Intuitive APIs and comprehensive documentation for rapid development." },
];

export default function Features() {
  return (
    <section id="features" className="features">
      <div className="container">
        <h2 className="section-title">Powerful Features</h2>
        <p className="section-subtitle">Everything you need to build amazing digital experiences</p>

        <div className="features-grid">
          {features.map((f, idx) => (
            <div className="feature-card" key={idx}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
