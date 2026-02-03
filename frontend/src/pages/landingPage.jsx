import React from 'react';
import "../App.css";
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';


function LandingPage() {
    return ( <>
    <div className="landingPageContainer">
        <nav>
            <div className="navHeader">
                  <h2>Meet<span style={{color:"#dae364",fontSize:"2rem"} }>X</span></h2>
            </div>
            <div className="navList" >
                <p>Join As Guest</p>
                <p>Register</p>
                <div role="button">
                    <p>Login</p>
                </div>
            </div>
        </nav>
        <div className=" landingMainContainer">
            <div className="landing-main-left">
                <h1><span style={{color:"#dae364"}}> Connect </span>with your loved ones.</h1>
                <p> Cover the distance by <b>MeetX</b></p>
                <div>
                    <Link to={"/auth"}><Button variant="contained" color="secondary">Get Started</Button></Link>
                </div>

            </div>
            <div className="landing-main-right">
                  <img src="/videocall-image.png" alt="video-call-image" style={{height:"20rem"}} />
            </div>
        </div>
    </div>
    
    </> );
}

export default LandingPage;