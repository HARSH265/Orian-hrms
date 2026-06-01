import React, { useState } from 'react'; // <-- 1. Import useState
import { useSelector } from 'react-redux';
import { Outlet, Navigate } from 'react-router-dom';
import WelcomeWizardPage from '../pages/WelcomeWizardPage';
import { Spin } from 'antd';

const WizardGuard = () => {
    const { user, status } = useSelector((state) => state.auth);

    // --- 2. THE STATE IS NOW MANAGED HERE, IN THE PARENT ---
    const [wizardStep, setWizardStep] = useState(0);

    if (status === 'failed') {
        return <Navigate to="/login" replace />;
    }

    if (status === 'loading' || !user) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
    }

    if (user.needsWelcomeWizard) {
        // --- 3. PASS THE STATE AND THE FUNCTION DOWN AS PROPS ---
        return <WelcomeWizardPage currentStep={wizardStep} setCurrentStep={setWizardStep} />;
    }

    return <Outlet />;
};

export default WizardGuard;