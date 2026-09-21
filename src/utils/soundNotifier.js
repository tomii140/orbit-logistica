// Genera un tono sintetizado mediante Web Audio API compatible con Web y Móviles
let sharedAudioCtx = null;

const getAudioContext = () => {
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
};

export const playNotificationSound = (type = 'info') => {
  try {
    const audioCtx = getAudioContext();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'support' || type === 'Urgente') {
      // Frecuencia doble/aguda para avisos de soporte o urgentes
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.1); // A5
    } else {
      // Frecuencia estándar para avisos operativos
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.setValueAtTime(554.37, now + 0.1); // C#5
    }

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.35);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {
    console.error("Audio API error:", e);
  }
};