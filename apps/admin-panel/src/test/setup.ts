import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"
// Tests read the English strings, as the app shows them by default.
import "@/i18n"

afterEach(cleanup)
