// High-quality notification sound URL
const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';

/**
 * Plays a modern notification "ping" sound.
 * Note: Browsers require user interaction (click/touch) before playing sound.
 */
export const playNotificationSound = () => {
  try {
    const audio = new Audio(NOTIFICATION_SOUND_URL);
    audio.volume = 0.4; // Subtle volume
    
    // Play and handle potential promise rejection (e.g. no user interaction)
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        // Silently fail if browser blocks autoplay
        console.log('Sound playback blocked by browser until user interaction.');
      });
    }
  } catch (err) {
    console.error('Error playing sound:', err);
  }
};
