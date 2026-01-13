// Notification sound utilities

let audioContext;
let gainNode;

// Initialize Web Audio API
const initAudio = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNode.gain.value = 0.3; // 30% volume
  }
};

// Play a subtle notification sound using Web Audio API
export const playNotificationSound = (volume = 0.3) => {
  try {
    initAudio();

    // Create oscillator for a pleasant notification sound
    const oscillator = audioContext.createOscillator();
    const envelope = audioContext.createGain();

    oscillator.connect(envelope);
    envelope.connect(gainNode);

    // Set frequency for a pleasant "ding" sound
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);

    // Create envelope for smooth sound
    envelope.gain.setValueAtTime(0, audioContext.currentTime);
    envelope.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    // Play the sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);

    // Cleanup
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
  } catch (error) {
    console.warn('Failed to play notification sound:', error);
  }
};

// Play sound from audio file (alternative method)
export const playNotificationSoundFromFile = (audioFile = '/notification.mp3', volume = 0.3) => {
  try {
    const audio = new Audio(audioFile);
    audio.volume = volume;
    audio.play().catch(err => console.warn('Failed to play notification sound:', err));
  } catch (error) {
    console.warn('Failed to play notification sound from file:', error);
  }
};

// Vibrate on mobile devices (PWA)
export const vibrateNotification = (pattern = [200, 100, 200]) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

// Combined notification feedback (sound + vibration)
export const notificationFeedback = (options = {}) => {
  const { sound = true, vibrate = false, volume = 0.3 } = options;

  if (sound) {
    playNotificationSound(volume);
  }

  if (vibrate && 'vibrate' in navigator) {
    vibrateNotification();
  }
};

// Set volume for notification sounds
export const setNotificationVolume = (volume) => {
  if (gainNode) {
    gainNode.gain.value = Math.max(0, Math.min(1, volume));
  }
};
