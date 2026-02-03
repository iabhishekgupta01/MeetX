import logo from './logo.svg';
import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from './pages/landingPage';
import Authentication from './pages/Authentication';
import { AuthProvider } from './contexts/AuthContext';
import VideoMeetComponent from './pages/VideoMeet';


function App() {
  return (
    <>

      <BrowserRouter>
        <AuthProvider>

          <Routes>

            <Route path="/" element={<LandingPage />} />

            <Route path="/auth" element={<Authentication />} />

            <Route path="/*"  element={<VideoMeetComponent/>}  />

          </Routes>
        

        </AuthProvider>
      </BrowserRouter>


    </>
  );
}

export default App;
