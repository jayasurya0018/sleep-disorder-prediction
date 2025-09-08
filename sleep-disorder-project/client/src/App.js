import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import OnboardingTour from './components/OnboardingTour';
import { NotificationProvider } from './components/NotificationProvider';
import { UserProvider } from './UserContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DataInput from './pages/DataInput';
import Analysis from './pages/Analysis';
import Recommendations from './pages/Recommendations';
import Profile from './pages/Profile';
import FeedbackButton from './components/FeedbackButton';


import { useContext } from 'react';
import { UserContext } from './UserContext';
// ...existing code...

function App() {
  // Show onboarding only for new users (localStorage flag)
  const [showTour, setShowTour] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem('onboarded')) {
      setShowTour(true);
    }
  }, []);
  const handleTourClose = () => {
    setShowTour(false);
    localStorage.setItem('onboarded', 'true');
  };
  // Get logout from UserContext
  const { logout } = useContext(UserContext) || {};
  return (
    <UserProvider>
      <NotificationProvider>
        <Router>
          <Navbar />
          {showTour && <OnboardingTour run={showTour} onClose={handleTourClose} />}
          <FeedbackButton />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/data-input" element={<DataInput />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/profile" element={<Profile logout={logout} />} />
          </Routes>
        </Router>
        <style>{`
  html, body, #root {
    min-height: 100vh;
    width: 100vw;
    margin: 0;
    padding: 0;
    font-family: 'Inter', 'Poppins', Arial, sans-serif;
    background: #f7f8fa;
    color: #232946;
    box-sizing: border-box;
    overflow-x: hidden;
  }
  .main-content {
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem 0.5rem 3rem 0.5rem;
    box-sizing: border-box;
  }
  .responsive-card {
    width: 100%;
    max-width: 700px;
    background: #fff;
    border-radius: 1.5rem;
    box-shadow: 0 4px 24px #7f53ac22;
    margin: 2rem auto;
    padding: 2.5rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
  }
  .responsive-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    justify-content: center;
    align-items: flex-start;
    width: 100%;
  }
  .responsive-col {
    flex: 1 1 320px;
    min-width: 260px;
    max-width: 100%;
    box-sizing: border-box;
  }
  img, canvas, svg {
    max-width: 100%;
    height: auto;
    display: block;
  }
  .responsive-btn {
    min-width: 120px;
    padding: 0.7rem 1.2rem;
    font-size: 1rem;
    border-radius: 1rem;
    border: none;
    background: linear-gradient(90deg, #7f53ac 0%, #38b2ac 100%);
    color: #fff;
    font-weight: 700;
    box-shadow: 0 2px 12px #7f53ac22;
    margin: 0.5rem 0.3rem;
    transition: background 0.2s, transform 0.2s;
    cursor: pointer;
  }
  .responsive-btn:hover {
    background: linear-gradient(90deg, #38b2ac 0%, #7f53ac 100%);
    transform: scale(1.04);
  }
  @media (max-width: 900px) {
    .responsive-card {
      max-width: 98vw;
      padding: 1.5rem 0.7rem;
    }
    .main-content {
      padding: 1.2rem 0.2rem 2rem 0.2rem;
    }
  }
  @media (max-width: 600px) {
    .responsive-card {
      max-width: 99vw;
      padding: 1rem 0.2rem;
    }
    .main-content {
      padding: 0.5rem 0.1rem 1rem 0.1rem;
    }
    .responsive-row {
      flex-direction: column;
      gap: 0.7rem;
    }
    .responsive-btn {
      min-width: 90px;
      font-size: 0.95rem;
      padding: 0.5rem 0.7rem;
    }
  }
`}</style>
      </NotificationProvider>
    </UserProvider>
  );
}

export default App;