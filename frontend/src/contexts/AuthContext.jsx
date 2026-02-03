
import React, { useContext, useState } from "react";
import axios from "axios";



const Backendserver = "http://localhost:8080";

export const AuthContext = React.createContext({});

export const AuthProvider = ({children}) => {

    const [userData, setUserData] = useState();

    const client = axios.create({
        baseURL:`${Backendserver}/api/v1/users`
    });

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
                return request.data.token;
            }
        }catch(err){
            throw err;
        }
    }

    const data={handleLogin,handleRegister,userData,setUserData};


    return (
        <AuthContext.Provider

            value={data}
        >
            {children}
        </AuthContext.Provider>
    )
}