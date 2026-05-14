import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const mutedText = { marginTop: '16px', color: '#aab3bc' };

const WaitingPage = () => {
  const [status, setStatus] = useState('pending_hr');
  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await axios.get('/employee/waiting-status');
        const { status, profileComplete } = response.data;

        setStatus(status);

        if (status === 'approved') {
          if (!profileComplete) {
            navigate('/employee/complete-profile', { replace: true });
          } else {
            navigate('/employee/dashboard', { replace: true });
          }
        }
      } catch (error) {
        console.error('Check status error:', error);
      }
    };

    checkStatus();

    const interval = setInterval(checkStatus, 10000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        {status === 'pending_hr' && (
          <>
            <div style={{ fontSize: '14px', letterSpacing: '0.08em', marginBottom: '20px', color: '#5dd6c7', textTransform: 'uppercase' }}>
              Pending Review
            </div>
            <h2>Application Under Review</h2>
            <p style={mutedText}>
              Your registration has been submitted successfully.
              Our HR team is reviewing your application.
            </p>
            <p style={mutedText}>
              You will be notified once your profile is approved.
            </p>
            <div style={{ marginTop: '24px' }}>
              <div className="loading">Checking status...</div>
            </div>
          </>
        )}

        {status === 'rejected' && (
          <>
            <div style={{ fontSize: '14px', letterSpacing: '0.08em', marginBottom: '20px', color: '#ffacb5', textTransform: 'uppercase' }}>
              Rejected
            </div>
            <h2>Application Rejected</h2>
            <p style={mutedText}>
              Unfortunately, your registration has been rejected by HR.
            </p>
            <p style={mutedText}>
              Please contact HR for more information.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default WaitingPage;
