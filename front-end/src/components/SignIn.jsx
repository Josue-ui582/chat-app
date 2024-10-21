import React, { useState } from "react";
import '../styles/signin.css';

const SignIn = () => {

    const [formData, setFormData] = useState({
        firstName : '',
        lastName : '',
        email : '',
        password : ''
    });
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name] : e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:5000/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
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
    };
    return(
        <div className="signin_container">
            <form onSubmit={handleSubmit} className="signin">
                <input type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First Name"
                required
                />

                <input type="text"
                value={formData.lastName}
                name="lastName"
                onChange={handleChange}
                placeholder="Last Name"
                required
                />

                <input type="email"
                value={formData.email}
                name="email"
                onChange={handleChange}
                placeholder="Email"
                required
                />

                <input type="password"
                value={formData.password}
                name="password"
                onChange={handleChange}
                placeholder="Password"
                required
                />
                <button type="submit">S'inscrire</button>
                {error && <p>{error}</p>}
            </form>
        </div>
    )
}

export default SignIn