import type { Metadata } from "next"
import "./globals.css"
import { AgentationWrapper } from "./components/agentation-wrapper"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "Scriber",
  description: "A Next.js application with Tailwind CSS",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
        <AgentationWrapper />
      </body>
    </html>
  )
}
