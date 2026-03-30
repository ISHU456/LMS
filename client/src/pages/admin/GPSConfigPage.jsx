import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Save, Shield, Crosshair, Navigation, AlertCircle, Info, CheckCircle } from 'lucide-react';

const GPSConfigPage = () => {
    const [config, setConfig] = useState({
        lat: '',
        lng: '',
        radius: 100,
        label: 'Main Campus'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const userStr = localStorage.getItem('user');
            const token = userStr ? JSON.parse(userStr).token : null;
            const res = await axios.get('http://localhost:5001/api/attendance/daily/gps-config', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data) {
                setConfig({
                    lat: res.data.center.lat,
                    lng: res.data.center.lng,
                    radius: res.data.radius,
                    label: res.data.label
                });
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setConfig({
                    ...config,
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setMessage({ type: 'success', text: 'Current coordinates captured successfully.' });
            },
            (err) => {
                setError("Failed to get location: " + err.message);
            }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        setError(null);

        try {
            const userStr = localStorage.getItem('user');
            const token = userStr ? JSON.parse(userStr).token : null;
            await axios.post('http://localhost:5001/api/attendance/daily/gps-config', config, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage({ type: 'success', text: 'GPS Configuration updated successfully.' });
            setSaving(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update GPS config');
            setSaving(false);
        }
    };

    if (loading) return <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div></div>;

    return (
        <div className="flex-grow p-6 bg-slate-50 dark:bg-[#030712] overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {/* Header Card */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -mr-32 -mt-32 blur-3xl transition-all" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl">
                                    <Shield size={20} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Security Control Hub</span>
                            </div>
                            <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">
                                GPS Parameter Sync
                            </h1>
                            <p className="text-gray-500 font-medium max-w-xl">
                                Configure the institutional geofence boundaries for biometric attendance enforcement.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Main Settings */}
                    <div className="lg:col-span-3 space-y-6">
                        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-gray-100 dark:border-gray-800 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-1">Geofence Label</label>
                                    <input 
                                        type="text" 
                                        value={config.label}
                                        onChange={(e) => setConfig({...config, label: e.target.value})}
                                        className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                                        placeholder="e.g. Main Campus / South Block"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-1">Latitude</label>
                                        <input 
                                            type="number" 
                                            step="any"
                                            value={config.lat}
                                            onChange={(e) => setConfig({...config, lat: e.target.value})}
                                            className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-gray-900 dark:text-white font-mono font-bold outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                                            placeholder="23.XXXXXX"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-1">Longitude</label>
                                        <input 
                                            type="number" 
                                            step="any"
                                            value={config.lng}
                                            onChange={(e) => setConfig({...config, lng: e.target.value})}
                                            className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-gray-900 dark:text-white font-mono font-bold outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                                            placeholder="77.XXXXXX"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-1">Allowed Radius (Meters)</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={config.radius}
                                            onChange={(e) => setConfig({...config, radius: e.target.value})}
                                            className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                                            placeholder="100"
                                            required
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-[10px] uppercase">METERS</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button" 
                                    onClick={getCurrentLocation}
                                    className="flex-1 flex items-center justify-center gap-3 py-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95"
                                >
                                    <Crosshair size={18} /> Use My Location
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className="flex-[2] flex items-center justify-center gap-3 py-4 bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-primary-500/20 active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <><Save size={18} /> Deploy Boundaries</>}
                                </button>
                            </div>

                            {message && (
                                <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                    <span className="text-xs font-bold">{message.text}</span>
                                </div>
                            )}
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/10 text-red-600 border border-red-100 dark:border-red-900/20 rounded-xl flex items-center gap-3">
                                    <AlertCircle size={20} />
                                    <span className="text-xs font-bold">{error}</span>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Information Sidebar */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden h-full">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Navigation size={120} />
                            </div>
                            <div className="relative z-10 space-y-8">
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter mb-4 flex items-center gap-3">
                                        <Info className="text-primary-400" /> Boundary Logic
                                    </h3>
                                    <ul className="space-y-4">
                                        <li className="flex gap-4">
                                            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 shrink-0" />
                                            <p className="text-xs text-gray-400 leading-relaxed"><span className="text-white font-bold">Accuracy:</span> High precision GPS ensures students are physically within the perimeter.</p>
                                        </li>
                                        <li className="flex gap-4">
                                            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 shrink-0" />
                                            <p className="text-xs text-gray-400 leading-relaxed"><span className="text-white font-bold">Latency:</span> Configuration updates take effect instantly across all nodes.</p>
                                        </li>
                                        <li className="flex gap-4">
                                            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 shrink-0" />
                                            <p className="text-xs text-gray-400 leading-relaxed"><span className="text-white font-bold">Fail-safe:</span> System ignores VPN-spoofed locations by cross-referencing cell tower data.</p>
                                        </li>
                                    </ul>
                                </div>

                                <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-400 mb-2">Technical Warning</h4>
                                    <p className="text-[10px] text-gray-400 leading-tight">
                                        Coordinates must be exact. Radius below 50m may cause false rejection due to GPS drift in shielded structures.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GPSConfigPage;
