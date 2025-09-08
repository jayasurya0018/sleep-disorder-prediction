import React from 'react';

const Home = () => {
    return (
        <>
            <style>{`
                body, .modern-home-bg, .modern-home-card {
                    font-family: 'Inter', 'Poppins', Arial, sans-serif;
                }
                .modern-home-bg {
                    min-height: 80vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    padding: 2rem 1rem;
                    transition: background 0.4s;
                }
                .modern-home-card {
                    background: rgba(255,255,255,0.95);
                    border-radius: 2rem;
                    box-shadow: 0 8px 32px rgba(100, 125, 222, 0.18);
                    padding: 3rem 2rem;
                    max-width: 700px;
                    width: 100%;
                    margin: 2rem auto;
                    text-align: center;
                    animation: bounce-in 0.7s;
                }
                .modern-home-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    background: linear-gradient(90deg, #7f53ac 0%, #38b2ac 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    color: transparent;
                    margin-bottom: 1rem;
                    text-shadow: 0 2px 12px #38b2ac33;
                    letter-spacing: 0.02em;
                    animation: fade-in 0.7s;
                }
                .modern-home-desc {
                    font-size: 1.2rem;
                    color: #232946cc;
                    margin-bottom: 1.5rem;
                    animation: slide-in 0.7s;
                }
                .modern-home-sub {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #232946;
                    margin-bottom: 1.5rem;
                    animation: fade-in 1s;
                }
                .modern-home-btns {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    justify-content: center;
                    margin-top: 2rem;
                }
                @media (min-width: 640px) {
                    .modern-home-btns {
                        flex-direction: row;
                    }
                }
                .modern-home-btn {
                    width: 100%;
                    min-width: 120px;
                    background: linear-gradient(135deg, #7f53ac 0%, #38b2ac 100%);
                    color: #fff;
                    font-weight: 700;
                    font-size: 1.1rem;
                    border: none;
                    border-radius: 1rem;
                    padding: 1rem 2.2rem;
                    box-shadow: 0 8px 24px rgba(100, 125, 222, 0.18);
                    transition: background 0.3s, box-shadow 0.3s, transform 0.2s;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    cursor: pointer;
                    outline: none;
                    animation: fade-in 1.2s;
                }
                .modern-home-btn:hover {
                    background: linear-gradient(135deg, #232946 0%, #7f53ac 100%);
                    box-shadow: 0 12px 32px rgba(35, 41, 70, 0.18);
                    transform: translateY(-2px) scale(1.04);
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: none; }
                }
                @keyframes slide-in {
                    from { opacity: 0; transform: translateX(-40px); }
                    to { opacity: 1; transform: none; }
                }
                @keyframes bounce-in {
                    0% { opacity: 0; transform: scale(0.8); }
                    60% { opacity: 1; transform: scale(1.05); }
                    100% { opacity: 1; transform: scale(1); }
                }
            `}</style>
            <div className="modern-home-bg">
                <div className="modern-home-card">
                    <h1 className="modern-home-title">Welcome to SleepAI</h1>
                    <p className="modern-home-desc">AI-powered detection of apnea, insomnia, and more. Login to start your journey to better sleep.</p>
                    <h2 className="modern-home-sub">Your Personalized Sleep Disorder Prediction</h2>
                    <div className="modern-home-btns">
                        <a href="/login">
                            <button className="modern-home-btn">Login</button>
                        </a>
                        <a href="/register">
                            <button className="modern-home-btn">Register</button>
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
export default Home;