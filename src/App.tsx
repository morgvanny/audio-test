import { useState, useRef, useEffect } from "react";
import "./App.css";

const FADE_OUT_DURATION = 0.05; // 50 milliseconds for fade out
const PAN_TRANSITION_TIME = 0.05; // 50 milliseconds for pan transition
const VOLUME_TRANSITION_TIME = 0.01; // Reduced from 0.05 to 0.01 (10 milliseconds)

function App(): JSX.Element {
  const [volume, setVolume] = useState<number>(0.5);
  const [pan, setPan] = useState<number>(0);
  const [isContinuous, setIsContinuous] = useState<boolean>(false);
  const [lastCustomPan, setLastCustomPan] = useState<number>(0);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const panNodeRef = useRef<StereoPannerNode | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const createAudioContext = () => {
    if (!audioContext.current) {
      audioContext.current = new AudioContext();
    }
    return audioContext.current;
  };

  const playSound = (
    frequency: number,
    panValue: number,
    buttonId: string
  ): void => {
    const context = createAudioContext();
    const now = context.currentTime;

    // If the same button is clicked while continuously playing, stop the sound
    if (isContinuous && currentlyPlaying === buttonId) {
      stopSound();
      return;
    }

    // If there's a tone currently playing, reuse it
    if (oscillatorRef.current && gainNodeRef.current && panNodeRef.current) {
      // Update the frequency
      oscillatorRef.current.frequency.setValueAtTime(frequency, now);

      // Only update the pan if it's different
      if (panNodeRef.current.pan.value !== panValue) {
        panNodeRef.current.pan.setValueAtTime(
          panNodeRef.current.pan.value,
          now
        );
        panNodeRef.current.pan.linearRampToValueAtTime(
          panValue,
          now + PAN_TRANSITION_TIME
        );
      }
    } else {
      // If no sound is playing, create a new oscillator and nodes
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      const panNode = context.createStereoPanner();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now);

      gainNodeRef.current = gainNode;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(
        volume,
        now + VOLUME_TRANSITION_TIME
      );

      panNodeRef.current = panNode;
      panNode.pan.setValueAtTime(panValue, now);

      oscillator.connect(gainNode);
      gainNode.connect(panNode);
      panNode.connect(context.destination);

      oscillator.start(now);
      oscillatorRef.current = oscillator;
    }

    setCurrentlyPlaying(buttonId);
    setLastPlayed(buttonId);

    // Set up the timeout for non-continuous play
    if (!isContinuous) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        if (!isContinuous) {
          stopSound();
        }
      }, 1000 - FADE_OUT_DURATION * 1000);
    }
  };

  const playCustomPan = () => {
    // setShowPanSlider(true);
    setPan(lastCustomPan);
    playSound(261.63, lastCustomPan, "custom");
  };

  const stopSound = () => {
    if (oscillatorRef.current && gainNodeRef.current && audioContext.current) {
      const now = audioContext.current.currentTime;

      gainNodeRef.current.gain.cancelScheduledValues(now);
      gainNodeRef.current.gain.setValueAtTime(
        gainNodeRef.current.gain.value,
        now
      );
      gainNodeRef.current.gain.linearRampToValueAtTime(
        0,
        now + FADE_OUT_DURATION
      );

      oscillatorRef.current.stop(now + FADE_OUT_DURATION);

      setTimeout(() => {
        oscillatorRef.current = null;
        gainNodeRef.current = null;
        setCurrentlyPlaying(null);
      }, FADE_OUT_DURATION * 1000);
    } else {
      setCurrentlyPlaying(null);
    }
  };

  const handlePanChange = (newPan: number) => {
    setPan(newPan);
    setLastCustomPan(newPan);

    if (panNodeRef.current && audioContext.current) {
      const now = audioContext.current.currentTime;
      panNodeRef.current.pan.cancelScheduledValues(now);
      panNodeRef.current.pan.setValueAtTime(panNodeRef.current.pan.value, now);
      panNodeRef.current.pan.linearRampToValueAtTime(
        newPan,
        now + PAN_TRANSITION_TIME
      );
    }
  };

  useEffect(() => {
    if (gainNodeRef.current && audioContext.current) {
      const now = audioContext.current.currentTime;
      gainNodeRef.current.gain.cancelScheduledValues(now);
      gainNodeRef.current.gain.setValueAtTime(
        gainNodeRef.current.gain.value,
        now
      );
      gainNodeRef.current.gain.linearRampToValueAtTime(
        volume,
        now + VOLUME_TRANSITION_TIME
      );
    }
  }, [volume]);

  useEffect(() => {
    if (panNodeRef.current && audioContext.current) {
      const now = audioContext.current.currentTime;
      panNodeRef.current.pan.cancelScheduledValues(now);
      panNodeRef.current.pan.setValueAtTime(panNodeRef.current.pan.value, now);
      panNodeRef.current.pan.linearRampToValueAtTime(
        pan,
        now + PAN_TRANSITION_TIME
      );
    }
  }, [pan]);

  useEffect(() => {
    if (!isContinuous) {
      stopSound();
    }
  }, [isContinuous]);

  useEffect(() => {
    return () => {
      stopSound();
    };
  }, []);

  useEffect(() => {
    if (currentlyPlaying === "custom") {
      setLastCustomPan(pan);
    }
  }, [pan, currentlyPlaying]);

  useEffect(() => {
    if (isContinuous && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    } else if (!isContinuous && !timeoutRef.current && currentlyPlaying) {
      timeoutRef.current = setTimeout(() => {
        stopSound();
      }, 1000);
    }
  }, [isContinuous, currentlyPlaying]);

  return (
    <div className="audio-test">
      <h1>Audio Configuration Test</h1>

      <div className="control-panel">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
        />
        <span>Volume: {volume.toFixed(2)}</span>
      </div>

      <div className="control-panel">
        <div className="button-container">
          <div className="main-buttons">
            <button
              onClick={() => playSound(261.63, -1, "left")}
              className={currentlyPlaying === "left" ? "playing" : ""}
            >
              Play Left
            </button>
            <button
              onClick={() => playSound(261.63, 0, "center")}
              className={currentlyPlaying === "center" ? "playing" : ""}
            >
              Play Center
            </button>
            <button
              onClick={() => playSound(261.63, 1, "right")}
              className={currentlyPlaying === "right" ? "playing" : ""}
            >
              Play Right
            </button>
          </div>
          <button
            onClick={playCustomPan}
            className={`custom-pan ${
              currentlyPlaying === "custom" ? "playing" : ""
            }`}
          >
            Pan Left/Right
          </button>
        </div>
        <div className="continuous-play">
          <label>
            <input
              type="checkbox"
              checked={isContinuous}
              onChange={(e) => setIsContinuous(e.target.checked)}
            />
            Play Continuously
          </label>
        </div>
      </div>

      {(currentlyPlaying === "custom" ||
        (!currentlyPlaying && lastPlayed === "custom")) && (
        <div className="control-panel">
          <h2>Pan Left/Right</h2>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.1"
            value={pan}
            onChange={(e) => handlePanChange(parseFloat(e.target.value))}
          />
          <span>Pan: {pan.toFixed(1)}</span>
        </div>
      )}
    </div>
  );
}

export default App;
