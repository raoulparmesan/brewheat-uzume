export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, background: '#000', color: '#D4AF37', fontFamily: 'system-ui' }}>
        {children}
      </body>
    </html>
  );
}
