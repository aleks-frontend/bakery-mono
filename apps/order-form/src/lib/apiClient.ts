import { createHttpClient, createPublicClient } from "@bakery/api-client"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"

const http = createHttpClient(BACKEND_URL)

export const publicClient = createPublicClient(http)
