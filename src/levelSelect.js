class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create() {
    this.add.text(this.game.config.width / 2, 50, "Select Level", {
      fontSize: '40px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const levels = ["Level 01", "Level 02", "Level 03", "Level 04", "Level 05"];
    const centerX = this.game.config.width / 2;
    const centerY = this.game.config.height / 2;
    const spacing = 150;

    // Create the 5 level buttons horizontally
    for (let i = 0; i < levels.length; i++) {
      let levelText = this.add.text(centerX + (i - 2) * spacing, centerY, levels[i], {
        fontSize: '32px',
        color: '#00ff00'
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        // Directly start the PlayScene (no pre-game setup)
        this.scene.start('PlayScene', { level: i + 1 });
      });
    }

    // Back button
    this.backButton = this.add.text(this.game.config.width / 2, this.game.config.height - 100, "Back", {
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
