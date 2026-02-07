const team = [
  { initials: "AJ", name: "Alex Johnson", role: "Founder & CEO" },
  { initials: "SC", name: "Sarah Chen", role: "CTO" },
  { initials: "MR", name: "Mike Rodriguez", role: "Lead Designer" },
  { initials: "EW", name: "Emma Wilson", role: "Product Manager" },
];

export default function Team() {
  return (
    <section id="team" className="team">
      <div className="container">
        <h2 className="section-title">Meet Our Team</h2>
        <p className="section-subtitle">Passionate creators building the future together</p>

        <div className="team-grid">
          {team.map((m, idx) => (
            <div className="team-member" key={idx}>
              <img
                src={`https://placehold.co/300x300/1e1b4b/ffffff?text=${m.initials}`}
                alt={m.name}
                className="team-photo"
              />
              <h3>{m.name}</h3>
              <p>{m.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
