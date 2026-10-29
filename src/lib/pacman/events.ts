// Window event that launches the Pac-Man easter egg, so any component can
// trigger it without importing the game.
export const PACMAN_START_EVENT = 'pacman:start';

export const startPacman = () => {
  window.dispatchEvent(new CustomEvent(PACMAN_START_EVENT));
};
