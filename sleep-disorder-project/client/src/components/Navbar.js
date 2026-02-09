import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ActivityIcon, BarChart3Icon, BrainIcon, HomeIcon, PlusIcon, TargetIcon, LogOutIcon, UserIcon, Radio, Download, Mail, Watch, Menu, X, Moon, Sun } from 'lucide-react';
import { UserContext } from '../UserContext';

const Navbar = () => {
    const location = useLocation();
    const { user, logout } = useContext(UserContext) || {};
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    
    const displayUser = user || JSON.parse(localStorage.getItem('user') || 'null');
    
    const isActive = (path) => location.pathname === path;

    // Toggle dark mode
    const toggleDarkMode = () => {
        const newDarkMode = !isDarkMode;
        setIsDarkMode(newDarkMode);
        localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', newDarkMode);
        document.documentElement.setAttribute('data-theme', newDarkMode ? 'dark' : 'light');
    };

    // Apply saved theme on mount
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }, [isDarkMode]);
    
    const navItems = [
        { path: '/', label: 'Home', icon: HomeIcon },
        { path: '/dashboard', label: 'Dashboard', icon: BarChart3Icon },
        { path: '/data-input', label: 'Add Data', icon: PlusIcon },
        { path: '/analysis', label: 'Analysis', icon: BrainIcon },
        { path: '/live-monitoring', label: 'Live', icon: Radio },
        { path: '/recommendations', label: 'Tips', icon: TargetIcon },
        { path: '/wearable-devices', label: 'Devices', icon: Watch },
        { path: '/reports', label: 'Export', icon: Download },
        { path: '/email-settings', label: 'Alerts', icon: Mail },
    ];
    
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.classList.add('scroll-lock');
        } else {
            document.body.classList.remove('scroll-lock');
        }
        return () => document.body.classList.remove('scroll-lock');
    }, [mobileMenuOpen]);
    
    const closeMobileMenu = () => setMobileMenuOpen(false);
    
    return (
        <>
            <nav style={{
                position: 'sticky',
                top: 0,
                zIndex: 'var(--z-sticky)',
                background: 'hsl(var(--card))',
                borderBottom: '1px solid hsl(var(--border))',
                boxShadow: 'var(--shadow-md)'
            }}>
                <div className="container-custom" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: '72px'
                }}>
                    {/* Logo */}
                    <Link to="/" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-sm)',
                        fontSize: 'var(--text-2xl)',
                        fontWeight: '700',
                        textDecoration: 'none'
                    }} className="text-gradient">
                        <ActivityIcon size={32} />
                        <span>SleepAI</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div style={{
                        display: 'none',
                        gap: 'var(--space-xs)'
                    }} className="desktop-nav">
                        {navItems.map((item) => {
                            const IconComponent = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={isActive(item.path) ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <IconComponent size={18} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* User Menu / Auth Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        {/* Dark Mode Toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="btn btn-ghost"
                            aria-label="Toggle dark mode"
                            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        {displayUser && typeof displayUser === 'object' && displayUser.name ? (
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="btn btn-ghost"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-sm)'
                                    }}
                                >
                                    <img
                                        src={displayUser.photo || `https://ui-avatars.com/api/?name=${displayUser.name}`}
                                        alt={displayUser.name}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: 'var(--radius-full)',
                                            objectFit: 'cover'
                                        }}
                                    />
                                    <span style={{ display: 'none' }} className="desktop-only">{displayUser.name}</span>
                                    <UserIcon size={16} />
                                </button>
                                
                                {dropdownOpen && (
                                    <>
                                        <div
                                            style={{
                                                position: 'fixed',
                                                inset: 0,
                                                zIndex: 'var(--z-dropdown)'
                                            }}
                                            onClick={() => setDropdownOpen(false)}
                                        />
                                        <div
                                            className="card"
                                            style={{
                                                position: 'absolute',
                                                top: '100%',
                                                right: 0,
                                                marginTop: 'var(--space-sm)',
                                                minWidth: '200px',
                                                zIndex: 'calc(var(--z-dropdown) + 1)',
                                                padding: 'var(--space-md)'
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--space-sm)',
                                                marginBottom: 'var(--space-md)',
                                                paddingBottom: 'var(--space-sm)',
                                                borderBottom: '1px solid hsl(var(--border))'
                                            }}>
                                                <img
                                                    src={displayUser.photo || `https://ui-avatars.com/api/?name=${displayUser.name}`}
                                                    alt={displayUser.name}
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: 'var(--radius-full)',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                                <div>
                                                    <div style={{ fontWeight: '600', color: 'hsl(var(--foreground))' }}>
                                                        {displayUser.name}
                                                    </div>
                                                    <div style={{ fontSize: 'var(--text-sm)', color: 'hsl(var(--muted-foreground))' }}>
                                                        {displayUser.email}
                                                    </div>
                                                </div>
                                            </div>
                                            <Link
                                                to="/profile"
                                                className="btn btn-ghost btn-full"
                                                style={{ marginBottom: 'var(--space-xs)' }}
                                                onClick={() => setDropdownOpen(false)}
                                            >
                                                <UserIcon size={16} />
                                                View Profile
                                            </Link>
                                            <button
                                                onClick={() => { logout(); setDropdownOpen(false); }}
                                                className="btn btn-primary btn-full"
                                            >
                                                <LogOutIcon size={16} />
                                                Logout
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                                <Link to="/login" className="btn btn-ghost btn-sm">
                                    Login
                                </Link>
                                <Link to="/register" className="btn btn-primary btn-sm">
                                    Register
                                </Link>
                            </div>
                        )}
                        
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="btn btn-ghost mobile-menu-btn"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 'var(--z-modal-backdrop)',
                        backdropFilter: 'blur(4px)'
                    }}
                    onClick={closeMobileMenu}
                />
            )}

            {/* Mobile Menu Sidebar */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    right: mobileMenuOpen ? 0 : '-100%',
                    width: '80%',
                    maxWidth: '320px',
                    height: '100vh',
                    background: 'hsl(var(--card))',
                    zIndex: 'var(--z-modal)',
                    transition: 'right var(--transition-base)',
                    overflowY: 'auto',
                    padding: 'var(--space-lg)',
                    boxShadow: 'var(--shadow-xl)'
                }}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--space-2xl)'
                }}>
                    <span className="text-gradient" style={{ fontSize: 'var(--text-2xl)', fontWeight: '700' }}>
                        Menu
                    </span>
                    <button onClick={closeMobileMenu} className="btn btn-ghost" aria-label="Close menu">
                        <X size={24} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {navItems.map((item) => {
                        const IconComponent = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={closeMobileMenu}
                                className={isActive(item.path) ? 'btn btn-primary btn-full' : 'btn btn-ghost btn-full'}
                                style={{ justifyContent: 'flex-start' }}
                            >
                                <IconComponent size={20} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <style>{`
                @media (min-width: 1024px) {
                    .desktop-nav {
                        display: flex !important;
                    }
                    .mobile-menu-btn {
                        display: none !important;
                    }
                    .desktop-only {
                        display: inline !important;
                    }
                }
            `}</style>
        </>
    );

}
export default Navbar;