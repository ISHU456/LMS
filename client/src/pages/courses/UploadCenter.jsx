import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { ArrowLeft, Megaphone, Radio, Layout, Calendar, Book, Youtube, ClipboardCheck, Award, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

// Modular Components
import SidebarNav from './course_modules/SidebarNav';
import CourseHeader from './course_modules/CourseHeader';
import ContentUploader from './course_modules/ContentUploader';
import LiveActivityFeed from './course_modules/LiveActivityFeed';

const UploadCenter = () => {
  const { courseId } = useParams();
  const { user } = useSelector(state => state.auth);
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'hod';
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [courseInfo, setCourseInfo] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  
  // Sidebar Resize States
  const [sidebarWidth, setSidebarWidth] = useState(288); // Default 72 (288px)
  const isSidebarResizing = useRef(false);
  const [isSidebarDragging, setIsSidebarDragging] = useState(false);
  
  // Resource Form State
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState('pdf');
  const [newPoints, setNewPoints] = useState(15);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Assignment Form State
  const [asgnTitle, setAsgnTitle] = useState('');
  const [asgnDesc, setAsgnDesc] = useState('');
  const [asgnDue, setAsgnDue] = useState('');
  const [asgnMarks, setAsgnMarks] = useState(100);

  // Announcement Form State
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');

  const displayName = user?.name || 'Faculty';
  const initials = user?.name?.split(' ').map(n => n[0]).join('') || 'FC';
  const roleLabel = user?.role?.toUpperCase() || 'TEACHER';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, annRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/courses/${courseId}`, {
             headers: { Authorization: `Bearer ${user.token}` }
          }),
          axios.get(`http://localhost:5000/api/announcements?courseId=${courseId}`)
        ]);
        setCourseInfo(courseRes.data);
      setAnnouncements(Array.isArray(annRes.data) ? annRes.data : (annRes.data.announcements || []));
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [courseId, user.token]);

  // Sidebar Resize Handlers
  useEffect(() => {
    const handleSideMouseMove = (e) => {
      if (!isSidebarResizing.current) return;
      const newWidth = e.clientX;
      if (newWidth > 200 && newWidth < 450) {
        setSidebarWidth(newWidth);
      }
    };
    const handleSideMouseUp = () => {
      isSidebarResizing.current = false;
      setIsSidebarDragging(false);
      document.body.style.cursor = 'default';
    };
    window.addEventListener('mousemove', handleSideMouseMove);
    window.addEventListener('mouseup', handleSideMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleSideMouseMove);
      window.removeEventListener('mouseup', handleSideMouseUp);
    };
  }, []);

  const startSidebarResizing = (e) => {
    e.preventDefault();
    isSidebarResizing.current = true;
    setIsSidebarDragging(true);
    document.body.style.cursor = 'col-resize';
  };

  const handleUploadCombined = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      let finalUrl = newUrl;
      const formData = new FormData();
      formData.append('title', newTitle);
      formData.append('type', newType);
      formData.append('points', newPoints);

      if (selectedFile) {
        formData.append('file', selectedFile);
        const res = await axios.post(`http://localhost:5000/api/courses/${courseId}/resources/upload`, formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${user.token}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        });
        alert('Asset deployed successfully');
      } else {
        await axios.post(`http://localhost:5000/api/courses/${courseId}/resources`, {
          title: newTitle, type: newType, fileUrl: newUrl, points: newPoints
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        alert('External node linked successfully');
      }
      
      setNewTitle('');
      setNewUrl('');
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      alert('Deployment failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:5000/api/courses/${courseId}/assignments`, {
        title: asgnTitle,
        description: asgnDesc,
        dueDate: asgnDue,
        totalMarks: asgnMarks
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('Protocol assigned successfully');
      setAsgnTitle('');
      setAsgnDesc('');
      setAsgnDue('');
    } catch (err) {
      console.error(err);
      alert('Protocol assignment failed');
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`http://localhost:5000/api/announcements`, {
        courseId,
        title: announcementTitle,
        content: announcementContent,
        author: user._id
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setAnnouncements([res.data, ...announcements]);
      setAnnouncementTitle('');
      setAnnouncementContent('');
      alert('Notice broadcasted successfully');
    } catch (err) {
      console.error(err);
      alert('Broadcast failed');
    }
  };

  const sectionTabs = [
    { id: 'upload', label: 'Upload Hub', icon: Layout, color: 'text-primary-500 bg-primary-50 dark:bg-primary-900/20 group-hover:bg-primary-100', active: 'bg-primary-500 text-white shadow-primary-500/30' },
    { id: 'timetable', label: 'Schedule', icon: Calendar, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100', active: 'bg-blue-500 text-white shadow-blue-500/30' },
    { id: 'ebooks', label: 'Resources', icon: Book, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 group-hover:bg-emerald-100', active: 'bg-emerald-500 text-white shadow-emerald-500/30' },
    { id: 'yt-links', label: 'Videos', icon: Youtube, color: 'text-red-500 bg-red-50 dark:bg-red-900/20 group-hover:bg-red-100', active: 'bg-red-500 text-white shadow-red-500/30' },
    { id: 'assignments', label: 'Assignments', icon: ClipboardCheck, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20 group-hover:bg-purple-100', active: 'bg-purple-500 text-white shadow-purple-500/30' },
    { id: 'completion', label: 'Completion', icon: Award, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 group-hover:bg-amber-100', active: 'bg-amber-500 text-white shadow-amber-500/30' },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 group-hover:bg-indigo-100', active: 'bg-indigo-500 text-white shadow-indigo-500/30' }
  ];

  if (!isTeacher) return <div className="p-20 text-center">Unauthorized Sector</div>;

  return (
    <div className="flex h-full bg-[#f8fafc] dark:bg-[#030712] overflow-hidden font-sans">
      <SidebarNav 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isTeacher={isTeacher}
        courseId={courseId}
        showUploadForm={true}
        setShowUploadForm={() => {}}
        sectionTabs={sectionTabs}
        activeSection="upload"
        setActiveSection={() => {}}
        initials={initials}
        displayName={displayName}
        roleLabel={roleLabel}
        isUploaderHub={true}
        sidebarWidth={sidebarWidth}
        startSidebarResizing={startSidebarResizing}
      />

      <main className="flex-1 flex flex-col min-w-0 min-h-0 relative">
        <header className="h-24 bg-white/80 dark:bg-[#030712]/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-10 flex items-center justify-between shrink-0 z-40">
           <div className="flex items-center gap-4">
              <Link to={`/course-inner/${courseId}`} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-400 hover:text-primary-600 transition-all">
                 <ArrowLeft size={20} />
              </Link>
              <div>
                 <h1 className="text-xl font-black dark:text-white uppercase tracking-tighter">Faculty Upload Hub</h1>
                 <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest">{courseInfo?.name || courseId}</p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                 <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Deployment Stream Active
                 </span>
                 <span className="text-xs font-black dark:text-white uppercase">Secure Session</span>
              </div>
              <button className="w-10 h-10 flex items-center justify-center bg-primary-600 text-white rounded-xl shadow-lg">
                 <Radio size={20}/>
              </button>
           </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
           <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Column: Form */}
              <div className="flex-1 space-y-8">
                 <ContentUploader 
                    showUploadForm={true}
                    setShowUploadForm={() => {}}
                    newTitle={newTitle}
                    setNewTitle={setNewTitle}
                    newType={newType}
                    setNewType={setNewType}
                    newUrl={newUrl}
                    setNewUrl={setNewUrl}
                    fileInputRef={fileInputRef}
                    selectedFile={selectedFile}
                    setSelectedFile={setSelectedFile}
                    handleUploadCombined={handleUploadCombined}
                    isUploading={isUploading}
                    uploadProgress={uploadProgress}
                    asgnTitle={asgnTitle}
                    setAsgnTitle={setAsgnTitle}
                    asgnDue={asgnDue}
                    setAsgnDue={setAsgnDue}
                    asgnDesc={asgnDesc}
                    setAsgnDesc={setAsgnDesc}
                    handleCreateAssignment={handleCreateAssignment}
                    announcementTitle={announcementTitle}
                    setAnnouncementTitle={setAnnouncementTitle}
                    announcementContent={announcementContent}
                    setAnnouncementContent={setAnnouncementContent}
                    handleCreateAnnouncement={handleCreateAnnouncement}
                 />
              </div>

              {/* Right Column: Feed */}
              <div className="w-full lg:w-96 shrink-0">
                 <div className="sticky top-0">
                    <div className="flex items-center gap-2 mb-4">
                       <Megaphone size={18} className="text-rose-500" />
                       <h2 className="text-xs font-black dark:text-white uppercase tracking-widest">Notice Broadcast History</h2>
                    </div>
                    <LiveActivityFeed 
                       announcements={announcements}
                       isTeacher={isTeacher}
                       activeSection="upload"
                    />
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default UploadCenter;
