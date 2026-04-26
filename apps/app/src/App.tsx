import { Navigate, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "@techbirds/ui-kit";
import { Shell } from "./components/Shell";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Punch from "./pages/Punch";
import Leave from "./pages/Leave";
import Feed from "./pages/Feed";
import Payslips from "./pages/Payslips";
import Documents from "./pages/Documents";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Shell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/punch" element={<Punch />} />
        <Route path="/leave" element={<Leave />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/payslips" element={<Payslips />} />
        <Route path="/documents" element={<Documents />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  );
}
