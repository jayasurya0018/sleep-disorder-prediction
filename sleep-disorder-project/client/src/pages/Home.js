import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Activity, BarChart3, Shield } from 'lucide-react';

const Home = () => {
    const features = [
        {
            icon: Brain,
            title: 'AI-Powered Analysis',
            description: 'Advanced machine learning algorithms detect sleep disorders with high accuracy'
        },
        {
            icon: Activity,
            title: 'Real-Time Monitoring',
            description: 'Track your sleep metrics live with instant alerts for anomalies'
        },
        {
            icon: BarChart3,
            title: 'Detailed Reports',
            description: 'Comprehensive analytics and personalized recommendations for better sleep'
        },
        {
            icon: Shield,
            title: 'Secure & Private',
            description: 'Your health data is encrypted and protected with industry-standard security'
        }
    ];

    return (
        <div>
            {/* Hero Section */}
            <div style={{
                minHeight: '80vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-2xl) var(--space-md)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div
                    className="fade-in"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'var(--gradient-hero)',
                        opacity: 0.1,
                        zIndex: 0
                    }}
                />
                <div className="container-custom" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    <div className="slide-in-up" style={{ marginBottom: 'var(--space-3xl)' }}>
                        <h1 style={{
                            fontSize: 'clamp(2.5rem, 8vw, 4rem)',
                            fontWeight: '800',
                            marginBottom: 'var(--space-lg)',
                            lineHeight: '1.1'
                        }} className="text-gradient">
                            Welcome to SleepAI
                        </h1>
                        <p style={{
                            fontSize: 'var(--text-xl)',
                            color: 'hsl(var(--muted-foreground))',
                            maxWidth: '700px',
                            margin: '0 auto var(--space-xl)',
                            lineHeight: '1.6'
                        }}>
                            AI-powered detection of apnea, insomnia, and other sleep disorders. 
                            Get personalized insights and improve your sleep quality today.
                        </p>
                        <div style={{
                            display: 'flex',
                            gap: 'var(--space-md)',
                            justifyContent: 'center',
                            flexWrap: 'wrap'
                        }}>
                            <Link to="/login" className="btn btn-primary btn-lg">
                                Login to Dashboard
                            </Link>
                            <Link to="/register" className="btn btn-outline btn-lg">
                                Create Account
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div style={{
                padding: 'var(--space-3xl) var(--space-md)',
                background: 'hsl(var(--muted) / 0.3)'
            }}>
                <div className="container-custom">
                    <h2 style={{
                        fontSize: 'var(--text-3xl)',
                        fontWeight: '700',
                        textAlign: 'center',
                        marginBottom: 'var(--space-sm)',
                        color: 'hsl(var(--foreground))'
                    }}>
                        Why Choose SleepAI?
                    </h2>
                    <p style={{
                        textAlign: 'center',
                        color: 'hsl(var(--muted-foreground))',
                        marginBottom: 'var(--space-2xl)',
                        fontSize: 'var(--text-lg)'
                    }}>
                        Comprehensive sleep disorder detection and monitoring
                    </p>
                    
                    <div className="grid-auto-fit">
                        {features.map((feature, index) => {
                            const IconComponent = feature.icon;
                            return (
                                <div
                                    key={index}
                                    className="card fade-in"
                                    style={{
                                        textAlign: 'center',
                                        animationDelay: `${index * 100}ms`
                                    }}
                                >
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        margin: '0 auto var(--space-md)',
                                        background: 'var(--gradient-primary)',
                                        borderRadius: 'var(--radius-xl)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white'
                                    }}>
                                        <IconComponent size={32} />
                                    </div>
                                    <h3 style={{
                                        fontSize: 'var(--text-xl)',
                                        fontWeight: '600',
                                        marginBottom: 'var(--space-sm)',
                                        color: 'hsl(var(--foreground))'
                                    }}>
                                        {feature.title}
                                    </h3>
                                    <p style={{
                                        color: 'hsl(var(--muted-foreground))',
                                        lineHeight: '1.6'
                                    }}>
                                        {feature.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div style={{
                padding: 'var(--space-3xl) var(--space-md)',
                background: 'hsl(var(--card))'
            }}>
                <div className="container-custom" style={{ textAlign: 'center' }}>
                    <div className="card-gradient" style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <h2 style={{
                            fontSize: 'var(--text-3xl)',
                            fontWeight: '700',
                            marginBottom: 'var(--space-md)'
                        }}>
                            Ready to Improve Your Sleep?
                        </h2>
                        <p style={{
                            fontSize: 'var(--text-lg)',
                            marginBottom: 'var(--space-xl)',
                            opacity: 0.95
                        }}>
                            Join thousands of users who are already tracking and improving their sleep quality with SleepAI
                        </p>
                        <Link to="/register" className="btn btn-secondary btn-lg">
                            Get Started Free
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Home;