import React, { useContext, useEffect, useState } from 'react';
import "../App.css";
import Button from '@mui/material/Button';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

function LandingPage() {
    const navigate = useNavigate();
    const { isAuthenticated, handleLogout } = useContext(AuthContext);
    
    // 1. Add state to hold the install prompt event
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    // 2. Listen for the browser's install prompt
    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleLogoutClick = () => {
        handleLogout();
        navigate("/");
        window.location.reload();
    };

    const handleDashboard = () => {
        navigate("/dashboard");
    };

    // 3. Function to run when they click the download text
    const handleDownloadClick = async () => {
        if (deferredPrompt) {
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('MeetX installed successfully!');
            }
            // We've used the prompt, and can't use it again, throw it away
            setDeferredPrompt(null);
        } else {
            // If the prompt isn't available (already installed, or unsupported browser)
            alert("MeetX is already installed or your browser doesn't support PWA installation directly from here!");
        }
    };

    return (<>
        <div className="landingPageContainer">
            <nav>
                <div className="navHeader">
                    <h2>Meet<span style={{ color: "#dae364", fontSize: "2rem" }}>X</span></h2>
                </div>
                <div className="navList" >
                    {isAuthenticated ? (
                        <>
                            <p onClick={handleDashboard} style={{ cursor: "pointer" }}>Dashboard</p>
                            <div role="button" onClick={handleLogoutClick} style={{ cursor: "pointer" }}>
                                <p>Logout</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <p>Join As Guest</p>
                            <Link to="/auth"><p>Register</p></Link>
                            <div role="button">
                                <Link to="/auth"><p>Login</p></Link>
                            </div>
                        </>
                    )}
                </div>
            </nav>
            <div className=" landingMainContainer">
                <div className="landing-main-left">
                    {isAuthenticated ? (
                        <>
                            <h1><span style={{ color: "#dae364" }}> Ready </span>to start meeting?</h1>
                            <p> Access your meetings and connect with your team in <b>MeetX</b></p>
                            <div>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={handleDashboard}
                                >
                                    Go to Dashboard
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <h1><span style={{ color: "#dae364" }}> Connect </span>with your loved ones.</h1>
                            <p> Cover the distance by <b>MeetX</b></p>
                            <div>
                                <Link to={"/auth"}><Button variant="contained" color="secondary">Get Started</Button></Link>
                            </div>
                        </>
                    )}
                </div>
                <div className="landing-main-right">
                    <img src="/videocall-image.png" alt="video-call-image" className="hero-image" />
                </div>
            </div>
            
            {/* 4. Add the onClick event to the download span */}
            <div className="download-section">
                <p>Want a seamless experience? <span className="download-link" onClick={handleDownloadClick}>Click here to download app</span></p>
            </div>

        </div>
    </>);
}

export default LandingPage;