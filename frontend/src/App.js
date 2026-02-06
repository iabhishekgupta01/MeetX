import logo from './logo.svg';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from './pages/landingPage';
import Authentication from './pages/Authentication';
import Dashboard from './pages/Dashboard';
import MeetingPage from './pages/MeetingPage';
import { AuthProvider } from './contexts/AuthContext';
import VideoMeetComponent from './pages/VideoMeet';
import ProtectedRoute from './components/ProtectedRoute';


function App() {
  return (
    <>

      <BrowserRouter>
        <AuthProvider>

          <Routes>

            <Route path="/" element={<LandingPage />} />

            <Route path="/auth" element={<Authentication />} />
            
            <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
            
            <Route path="/meeting/:meetingId" element={<ProtectedRoute element={<MeetingPage />} />} />
            
            <Route path="/*"  element={<ProtectedRoute element={<VideoMeetComponent/>} />}  />

          </Routes>
        

        </AuthProvider>
      </BrowserRouter>


    </>
  );
}

export default App;
