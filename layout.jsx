export const metadata = {
  title: 'Hanuman Prime - AI Battery Analytics',
  description: 'AI Battery Analytics for Power Substations by Tinamics Co., Ltd.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body style={{ margin: 0, padding: 0, background: '#1a0a00' }}>
        {children}
      </body>
    </html>
  )
}
