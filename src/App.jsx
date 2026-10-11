import { Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import UploadPage from "./pages/UploadPage";
import InvestigationPage from "./pages/InvestigationPage";
import AIReportPage from "./pages/AIReportPage";

export default function App() {
  return (
    <Routes>

      <Route
        path="/"
        element={<LandingPage />}
      />

      <Route
        path="/upload"
        element={<UploadPage />}
      />

      <Route
        path="/investigation"
        element={<InvestigationPage />}
      />

      <Route
        path="/ai-report"
        element={<AIReportPage />}
      />

    </Routes>
  );
}