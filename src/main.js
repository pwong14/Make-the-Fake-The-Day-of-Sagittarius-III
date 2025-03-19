/*
 * Major Phaser Components Used in This Project:
 *
 * 1. Arcade Physics System:
 *    - Handles collision detection, movement physics, and ensures that game objects (e.g., ships)
 *      interact in a realistic way using colliders and body configurations.
 *
 * 2. Cameras:
 *    - Multiple cameras are used, including the main game camera, a UI camera (to separate HUD elements),
 *      and a minimap camera to provide an overview of the game world.
 *
 * 3. Text Objects:
 *    - Utilized for displaying game titles, instructions, status updates, and other HUD elements.
 *
 * 4. Tween Manager:
 *    - Responsible for creating smooth animations for various effects, such as bullet trajectories,
 *      explosions, and portrait transitions.
 *
 * 5. Timers:
 *    - Implemented with time events to schedule recurring actions like enemy AI updates and combat checks.
 */

class Main {
  constructor() {
    this.gameConfig = {
      type: Phaser.AUTO,
      width: 1280,
      height: 720,
      backgroundColor: '#000000',
      scene: [
        MenuScene,
        TutorialScene,
        PlayScene,
        EndScene
      ],
      physics: {
        default: 'arcade',
        arcade: {
          debug: false
        }
      }
    };

    this.game = new Phaser.Game(this.gameConfig);
  }
}

window.onload = () => {
  new Main();
};
