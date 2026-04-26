import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MainLayout from './components/Layout/MainLayout';
import LandingPage from './pages/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import ProjectDetails from './pages/ProjectDetails';
import CreateProject from './pages/CreateProject';
import CreateCollection from './pages/CreateCollection';
import NotFound from './pages/NotFound';
import Analytics from './pages/Analytics';
import Releases from './pages/Releases';
import AdminCreateRelease from './pages/AdminCreateRelease';


import Database from './pages/Database';
import Storage from './pages/Storage';
import Docs from './pages/Docs';
import Auth from './pages/Auth';
import AuthCallback from './pages/AuthCallback';
import OtpVerification from './pages/OtpVerification';
import ForgotPassword from './pages/ForgotPassword';
import Settings from './pages/Settings';
import ProjectSettings from './pages/ProjectSettings';
import Webhooks from './pages/Webhooks';
import RequestPro from './pages/RequestPro';
import AdminProRequests from './pages/AdminProRequests';

import { LayoutProvider } from './context/LayoutContext';
import { PlanProvider, usePlan } from './context/PlanContext';
import UpgradeModal from './components/UpgradeModal';
import BillingSuccess from './pages/BillingSuccess';

// Inner component so usePlan can be called inside PlanProvider
function AppContent() {
  const { isUpgradeModalOpen, closeUpgradeModal } = usePlan();
  return (
    <LayoutProvider>
      <Toaster position="top-center" reverseOrder={false}
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
            border: '1px solid #444'
          }
        }}
      />

      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={closeUpgradeModal} />

      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-otp" element={<OtpVerification />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/request-pro" element={<RequestPro />} />


        {/* --- Protected Routes --- */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/create-project" element={
          <ProtectedRoute>
            <MainLayout>
              <CreateProject />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/project/:projectId" element={
          <ProtectedRoute>
            <MainLayout>
              <ProjectDetails />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/project/:projectId/database" element={
          <ProtectedRoute>
            <MainLayout>
              <Database />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/project/:projectId/storage" element={<ProtectedRoute><MainLayout><Storage /></MainLayout></ProtectedRoute>} />


        <Route path="/docs" element={
          <Docs />
        } />


        <Route path="/project/:projectId/analytics" element={
          <ProtectedRoute>
            <MainLayout>
              <Analytics />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/project/:projectId/auth" element={<ProtectedRoute><MainLayout><Auth /></MainLayout></ProtectedRoute>} />

        <Route path="/project/:projectId/webhooks" element={<ProtectedRoute><MainLayout><Webhooks /></MainLayout></ProtectedRoute>} />

        <Route path="/settings" element={<ProtectedRoute><MainLayout><Settings /></MainLayout></ProtectedRoute>} />

        <Route path="/project/:projectId/settings" element={<ProtectedRoute><MainLayout><ProjectSettings /></MainLayout></ProtectedRoute>} />


        <Route path="/project/:projectId/create-collection" element={
          <ProtectedRoute>
            <MainLayout>
              <CreateCollection />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/releases" element={
          <MainLayout>
            <Releases />
          </MainLayout>
        } />

        <Route path="/admin/create-release" element={
          <ProtectedRoute>
            <MainLayout>
              <AdminCreateRelease />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/pro-requests" element={
          <ProtectedRoute>
            <MainLayout>
              <AdminProRequests />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/billing/success" element={
          <ProtectedRoute>
            <BillingSuccess />
          </ProtectedRoute>
        } />

        <Route path="*" element={<NotFound />} />

      </Routes>
    </LayoutProvider>
  );
}

function App() {
  return (
    <PlanProvider>
      <AppContent />
    </PlanProvider>
  );
}

export default App;
