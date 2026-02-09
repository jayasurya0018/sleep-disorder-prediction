import React, { useState, useContext } from 'react';
import { useNotification } from '../components/NotificationProvider';
import api from '../api.js';
import { useNavigate, Link } from 'react-router-dom';
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
    const [loading, setLoading] = useState(false);
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
        
        setLoading(true);
        try {
            const response = await api.post('/auth/register', formData);
            if (response.status === 200 || response.status === 201) {
                const userData = response.data;
                login(userData);
                setSuccess('Registration successful! Redirecting to profile...');
                showNotification('Registration successful! Redirecting to profile...', 'success');
                setTimeout(() => navigate('/profile'), 1500);
            }
        } catch (err) {
            setError(err.response?.data || 'Registration failed');
            showNotification(typeof err.response?.data === 'string' ? err.response.data : 'Registration failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)' }}>
            <div className="container-custom" style={{ maxWidth: '520px' }}>
                <div className="card fade-in">
                    <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
                        <h1 className="text-gradient" style={{ marginBottom: 'var(--space-sm)' }}>Create Account</h1>
                        <p style={{ color: 'hsl(var(--muted-foreground))' }}>Start monitoring your sleep health today</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="alert alert-danger">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="alert alert-success">
                                {success}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="email" className="form-label">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="your.email@example.com"
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" className="form-label">Password</label>
                            <input
                                type="password"
                                name="password"
                                id="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="At least 6 characters"
                                disabled={loading}
                            />
                            <p className="form-help">Password must be at least 6 characters long</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                            <div className="form-group">
                                <label htmlFor="age" className="form-label">Age</label>
                                <input
                                    type="number"
                                    name="age"
                                    id="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="25"
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="gender" className="form-label">Gender</label>
                                <select
                                    name="gender"
                                    id="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="form-select"
                                    disabled={loading}
                                >
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
                            {loading ? (
                                <><span className="spinner spinner-sm" style={{ marginRight: 'var(--space-sm)' }}></span> Creating account...</>
                            ) : (
                                'Register'
                            )}
                        </button>
                    </form>

                    <div className="divider"></div>

                    <p style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ fontWeight: '600', color: 'hsl(var(--primary))' }}>
                            Login here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
