// Sound effects utility for the medical assistant

// Audio context for generating tones
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

// Check if sounds are enabled
export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('soundEnabled') !== 'false';
}

// Generate a pleasant beep tone
function playTone(frequency: number, duration: number, volume: number = 0.3, type: OscillatorType = 'sine') {
  if (!isSoundEnabled()) return;
  
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (error) {
    console.warn('Sound playback failed:', error);
  }
}

// Play a success sound (ascending notes)
export function playSuccess() {
  if (!isSoundEnabled()) return;
  playTone(523.25, 0.1, 0.2); // C5
  setTimeout(() => playTone(659.25, 0.1, 0.2), 100); // E5
  setTimeout(() => playTone(783.99, 0.15, 0.2), 200); // G5
}

// Play a notification/message received sound
export function playMessageReceived() {
  if (!isSoundEnabled()) return;
  playTone(880, 0.08, 0.15); // A5
  setTimeout(() => playTone(1174.66, 0.12, 0.15), 80); // D6
}

// Play a click/tap sound
export function playClick() {
  if (!isSoundEnabled()) return;
  playTone(600, 0.05, 0.1);
}

// Play an error sound (descending notes)
export function playError() {
  if (!isSoundEnabled()) return;
  playTone(440, 0.15, 0.2); // A4
  setTimeout(() => playTone(349.23, 0.2, 0.2), 150); // F4
}

// Play a warning sound
export function playWarning() {
  if (!isSoundEnabled()) return;
  playTone(587.33, 0.1, 0.2); // D5
  setTimeout(() => playTone(587.33, 0.1, 0.2), 200); // D5 again
}

// Play a send message sound
export function playMessageSent() {
  if (!isSoundEnabled()) return;
  playTone(440, 0.06, 0.12); // A4
  setTimeout(() => playTone(523.25, 0.08, 0.12), 60); // C5
}

// Play a toggle sound
export function playToggle(enabled: boolean) {
  if (!isSoundEnabled()) return;
  if (enabled) {
    playTone(523.25, 0.08, 0.15); // C5 - higher for "on"
  } else {
    playTone(392, 0.08, 0.15); // G4 - lower for "off"
  }
}
