import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMFA } from '../../modules/mfa/MFAContext';
import MFAContainer from '../../modules/mfa/MFAContainer';

const MFAVerify = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { initiateMFA, mfaState } = useMFA();

    useEffect(() => {
        // If coming from login with tempToken
        const state = location.state;
        if (state?.requires2FA && state?.tempToken) {
            initiateMFA(state);
        } else if (!mfaState.requires2FA) {
            // If accessed directly without data, redirect to login
            navigate('/login');
        }
    }, []);

    return (
        <div className="flex-1 flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50">
            <MFAContainer />
        </div>
    );
};

export default MFAVerify;
