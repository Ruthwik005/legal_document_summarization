import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import PropTypes from 'prop-types';
import HomeDoop from "./components/HomeDoop";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import Error from "./components/Error";
import Otp from "./components/Otp";
import Dash from "./components/Dash";
import ForgetPassward from "./components/ForgetPassward";
import ResetPassword from "./components/ResetPassword";
import ResetOtp from "./components/ResetOtp";
import ModelsPage from "./components/ModelsPage";
import Summarization from './components/Summarization';
import QAPage from "./components/QAPage";
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import BlogList from './components/blog/BlogList';
import BlogEditor from './components/blog/BlogEditor';
import BlogPostDetail from './components/blog/BlogPostDetail';
import PublicBlogList from './components/blog/PublicBlogList';
import FeedbackList from './components/admin/FeedbackList';
import NotesApp from "./components/NotesApp"; 
import ProfileWeb from "./components/ProfileWeb"; 

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const isExpired = decoded.exp * 1000 < Date.now();

    if (isExpired) {
      localStorage.removeItem('token');
      localStorage.removeItem('email');
      return <Navigate to="/signin" state={{ expired: true }} replace />;
    }

 
    if (decoded.isAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    }

    return children;
  } catch (error) {
    console.error('Invalid token:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    return <Navigate to="/signin" replace />;
  }
};

const AdminProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const isExpired = decoded.exp * 1000 < Date.now();

    if (isExpired) {
      localStorage.removeItem('token');
      localStorage.removeItem('email');
      return <Navigate to="/signin" state={{ expired: true }} replace />;
    }

    if (!decoded.isAdmin) {
      return <Navigate to="/Dash" replace />;
    }

    return children;
  } catch (error) {
    console.error('Invalid token:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    return <Navigate to="/signin" replace />;
  }
};

AdminProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};

const PublicRoute = ({ children, restricted = false }) => {
  const token = localStorage.getItem('token');

  if (token) {
    try {
      const decoded = jwtDecode(token);
      const isExpired = decoded.exp * 1000 < Date.now();
      
      if (isExpired) {
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        return children;
      }
 
      if (restricted) {
        return <Navigate to={decoded.isAdmin ? "/admin/dashboard" : "/Dash"} replace />;
      }
      
      return children;
    } catch (error) {
      console.error('Invalid token:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('email');
      return children;
    }
  }

  return children;
};

PublicRoute.propTypes = {
  children: PropTypes.node.isRequired,
  restricted: PropTypes.bool
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <PublicRoute restricted>
            <HomeDoop />
          </PublicRoute>
        } />
        <Route path="/signin" element={
          <PublicRoute restricted>
            <SignIn />
          </PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute restricted>
            <SignUp />
          </PublicRoute>
        } />
        <Route path="/otp" element={
          <PublicRoute restricted>
            <Otp />
          </PublicRoute>
        } />
        <Route path="/ForgetPassward" element={
          <PublicRoute restricted>
            <ForgetPassward />
          </PublicRoute>
        } />
        <Route path="/ResetPassword" element={
          <PublicRoute restricted>
            <ResetPassword />
          </PublicRoute>
        } />
        <Route path="/ResetOtp" element={
          <PublicRoute restricted>
            <ResetOtp />
          </PublicRoute>
        } />

        <Route path="/ModelsPage" element={
          <ProtectedRoute>
            <ModelsPage />
          </ProtectedRoute>
        } />
        <Route path="/Dash" element={
          <ProtectedRoute>
            <Dash />
          </ProtectedRoute>
        } />
        <Route path="/Summarization" element={
          <ProtectedRoute>
            <Summarization />
          </ProtectedRoute>
        } />
        <Route path="/QAPage" element={
          <ProtectedRoute>
            <QAPage />
          </ProtectedRoute>
        } />
        <Route path="/NotesApp" element={
          <ProtectedRoute>
            <NotesApp />
          </ProtectedRoute>
        } /> 
        <Route path="/ProfileWeb" element={
          <ProtectedRoute>
            <ProfileWeb />
          </ProtectedRoute>
        } /> 

    
        <Route path="/blog" element={
          <PublicRoute>
            <PublicBlogList />
          </PublicRoute>
        } />
        <Route path="/blog/:id" element={
          <PublicRoute>
            <BlogPostDetail />
          </PublicRoute>
        } />
        
        <Route path="/admin" element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="blog" element={<BlogList isAdmin />} />
          <Route path="blog/new" element={<BlogEditor />} />
          <Route path="blog/edit/:id" element={<BlogEditor />} />
          <Route path="feedback" element={<FeedbackList />} />
        </Route>

        <Route path="/unauthorized" element={<Error message="Unauthorized Access" />} />
        
        <Route path="*" element={<Error />} />
      </Routes>
    </Router>
  );
}

export default App;