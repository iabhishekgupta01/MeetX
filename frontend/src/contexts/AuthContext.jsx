
import React, { useContext, useState, useEffect } from "react";
import axios from "axios";



const Backendserver ="http://localhost:5000";

export const AuthContext = React.createContext({});

export const AuthProvider = ({children}) => {

    const [userData, setUserData] = useState();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const client = axios.create({
        baseURL:`${Backendserver}/api/v1/users`
    });

    // Check if user is already logged in on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);

    let handleRegister = async (name, username, password) => {

        try {
            const request = await client.post("/register", {
                name: name,
                username: username,
                password: password
            });

            if (request.status===201) {
                return request.data.message;
            }

        } catch (err) {
            throw err;
        }

    }

    let handleLogin=async(username,password)=>{
        console.log("Inside handle login");
        try{
            const request=await client.post("/login",{
                username:username,
                password:password
            });

            if(request.status===200){
                localStorage.setItem('token', request.data.token);
                setIsAuthenticated(true);
                return request.data.token;
            }
        }catch(err){
            throw err;
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUserData(null);
    }

    const data={handleLogin,handleRegister,userData,setUserData,isAuthenticated,setIsAuthenticated,isLoading,handleLogout};


    return (
        <AuthContext.Provider

            value={data}
        >
            {children}
        </AuthContext.Provider>
    )
}