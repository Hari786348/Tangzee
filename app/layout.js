export const metadata = {
  title: "Tangzee",
  description: "Tangzee — premium desserts",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#FFFFFF",
          color: "#000000",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
