import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { HashRouter, Routes, Route, Navigate } from "react-router-dom"
import { OrdersPage } from "./app/OrdersPage"
import { ArticlesPage } from "./app/ArticlesPage"
import { CyclesPage } from "./app/CyclesPage"
import { RepeatingOrdersPage } from "./app/RepeatingOrdersPage"
import { LoginPage } from "./app/LoginPage"
import { Header } from "./components/Header"
import { RequireAuth } from "./components/RequireAuth"
import "./i18n"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <div className="min-h-screen">
          <Header />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/" element={<OrdersPage />} />
              <Route path="/articles" element={<ArticlesPage />} />
              <Route path="/cycles" element={<CyclesPage />} />
              <Route path="/repeating-orders" element={<RepeatingOrdersPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </HashRouter>
    </QueryClientProvider>
  )
}

export default App
