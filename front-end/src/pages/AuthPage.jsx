import React, { useState } from "react";
import Login from "../components/Login";
import SignIn from "../components/SignIn";
import '../styles/authpage.css'

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true)

    return(
        <div className="authen">
            <h1>Bienvenue sur TechSeed Chat App</h1>

            <h3>{isLogin ? 'Login' : 'Sign Up'}</h3>
            {isLogin ? <Login /> : <SignIn />}
            <p onClick={() => setIsLogin(!isLogin)} className="toggle">
                {isLogin ? 'Don’t have an account? Sign up' : 'Already have an account? Login'}
            </p>
        </div>
    )
}

export default AuthPage