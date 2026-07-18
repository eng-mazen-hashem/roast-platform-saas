import './globals.css'

export const metadata = {
  title: 'ArtisanRoast SaaS Portal',
  description: 'Enterprise IoT Coffee Roasting Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
