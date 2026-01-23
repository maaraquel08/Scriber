import { redirect } from "next/navigation"
import { getServerUser } from "@/lib/server-supabase"
import { HomeClient } from "./home-client"

export default async function Home() {
  const user = await getServerUser()

  if (!user) {
    redirect("/auth/login")
  }

  return <HomeClient />
}
