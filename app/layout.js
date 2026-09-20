import { Playfair_Display, Inter } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata = { title: "Tangzee", description: "Tangzee — premium desserts" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body style={{ margin: 0, background: "#FFF9F0", color: "#1D1424", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
        {children}
        <style>{`
          @keyframes tangzeeFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
          .fade-up { animation: tangzeeFadeUp 0.7s ease-out both; }
          .tangzee-gold-underline { position: relative; text-decoration: none; }
          .tangzee-gold-underline::after { content: ""; position: absolute; left: 0; bottom: -3px; width: 0%; height: 1px; background: #D8B36A; transition: width 0.3s ease; }
          .tangzee-gold-underline:hover::after { width: 100%; }
          .tangzee-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(29, 20, 36, 0.12); }
          .tangzee-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
          .tangzee-zoom-wrap { overflow: hidden; }
          .tangzee-zoom-wrap img { transition: transform 0.6s ease; }
          .tangzee-zoom-wrap:hover img { transform: scale(1.05); }
        `}</style>
      </body>
    </html>
  );
  }
