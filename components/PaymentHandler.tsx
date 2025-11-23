import React, { useState, useEffect } from 'react';
import { verifyPaytmPayment } from '../lib/bookingService';

const PaymentHandler: React.FC = () => {
    const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
    const [error, setError] = useState<string | null>(null);
    const [redirectPath, setRedirectPath] = useState<string>('#/');

    useEffect(() => {
        const handlePaymentCallback = async () => {
            try {
                const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
                const paymentId = hashParams.get('payment_id');
                const paymentStatusFromUrl = hashParams.get('status');
                
                // For initial bookings
                const bookingId = hashParams.get('booking_id');
                const carId = hashParams.get('car_id');

                // For extensions
                const extensionId = hashParams.get('extension_id');

                if (!paymentId || paymentId === 'undefined' || !paymentStatusFromUrl) {
                    throw new Error('Invalid payment callback URL. Missing or invalid required parameters.');
                }
                
                // Simulate payment failure for testing if needed
                // const paymentStatus = 'failed';
                const paymentStatus = paymentStatusFromUrl;

                const { success, error: verificationError } = await verifyPaytmPayment(paymentId, paymentStatus);

                if (!success) {
                    throw new Error(verificationError || 'Payment verification failed.');
                }
                
                if (paymentStatus === 'success') {
                    // Clear any previous attempt info on success
                    sessionStorage.removeItem('paymentAttemptInfo');
                    if (extensionId) {
                        sessionStorage.setItem('postExtensionSuccess', 'true');
                        setRedirectPath('#/dashboard');
                    } else if (bookingId && carId) {
                        sessionStorage.setItem('postPaymentInfo', JSON.stringify({ carId, bookingId }));
                        setRedirectPath('#/');
                    }
                    setStatus('success');
                } else {
                     throw new Error('Payment was not successful. Please try again.');
                }
            } catch (err: any) {
                setError(err.message || 'An unknown error occurred during payment processing.');
                setStatus('failed');
            }
        };

        handlePaymentCallback();
    }, []);
    
    useEffect(() => {
        if (status === 'success') {
            const timer = setTimeout(() => {
                window.location.hash = redirectPath;
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [status, redirectPath]);

    const handleRetry = () => {
        // This flag will be picked up by HomePage to re-open the booking modal
        sessionStorage.setItem('retryPayment', 'true');
        window.location.hash = '#/';
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
                {status === 'verifying' && (
                    <>
                        <svg className="animate-spin h-12 w-12 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <h1 className="text-2xl font-bold text-foreground">Verifying Payment...</h1>
                        <p className="text-gray-600 mt-2">Please wait while we confirm your transaction. Do not refresh this page.</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <svg className="w-16 h-16 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <h1 className="text-2xl font-bold text-foreground">Payment Successful!</h1>
                        <p className="text-gray-600 mt-2">Your booking has been updated. Redirecting you now...</p>
                    </>
                )}
                {status === 'failed' && (
                    <>
                         <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <h1 className="text-2xl font-bold text-foreground">Payment Failed</h1>
                        <p className="bg-red-100 text-red-700 p-3 rounded-md my-4 text-sm">{error}</p>
                        <div className="flex justify-center space-x-4">
                            <a href="#/" className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition">
                                Return to Homepage
                            </a>
                             <button 
                                onClick={handleRetry}
                                className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition"
                            >
                                Retry Payment
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentHandler;