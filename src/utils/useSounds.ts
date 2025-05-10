
// Custom hook to handle sounds across the application
import { useEffect, useRef, useState } from 'react';

type SoundType = 'explosion' | 'door-open' | 'sling';

interface Sounds {
  [key: string]: HTMLAudioElement;
}

export const useSounds = () => {
  const soundsRef = useRef<Sounds>({});
  const [soundsLoaded, setSoundsLoaded] = useState(false);
  
  useEffect(() => {
    // Initialize sounds - only load them once
    if (Object.keys(soundsRef.current).length === 0) {
      // Define the sound files with their proper paths
      const soundFiles = {
        'explosion': '/sounds/explosion.mp3',
        'door-open': '/sounds/door-open.mp3',
        'sling': '/sounds/sling.mp3',
      };
      
      // Create audio elements for each sound
      Object.entries(soundFiles).forEach(([key, path]) => {
        const audio = new Audio();
        audio.src = path;
        audio.preload = 'auto';
        
        // Set reduced volume - make sling sound even quieter
        audio.volume = key === 'sling' ? 0.15 : 0.2;
        
        // Add to sounds collection
        soundsRef.current[key] = audio;
        
        // Add error handler to log issues
        audio.onerror = (e) => {
          console.error(`Error loading sound ${key} from ${path}:`, e);
        };
      });
      
      setSoundsLoaded(true);
    }
  }, []);
  
  const playSound = (sound: SoundType) => {
    const audio = soundsRef.current[sound];
    if (audio) {
      try {
        // Reset the sound to the beginning if it's already playing
        audio.currentTime = 0;
        // Use the play() promise to handle autoplay restrictions
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Playback started successfully
            })
            .catch(error => {
              // Auto-play was prevented
              console.info("Could not play sound:", error);
            });
        }
      } catch (error) {
        console.info("Could not play sound:", error);
      }
    } else {
      console.warn(`Sound "${sound}" not found`);
    }
  };
  
  return { playSound, soundsLoaded };
};
