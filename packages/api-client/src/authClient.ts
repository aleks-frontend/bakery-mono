import { createAuthClient } from "better-auth/react";

export function createBakeryAuthClient(baseURL: string) {
  return createAuthClient({ baseURL });
}
