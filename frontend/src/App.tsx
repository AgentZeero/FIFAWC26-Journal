import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthPage } from "./pages/AuthPage";
import { MainLayout } from "./pages/MainLayout";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Loading application…</p>
      </div>
    );
  }
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { token } = useAuth();
  return (
    <Routes>
      <Route 
        path="/login" 
        element={token ? <Navigate to="/" replace /> : <AuthPage mode="login" />} 
      />
      <Route 
        path="/register" 
        element={token ? <Navigate to="/" replace /> : <AuthPage mode="register" />} 
      />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
