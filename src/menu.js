class MenuScene extends Phaser.Scene {
    constructor() {
      super({ key: 'MenuScene' });
    }
  
    create() {
      // Title
      this.titleText = this.add.text(this.game.config.width / 2, 100, "THE DAY OF SAGITTARIUS III", {
        fontSize: '48px',
        color: '#ffffff'
      }).setOrigin(0.5);
  
      // Start button
      this.startButton = this.add.text(this.game.config.width / 2, 300, "Start", {
        fontSize: '32px',
        color: '#00ff00'
      })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.scene.start('LevelSelectScene');
        });
  
      // Tutorial button (placeholder)
      this.tutorialButton = this.add.text(this.game.config.width / 2, 400, "Tutorial", {
        fontSize: '32px',
        color: '#00ff00'
      })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          alert("Tutorial is not implemented yet!");
        });
    }
  }
  