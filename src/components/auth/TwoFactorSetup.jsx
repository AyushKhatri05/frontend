import { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import apiService from '../../utils/api';
import toast from 'react-hot-toast';

const TwoFactorSetup = ({ onComplete }) => {
    const [step, setStep] = useState('loading'); // loading, setup, verify
    const [secret, setSecret] = useState('');
    const [otpauthUrl, setOtpauthUrl] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [recoveryCodes, setRecoveryCodes] = useState([]);

    // Step 1: Fetch 2FA secret from backend
    useEffect(() => {
        fetchSetupData();
    }, []);

    const fetchSetupData = async () => {
        try {
            const response = await apiService.auth.setup2FA();
            setSecret(response.data.data.secret);
            setOtpauthUrl(response.data.data.otpauth_url);
            setStep('setup');
        } catch (error) {
            toast.error('Failed to setup 2FA');
            setStep('setup');
        }
    };

    // Step 2: Verify and enable 2FA
    const verifyAndEnable = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }

        setLoading(true);
        try {
            const response = await apiService.auth.enable2FA({ token: verificationCode });
            // Mock recovery codes - in real app, these come from backend
            setRecoveryCodes([
                '12345-67890', '23456-78901', '34567-89012', '45678-90123',
                '56789-01234', '67890-12345', '78901-23456', '89012-34567'
            ]);
            setStep('recovery');
            toast.success('2FA enabled successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid verification code');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Complete setup
    const handleComplete = () => {
        if (onComplete) onComplete();
    };

    if (step === 'loading') {
        return (
            <div className="text-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Preparing 2FA setup...</p>
            </div>
        );
    }

    if (step === 'setup') {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Setup Two-Factor Authentication</h2>
                
                <div className="space-y-8">
                    {/* Step 1: Install App */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <div className="flex items-center mb-4">
                            <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold mr-3">1</span>
                            <h3 className="text-lg font-semibold">Install an Authenticator App</h3>
                        </div>
                        <p className="text-gray-600 ml-11">
                            Download Google Authenticator, Microsoft Authenticator, or Authy on your phone.
                        </p>
                    </div>

                    {/* Step 2: Scan QR Code */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <div className="flex items-center mb-4">
                            <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold mr-3">2</span>
                            <h3 className="text-lg font-semibold">Scan QR Code</h3>
                        </div>
                        <div className="ml-11">
                            <p className="text-gray-600 mb-4">
                                Open your authenticator app and scan this QR code:
                            </p>
                            <div className="flex justify-center bg-white p-6 rounded-lg border-2 border-dashed">
                                <QRCode 
                                    value={otpauthUrl} 
                                    size={200}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>
                            
                            {/* Manual entry option */}
                            <div className="mt-4">
                                <details className="text-sm">
                                    <summary className="text-indigo-600 cursor-pointer">Can't scan? Enter code manually</summary>
                                    <div className="mt-2 p-3 bg-gray-100 rounded font-mono text-sm break-all">
                                        {secret}
                                    </div>
                                </details>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Verify Code */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <div className="flex items-center mb-4">
                            <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold mr-3">3</span>
                            <h3 className="text-lg font-semibold">Verify Code</h3>
                        </div>
                        <div className="ml-11">
                            <p className="text-gray-600 mb-4">
                                Enter the 6-digit code from your authenticator app:
                            </p>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    maxLength="6"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    onClick={verifyAndEnable}
                                    disabled={loading || verificationCode.length !== 6}
                                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {loading ? '...' : 'Verify'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'recovery') {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-yellow-800 mb-4">⚠️ Save These Recovery Codes</h2>
                    <p className="text-yellow-700 mb-4">
                        Each code can be used only once. Store them in a safe place.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {recoveryCodes.map((code, index) => (
                            <div key={index} className="bg-white p-3 rounded font-mono text-center border border-yellow-300">
                                {code}
                            </div>
                        ))}
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(recoveryCodes.join('\n'));
                                toast.success('Codes copied to clipboard');
                            }}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Copy Codes
                        </button>
                        <button
                            onClick={handleComplete}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            I've Saved Codes
                        </button>
                    </div>
                </div>
            </div>
        );
    }
};

export default TwoFactorSetup;