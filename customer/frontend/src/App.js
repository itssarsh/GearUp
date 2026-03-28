import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LoadingProvider } from "./components/LoadingProvider";
import { ToastProvider } from "./components/ToastProvider";
import {
  CustomerAddServiceRecordPage,
  CustomerAddVehiclePage,
  CustomerDashboardPage,
  CustomerForgotPasswordPage,
  CustomerLoginPage,
  CustomerProfilePage,
  CustomerResetPasswordPage,
  CustomerSignupPage,
} from "./portals/customer";
import "./App.css";

function App() {
  return (
    <div className="app-shell">
      <LoadingProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<CustomerLoginPage />} />
              <Route path="/forgot-password" element={<CustomerForgotPasswordPage />} />
              <Route path="/reset-password" element={<CustomerResetPasswordPage />} />
              <Route path="/signup" element={<CustomerSignupPage />} />
              <Route path="/dashboard" element={<CustomerDashboardPage />} />
              <Route path="/vehicles/new" element={<CustomerAddVehiclePage />} />
              <Route path="/service-records/new" element={<CustomerAddServiceRecordPage />} />
              <Route
                path="/service-records/:recordId/edit"
                element={<CustomerAddServiceRecordPage />}
              />
              <Route path="/profile" element={<CustomerProfilePage />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </LoadingProvider>
    </div>
  );
}

export default App;
