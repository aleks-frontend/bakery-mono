import { createBakeryAuthClient } from "@bakery/api-client"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"

export const authClient = createBakeryAuthClient(BACKEND_URL)

export const { useSession, signIn, signOut } = authClient
