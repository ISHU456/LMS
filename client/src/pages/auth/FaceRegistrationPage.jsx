import { useSelector } from 'react-redux';
import { Camera, ShieldCheck, AlertCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import FaceRegistration from '../../modules/mfa/components/FaceRegistration';

const FaceRegistrationPage = () => {
    const { user } = useSelector((state) => state.auth);
    const location = useLocation();
    const isForced = location.state?.forced || ((user?.role === 'student' || user?.role === 'admin' || user?.role === 'teacher') && !user?.faceRegistered);

    return (
        <div className="flex-grow p-4 md:p-10 flex flex-col items-center">
            {isForced && (
                <div className="mb-6 w-full max-w-lg bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl flex items-center gap-4 animate-bounce-subtle">
                   <div className="p-2 bg-orange-500 text-white rounded-xl shadow-lg shadow-orange-500/20">
                      <AlertCircle size={20} />
                   </div>
                   <p className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest leading-normal">
                      Mandatory Biometric Setup Required to Access your Academic Dashboard.
                   </p>
                </div>
            )}
            <header className="mb-10 text-center max-w-xl">
                 <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-200">
                    <Camera className="w-8 h-8" />
                 </div>
                 <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Biometric Gateway</h1>
                 <p className="text-slate-500">Welcome, <span className="text-blue-600 font-semibold">{user?.name}</span>. Secure your account by registering your unique facial signature.</p>
            </header>

            <div className="flex justify-center w-full">
                <FaceRegistration />
            </div>

            <footer className="mt-16 text-center text-slate-400 max-w-sm">
                <div className="flex items-center justify-center gap-2 mb-2 text-xs uppercase tracking-widest font-bold">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    <span>Hardware Encrypted</span>
                </div>
                <p className="text-[10px]">Your raw imagery is never stored. Only local mathematical signatures are encrypted and saved to the server vault.</p>
            </footer>
        </div>
    );
};

export default FaceRegistrationPage;
