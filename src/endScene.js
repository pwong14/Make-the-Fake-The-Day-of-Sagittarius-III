class EndScene extends Phaser.Scene {
    constructor() {
      super({ key: 'EndScene' });
    }
  
    init(data) {
      this.result = data.result; // 'win' or 'lose'
      this.level = data.level || 1;
    }
  
    create() {
      if (this.result === 'win') {
        this.add.text(this.game.config.width / 2, 200, "YOU WIN!", {
          fontSize: '48px',
          color: '#ffffff'
        }).setOrigin(0.5);
  
        // If there's a next level, show a "Next Level" button
        if (this.level < 5) {
          this.nextLevelButton = this.add.text(this.game.config.width / 2, 300, "Next Level", {
            fontSize: '32px',
            color: '#00ff00'
          })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
              // Move on to the next level’s pre-game
              this.scene.start('PreGameScene', { level: this.level + 1 });
            });
        }
  
        // Main Menu button
        this.menuButton = this.add.text(this.game.config.width / 2, 400, "Main Menu", {
          fontSize: '32px',
          color: '#00ff00'
        })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => {
            this.scene.start('MenuScene');
          });
      } else {
        // Lose scenario
        this.add.text(this.game.config.width / 2, 200, "YOU LOSE!", {
          fontSize: '48px',
          color: '#ffffff'
        }).setOrigin(0.5);
  
        this.menuButton = this.add.text(this.game.config.width / 2, 300, "Main Menu", {
          fontSize: '32px',
          color: '#00ff00'
        })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => {
            this.scene.start('MenuScene');
          });
      }
    }
  }
  