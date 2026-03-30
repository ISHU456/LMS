import React, { createContext, useContext, useState, useEffect } from 'react';

const MFAContext = createContext();

export const MFAProvider = ({ children }) => {
  const [mfaState, setMfaState] = useState({
    requires2FA: false,
    tempToken: null,
    userId: null,
    isVerified: false,
    verificationStep: 'idle', // 'idle' | 'liveness' | 'face' | 'location' | 'verifying' | 'success' | 'failed'
    faceDescriptor: null,
    location: null,
    error: null
  });

  const initiateMFA = (tempData) => {
    setMfaState(prev => ({
      ...prev,
      requires2FA: true,
      tempToken: tempData.tempToken,
      userId: tempData.userId,
      verificationStep: 'liveness',
      error: null
    }));
  };

  const completeStep = (step, data) => {
    setMfaState(prev => {
      const newState = { ...prev };
      if (step === 'liveness') newState.verificationStep = 'face';
      if (step === 'face') {
        newState.faceDescriptor = data;
        newState.verificationStep = 'location';
      }
      if (step === 'location') {
        newState.location = data;
        newState.verificationStep = 'verifying';
      }
      return newState;
    });
  };

  const setVerificationStep = (step) => {
    setMfaState(prev => ({ ...prev, verificationStep: step }));
  };

  const resetMFA = () => {
    setMfaState({
      requires2FA: false,
      tempToken: null,
      userId: null,
      isVerified: false,
      verificationStep: 'idle',
      faceDescriptor: null,
      location: null,
      error: null
    });
  };

  const restartMFA = () => {
    setMfaState(prev => ({
      ...prev,
      isVerified: false,
      verificationStep: 'liveness',
      faceDescriptor: null,
      location: null,
      error: null
    }));
  };

  const setMFAError = (error) => {
    setMfaState(prev => ({ ...prev, error, verificationStep: 'failed' }));
  };

  return (
    <MFAContext.Provider value={{ mfaState, initiateMFA, completeStep, resetMFA, restartMFA, setMFAError, setVerificationStep }}>
      {children}
    </MFAContext.Provider>
  );
};

export const useMFA = () => {
  const context = useContext(MFAContext);
  if (!context) throw new Error('useMFA must be used within an MFAProvider');
  return context;
};
