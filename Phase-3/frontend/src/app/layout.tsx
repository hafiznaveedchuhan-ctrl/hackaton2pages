import './globals.css'

export const metadata = {
  title: 'Fatima Zehra Todo - AI Task Manager',
  description: 'AI-powered todo system with multi-agent architecture',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="text-white font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
