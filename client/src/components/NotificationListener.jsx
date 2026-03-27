import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';

const NotificationListener = () => {
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user) return;

    const socket = io('http://localhost:5001');
    
    // Join a private room for the user
    socket.emit('join-room', `user_${user._id}`, user._id);

    // Listen for course access updates
    socket.on('access-update', (data) => {
      if (data.studentId === user._id) {
        // Dispatch custom event for AchievementToaster
        const event = new CustomEvent('smartlms:achievement', {
          detail: {
            title: `Access ${data.state}`,
            subtitle: data.message,
            icon: data.state === 'ACTIVE' ? 'zap' : 'shield-alert',
            color: data.state === 'ACTIVE' ? 'bg-emerald-600/80' : 'bg-rose-600/80',
          }
        });
        window.dispatchEvent(event);
      }
    });

    // Listen for low attendance alerts
    socket.on('attendance-alert', (data) => {
      if (data.studentId === user._id) {
        const event = new CustomEvent('smartlms:achievement', {
          detail: {
            title: 'Low Attendance Alert',
            subtitle: `Your attendance in ${data.courseCode} has dropped below 75%.`,
            icon: 'calendar',
            color: 'bg-amber-600/80',
          }
        });
        window.dispatchEvent(event);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  return null; // This component doesn't render anything
};

export default NotificationListener;
