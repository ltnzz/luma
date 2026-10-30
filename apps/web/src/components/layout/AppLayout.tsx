import type { ReactNode } from 'react'

export function AppLayout({ children, fullWidth = false }: { children: ReactNode; fullWidth?: boolean }) {
  if (fullWidth) {
    return (
      <main className="min-h-screen bg-background text-foreground flex flex-col">
        {children}
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        {children}
      </div>
    </main>
  )
}
