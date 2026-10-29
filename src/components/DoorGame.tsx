
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftRight, Fish, Gift, PartyPopper, X } from 'lucide-react';
import { useSounds } from '@/utils/useSounds';

type DoorContent = 'reward' | 'fish';
type GameState = 'initial' | 'firstPick' | 'revealed' | 'final';

const DoorGame = () => {
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
      } else {
        setResult('lose');
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
    const isReward = doors[doorIndex] === 'reward';
    const isOpen = doorsOpen[doorIndex];

    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 transition-all duration-500 delay-200 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
        aria-hidden={!isOpen}
      >
        <div
          className={`flex items-center justify-center w-12 h-12 md:w-20 md:h-20 rounded-full border-2 border-foreground ${isReward ? 'bg-secondary' : 'bg-sky'} ${isOpen && isReward ? 'jump' : ''}`}
        >
          {isReward ? (
            <Gift className="w-6 h-6 md:w-10 md:h-10" strokeWidth={2.25} />
          ) : (
            <Fish className={`w-6 h-6 md:w-10 md:h-10 ${isOpen ? 'fish-swim' : ''}`} strokeWidth={2.25} />
          )}
        </div>
        <p className="font-heading font-semibold text-xs md:text-base text-center">
          {isReward ? 'Reward!' : 'Just a fish'}
        </p>
      </div>
    );
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
    <section className="section section-alt border-y-2 border-foreground">
      <div className="container mx-auto px-4">
        <div className="section-header">
          <h2 className="section-title">I see... you don't just click random buttons on the internet.</h2>
          <p className="lead">Alright then, let's play. Pick a door. Behind one is a reward. Behind the other 2, just toy fish. Pick wisely.</p>
        </div>

        {gameState !== 'final' && (
          <p className="text-center mb-4 font-mono font-medium text-xs md:text-sm uppercase tracking-wider text-muted-foreground">
            {gameState === 'revealed' ? 'Step 2 of 2 · Stick or switch?' : 'Step 1 of 2 · Pick a door'}
          </p>
        )}

        {/* Always use grid-cols-3 for doors, even on mobile */}
        <div className="grid grid-cols-3 gap-3 md:gap-8 max-w-3xl mx-auto mb-10 pt-10">
          {[0, 1, 2].map((doorIndex) => {
            const isOpen = doorsOpen[doorIndex];
            const isPicked = selectedDoor === doorIndex;
            const canPick = gameState !== 'final' && !isOpen;
            const isWinner = gameState === 'final' && doors[doorIndex] === 'reward';
            const isDecision = gameState === 'revealed';
            const isRevealedFish = isDecision && revealedDoor === doorIndex;
            const isSwitchOption = isDecision && !isPicked && !isRevealedFish;

            return (
              <button
                key={doorIndex}
                type="button"
                disabled={!canPick}
                onClick={() => handleDoorClick(doorIndex)}
                aria-label={`Door ${doorIndex + 1}${isPicked ? ', your pick' : ''}${isOpen ? (doors[doorIndex] === 'reward' ? ', reward' : ', fish') : ''}`}
                className={`group relative aspect-[1/1.5] rounded-2xl text-left [perspective:1200px] transition-opacity duration-500 ${isRevealedFish ? 'opacity-50' : ''} focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-sunken disabled:cursor-default`}
              >
                {(isPicked || isRevealedFish || isSwitchOption) && (
                  <span className="absolute -top-9 md:-top-10 left-1/2 -translate-x-1/2 z-20">
                    <span
                      className={`inline-flex items-center gap-1 whitespace-nowrap px-2 md:px-3 py-0.5 rounded-full border-2 border-foreground font-heading font-semibold text-xs md:text-sm shadow-pop-sm ${isPicked ? 'bg-secondary' : isRevealedFish ? 'bg-surface' : 'bg-accent animate-bounce'}`}
                    >
                      {isPicked && 'Your pick'}
                      {isRevealedFish && (<><X className="w-3.5 h-3.5" strokeWidth={3} /> Fish!</>)}
                      {isSwitchOption && 'Switch?'}
                    </span>
                  </span>
                )}

                {/* Frame and the room behind the door */}
                <div
                  className={`absolute inset-0 rounded-2xl border-2 border-foreground shadow-pop flex items-center justify-center pl-[20%] transition-colors duration-500 ${isWinner ? 'bg-accent' : 'bg-surface'}`}
                >
                  {renderDoorContent(doorIndex)}
                </div>

                {/* The door swings on its left hinge; hovering a closed door cracks it open */}
                <div
                  className={`absolute inset-0 z-10 origin-left rounded-2xl border-2 border-foreground bg-primary transition-transform duration-700 ease-[cubic-bezier(.3,1.4,.5,1)] [transform-style:preserve-3d] ${isOpen ? '[transform:rotateY(78deg)] brightness-90' : canPick ? 'group-hover:[transform:rotateY(18deg)]' : ''} ${isPicked && !isOpen ? 'ring-4 ring-secondary ring-offset-2 ring-offset-sunken' : ''} ${isSwitchOption ? 'ring-4 ring-accent ring-offset-2 ring-offset-sunken' : ''}`}
                >
                  <div className="absolute inset-x-[14%] top-[8%] h-[34%] rounded-lg border-2 border-foreground/25" />
                  <div className="absolute inset-x-[14%] bottom-[8%] h-[38%] rounded-lg border-2 border-foreground/25" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="flex items-center justify-center w-9 h-9 md:w-16 md:h-16 rounded-full bg-surface border-2 border-foreground font-heading font-bold text-lg md:text-3xl">
                      {doorIndex + 1}
                    </span>
                  </div>
                  <div className="absolute right-[10%] top-1/2 -translate-y-1/2 w-2.5 h-2.5 md:w-4 md:h-4 rounded-full bg-secondary border-2 border-foreground" />
                </div>
              </button>
            );
          })}
        </div>

        {gameState === 'revealed' && (
          <div className="max-w-4xl mx-auto pt-8 border-t-2 border-foreground grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center text-left animate-fade-in">
            <div className="flex items-center gap-5">
              <div className="shrink-0 flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-foreground shadow-pop-sm bg-sky">
                <Fish className="w-10 h-10 md:w-12 md:h-12 fish-swim" strokeWidth={2.25} />
              </div>
              <p className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.95]">
                One fish down!
              </p>
            </div>

            <div>
              <p className="text-lg text-foreground mb-6">
                I opened Door {revealedDoor! + 1} for you. It's a fish. The reward is behind Door {selectedDoor! + 1} or Door {[0, 1, 2].find(i => i !== selectedDoor && i !== revealedDoor)! + 1}. Last chance to change your mind.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  className="btn-ghost"
                  onClick={() => handleDoorClick(selectedDoor!)}
                >
                  Stick with Door {selectedDoor! + 1}
                </button>

                {[0, 1, 2].filter(i => i !== selectedDoor && i !== revealedDoor).map(i => (
                  <button
                    key={i}
                    className="btn-primary"
                    onClick={() => handleDoorClick(i)}
                  >
                    <ArrowLeftRight className="w-5 h-5" strokeWidth={2.25} /> Switch to Door {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {gameState === 'final' && (
          <div className="max-w-4xl mx-auto pt-8 border-t-2 border-foreground grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center text-left animate-fade-in">
            <div className="flex items-center gap-5">
              <div
                className={`shrink-0 flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-foreground shadow-pop-sm ${result === 'win' ? 'bg-secondary jump' : 'bg-sky'}`}
              >
                {result === 'win' ? (
                  <PartyPopper className="w-10 h-10 md:w-12 md:h-12" strokeWidth={2.25} />
                ) : (
                  <Fish className="w-10 h-10 md:w-12 md:h-12 fish-swim" strokeWidth={2.25} />
                )}
              </div>
              <p className={`font-heading text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.95] ${result === 'win' ? 'text-primary' : 'text-foreground'}`}>
                {result === 'win' ? 'Jackpot!' : 'Another fish!'}
              </p>
            </div>

            <div>
              <p className="text-lg text-foreground mb-2">
                {result === 'win'
                  ? "You've unlocked 25% off if you hire me right now."
                  : "Either you're unlucky, or a secret fish collector."}
                {' '}You {isSwitched ? 'switched' : 'stayed with'} your original choice.
              </p>
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-6">
                Fun fact: switching wins 2/3 of the time (Monty Hall)
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  className="btn-ghost"
                  onClick={resetGame}
                >
                  Play again
                </button>

                {result === 'win' && (
                  <a
                    ref={prizeButtonRef}
                    href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="elusive-button btn-primary cursor-not-allowed"
                  >
                    Claim your prize
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default DoorGame;
