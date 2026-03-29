import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'مُفَكِّرة | Mufakkira',
  description: 'مجتمع الأفكار البحثية — Research Ideas Community',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar">
      <body style={{ margin: 0, background: '#0a0a0a' }}>{children}</body>
    </html>
  )
}
