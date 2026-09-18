const PLUM = "#2F243A";

export default function OnlyOneDifference() {
  return (
    <main style={{ minHeight: "100vh", background: PLUM, color: "#fff", padding: "48px 20px", textAlign: "center" }}>
      <div style={{ maxWidth: 380, margin: "0 auto" }}>
        <h1 style={{ letterSpacing: 2, fontSize: 24 }}>ONLY 1 DIFFERENCE</h1>
        <p style={{ marginTop: 16, letterSpacing: 1, opacity: 0.85 }}>FIND IT. CIRCLE IT. BRING IT.</p>
        <p style={{ marginTop: 24, fontSize: 14, opacity: 0.85, lineHeight: 1.6 }}>
          Look for a Tangzee poster in the wild — two almost-identical scenes,
          only one difference between them. Spot it, scan the QR code on the
          poster, and claim your reward for that dessert.
        </p>
        <p style={{ marginTop: 24, fontSize: 13, opacity: 0.6 }}>
          No poster nearby? Keep an eye out around town — new campaigns drop regularly.
        </p>
      </div>
    </main>
  );
}
