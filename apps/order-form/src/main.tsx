// Watch Paths test: this comment is a no-op change scoped to order-form only.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import Modal from "react-modal";
import "@/i18n";
import App from "./App";
import "./index.css";

// No-ops if VITE_SENTRY_DSN is unset, same convention as the backend's Resend/Sentry setup.
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});

Modal.setAppElement("#root");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 6000,
          style: {
            background: "#3d2f1e",
            color: "#fdf6ec",
            borderRadius: "12px",
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>
);
