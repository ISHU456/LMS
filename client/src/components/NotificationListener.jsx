import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import socket from '../utils/socket';
import { useDispatch } from 'react-redux';
import { updateProfile } from '../features/auth/authSlice';

const NotificationListener = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!user) return;

    // Join a private room for the user
    socket.emit('join-room', `user_${user._id}`, user._id);

    // Listen for course access updates
    socket.on('access-update', (data) => {
      if (data.studentId === user._id) {
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

    // Listen for real-time profile updates (credits, coins, etc.)
    socket.on('profile-update', (data) => {
       dispatch(updateProfile(data));
       
       const event = new CustomEvent('smartlms:achievement', {
         detail: {
           title: 'Balance Synchronized',
           subtitle: 'Your institutional assets have been updated.',
           icon: 'zap',
           color: 'bg-indigo-600/90',
         }
       });
       window.dispatchEvent(event);
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
      socket.off('access-update');
      socket.off('attendance-alert');
    };
  }, [user]);

  return null; // This component doesn't render anything
};

export default NotificationListener;
