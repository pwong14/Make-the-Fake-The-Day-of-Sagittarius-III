class Main {
    constructor() {
      this.gameConfig = {
        type: Phaser.AUTO,
        width: 1280,
        height: 720,
        backgroundColor: '#000000',
        scene: [
          MenuScene,
          LevelSelectScene,
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
  
  // Initialize our main class once the window loads
  window.onload = () => {
    new Main();
  };
  