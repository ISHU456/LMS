import { motion } from 'framer-motion';

const HeartbeatBackground = ({ scrollY }) => {
  // Heartbeat animation keyframes
  const heartbeats = [
    { left: '10%', top: '20%', delay: 0 },
    { left: '70%', top: '30%', delay: 0.3 },
    { left: '30%', top: '60%', delay: 0.6 },
    { left: '80%', top: '70%', delay: 0.9 },
    { left: '50%', top: '40%', delay: 1.2 },
  ];

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
      {heartbeats.map((hb, i) => (
        <motion.div
          key={i}
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ 
            scale: [1, 1.3, 1], 
            opacity: [0.5, 1, 0.5],
            y: scrollY * (i % 2 === 0 ? 0.2 : -0.2) * (i+1)
          }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            delay: hb.delay,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            left: hb.left,
            top: hb.top,
            width: 80,
            height: 80,
            zIndex: 0,
          }}
        >
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <motion.path
              d="M50 80C50 80 10 55 10 35C10 20 30 10 50 30C70 10 90 20 90 35C90 55 50 80 50 80Z"
              fill="#e11d48"
              initial={{ filter: 'blur(2px)' }}
              animate={{ filter: [
                'blur(2px)',
                'blur(0px)',
                'blur(2px)'
              ] }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                delay: hb.delay,
                ease: 'easeInOut',
              }}
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
};

export default HeartbeatBackground;
