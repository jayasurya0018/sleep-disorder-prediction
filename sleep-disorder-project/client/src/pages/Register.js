import React, { useState, useEffect, useContext } from 'react';
import { useNotification } from '../components/NotificationProvider';
import api from '../api.js';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../UserContext';

const Register = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        age: '',
        gender: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const { login } = useContext(UserContext);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
            // Basic validation
            if (!formData.email || !formData.password || !formData.age || !formData.gender) {
                setError('Please fill in all fields.');
                showNotification('Please fill in all fields.', 'error');
                return;
            }
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
                setError('Please enter a valid email address.');
                showNotification('Please enter a valid email address.', 'error');
                return;
            }
            if (formData.password.length < 6) {
                setError('Password must be at least 6 characters.');
                showNotification('Password must be at least 6 characters.', 'error');
                return;
            }
            try {
                // Assume register API returns user data on success
                const response = await api.post('/auth/register', formData);
                if (response.status === 200 || response.status === 201) {
                    const userData = response.data;
                    login(userData); // Update context
                    setSuccess('Registration successful! Redirecting to profile...');
                    showNotification('Registration successful! Redirecting to profile...', 'success');
                    setTimeout(() => navigate('/profile'), 1500);
                }
            } catch (err) {
                setError(err.response?.data || 'Registration failed');
                showNotification(typeof err.response?.data === 'string' ? err.response.data : 'Registration failed', 'error');
            }
    };

    return (
        <>
            <style>{`
                .modern-register-bg {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                    padding: 2rem 1rem;
                }
                .modern-register-card {
                    background: rgba(255,255,255,0.95);
                    border-radius: 1.5rem;
                    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.1);
                    padding: 3rem 2rem;
                    max-width: 450px;
                    width: 100%;
                    margin: 2rem auto;
                    text-align: center;
                    transition: transform 0.4s, box-shadow 0.4s;
                }
                .modern-register-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 16px 64px rgba(0, 0, 0, 0.2);
                }
                .modern-register-title {
                    font-size: 2.5rem;
                    font-weight: 700;
                    background: linear-gradient(90deg, #2196f3 0%, #21cbf3 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    color: transparent;
                    margin-bottom: 2rem;
                }
                .modern-register-form {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.5rem;
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
                .modern-form-input::placeholder {
                    color: #a0aec0;
                    opacity: 1;
                    font-size: 1rem;
                    font-weight: 500;
                }
                .modern-form-input:focus {
                    border: 1.5px solid #7f53ac;
                    box-shadow: 0 2px 12px #7f53ac22;
                    background: #fff;
                }
                .modern-register-btn {
                    width: 100%;
                    background: linear-gradient(135deg, #2196f3 0%, #21cbf3 100%);
                    color: #fff;
                    font-weight: 700;
                    font-size: 1.1rem;
                    border: none;
                    border-radius: 1rem;
                    padding: 1rem 2.5rem;
                    box-shadow: 0 8px 24px rgba(33, 150, 243, 0.18);
                    transition: background 0.3s, box-shadow 0.3s, transform 0.2s;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    cursor: pointer;
                    outline: none;
                }
                .modern-register-btn:hover {
                    background: linear-gradient(135deg, #0d47a1 0%, #1976d2 100%);
                    box-shadow: 0 12px 32px rgba(13, 71, 161, 0.18);
                    transform: translateY(-2px) scale(1.04);
                }
                .modern-register-error {
                    color: #f44336;
                    background: rgba(244, 67, 54, 0.15);
                    border-radius: 12px;
                    padding: 0.75rem 1.25rem;
                    margin-bottom: 1.5rem;
                    font-weight: 600;
                    box-shadow: 0 0 8px rgba(244, 67, 54, 0.3);
                    border: 1px solid #f44336;
                }
                .modern-register-success {
                    color: #4caf50;
                    background: rgba(76, 175, 80, 0.12);
                    border-radius: 12px;
                    padding: 0.75rem 1.25rem;
                    margin-bottom: 1.5rem;
                    font-weight: 600;
                    box-shadow: 0 0 8px rgba(76, 175, 80, 0.18);
                    border: 1px solid #4caf50;
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
            <div className="modern-register-bg">
                <div className="modern-register-card">
                    <h2 className="modern-register-title">Register</h2>
                    <form className="modern-register-form modern-form-section" onSubmit={handleSubmit}>
                        {error && <p className="modern-register-error">{error}</p>}
                        {success && <p className="modern-register-success">{success}</p>}
                        <div className="modern-form-group">
                            <label className="modern-form-label" htmlFor="email">Email</label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="modern-form-input"
                                placeholder="Email"
                            />
                        </div>
                        <div className="modern-form-group">
                            <label className="modern-form-label" htmlFor="password">Password</label>
                            <input
                                type="password"
                                name="password"
                                id="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="modern-form-input"
                                placeholder="Password"
                            />
                        </div>
                        <div className="modern-form-group">
                            <label className="modern-form-label" htmlFor="age">Age</label>
                            <input
                                type="number"
                                name="age"
                                id="age"
                                value={formData.age}
                                onChange={handleChange}
                                className="modern-form-input"
                                placeholder="Age"
                            />
                        </div>
                        <div className="modern-form-group">
                            <label className="modern-form-label" htmlFor="gender">Gender</label>
                            <select
                                name="gender"
                                id="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="modern-form-input"
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <button type="submit" className="modern-register-btn">Register</button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default Register;
