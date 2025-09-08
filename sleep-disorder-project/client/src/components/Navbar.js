import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ActivityIcon, BarChart3Icon, BrainIcon, HomeIcon, PlusIcon, TargetIcon, LogOutIcon, UserIcon } from 'lucide-react';
import { UserContext } from '../UserContext';

const Navbar = () => {
    const location = useLocation();
    const { user, logout } = useContext(UserContext) || {};
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const isActive = (path) => location.pathname === path;
    const navItems = [
        { path: '/', label: 'Home', icon: HomeIcon },
        { path: '/dashboard', label: 'Dashboard', icon: BarChart3Icon },
        { path: '/data-input', label: 'Add Data', icon: PlusIcon },
        { path: '/analysis', label: 'Analysis', icon: BrainIcon },
        { path: '/recommendations', label: 'Tips', icon: TargetIcon },
    ];
    return (
        <div>
            <style>{`
                .modern-navbar {
                    position: sticky;
                    top: 0;
                    z-index: 50;
                    width: 100%;
                    background: #f7f8fa;
                    border-bottom: 1.5px solid #e0e7ff;
                    box-shadow: 0 4px 24px rgba(100, 125, 222, 0.10);
                    border-radius: 0 0 2rem 2rem;
                    transition: background 0.4s;
                    animation: navbar-fade-in 0.7s;
                    font-family: 'Inter', 'Poppins', Arial, sans-serif;
                }
                .modern-navbar-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    height: 4.5rem;
                }
                .modern-navbar-logo {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 2rem;
                    font-weight: 800;
                    color: #7f53ac;
                    text-shadow: 0 2px 12px #38b2ac11;
                    transition: transform 0.2s;
                    letter-spacing: 0.04em;
                    text-decoration: none;
                }
                .modern-navbar-logo:hover {
                    transform: scale(1.08);
                }
                .modern-navbar-links {
                    display: none;
                }
                @media (min-width: 768px) {
                    .modern-navbar-links {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }
                }
                .modern-navbar-link-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.7rem 1.5rem;
                    border-radius: 1rem;
                    font-weight: 600;
                    font-size: 1rem;
                    background: rgba(255,255,255,0.7);
                    color: #232946;
                    border: none;
                    box-shadow: 0 2px 8px rgba(100, 125, 222, 0.08);
                    transition: background 0.2s, color 0.2s, transform 0.2s;
                    cursor: pointer;
                    font-family: 'Inter', 'Poppins', Arial, sans-serif;
                    text-decoration: none;
                }
                .modern-navbar-link-btn.active, .modern-navbar-link-btn:hover {
                    background: linear-gradient(90deg, #7f53ac 0%, #38b2ac 100%);
                    color: #fff;
                    transform: scale(1.04);
                    box-shadow: 0 4px 16px #38b2ac33;
                    text-decoration: none;
                }
                .modern-navbar-link-btn span {
                    color: inherit;
                    text-decoration: none;
                }
                .modern-navbar-auth {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .modern-navbar-login {
                    display: none;
                }
                @media (min-width: 640px) {
                    .modern-navbar-login {
                        display: flex;
                        color: #7f53ac;
                        font-weight: 600;
                        background: rgba(255,255,255,0.7);
                        border-radius: 1rem;
                        padding: 0.7rem 1.5rem;
                        box-shadow: 0 2px 8px rgba(100, 125, 222, 0.08);
                        transition: background 0.2s, color 0.2s;
                        font-family: 'Inter', 'Poppins', Arial, sans-serif;
                        text-decoration: none;
                    }
                    .modern-navbar-login:hover {
                        background: linear-gradient(90deg, #7f53ac 0%, #647dee 100%);
                        color: #fff;
                        text-decoration: none;
                    }
                }
                .modern-navbar-register {
                    background: linear-gradient(90deg, #7f53ac 0%, #38b2ac 100%);
                    color: #fff;
                    font-weight: 600;
                    border-radius: 1rem;
                    padding: 0.7rem 1.5rem;
                    box-shadow: 0 2px 8px rgba(100, 125, 222, 0.12);
                    transition: background 0.2s, color 0.2s, transform 0.2s;
                    font-family: 'Inter', 'Poppins', Arial, sans-serif;
                    text-decoration: none;
                }
                .modern-navbar-register:hover {
                    background: linear-gradient(90deg, #232946 0%, #7f53ac 100%);
                    color: #fff;
                    transform: scale(1.04);
                    text-decoration: none;
                }
                @keyframes navbar-fade-in {
                    from { opacity: 0; transform: translateY(-30px); }
                    to { opacity: 1; transform: none; }
                }
                .modern-navbar-mobile {
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                    overflow-x: auto;
                    padding: 0.5rem 0.2rem 0.7rem 0.2rem;
                }
                @media (min-width: 768px) {
                    .modern-navbar-mobile {
                        display: none;
                    }
                }
                .navbar-user {
                  display: flex;
                  align-items: center;
                  gap: 0.7rem;
                  font-weight: 700;
                  font-size: 1.1rem;
                  color: #7f53ac;
                  background: #f7f8fa;
                  border-radius: 1.2rem;
                  padding: 0.3rem 1rem;
                  box-shadow: 0 2px 12px #7f53ac11;
                  cursor: pointer;
                  transition: background 0.2s;
                  position: relative;
                }
                .navbar-user-photo {
                  width: 36px;
                  height: 36px;
                  border-radius: 50%;
                  object-fit: cover;
                  background: #e0e7ff;
                  box-shadow: 0 2px 8px #7f53ac22;
                }
                .navbar-dropdown {
                  position: absolute;
                  top: 48px;
                  right: 0;
                  background: #fff;
                  border-radius: 1rem;
                  box-shadow: 0 4px 24px #7f53ac22;
                  min-width: 180px;
                  z-index: 100;
                  padding: 1rem;
                  display: flex;
                  flex-direction: column;
                  gap: 0.7rem;
                }
                .navbar-dropdown-user {
                  display: flex;
                  align-items: center;
                  gap: 0.7rem;
                  margin-bottom: 0.5rem;
                }
                .navbar-dropdown-photo {
                  width: 40px;
                  height: 40px;
                  border-radius: 50%;
                  object-fit: cover;
                  background: #e0e7ff;
                }
                .navbar-dropdown-name {
                  font-weight: 700;
                  color: #7f53ac;
                }
                .navbar-dropdown-email {
                  font-size: 0.95rem;
                  color: #444;
                }
                .navbar-dropdown-logout {
                  background: linear-gradient(90deg, #7f53ac 0%, #38b2ac 100%);
                  color: #fff;
                  border: none;
                  border-radius: 0.8rem;
                  padding: 0.6rem 1.2rem;
                  font-weight: 700;
                  cursor: pointer;
                  transition: background 0.2s;
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                }
                .navbar-dropdown-logout:hover {
                  background: linear-gradient(90deg, #38b2ac 0%, #7f53ac 100%);
                }
            `}</style>
            <nav className="modern-navbar" aria-label="Main Navigation">
                <div className="modern-navbar-container">
                    {/* Logo */}
                    <Link to="/" className="modern-navbar-logo" aria-label="SleepAI Home">
                        <ActivityIcon style={{ height: 32, width: 32 }} /> SleepAI
                    </Link>
                    {/* Desktop Navigation */}
                    <div className="modern-navbar-links">
                        {navItems.map((item) => {
                            const IconComponent = item.icon;
                            return (
                                <Link key={item.path} to={item.path} aria-label={item.label} tabIndex={0} style={{ textDecoration: 'none' }}>
                                    <button
                                        type="button"
                                        className={`modern-navbar-link-btn${isActive(item.path) ? ' active' : ''}`}
                                        aria-current={isActive(item.path) ? 'page' : undefined}
                                        style={{ textDecoration: 'none' }}
                                    >
                                        <IconComponent style={{ height: 20, width: 20 }} />
                                        <span>{item.label}</span>
                                    </button>
                                </Link>
                            );
                        })}
                    </div>
                    {/* User Info & Dropdown */}
                    {user && typeof user === 'object' && typeof user.name === 'string' ? (
                      <div className="navbar-user" onClick={() => setDropdownOpen((v) => !v)}>
                        <img src={user.photo || `https://ui-avatars.com/api/?name=${user.name}`} alt="User" className="navbar-user-photo" />
                        <span>{user.name}</span>
                        <UserIcon style={{ height: 18, width: 18, color: '#7f53ac' }} />
                        {dropdownOpen && (
                          <div className="navbar-dropdown">
                            <div className="navbar-dropdown-user">
                              <img src={user.photo || `https://ui-avatars.com/api/?name=${user.name}`} alt="User" className="navbar-dropdown-photo" />
                              <div>
                                <div className="navbar-dropdown-name">{user.name}</div>
                                <div className="navbar-dropdown-email">{typeof user.email === 'string' ? user.email : ''}</div>
                              </div>
                            </div>
                            <Link to="/profile" style={{ textDecoration: 'none', color: '#7f53ac', fontWeight: 700 }}>View Profile</Link>
                            <button className="navbar-dropdown-logout" onClick={logout}><LogOutIcon style={{ height: 18, width: 18 }} /> Logout</button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="modern-navbar-auth" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Link to="/login" style={{ textDecoration: 'none' }}>
                            <button type="button" className="modern-navbar-login" aria-label="Login" style={{ textDecoration: 'none' }}>Login</button>
                        </Link>
                        <Link to="/register" style={{ textDecoration: 'none' }}>
                            <button type="button" className="modern-navbar-register" aria-label="Register" style={{ textDecoration: 'none' }}>Register</button>
                        </Link>
                      </div>
                    )}
                </div>
                {/* Mobile Navigation */}
                <div className="modern-navbar-mobile">
                    {navItems.map((item) => {
                        const IconComponent = item.icon;
                        return (
                            <Link key={item.path} to={item.path} aria-label={item.label} tabIndex={0} style={{ textDecoration: 'none' }}>
                                <button
                                    type="button"
                                    className={`modern-navbar-link-btn${isActive(item.path) ? ' active' : ''}`}
                                    style={{ fontSize: 13, padding: '0.5rem 1rem', textDecoration: 'none' }}
                                    aria-current={isActive(item.path) ? 'page' : undefined}
                                >
                                    <IconComponent style={{ height: 16, width: 16 }} />
                                    <span>{item.label}</span>
                                </button>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );

}
export default Navbar;