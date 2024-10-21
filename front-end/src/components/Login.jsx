import React, { useState } from "react";
import '../styles/login.css'

const Login = () => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                window.location.href = '/chat';
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        }
    }
    return(
        <div className="login_container">
            <form onSubmit={handleSubmit} className="login">
                <input type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                />

                <input type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                />
                <button type="submit">Se connecter</button>
                {error && <p>{error}</p>}
            </form>
        </div>
    )
}

export default Login