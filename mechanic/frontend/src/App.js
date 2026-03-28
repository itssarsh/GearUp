import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LoadingProvider } from "./components/LoadingProvider";
import { ToastProvider } from "./components/ToastProvider";
import {
  MechanicAddServiceRecordPage,
  MechanicAddVehiclePage,
  MechanicDashboardPage,
  MechanicForgotPasswordPage,
  MechanicLoginPage,
  MechanicProfilePage,
  MechanicResetPasswordPage,
  MechanicSignupPage,
} from "./portals/mechanic";
import "./App.css";

function App() {
  return (
    <div className="app-shell">
      <LoadingProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<MechanicLoginPage />} />
              <Route path="/workshop/login" element={<MechanicLoginPage />} />
              <Route
                path="/workshop/forgot-password"
                element={<MechanicForgotPasswordPage />}
              />
              <Route
                path="/workshop/reset-password"
                element={<MechanicResetPasswordPage />}
              />
              <Route path="/workshop/signup" element={<MechanicSignupPage />} />
              <Route path="/workshop/dashboard" element={<MechanicDashboardPage />} />
              <Route path="/workshop/vehicles/new" element={<MechanicAddVehiclePage />} />
              <Route
                path="/workshop/service-records/new"
                element={<MechanicAddServiceRecordPage />}
              />
              <Route
                path="/workshop/service-records/:recordId/edit"
                element={<MechanicAddServiceRecordPage />}
              />
              <Route path="/workshop/profile" element={<MechanicProfilePage />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </LoadingProvider>
    </div>
  );
}

export default App;
