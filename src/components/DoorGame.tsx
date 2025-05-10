
import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSounds } from '@/utils/useSounds';

type DoorContent = 'reward' | 'fish';
type GameState = 'initial' | 'firstPick' | 'revealed' | 'final';

const DoorGame = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { playSound, soundsLoaded } = useSounds();
  const [doors, setDoors] = useState<DoorContent[]>(['fish', 'fish', 'fish']);
  const [selectedDoor, setSelectedDoor] = useState<number | null>(null);
  const [revealedDoor, setRevealedDoor] = useState<number | null>(null);
  const [gameState, setGameState] = useState<GameState>('initial');
  const [result, setResult] = useState<string | null>(null);
  const [isSwitched, setIsSwitched] = useState<boolean | null>(null);
  const [doorsOpen, setDoorsOpen] = useState<boolean[]>([false, false, false]);
  const prizeButtonRef = useRef<HTMLAnchorElement>(null);

  // Debug sounds loading
  useEffect(() => {
    console.log('DoorGame mounted, sounds loaded:', soundsLoaded);
  }, [soundsLoaded]);

  // Initialize the game with random door contents
  useEffect(() => {
    const rewardIndex = Math.floor(Math.random() * 3);
    const newDoors: DoorContent[] = ['fish', 'fish', 'fish'];
    newDoors[rewardIndex] = 'reward';
    setDoors(newDoors);
  }, []);

  const openDoor = (doorIndex: number) => {
    
    // Create a copy of the current doors open state
    const newDoorsOpen = [...doorsOpen];
    newDoorsOpen[doorIndex] = true;
    setDoorsOpen(newDoorsOpen);
  };

  const handleDoorClick = (doorIndex: number) => {
    if (gameState === 'initial') {
         // Play door opening sound
      playSound('door-open');
      // First selection
      setSelectedDoor(doorIndex);
      setGameState('firstPick');
      // Reveal a fish door that is not the selected one and not the reward
      const availableDoorsToReveal = [];
      for (let i = 0; i < 3; i++) {
        if (i !== doorIndex && doors[i] === 'fish') {
          availableDoorsToReveal.push(i);
        }
      }
      
      const revealIndex = availableDoorsToReveal[Math.floor(Math.random() * availableDoorsToReveal.length)];
      setRevealedDoor(revealIndex);
      openDoor(revealIndex);
      
      toast({
        title: "Here, let me help you!",
        description: "I've opened one of the losing doors. Would you like to stick with your choice or switch?",
      });
      
      setGameState('revealed');
    } else if (gameState === 'revealed') {
         // Play door opening sound
      playSound('door-open');
      // Final selection
      const finalDoorIndex = doorIndex;
      setSelectedDoor(finalDoorIndex);
      setIsSwitched(selectedDoor !== finalDoorIndex);
      
      // Open all doors
      setDoorsOpen([true, true, true]);
      
      // Show the result
      if (doors[finalDoorIndex] === 'reward') {
        setResult('win');
       
        
        toast({
          title: "🎉 Jackpot!",
          description: "You've unlocked 25% off if you hire me right now!",
        });
      } else {
        setResult('lose');
        toast({
          title: "🐟 Another fish!",
          description: "Either you're unlucky, or a secret fish collector. Try again? I'm not judging.",
        });
      }
      
      setGameState('final');
    }
  };

  const resetGame = () => {
    const rewardIndex = Math.floor(Math.random() * 3);
    const newDoors: DoorContent[] = ['fish', 'fish', 'fish'];
    newDoors[rewardIndex] = 'reward';
    
    setDoors(newDoors);
    setSelectedDoor(null);
    setRevealedDoor(null);
    setDoorsOpen([false, false, false]);
    setGameState('initial');
    setResult(null);
    setIsSwitched(null);
  };

  const renderDoorContent = (doorIndex: number) => {
    // Show the door content if:
    // - It's the revealed door
    // - The game is in final state
    if (doorsOpen[doorIndex]) {
      if (doors[doorIndex] === 'reward') {
        return (
          <div className="flex flex-col items-center justify-center">
            <div className="text-5xl mb-2">🎁</div>
            <p className="text-sm text-center text-gray-400">Reward!</p>
          </div>
        );
      } else {
        return (
          <div className="flex flex-col items-center justify-center">
            <div className="text-5xl mb-2 fish-swim">🐟</div>
            <p className="text-sm text-center text-gray-400">Just a fish</p>
          </div>
        );
      }
    }
    
    return null;
  };

  // Function to make the button move away from cursor
  const moveButton = (e: MouseEvent) => {
    if (!prizeButtonRef.current) return;
    
    const button = prizeButtonRef.current;
    const buttonRect = button.getBoundingClientRect();
    
    // Calculate center point of button
    const buttonCenterX = buttonRect.left + buttonRect.width / 2;
    const buttonCenterY = buttonRect.top + buttonRect.height / 2;
    
    // Calculate distance between cursor and button center
    const distanceX = e.clientX - buttonCenterX;
    const distanceY = e.clientY - buttonCenterY;
    
    // Define "danger zone" - how close cursor needs to be to move the button
    const dangerZone = 200;
    
    // Calculate distance between cursor and button center
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    
    // If cursor is within the danger zone
    if (distance < dangerZone) {
      // Calculate movement direction (opposite of cursor)
      const moveX = distanceX > 0 ? -80 : 90;
      const moveY = distanceY > 0 ? -80 : 90;
      
      // Apply the movement
      button.style.transform = `translate(${moveX}px, ${moveY}px)`;
      button.style.transition = 'transform 0.2s ease-out';
    } else {
      // Reset position when cursor is far enough
      button.style.transform = 'translate(0, 0)';
    }
  };

  // Add mouse move listener for the prize button movement
  useEffect(() => {
    if (result === 'win') {
      window.addEventListener('mousemove', moveButton);
    }
    
    return () => {
      window.removeEventListener('mousemove', moveButton);
    };
  }, [result]);

  return (
    <div className="py-16 bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold mb-3">I see... you don't just click random buttons on the internet.</h2>
          <p className="text-lg mb-8 text-gray-400">Alright then, let's play a little game. <br />🎲 Pick a door. Behind one is a reward. Behind the other 2, just toy fish. Pick wisely.</p>
        </div>

        {/* Always use grid-cols-3 for doors, even on mobile */}
        <div className="grid grid-cols-3 gap-2 md:gap-6 max-w-3xl mx-auto mb-10">
          {[0, 1, 2].map((doorIndex) => (
            <div
              key={doorIndex}
              className="aspect-[1/1.5] cursor-pointer relative"
              onClick={() => {
                if (doorIndex !== revealedDoor && gameState !== 'final' && !doorsOpen[doorIndex]) {
                  handleDoorClick(doorIndex);
                }
              }}
            >
              <div className="backDoor h-full w-full bg-[#FFECEB] rounded-lg relative shadow-inner border-4 border-primary">
                <div 
                  className={`door absolute inset-0 bg-primary rounded-lg transition-transform duration-500 transform origin-left ${doorsOpen[doorIndex] ? 'door-open' : ''} ${selectedDoor === doorIndex && !doorsOpen[doorIndex] ? 'ring-4 ring-accent' : ''}`}
                >
                  <div className="door-knob absolute w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#FFEBA6] right-2 md:right-4 top-1/2 transform -translate-y-1/2 shadow-md"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-bold text-white text-sm md:text-2xl lg:text-4xl">Door {doorIndex + 1}</span>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  {renderDoorContent(doorIndex)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {gameState === 'revealed' && (
          <div className="text-center mb-10">
            <p className="text-xl mb-4 text-gray-400">I've opened one of the losing doors. Would you like to stick with Door {selectedDoor! + 1} or switch?</p>
            
            <div className="flex flex-col md:flex-row justify-center gap-4">
              <Button 
                className="bg-primary text-white hover:bg-primary/90"
                onClick={() => handleDoorClick(selectedDoor!)}
              >
                Stick with Door {selectedDoor! + 1}
              </Button>
              
              {[0, 1, 2].filter(i => i !== selectedDoor && i !== revealedDoor).map(i => (
                <Button 
                  key={i}
                  className="bg-accent text-white hover:bg-accent/90"
                  onClick={() => handleDoorClick(i)}
                >
                  Switch to Door {i + 1}
                </Button>
              ))}
            </div>
          </div>
        )}

        {gameState === 'final' && (
          <div className="text-center">
            <div className={`text-2xl font-bold mb-4 ${result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
              {result === 'win' ? (
                <p>🎉 Jackpot! You've unlocked 25% off if you hire me right now.</p>
              ) : (
                <p>🐟 Another fish! Either you're unlucky, or a secret fish collector.</p>
              )}
            </div>
            
            <div className="mb-6">
              <p className="text-gray-400">You {isSwitched ? 'switched' : 'stayed with'} your original choice.</p>
              <p className="text-sm text-gray-500 mt-2">
                Fun fact: In the Monty Hall problem, switching gives you a 2/3 chance of winning!
              </p>
            </div>

            <div className={`flex ${isMobile ? 'flex-col' : 'justify-center'} gap-4`}>
              <Button 
                className="bg-primary text-white hover:bg-primary/90"
                onClick={resetGame}
              >
                Play Again
              </Button>
              
              {result === 'win' && (
                <a 
                  ref={prizeButtonRef}
                  href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="elusive-button px-6 py-2 bg-green-700 text-white rounded hover:bg-green-600 inline-flex items-center justify-center"
                >
                  Claim Your Prize
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoorGame;
