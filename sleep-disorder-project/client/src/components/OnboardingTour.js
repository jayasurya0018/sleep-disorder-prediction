import React from 'react';
import Joyride from 'react-joyride';

const steps = [
  {
    target: '.modern-navbar-logo',
    content: 'Welcome to SleepAI! This is your home base. Click here to return to the dashboard anytime.'
  },
  {
    target: '.modern-navbar-link-btn',
    content: 'Navigate between Home, Dashboard, Add Data, Analysis, and Tips using these links.'
  },
  {
    target: '.dark-toggle-navbar',
    content: 'Switch between light and dark mode for your comfort.'
  },
  {
    target: '.modern-dashboard-title',
    content: 'Your dashboard shows analytics and trends about your sleep.'
  },
  {
    target: '.modern-dashboard-btns',
    content: 'Use these buttons to add data, run analysis, or view recommendations.'
  }
];

const OnboardingTour = ({ run, onClose }) => (
  <Joyride
    steps={steps}
    run={run}
    continuous
    showSkipButton
    showProgress
    styles={{ options: { zIndex: 10000 } }}
    callback={data => {
      if (data.status === 'finished' || data.status === 'skipped') {
        onClose();
      }
    }}
  />
);


export default OnboardingTour;
