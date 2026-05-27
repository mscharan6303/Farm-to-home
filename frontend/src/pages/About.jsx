export default function About() {
  return (
    <div className="container section">
      <h1 className="section-title"><small>Our story</small>About Farm to Home</h1>
      <div style={{ maxWidth: 760, margin: "0 auto", lineHeight: 1.8 }}>
        <p className="mb-2">Farm to Home was born from a simple belief: the people who grow our food deserve to be paid fairly, and the people who eat it deserve to know where it came from.</p>
        <p className="mb-2">We work directly with verified small and medium farms across India. No middlemen, no warehouses sitting on produce for days. Just fresh harvests, picked at peak ripeness and delivered to your home within 24 hours.</p>
        <p className="mb-2">Every order supports an Indian farmer family. Every bite is traceable. That's our promise.</p>
        <div className="grid grid-3 mt-3">
          <div className="stat"><div className="label">Verified farmers</div><div className="value">1,200+</div></div>
          <div className="stat"><div className="label">Cities served</div><div className="value">14</div></div>
          <div className="stat"><div className="label">Orders delivered</div><div className="value">85,000+</div></div>
        </div>
      </div>
    </div>
  );
}
