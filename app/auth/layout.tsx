export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Auth pages handle their own redirect logic client-side
  // The callback route needs to process without server-side redirect
  return <>{children}</>
}
