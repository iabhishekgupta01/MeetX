import React, { useContext } from 'react';
import "../App.css";
import Button from '@mui/material/Button';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';


function LandingPage() {
    const navigate = useNavigate();
    const { isAuthenticated, handleLogout } = useContext(AuthContext);

    const handleLogoutClick = () => {
        handleLogout();
        navigate("/");
        window.location.reload();
    };

    const handleDashboard = () => {
        navigate("/dashboard");
    };

    return ( <>
    <div className="landingPageContainer">
        <nav>
            <div className="navHeader">
                  <h2>Meet<span style={{color:"#dae364",fontSize:"2rem"} }>X</span></h2>
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
                        <h1><span style={{color:"#dae364"}}> Ready </span>to start meeting?</h1>
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
                        <h1><span style={{color:"#dae364"}}> Connect </span>with your loved ones.</h1>
                        <p> Cover the distance by <b>MeetX</b></p>
                        <div>
                            <Link to={"/auth"}><Button variant="contained" color="secondary">Get Started</Button></Link>
                        </div>
                    </>
                )}
            </div>
            <div className="landing-main-right">
                  <img src="/videocall-image.png" alt="video-call-image" style={{height:"20rem"}} />
            </div>
        </div>
    </div>
    
    </> );
}

export default LandingPage;