import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { 
  Youtube, Map, Plus, PlayCircle, Clock, CheckCircle, Video, FileText, 
  ExternalLink, ArrowLeft, FileDown, Book, Presentation, ClipboardCheck,   
  Settings, Layout, Layers, Info, Users, Trash2, Upload, AlertCircle, 
  Download, X, Eye, Shield, GripVertical, MonitorPlay, Calendar, Target, Globe, 
  FileCode, Check, ShieldCheck, Megaphone, Zap, Sparkles, MessageCircle,
  VideoIcon, Radio, UserCheck, Award, Trophy, TrendingUp, BarChart3,
  Play, Send, Paperclip, FolderOpen, GraduationCap, Link2, File, Image,
  Loader2, Bot, Search, PanelLeft, Maximize, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Chatbot from '../../components/Chatbot';
import {
  completeLectureForStudent,
  getGamificationState,
  getTodayKey,
  markAttendanceForStudent,
  getCourseProgressSummary
} from '../../utils/gamificationStore';
import CompletionPreview from '../../components/course/CompletionPreview';
import Schedule from './schedule/Schedule';

// Modular Components
import SidebarNav from './course_modules/SidebarNav';
import CourseHeader from './course_modules/CourseHeader';
import ContentUploader from './course_modules/ContentUploader';
import LiveActivityFeed from './course_modules/LiveActivityFeed';
import DispatchHub from './course_modules/DispatchHub';
import IntelligenceTerminal from './course_modules/IntelligenceTerminal';
import QuickScheduleAdd from './course_modules/QuickScheduleAdd';
import ActiveScheduleTasks from './course_modules/ActiveScheduleTasks';
import PreviewWorkspace from './course_modules/PreviewWorkspace';


const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useSelector(state => state.auth);
  
  const isAdminHOD = user?.role === 'admin' || user?.role === 'hod';
  const isUserTeacher = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'hod';
  const isStudent = user?.role === 'student';

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const isSidebarResizing = useRef(false);

  const displayName = user?.name?.trim()
    ? user.name.trim().split(/\s+/).slice(0, 2).join(' ')
    : 'Student';
  const initials = user?.name?.trim()
    ? user.name.trim().split(/\s+/).map((n) => n[0]?.toUpperCase()).filter(Boolean).slice(0, 2).join('')
    : 'ST';
  const roleLabel = user?.role ? String(user.role).toUpperCase() : 'MEMBER';

  const [activeSection, setActiveSection] = useState(() => 
    searchParams.get('section') || localStorage.getItem(`course_active_tab_${courseId}`) || 'timetable'
  );
  const [onlineStudents, setOnlineStudents] = useState(0);
  const [classLive, setClassLive] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Update URL and LocalStorage when active section changes
  useEffect(() => {
    localStorage.setItem(`course_active_tab_${courseId}`, activeSection);
    setSearchParams(prev => {
        prev.set('section', activeSection);
        return prev;
    }, { replace: true });

    if (activeSection === 'ai-assistant') {
      document.body.classList.add('ai-assistant-page-active');
    } else {
      document.body.classList.remove('ai-assistant-page-active');
    }
    return () => document.body.classList.remove('ai-assistant-page-active');
  }, [activeSection, courseId, setSearchParams]);

  const [resources, setResources] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [completedItems, setCompletedItems] = useState(new Set());
  const [gamificationState, setGamificationState] = useState(null);
  const progress = useMemo(() => {
    if (!user?._id) return 0;
    
    // Calculate total possible points and completed points
    const totalPoints = resources.reduce((sum, r) => sum + (Number(r.points) || 10), 0) + 
                       assignments.reduce((sum, a) => sum + (Number(a.totalMarks) || 100), 0);
    
    if (totalPoints === 0) return 0;

    let completedPoints = 0;
    resources.forEach(r => {
      if (completedItems.has(r._id)) completedPoints += (Number(r.points) || 10);
    });
    assignments.forEach(a => {
      const isCompleted = studentSubmissions.some(sub => (sub.assignment?._id === a._id) || (sub.assignment === a._id));
      if (isCompleted || completedItems.has(a._id)) completedPoints += (Number(a.totalMarks) || 100);
    });

    return Math.round((completedPoints / totalPoints) * 100);
  }, [completedItems, resources, assignments, studentSubmissions, user?._id]);
  
  const [timetable, setTimetable] = useState([
    { day: 'Monday', time: '10:00 - 11:30', room: 'Lecture Hall 101', activity: 'Theory Session', type: 'lecture' },
    { day: 'Wednesday', time: '14:00 - 16:00', room: 'Computer Lab C', activity: 'Practical Lab', type: 'lab' },
    { day: 'Friday', time: '11:00 - 12:30', room: 'Seminar Room 202', activity: 'Tutorial & Discussion', type: 'tutorial' },
  ]);
  
  const [courseInfo, setCourseInfo] = useState(null);

  // Management Permission: strictly assigned teachers (or HOD/Admin oversight)
  const isAuthorizedTeacher = isAdminHOD || (user?.role === 'teacher' && (
     courseInfo?.facultyAssigned?.some(f => (f._id?.toString() || f.toString()) === user?._id?.toString())
  ));

  // Access Permission: allow all faculty into the page, but restricted students
  const isFacultyRole = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'hod';
  
  const isEnrolledStudent = isStudent && (
     (courseInfo?.department?.name === user?.department || courseInfo?.department?.code === user?.department) &&
     Number(courseInfo?.semester) <= Number(user?.semester)
  );
  
  const isExcluded = isStudent && courseInfo?.excludedStudents?.includes(user?._id);

  const isFutureSemester = isStudent && Number(courseInfo?.semester) > Number(user?.semester);
  const isLocked = courseInfo && !(isFacultyRole || (isEnrolledStudent && !isExcluded));
  const [dbProgress, setDbProgress] = useState({ percentage: 0, completedCount: 0, totalItems: 0 });
  
  // New Schedule Item State (deprecated for sidebar, moved to Schedule.jsx)
  const [timetableImageUrl, setTimetableImageUrl] = useState('');

  const updateScheduleInDB = async (payload) => {
    try {
      const res = await axios.put(`http://localhost:5001/api/courses/${courseId}/schedule`, payload, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setTimetable(res.data.schedule);
      if (res.data.timetableImageUrl) setTimetableImageUrl(res.data.timetableImageUrl);
      return true;
    } catch (err) {
      console.error('Failed to update schedule', err);
      alert('Failed to sync schedule with server');
      return false;
    }
  };


  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleTimetableImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const code = courseId.toUpperCase();
      const res = await axios.post(`http://localhost:5001/api/courses/${code}/schedule/image`, formData, {
        headers: { 
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setTimetableImageUrl(res.data.timetableImageUrl);
      alert('Master photo uploaded successfully.');
    } catch (err) {
      console.error(err);
      alert('Upload failed.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteTimetableImage = async () => {
    if (!window.confirm('Are you sure you want to delete the Master Timetable photo?')) return;
    try {
      const code = courseId.toUpperCase();
      await axios.put(`http://localhost:5001/api/courses/${code}/schedule`, { 
        timetableImageUrl: '' 
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setTimetableImageUrl('');
      alert('Master photo deleted.');
    } catch (err) {
      console.error(err);
      alert('Failed to delete.');
    }
  };

  const handleDeleteScheduleItem = async (index) => {
    if (!window.confirm('Remove this schedule entry?')) return;
    const updated = timetable.filter((_, i) => i !== index);
    updateScheduleInDB({ schedule: updated });
  };

  // Dispatch Hub / Content Uploader States
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('pdf');
  const [newPoints, setNewPoints] = useState(15);
  const [newUrl, setNewUrl] = useState('');
  const [asgnTitle, setAsgnTitle] = useState('');
  const [asgnDue, setAsgnDue] = useState('');
  const [asgnMarks, setAsgnMarks] = useState(10);
  const [asgnDesc, setAsgnDesc] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);

  const [leftWidth, setLeftWidth] = useState(45);
  const isResizing = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSidebarDragging, setIsSidebarDragging] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  // Fetch DB Progress
  const fetchProgress = async () => {
    if (!user?._id || !courseId) return;
    try {
      const res = await axios.get(`http://localhost:5001/api/progress/${courseId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setDbProgress(res.data);
      // Sync local completedItems set
      if (res.data.progress?.completedItems) {
        const itemIds = new Set(res.data.progress.completedItems.map(i => i.itemId));
        setCompletedItems(itemIds);
      }
    } catch (err) {
      console.error('Failed to fetch progress', err);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [courseId, user?._id]);

  useEffect(() => {
    return () => {
      if (previewItem && previewItem.url && previewItem.url.startsWith('blob:')) {
        URL.revokeObjectURL(previewItem.url);
      }
    };
  }, [previewItem]);

  const [showProgressToast, setShowProgressToast] = useState(false);

  const updateDbProgress = async (itemId, itemType) => {
    if (!user?._id || !courseId) return;
    
    // Optimistic local update
    setCompletedItems(prev => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
    
    setShowProgressToast(true);
    setTimeout(() => setShowProgressToast(false), 3000);

    try {
      await axios.post('http://localhost:5001/api/progress/update', {
        courseId,
        itemId,
        itemType
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchProgress();
    } catch (err) {
      console.error('Failed to update progress', err);
      // Rollback if failed
      fetchProgress();
    }
  };
  const [isMarkerActive, setIsMarkerActive] = useState(false);
  const [markerColor, setMarkerColor] = useState('#ffea00'); // Default yellow highlighter
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);

  const hasIncrementedView = useRef(null);

  const fetchCourseData = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/courses/${courseId}`, {
         headers: { Authorization: `Bearer ${user.token}` }
      });
      setCourseInfo(res.data);
      if (res.data.schedule && res.data.schedule.length > 0) {
        setTimetable(res.data.schedule);
      }
      if (res.data.timetableImageUrl) {
        setTimetableImageUrl(res.data.timetableImageUrl);
      }
    } catch (err) {
      console.error('Failed to fetch course info', err);
    }
  };

  // Dedicated effect for incrementing views once per unique course mount
  useEffect(() => {
    if (courseId && user?.token && hasIncrementedView.current !== courseId) {
       hasIncrementedView.current = courseId;
       axios.patch(`http://localhost:5001/api/courses/${courseId}/view`, {}, {
         headers: { Authorization: `Bearer ${user.token}` }
       }).catch(err => console.error('Failed to increment views', err));
    }
  }, [courseId, user?.token]);

  useEffect(() => {
    if (previewItem?.type === 'pdf' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      // Set canvas size to match container
      const resizeCanvas = () => {
        const parent = canvas.parentElement;
        if (parent) {
          canvas.width = parent.clientWidth;
          canvas.height = parent.clientHeight;
        }
      };
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, [previewItem]);

  const startDrawing = (e) => {
    if (!isMarkerActive) return;
    isDrawing.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = markerColor + '80'; // Add transparency
    ctx.lineWidth = 15;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e) => {
    if (!isDrawing.current || !isMarkerActive) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [videoLoadStates, setVideoLoadStates] = useState({});
  
  // Refs for resizing
  const resizerRef = useRef(null);
  const leftColumnRef = useRef(null);
  const rightColumnRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchResources = async () => {
    try { 
      setIsLoading(true); 
      const res = await axios.get(`http://localhost:5001/api/resources?courseId=${courseId}`); 
      setResources(res.data); 
    } catch (err) { 
      console.error(err); 
    } finally { 
      setIsLoading(false); 
    }
  };
  
  const fetchAssignments = async () => { 
    try { 
      const res = await axios.get(`http://localhost:5001/api/assignments/course/${courseId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      }); 
      setAssignments(res.data); 
      if (isStudent) fetchStudentSubmissions();
    } catch (err) { 
      console.error(err); 
    } 
  };

  const fetchStudentSubmissions = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/assignments/my-submissions/${courseId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setStudentSubmissions(res.data);
    } catch (err) {
      console.error(err);
    }
  };
  
  const fetchAnnouncements = async () => { 
    try { 
      const res = await axios.get(`http://localhost:5001/api/announcements`); 
      const data = Array.isArray(res.data) ? res.data : (res.data.announcements || []);
      setAnnouncements(data.slice(0, 3)); 
    } catch (err) { 
      console.error(err); 
    } 
  };

  const fetchOnlineCount = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/auth/course-activity/${courseId}`);
      setOnlineStudents(res.data.onlineCount || 0);
    } catch (err) { 
      console.error(err); 
    }
  };

  const sendPulse = async () => {
    try {
      await axios.post('http://localhost:5001/api/auth/pulse', { courseId }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
    } catch (err) { 
      console.error(err); 
    }
  };



  useEffect(() => {
    fetchCourseData();
    fetchResources(); 
    fetchAssignments();
    fetchOnlineCount();
    fetchAnnouncements();
    sendPulse();

    if (isStudent && user?._id) {
      const state = getGamificationState(user._id);
      setGamificationState(state);
      const ids = state?.progressByCourseId?.[courseId]?.completedLectureIds || [];
      setCompletedItems(new Set(ids));
    }

    const interval = setInterval(() => {
      fetchOnlineCount();
      sendPulse();
    }, 30000);

    const handleMouseMove = (e) => {
      if (!isResizing.current) return;
      if (window.innerWidth < 1024) return;
      
      requestAnimationFrame(() => {
        const container = leftColumnRef.current?.parentElement;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const localX = e.clientX - rect.left;
        const newLeftWidth = (localX / rect.width) * 100;

        if (newLeftWidth > 30 && newLeftWidth < 70) {
          setLeftWidth(newLeftWidth);
        }
      });
    };
    
    const handleMouseUp = () => { 
      isResizing.current = false; 
      setIsDragging(false); 
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      
      if (leftColumnRef.current) {
        leftColumnRef.current.style.pointerEvents = 'auto';
      }
      if (rightColumnRef.current) {
        rightColumnRef.current.style.pointerEvents = 'auto';
      }
    };
    
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
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleSideMouseMove);
    window.addEventListener('mouseup', handleSideMouseUp);
    
    return () => { 
      clearInterval(interval);
      window.removeEventListener('mousemove', handleMouseMove); 
      window.removeEventListener('mouseup', handleMouseUp); 
      window.removeEventListener('mousemove', handleSideMouseMove); 
    };
  }, [courseId, user?._id]);

  const startResizing = (e) => {
    e.preventDefault();
    isResizing.current = true;
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    
    if (leftColumnRef.current) {
      leftColumnRef.current.style.pointerEvents = 'none';
    }
    if (rightColumnRef.current) {
      rightColumnRef.current.style.pointerEvents = 'none';
    }
  };


  const handleMarkComplete = (item) => {
    if (isStudent && user?._id && !completedItems.has(item._id)) {
      completeLectureForStudent(user._id, courseId, item._id, item.points || 10, item.type === 'assignment' ? 'assignment' : 'lecture');
      const newSet = new Set(completedItems);
      newSet.add(item._id);
      setCompletedItems(newSet);
      
      const state = getGamificationState(user._id);
      setGamificationState(state);
    }
  };

  const handleDelete = async (item) => { 
    if (!window.confirm('Are you sure you want to delete this item?')) return; 
    try { 
      const config = {};
      if (user?.token) config.headers = { Authorization: `Bearer ${user.token}` };
      
      if (activeSection === 'assignments') {
        await axios.delete(`http://localhost:5001/api/assignments/${item._id}?courseId=${courseId}`, config);
        setAssignments(assignments.filter(a => a._id !== item._id));
      } else {
        await axios.delete(`http://localhost:5001/api/resources/${item._id}?courseId=${courseId}`, config); 
        setResources(resources.filter(r => r._id !== item._id)); 
      }
      
      if (previewItem?.id === item._id) {
        setPreviewItem(null);
      }
    } catch (err) { 
      console.error(err);
      alert('Delete failed'); 
    } 
  };

  const toggleComplete = (id) => {
    const newSet = new Set(completedItems);
    if (!newSet.has(id)) {
      newSet.add(id);
      setCompletedItems(newSet);
    }
  };

  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handlePreview = async (res) => {
    if (previewItem && previewItem.url && previewItem.url.startsWith('blob:')) {
      URL.revokeObjectURL(previewItem.url);
    }
  
    setPreviewItem({ url: null, type: 'loading', title: res.title, id: res._id });
  
    let url = res.fileUrl;
    let originalType = res.type;
  
    if (res.fileData) {
      url = `http://localhost:5001/api/resources/file/${res._id}`;
    }
  
    let resolvedPreviewType = originalType;
    let finalUrl = url;
  
    if (originalType === 'youtube' || (url && (url.includes('youtube.com') || url.includes('youtu.be')))) {
      const videoId = getYouTubeVideoId(url);
      if (videoId) {
        finalUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&loop=1&playlist=${videoId}&showinfo=0`;
      }
      resolvedPreviewType = 'youtube';
      setPreviewItem({ url: finalUrl, type: resolvedPreviewType, title: res.title, originalType: originalType, id: res._id });
    } else if (
      originalType === 'pdf' ||
      originalType === 'ebook' ||
      originalType === 'material' ||
      originalType === 'pyq' ||
      originalType === 'mindmap' ||
      (url && url.toLowerCase().split('?')[0].endsWith('.pdf'))
    ) {
      resolvedPreviewType = 'pdf';
      try {
        const config = { responseType: 'blob' };
        // Only attatch token if it's a local request (not external Cloudinary)
        if (user?.token && !url.includes('cloudinary.com')) {
          config.headers = { Authorization: `Bearer ${user.token}` };
        }
        const response = await axios.get(url, config);
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const objectUrl = URL.createObjectURL(blob);
        setPreviewItem({ url: objectUrl, type: 'pdf', title: res.title, originalType: originalType, id: res._id });
      } catch (error) {
        console.error("Error fetching PDF for preview:", error);
        setPreviewItem({ url: url, type: 'error', title: res.title, originalType: originalType, id: res._id });
      }
    } else if (originalType === 'ppt' || (url && (url.toLowerCase().split('?')[0].endsWith('.pptx') || url.toLowerCase().split('?')[0].endsWith('.ppt')))) {
      resolvedPreviewType = 'ppt';
      setPreviewItem({ url: finalUrl, type: resolvedPreviewType, title: res.title, originalType: originalType, id: res._id });
    } else {
        resolvedPreviewType = 'default'
      setPreviewItem({ url: finalUrl, type: resolvedPreviewType, title: res.title, originalType: originalType, id: res._id });
    }
  
    if (isStudent && user?._id && !completedItems.has(res._id)) {
      toggleComplete(res._id);
      updateDbProgress(res._id, res.type);
      const newState = completeLectureForStudent({
        studentId: user._id,
        courseId,
        lectureId: res._id,
        lectureType: res.type,
      });
      if (newState) setGamificationState(newState);
    }
  };

  const handleVideoLoadStart = (videoId) => {
    setVideoLoadStates(prev => ({ ...prev, [videoId]: 'loading' }));
  };

  const handleVideoLoadSuccess = (videoId) => {
    setVideoLoadStates(prev => ({ ...prev, [videoId]: 'loaded' }));
  };

  const sectionTabs = [
    { id: 'timetable', label: 'Schedule', icon: Calendar, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100', active: 'bg-blue-500 text-white shadow-blue-500/30' },
    { id: 'ebooks', label: 'Resources', icon: Book, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 group-hover:bg-emerald-100', active: 'bg-emerald-500 text-white shadow-emerald-500/30' },
    { id: 'yt-links', label: 'Videos', icon: Youtube, color: 'text-red-500 bg-red-50 dark:bg-red-900/20 group-hover:bg-red-100', active: 'bg-red-500 text-white shadow-red-500/30' },
    { id: 'assignments', label: 'Assignments', icon: ClipboardCheck, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20 group-hover:bg-purple-100', active: 'bg-purple-500 text-white shadow-purple-500/30' },
    { id: 'completion', label: 'Completion', icon: Award, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 group-hover:bg-amber-100', active: 'bg-amber-500 text-white shadow-amber-500/30' },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 group-hover:bg-indigo-100', active: 'bg-indigo-500 text-white shadow-indigo-500/30' }
  ];

  const renderPreviewContent = () => {
    if (!previewItem) return null;
    
    const SimplePreviewWrapper = ({ children }) => (
      <div className="relative w-full h-full bg-white dark:bg-gray-900 flex flex-col rounded-2xl overflow-hidden shadow-2xl">
        {children}
      </div>
    );

    switch(previewItem.type) {
        case 'loading':
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="w-16 h-16 animate-spin text-primary-500" />
                    <p className="mt-4 text-lg font-bold text-gray-500 dark:text-gray-400">Loading Preview...</p>
                </div>
            );
        case 'error':
            return (
              <SimplePreviewWrapper>
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500 hover:text-gray-700">
                  <AlertCircle size={64} className="opacity-50 mb-4 text-red-500" />
                  <h3 className="text-xl font-semibold mb-2">Preview Failed</h3>
                  <p className="text-sm opacity-80 mb-6">Could not load the resource for preview.</p>
                  <a
                    href={previewItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold inline-flex items-center gap-2 transition-colors shadow-lg shadow-primary-500/20"
                  >
                    <ExternalLink size={18} />
                    Open Original Resource
                  </a>
                </div>
              </SimplePreviewWrapper>
            );
      case 'youtube':
        return (
          <div className="w-full bg-white dark:bg-black flex flex-col h-full overflow-hidden">
            <div className="flex-1 p-4 md:p-8 flex items-center justify-center min-h-0">
              <div className="w-full h-auto max-h-full aspect-video shadow-2xl rounded-3xl overflow-hidden border-4 border-gray-200 dark:border-white/10 flex items-center justify-center bg-black">
                <iframe
                  src={previewItem.url}
                  className="w-full h-full border-0"
                  title="Video Content"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
            {/* Legal Attribution Footer */}
            <div className="shrink-0 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-white/5 px-8 py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 flex items-center justify-center animate-pulse">
                  <Youtube size={16} fill="currentColor" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Digital Content Source</p>
                  <p className="text-xs font-bold text-gray-900 dark:text-white uppercase">Sourced from YouTube API</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <a 
                  href={previewItem.url?.split('?')[0].replace('embed/', 'watch?v=')} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  <ExternalLink size={14} />
                  Watch on Original Channel
                </a>
              </div>
            </div>
          </div>
        );
      case 'pdf':
        return (
          <SimplePreviewWrapper>
            <iframe
              src={previewItem.url}
              className="w-full h-full border-0"
              title="PDF Preview"
              loading="lazy"
            />
          </SimplePreviewWrapper>
        );

      case 'ppt':
        const officeUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(previewItem.url)}`;
        return (
          <SimplePreviewWrapper>
            <iframe
              src={officeUrl}
              className="w-full h-full border-0"
              title="PPT Preview"
              allowFullScreen
              loading="lazy"
            />
          </SimplePreviewWrapper>
        );
      default:
        return (
          <SimplePreviewWrapper>
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-400">
              <FileText size={64} className="opacity-50 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">{previewItem.title}</h3>
              <p className="text-sm mb-6">Native preview unavailable.</p>
              <a
                href={previewItem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold inline-flex items-center gap-2 transition-colors shadow-lg shadow-primary-500/20"
              >
                <ExternalLink size={18} />
                Open Original File
              </a>
            </div>
          </SimplePreviewWrapper>
        );
    }
  };

  if (isLocked) return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-[#030712] p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-[3rem] p-12 text-center shadow-3xl border border-gray-100 dark:border-gray-800 relative z-10"
      >
        <div className="relative inline-flex items-center justify-center mb-8">
          <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
          <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-3xl flex items-center justify-center shadow-inner relative">
            <Lock size={48} className="translate-y-[-2px]"/>
            <div className="absolute bottom-[-4px] right-[-4px] p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <X className="text-red-500" size={16} />
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4">
          {isFutureSemester ? 'CURRICULUM LOCKED' : 'ACCESS DENIED'}
        </h2>
        <div className="w-12 h-1 bg-red-500 mx-auto rounded-full mb-6" />
        
        <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-10 text-sm">
          {isFutureSemester 
            ? `Protocol for Semester ${courseInfo?.semester} is currently inactive. You will gain access to this curriculum once you reach the required academic milestone.`
            : `This system is strictly reserved for authorized faculty and enrolled students. Your credential signature does not match the active roster for the ${courseInfo?.code || 'requested'} sector.`
          }
        </p>

        <div className="grid grid-cols-1 gap-4">
           <button 
             onClick={() => navigate('/courses')}
             className="w-full flex items-center justify-center gap-3 py-5 rounded-[2rem] bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl hover:shadow-primary-500/20"
           >
             <ArrowLeft size={16} /> RETURN TO COURSE DIRECTORY
           </button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="flex h-full bg-[#f8fafc] dark:bg-[#030712] overflow-hidden font-sans">
      <SidebarNav 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isTeacher={isAuthorizedTeacher}
        courseId={courseId}
        showUploadForm={showUploadForm}
        setShowUploadForm={setShowUploadForm}
        sectionTabs={sectionTabs}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        initials={initials}
        displayName={displayName}
        roleLabel={roleLabel}
        sidebarWidth={sidebarWidth}
        isSidebarDragging={isSidebarDragging}
        startSidebarResizing={(e) => {
          e.preventDefault();
          isSidebarResizing.current = true;
          setIsSidebarDragging(true);
        }}
      />

      <main className="flex-1 flex flex-col min-w-0 min-h-0 relative">
        <CourseHeader 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          courseInfo={courseInfo}
          courseId={courseId}
          progress={progress}
          gamificationState={gamificationState}
          onlineStudents={onlineStudents}
          isTeacher={isFacultyRole}
          canManage={isAuthorizedTeacher}
          navigate={navigate}
        />

        <div className={`flex-1 flex flex-col min-h-0 overflow-hidden transition-all duration-500 ${activeSection === 'ai-assistant' ? 'p-0 pb-0' : 'p-4 md:p-8'}`}>
          <AnimatePresence mode="wait">
            {activeSection === 'ai-assistant' ? (
              <motion.div
                key="ai-assistant"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="h-full bg-white dark:bg-gray-800 shadow-3xl overflow-hidden"
              >
                <Chatbot variant="inline" className="h-full border-0 rounded-none shadow-none" noAutoScroll={true} />
              </motion.div>
            ) : (
              <motion.div 
                key="workspace-system"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col gap-6 h-full overflow-hidden"
              >
                <div className="flex-1 flex flex-col lg:flex-row gap-6 h-full overflow-hidden relative">
                  <AnimatePresence>
                    {activeSection === 'completion' && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="absolute inset-0 z-[100] bg-white dark:bg-[#0b0f19] rounded-[2.5rem] shadow-3xl overflow-hidden border border-gray-100 dark:border-gray-800"
                      >

                         <div className="h-full flex flex-col">
                            <header className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                                     <Award size={20} />
                                  </div>
                                  <div>
                                     <h2 className="text-lg font-black dark:text-white uppercase tracking-tighter">Course Completion Matrix</h2>
                                     <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Verified Digital Credential Processing Engine</p>
                                  </div>
                               </div>
                               <button 
                                 onClick={() => setActiveSection('timetable')}
                                 className="px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                               >
                                 Return to HUB
                               </button>
                            </header>
                            <div className="flex-1 min-h-0 overflow-y-auto relative">
                               <CompletionPreview 
                                 progress={progress}
                                 completedItems={completedItems}
                                 resources={resources}
                                 assignments={assignments}
                                 displayName={displayName}
                                 courseInfo={courseInfo}
                                 courseId={courseId}
                                 isTeacher={isAuthorizedTeacher}
                                 gamificationState={gamificationState}
                                 studentSubmissions={studentSubmissions}
                                />
                            </div>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {activeSection !== 'completion' && (
                    <>
                      <div
                        ref={leftColumnRef}
                        style={{ width: `${leftWidth}%`, minWidth: '400px' }}
                        className={`flex flex-col gap-6 min-h-0 overflow-y-auto pr-2 custom-scrollbar transition-all w-full lg:w-auto ${isDragging ? 'duration-0 pointer-events-none' : 'duration-300'}`}
                      >
                        {activeSection === 'timetable' && (
                          <div className="flex flex-col gap-4">
                            {isAuthorizedTeacher && (
                              <QuickScheduleAdd 
                                timetable={timetable} 
                                updateScheduleInDB={updateScheduleInDB} 
                                user={user} 
                                courseId={courseId}
                                asgnDue={asgnDue}
                                setAsgnDue={setAsgnDue}
                                asgnMarks={asgnMarks}
                                setAsgnMarks={setAsgnMarks}
                                handleTimetableImageUpload={handleTimetableImageUpload}
                                isUploadingImage={isUploadingImage}
                                handleDeleteScheduleItem={handleDeleteScheduleItem}
                              />
                            )}
                            <ActiveScheduleTasks 
                              timetable={timetable} 
                              handleDeleteScheduleItem={handleDeleteScheduleItem} 
                              updateScheduleInDB={updateScheduleInDB}
                              isTeacher={isAuthorizedTeacher}
                            />
                          </div>
                        )}

                        {activeSection !== 'timetable' && (
                          <IntelligenceTerminal 
                            activeSection={activeSection}
                            isAdminHOD={isAdminHOD}
                            setShowUploadForm={setShowUploadForm}
                            showUploadForm={showUploadForm}
                            timetable={timetable}
                            isTeacher={isAuthorizedTeacher}
                            courseId={courseId}
                            user={user}
                            handleDeleteScheduleItem={handleDeleteScheduleItem}
                            assignments={assignments}
                            resources={resources}
                            previewItem={previewItem}
                            isStudent={isStudent}
                            handleMarkComplete={handleMarkComplete}
                            handlePreview={handlePreview}
                            handleDelete={handleDelete}
                            completedItems={completedItems}
                            updateScheduleInDB={updateScheduleInDB}
                            selectedAssignment={selectedAssignment}
                            setSelectedAssignment={(val) => {
                                setSelectedAssignment(val);
                                if (val) setLeftWidth(40);
                            }}
                            studentSubmissions={studentSubmissions}
                            fetchAssignments={fetchAssignments}
                          />
                        )}
                      </div>

                      <PreviewWorkspace
                        leftWidth={leftWidth}
                        startResizing={startResizing}
                        isDragging={isDragging}
                        rightColumnRef={rightColumnRef}
                        previewItem={previewItem}
                        setPreviewItem={setPreviewItem}
                        activeSection={activeSection}
                        courseId={courseId}
                        isTeacher={isAuthorizedTeacher}
                        user={user}
                        timetable={timetable}
                        setTimetable={setTimetable}
                        timetableImageUrl={timetableImageUrl}
                        setTimetableImageUrl={setTimetableImageUrl}
                        handleTimetableImageUpload={handleTimetableImageUpload}
                        handleDeleteTimetableImage={handleDeleteTimetableImage}
                        isUploadingImage={isUploadingImage}
                        selectedAssignment={selectedAssignment}
                        setSelectedAssignment={setSelectedAssignment}
                        fetchAssignments={fetchAssignments}
                        setLeftWidth={setLeftWidth}
                      />
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>      </main>
    </div>
  );
};

export default CourseDetail;
