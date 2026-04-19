import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { io } from 'socket.io-client';
import { ArrowLeft, Loader2, ShieldCheck, Eye, Radio, Users, MessageSquare, Hand, Send, Mic, MicOff, Video, VideoOff, MessageCircle } from 'lucide-react';


const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

const LiveClass = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  
  const [isLoading, setIsLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [streamActive, setStreamActive] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [raisedHands, setRaisedHands] = useState(new Set());
  const [activeSidebarTab, setActiveSidebarTab] = useState('chat');
  const [broadcasterName, setBroadcasterName] = useState('Professor');

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'hod';
  
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnections = useRef({}); // For Teacher to manage multiple watchers
  const watcherConnection = useRef(null); // For Student to manage connection to Teacher
  const localStream = useRef(null);
  const messagesEndRef = useRef(null);
  const notificationAlerted = useRef(false);

  useEffect(() => {
    // Scroll to bottom of chat
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    // Initialize Socket
    socketRef.current = io('http://localhost:5001');
    const socket = socketRef.current;

    if (isTeacher) {
      // TEACHER LOGIC
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          localStream.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setStreamActive(true);
          setIsLoading(false);
          setBroadcasterName(user?.name);

          socket.emit('broadcaster-join', classId, user?.name);

          if (!notificationAlerted.current) {
            notificationAlerted.current = true;
            const payload = {
              title: `🔴 Live Class Started: ${classId}`,
              content: `Professor ${user?.name || 'Faculty'} has initiated a live broadcast. Click the link to join.`,
              type: 'link',
              category: 'Academic',
              priority: 'high',
              important: true,
              tags: ['live'],
              externalLink: `${window.location.origin}/live-class/${classId}`
            };
            axios.post('http://localhost:5001/api/announcements', payload, {
              headers: { Authorization: `Bearer ${user.token}` }
            }).catch(console.error);
          }
        })
        .catch(err => {
          console.error("Failed to access media devices.", err);
          alert("Microphone/Camera access required to broadcast.");
        });

      socket.on('watcher-connected', (id, watcherUser) => {
        setParticipants(prev => {
          if (prev.find(p => p.id === id)) return prev;
          return [...prev, { id, ...watcherUser }];
        });
        
        const peerConnection = new RTCPeerConnection(rtcConfig);
        peerConnections.current[id] = peerConnection;

        // Add local stream tracks to connection
        localStream.current.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStream.current);
        });

        peerConnection.onicecandidate = event => {
          if (event.candidate) {
            socket.emit('candidate', id, event.candidate);
          }
        };

        peerConnection.createOffer()
          .then(sdp => peerConnection.setLocalDescription(sdp))
          .then(() => {
            socket.emit('offer', id, peerConnection.localDescription);
          });
      });

      socket.on('answer', (id, description) => {
        if (peerConnections.current[id]) {
          peerConnections.current[id].setRemoteDescription(description);
        }
      });

      socket.on('candidate', (id, candidate) => {
        if (peerConnections.current[id]) {
          peerConnections.current[id].addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      socket.on('disconnectPeer', id => {
        setParticipants(prev => prev.filter(p => p.id !== id));
        if (peerConnections.current[id]) {
          peerConnections.current[id].close();
          delete peerConnections.current[id];
        }
      });

      socket.on('raise-hand', (raisedUser) => {
         setRaisedHands(prev => new Set(prev).add(raisedUser.name));
         setTimeout(() => {
           setRaisedHands(prev => {
              const newSet = new Set(prev);
              newSet.delete(raisedUser.name);
              return newSet;
           });
         }, 10000); // clear hand after 10s
      });

    } else {
      // STUDENT LOGIC
      socket.emit('watcher-join', classId, { name: user?.name, email: user?.email });

      socket.on('broadcaster-connected', (name) => {
         // Broadcaster reconnected
         if (name) setBroadcasterName(name);
         socket.emit('watcher-join', classId, { name: user?.name, email: user?.email });
      });

      socket.on('offer', (id, description, name) => {
        setIsLoading(false);
        if (name) setBroadcasterName(name);
        const peerConnection = new RTCPeerConnection(rtcConfig);
        watcherConnection.current = peerConnection;

        peerConnection.setRemoteDescription(description)
          .then(() => peerConnection.createAnswer())
          .then(sdp => peerConnection.setLocalDescription(sdp))
          .then(() => {
            socket.emit('answer', id, peerConnection.localDescription);
          });

        peerConnection.ontrack = event => {
          if (videoRef.current) {
            videoRef.current.srcObject = event.streams[0];
            setStreamActive(true);
          }
        };

        peerConnection.onicecandidate = event => {
          if (event.candidate) {
            socket.emit('candidate', id, event.candidate);
          }
        };
      });

      socket.on('candidate', (id, candidate) => {
        if (watcherConnection.current) {
          watcherConnection.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error(e));
        }
      });

      socket.on('broadcaster-disconnected', () => {
        if (watcherConnection.current) {
          watcherConnection.current.close();
        }
        setStreamActive(false);
        if (videoRef.current) videoRef.current.srcObject = null;
        setIsLoading(true); // Wait for them to reconnect
      });

      socket.on('broadcaster-name', (name) => {
         if (name) setBroadcasterName(name);
      });

      socket.on('update-participants', (list) => {
         setParticipants(list);
      });
    }

    // SHARED LOGIC
    socket.on('chat-message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
      if (localStream.current) {
        localStream.current.getTracks().forEach(t => t.stop());
      }
      Object.keys(peerConnections.current).forEach(id => {
        peerConnections.current[id].close();
      });
      if (watcherConnection.current) {
        watcherConnection.current.close();
      }
    };
  }, [classId, isTeacher, user]);

  const toggleMic = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach(t => t.enabled = !micEnabled);
      setMicEnabled(!micEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStream.current) {
      localStream.current.getVideoTracks().forEach(t => t.enabled = !videoEnabled);
      setVideoEnabled(!videoEnabled);
    }
  };

  const handleLeaveClass = () => {
    if (isTeacher) {
      if (window.confirm('Ending the class will disconnect all students. Proceed?')) {
        navigate('/faculty-dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const payload = {
      sender: user?.name,
      text: newMessage.trim(),
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    socketRef.current.emit('chat-message', classId, payload);
    setNewMessage('');
  };

  const handleRaiseHand = () => {
    socketRef.current.emit('raise-hand', classId, { name: user?.name });
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#0f172a] text-white overflow-hidden">
      
      {/* ── HEADER ──────────────────────────── */}
      <header className="h-16 shrink-0 bg-[#1e293b] border-b border-gray-800 flex items-center justify-between px-4 lg:px-6 z-20 shadow-2xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLeaveClass} 
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase transition-all shadow-lg active:scale-95 ${isTeacher ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
          >
             <ArrowLeft size={16} />
             {isTeacher ? 'End Session' : 'Leave Class'}
          </button>
          
          <div className="h-6 w-[1px] bg-gray-700 mx-2" />
          
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${streamActive ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-red-500'}`}></div>
            <div className="flex flex-col">
               <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Live Infrastructure</span>
               <span className={`font-bold text-sm tracking-tight ${streamActive ? 'text-emerald-400' : 'text-red-500'}`}>
                 {isTeacher ? 'Broadcasting Mode' : (streamActive ? 'Class in Progress' : 'Professor Offline')}
               </span>
            </div>
          </div>
        </div>

        {/* PRESIDING PROFESSOR NODE */}
        <div className="hidden md:flex items-center gap-4 px-6 py-2 bg-gray-900/50 rounded-2xl border border-gray-700/50">
           <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center font-black text-sm shadow-lg shadow-primary-500/20">
              {broadcasterName[0]}
           </div>
           <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em]">Presiding Faculty</span>
              <span className="text-xs font-bold text-gray-200 uppercase tracking-wide">Prof. {broadcasterName}</span>
           </div>
           {isTeacher ? <ShieldCheck size={18} className="text-emerald-500" title="Host Privileges Verified" /> : <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-2" />}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-sm">
            <Users size={14} className="text-emerald-400" />
            <span className="font-bold text-gray-300">{participants.length + (isTeacher ? 0 : 1)} Online</span>
          </div>
          {!isTeacher && (
             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-900/30 border border-emerald-500/30 rounded-lg text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
               <Eye size={12} />
               <span>Viewer</span>
             </div>
          )}
        </div>
      </header>

      {/* ── MAIN CONTENT ──────────────────────── */}
      <main className="flex-1 w-full relative flex flex-col xl:flex-row overflow-hidden bg-black">
        
        {/* Video Area */}
        <div className="flex-1 relative flex items-center justify-center p-4">
           {isLoading && !streamActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-4 bg-[#0f172a]">
                 <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-blue-500 blur-[20px] opacity-70 absolute" />
                 <Loader2 size={40} className="text-emerald-400 animate-spin relative z-10" />
                 <div className="text-center mt-2 relative z-10">
                    <h2 className="text-lg font-bold text-white">
                      {isTeacher ? 'Initializing Camera...' : 'Waiting for Professor...'}
                    </h2>
                 </div>
              </div>
           )}

           <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted={isTeacher} // Broadcaster shouldn't hear themselves
              className="w-full h-full object-contain rounded-2xl shadow-2xl bg-black border border-gray-800"
           />
           
           {isTeacher && streamActive && (
               <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-900/80 backdrop-blur-xl px-6 py-3 rounded-full border border-gray-700">
                  <button onClick={toggleMic} className={`p-4 rounded-full transition ${micEnabled ? 'bg-gray-800 hover:bg-gray-700' : 'bg-red-500/20 text-red-500 hover:bg-red-500/40'}`}>
                     {micEnabled ? <Mic size={24}/> : <MicOff size={24}/>}
                  </button>
                  <button onClick={toggleVideo} className={`p-4 rounded-full transition ${videoEnabled ? 'bg-gray-800 hover:bg-gray-700' : 'bg-red-500/20 text-red-500 hover:bg-red-500/40'}`}>
                     {videoEnabled ? <Video size={24}/> : <VideoOff size={24}/>}
                  </button>
               </div>
           )}
        </div>

        {/* Chat / Sidebar Area */}
        <div className="w-full xl:w-[400px] shrink-0 bg-[#0f172a] border-l border-gray-800 flex flex-col h-[50vh] xl:h-auto shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-10">
           
           {/* Section Tabs */}
           <div className="flex border-b border-gray-800 bg-[#1e293b]/50 backdrop-blur-xl">
              <button 
                onClick={() => setActiveSidebarTab('chat')}
                className={`flex-1 py-4 text-center font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all ${activeSidebarTab === 'chat' ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/5' : 'text-gray-500 hover:bg-gray-800/50'}`}
              >
                 <MessageSquare size={14}/> Live Chat
              </button>
              <button 
                onClick={() => setActiveSidebarTab('students')}
                className={`flex-1 py-4 text-center font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all ${activeSidebarTab === 'students' ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/5' : 'text-gray-500 hover:bg-gray-800/50'}`}
              >
                 <Users size={14}/> Students ({participants.length + (isTeacher ? 0 : 1)})
              </button>
           </div>

           {/* Raised Hands Banner (Teacher View) */}
           {isTeacher && raisedHands.size > 0 && (
              <div className="bg-amber-500/20 px-6 py-4 border-b border-amber-500/30 flex items-start gap-3 animate-slide-in">
                 <Hand className="text-amber-500 animate-bounce mt-1" size={20} />
                 <div>
                    <h4 className="text-amber-500 font-extrabold text-sm uppercase italic">Raised Hand Alert!</h4>
                    <p className="text-amber-200/70 text-xs mt-1 font-medium">
                       <span className="font-black text-white uppercase">{Array.from(raisedHands).join(', ')}</span> is requesting a clarification node.
                    </p>
                 </div>
              </div>
           )}

           {/* Content Area */}
           <div className="flex-1 overflow-y-auto custom-scrollbar">
              {activeSidebarTab === 'chat' ? (
                 <div className="p-4 space-y-4">
                    {chatMessages.length === 0 ? (
                       <div className="h-64 flex flex-col items-center justify-center text-gray-600">
                          <MessageCircle size={40} className="mb-2 opacity-20"/>
                          <p className="text-[10px] font-black uppercase tracking-widest">Digital Void...</p>
                          <p className="text-[9px] mt-1">Start the conversation</p>
                       </div>
                    ) : (
                       chatMessages.map((msg, idx) => (
                          <div key={idx} className="flex flex-col group">
                             <div className="flex items-baseline gap-2 mb-1">
                                <span className={`text-[10px] ml-1 font-black uppercase tracking-tight ${msg.sender === user?.name ? 'text-emerald-400' : 'text-primary-400'}`}>
                                   {msg.sender === user?.name ? 'You' : msg.sender}
                                </span>
                                <span className="text-[9px] text-gray-600 font-black">{msg.time}</span>
                             </div>
                             <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed transition-all ${msg.sender === user?.name ? 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-50 rounded-tr-sm self-start group-hover:bg-emerald-600/20' : 'bg-gray-800/50 text-gray-200 border border-gray-700/50 rounded-tl-sm self-start group-hover:bg-gray-800'} max-w-[92%] shadow-sm`}>
                                {msg.text}
                             </div>
                          </div>
                       ))
                    )}
                 </div>
              ) : (
                 <div className="p-6 space-y-6">
                    <div className="space-y-4">
                       <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2">Academic Host</h4>
                       <div className="flex items-center gap-3 p-3 bg-primary-600/10 border border-primary-500/20 rounded-2xl">
                          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center font-black">
                             {broadcasterName[0]}
                          </div>
                          <div>
                             <p className="text-xs font-black uppercase text-white tracking-tight">Prof. {broadcasterName}</p>
                             <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active Presenter</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2">Participant Roster</h4>
                       <div className="grid gap-3">
                          {participants.length === 0 ? (
                             <div className="p-4 text-center text-gray-600 text-[10px] font-black uppercase">No other students yet</div>
                          ) : (
                             participants.map((p, i) => (
                                <div key={p.id || i} className="flex items-center gap-3 p-3 bg-gray-800/30 border border-gray-700/30 rounded-2xl hover:bg-gray-800/50 transition-colors">
                                   <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center font-bold text-xs">
                                      {p.name?.[0] || 'S'}
                                   </div>
                                   <div className="flex-1 flex items-center justify-between">
                                      <p className="text-xs font-bold text-gray-300 uppercase tracking-tight">{p.name || 'Anonymous Student'}</p>
                                      {raisedHands.has(p.name) && (
                                         <Hand size={12} className="text-amber-500 animate-bounce" />
                                      )}
                                   </div>
                                </div>
                             ))
                          )}
                       </div>
                    </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
           </div>

           {/* Input Area */}
           <div className="p-4 bg-gray-900 border-t border-gray-800">
              <form onSubmit={sendMessage} className="flex gap-2">
                 {!isTeacher && streamActive && (
                    <button type="button" onClick={handleRaiseHand} className="shrink-0 p-3 bg-gray-800 hover:bg-amber-500/20 text-gray-400 hover:text-amber-500 transition rounded-xl border border-gray-700" title="Raise Hand">
                       <Hand size={20} />
                    </button>
                 )}
                 <input 
                    type="text" 
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-[#0f172a] border border-gray-700 rounded-xl px-4 text-sm outline-none focus:border-emerald-500 focus:bg-gray-900 transition-all font-medium text-gray-200 placeholder-gray-600"
                 />
                 <button type="submit" disabled={!newMessage.trim()} className="shrink-0 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-500 text-white p-3 rounded-xl transition">
                    <Send size={18} />
                 </button>
              </form>
           </div>
           
        </div>
      </main>
    </div>
  );
};

export default LiveClass;
