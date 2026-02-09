import React, { useState, useContext } from 'react';
import { useNotification } from '../components/NotificationProvider';
import api from '../api.js';
import { useNavigate, Link } from 'react-router-dom';
import { UserContext } from '../UserContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
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
        setLoading(true);
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            login(res.data.user);
            showNotification('Login successful!', 'success');
            navigate('/profile');
        } catch (err) {
            setError(err.response?.data || 'Login failed');
            showNotification(typeof err.response?.data === 'string' ? err.response.data : 'Login failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)' }}>
            <div className="container-custom" style={{ maxWidth: '480px' }}>
                <div className="card fade-in">
                    <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
                        <h1 className="text-gradient" style={{ marginBottom: 'var(--space-sm)' }}>Welcome Back</h1>
                        <p style={{ color: 'hsl(var(--muted-foreground))' }}>Login to access your sleep dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="alert alert-danger">
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="email" className="form-label">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your.email@example.com"
                                className="form-input"
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" className="form-label">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="form-input"
                                disabled={loading}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
                            {loading ? (
                                <><span className="spinner spinner-sm" style={{ marginRight: 'var(--space-sm)' }}></span> Logging in...</>
                            ) : (
                                'Login'
                            )}
                        </button>
                    </form>

                    <div className="divider"></div>

                    <p style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                        Don't have an account?{' '}
                        <Link to="/register" style={{ fontWeight: '600', color: 'hsl(var(--primary))' }}>
                            Register here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;