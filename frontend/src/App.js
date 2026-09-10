import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import ViewPage from './pages/ViewPage';
import Dashboard from './pages/Dashboard';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <nav className="nav">
        <a href="/" className="nav-brand">
          <div className="nav-brand-icon">🔗</div>
          <span className="nav-brand-text">Secure<span>Image</span></span>
        </a>
        <div className="nav-links">
          <NavLink to="/"
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            end>
            Upload
          </NavLink>
          <NavLink to="/view"
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            View Image
          </NavLink>
          <NavLink to="/dashboard"
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Audit Log
          </NavLink>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/view" element={<ViewPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;