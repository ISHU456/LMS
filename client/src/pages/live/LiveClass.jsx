import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';

const LiveClass = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  
  const [isLoading, setIsLoading] = useState(true);
  
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'hod';
  
  // Create a unique, secure room name based on the classId
  const roomName = `LMS_Secure_Live_Class_${classId || 'DEMO_ROOM'}_10123`;

  const handleLeaveClass = () => {
     if(isTeacher) navigate('/faculty-dashboard');
     else navigate('/dashboard');
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#0f172a] text-white">
      
      {/* --- TOP HEADER NAVIGATION --- */}
      <header className="h-16 shrink-0 bg-[#1e293b] border-b border-gray-800 flex items-center justify-between px-6 z-20">
         <div className="flex items-center gap-4">
            <button onClick={handleLeaveClass} className="text-gray-400 hover:text-white transition bg-gray-800 p-2 rounded-lg">
               <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
               <span className="font-bold tracking-wider text-sm uppercase text-red-500">Live Server</span>
            </div>
            <div className="h-4 w-[1px] bg-gray-700 hidden md:block mx-2"></div>
            <h1 className="font-bold text-gray-200 hidden md:flex items-center gap-2">
               Course Stream: {classId || 'Global Room'} 
               {isTeacher && <ShieldCheck size={18} className="text-emerald-500 ml-2" title="Host Privileges Active"/>}
            </h1>
         </div>
         <div className="flex items-center gap-4">
            <div className="text-xs font-mono text-gray-500 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800">
               Encryption: end-to-end
            </div>
         </div>
      </header>

      {/* --- MAIN JITSI MEET CONTAINER --- */}
      <main className="flex-1 w-full h-full relative flex items-center justify-center">
         
         {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f172a] z-10">
               <Loader2 size={48} className="text-primary-500 animate-spin mb-4" />
               <h2 className="text-xl font-bold">Connecting to WebRTC Nodes...</h2>
               <p className="text-gray-500 mt-2">Initializing secure camera protocols</p>
            </div>
         )}
         
         <div className="w-full h-full">
            <JitsiMeeting
              domain="meet.jit.si"
              roomName={roomName}
              configOverwrite={{
                 startWithAudioMuted: true,
                 startWithVideoMuted: false,
                 requireDisplayName: true,
                 prejoinPageEnabled: false, // Jump straight in
                 disableDeepLinking: true, // Prevent prompting app downloads
              }}
              interfaceConfigOverwrite={{
                 DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
                 TOOLBAR_BUTTONS: [
                    'microphone', 'camera', 'closedcaptions', 'desktop', 'embedmeeting', 'fullscreen',
                    'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                    'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                    'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                    'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                    'security'
                 ],
                 SHOW_JITSI_WATERMARK: false,
                 SHOW_WATERMARK_FOR_GUESTS: false,
              }}
              userInfo={{
                 displayName: user?.name || (isTeacher ? 'Professor' : 'Student'),
                 email: user?.email || '',
              }}
              onApiReady={(externalApi) => {
                 setIsLoading(false);
                 console.log("Jitsi API Hook Initialized", externalApi);
                 
                 // Automatically grant admin/host privileges to Teacher Accounts
                 if(isTeacher) {
                    externalApi.executeCommand('subject', `Class ID: ${classId}`);
                 }
              }}
              getIFrameRef={(iframeRef) => { 
                iframeRef.style.height = '100%'; 
                iframeRef.style.width = '100%'; 
                iframeRef.style.border = 'none';
              }}
            />
         </div>
      </main>

    </div>
  );
};

export default LiveClass;
