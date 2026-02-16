import { Routes, Route, Navigate } from 'react-router-dom';
import SolverPage from './pages/SolverPage';
import EquityPage from './pages/equity/EquityPage';
import { Sidebar } from './components/layout/Sidebar';

function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/solver" replace />} />
          <Route path="/solver" element={<SolverPage />} />
          <Route path="/equity" element={<EquityPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
