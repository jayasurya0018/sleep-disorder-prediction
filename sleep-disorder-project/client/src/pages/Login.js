import React, { useState, useEffect, useContext } from 'react';
import { useNotification } from '../components/NotificationProvider';
import api from '../api.js';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../UserContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const { login } = useContext(UserContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('Please enter both email and password.');
            showNotification('Please enter both email and password.', 'error');
            return;
        }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            setError('Please enter a valid email address.');
            showNotification('Please enter a valid email address.', 'error');
            return;
        }
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            login(res.data.user); // Update context with user data
            showNotification('Login successful!', 'success');
            navigate('/profile'); // Redirect to profile after login
        } catch (err) {
            setError(err.response?.data || 'Login failed');
            showNotification(typeof err.response?.data === 'string' ? err.response.data : 'Login failed', 'error');
        }
    };

    return (
        <>
            <style>{`
                body, .modern-login-bg, .modern-login-card {
                    font-family: 'Inter', 'Poppins', Arial, sans-serif;
                }
                .modern-login-bg {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #e0e7ff 0%, #f5f7fa 100%);
                    padding: 2rem 1rem;
                }
                .modern-login-card {
                    background: rgba(255,255,255,0.98);
                    border-radius: 1.5rem;
                    box-shadow: 0 12px 48px rgba(100, 125, 222, 0.2);
                    padding: 3rem 2rem;
                    max-width: 450px;
                    width: 100%;
                    margin: 2rem auto;
                    text-align: center;
                    animation: fade-in 0.7s;
                }
                .modern-login-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    font-family: 'Poppins', 'Inter', Arial, sans-serif;
                    background: linear-gradient(90deg, #7f53ac 0%, #38b2ac 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    color: transparent;
                    margin-bottom: 2rem;
                    text-shadow: 0 2px 12px #38b2ac33;
                    letter-spacing: 0.02em;
                }
                .modern-login-form input {
                    width: 90%;
                    padding: 1rem 1.2rem;
                    margin-bottom: 1.5rem;
                    border-radius: 1rem;
                    border: 1px solid #c3cfe2;
                    font-size: 1rem;
                    background: #f5f7fa;
                    transition: border 0.2s;
                }
                .modern-login-form input:focus {
                    border: 1.5px solid #38b2ac;
                    outline: none;
                }
                .modern-login-btn {
                    width: 70%;
                    background: linear-gradient(135deg, #7f53ac 0%, #38b2ac 100%);
                    color: #fff;
                    font-weight: 700;
                    font-size: 1.2rem;
                    border: none;
                    border-radius: 1rem;
                    padding: 1rem 2.5rem;
                    box-shadow: 0 12px 32px rgba(100, 125, 222, 0.2);
                    transition: background 0.3s, box-shadow 0.3s, transform 0.2s;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    cursor: pointer;
                    outline: none;
                }
                .modern-login-btn:hover {
                    background: linear-gradient(135deg, #232946 0%, #7f53ac 100%);
                    box-shadow: 0 16px 48px rgba(35, 41, 70, 0.2);
                    transform: translateY(-2px) scale(1.04);
                }
                .modern-login-error {
                    color: #f87171;
                    background: rgba(248, 113, 113, 0.15);
                    border-radius: 12px;
                    padding: 0.75rem 1.25rem;
                    margin-bottom: 1.5rem;
                    font-weight: 600;
                    box-shadow: 0 0 8px rgba(248, 113, 113, 0.3);
                    border: 1px solid #f87171;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: none; }
                }
                .modern-form-section {
                    background: #fff;
                    border-radius: 1.5rem;
                    padding: 2.5rem 2rem;
                    margin: 2rem auto 2.5rem auto;
                    max-width: 400px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.5rem;
                }
                .modern-form-title {
                    font-size: 2rem;
                    font-weight: 800;
                    color: #7f53ac;
                    margin-bottom: 0.5rem;
                    letter-spacing: 0.01em;
                    text-align: center;
                }
                .modern-form-label {
                    font-size: 1.08rem;
                    color: #232946;
                    font-weight: 600;
                    margin-bottom: 0.2rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .modern-form-input {
                    width: 100%;
                    max-width: 320px;
                    padding: 0.7rem 1rem;
                    border-radius: 0.8rem;
                    border: 1.5px solid #e0e7ff;
                    background: #f7f8fa;
                    font-size: 1.05rem;
                    color: #232946;
                    font-family: inherit;
                    margin-top: 0.1rem;
                    transition: border 0.2s, box-shadow 0.2s;
                    outline: none;
                    box-shadow: 0 1px 4px #7f53ac11;
                }
                .modern-form-input:focus {
                    border: 1.5px solid #7f53ac;
                    box-shadow: 0 2px 12px #7f53ac22;
                    background: #fff;
                }
                .modern-form-input::placeholder {
                    color: #a0aec0;
                    opacity: 1;
                    font-size: 1rem;
                    font-weight: 500;
                }
                @media (max-width: 600px) {
                    .modern-form-section {
                        padding: 1.2rem 0.5rem;
                        max-width: 98vw;
                    }
                    .modern-form-input {
                        max-width: 98vw;
                        font-size: 0.98rem;
                        padding: 0.6rem 0.7rem;
                    }
                }
            `}</style>
            <div className="modern-login-bg">
                <div className="modern-login-card">
                    <h2 className="modern-login-title">Login</h2>
                    <form className="modern-login-form modern-form-section" onSubmit={handleSubmit}>
                        {error && <p className="modern-login-error">{error}</p>}
                        <label className="modern-form-label">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            className="modern-form-input"
                        />
                        <label className="modern-form-label">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="modern-form-input"
                        />
                        <button className="modern-login-btn" type="submit">
                            Login
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default Login;