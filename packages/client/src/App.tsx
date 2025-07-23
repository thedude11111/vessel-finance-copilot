import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { GoogleLoginButton } from './components/GoogleLoginButton';
import { AnalysisChat } from './components/AnalysisChat';
import { ResultsTable } from './components/ResultsTable';
import { ResultsGraphs } from './components/ResultsGraphs';
import { useAnalysisStore } from './stores/analysisStore';
import { useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { User } from 'shared-types';

function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Vessel Finance Copilot</h1>
      <GoogleLoginButton />
    </div>
  );
}

function DashboardPage() {
  const activeAnalysisId = "test-analysis-id"; // Placeholder
  const { parameters, results, fetchAnalysis, error, loading } = useAnalysisStore();

  useEffect(() => {
    if (activeAnalysisId) {
      fetchAnalysis(activeAnalysisId);
    }
  }, [activeAnalysisId, fetchAnalysis]);

  return (
    <div className="p-4 h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      {error && <div className="text-red-500 mb-4">Error: {error}</div>}
      {loading && <div className="text-blue-500 mb-4">Loading analysis data...</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        <div className="flex flex-col">
          {activeAnalysisId ? (
            <AnalysisChat analysisId={activeAnalysisId} title="Vessel Parameters Chat" chatType="parameters" />
          ) : (
            <p>Please select or create an analysis to start chatting.</p>
          )}
        </div>
        <div className="flex flex-col space-y-4">
          <h2 className="text-xl font-bold">Analysis Results</h2>
          {parameters.length > 0 && (
            <ResultsTable data={parameters.map(p => ({ key: p.key, value: p.value, type: p.type }))} caption="Extracted Parameters" />
          )}
          {results && results.cashFlowProjections && (
            <ResultsTable data={results.cashFlowProjections} caption="Cash Flow Projections" />
          )}
          {results && results.chartData && (
            <ResultsGraphs chartData={results.chartData} />
          )}
          {activeAnalysisId && (
            <AnalysisChat analysisId={activeAnalysisId} title="Results Q&A" chatType="results" />
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const { token, setToken, setUser } = useAuthStore();

  // Handle Google OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jwtToken = params.get('token');

    if (jwtToken) {
      setToken(jwtToken);
      try {
        const decodedToken: any = jwtDecode(jwtToken);
        setUser({ name: decodedToken.name, email: decodedToken.email });
      } catch (error) {
        console.error("Error decoding JWT:", error);
        // Optionally, log out the user or show an error message
      }
      window.history.replaceState({}, document.title, "/"); // Clean the URL
    }
  }, [setToken, setUser]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/dashboard" element={token ? <DashboardPage /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
