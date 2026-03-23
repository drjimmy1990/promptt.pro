import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminTemplates from './pages/Admin/AdminTemplates';
import AdminCategories from './pages/Admin/AdminCategories';
import AdminOptions from './pages/Admin/AdminOptions';
import AdminConfig from './pages/Admin/AdminConfig';
import AdminHistory from './pages/Admin/AdminHistory';
import { ToastProvider } from './components/Toast';
import './index.css';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="templates" element={<AdminTemplates />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="options" element={<AdminOptions />} />
            <Route path="config" element={<AdminConfig />} />
            <Route path="history" element={<AdminHistory />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
