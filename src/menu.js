class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload() {
    // Load the battle theme so it can be played immediately
    this.load.audio('battleTheme', 'assets/battleTheme.mp3');
  }

  create() {
    // Immediately start playing the battle theme (loop if you want continuous music)
    // e.g. { loop: true, volume: 0.1 } for infinite loop at 10% volume
    this.bgm = this.sound.add('battleTheme', { loop: true, volume: 0.1 });
    this.bgm.play();

    const { width, height } = this.sys.game.config;

    // 1) Dark background
    const bgGraphics = this.add.graphics();
    bgGraphics.fillStyle(0x000000, 1);
    bgGraphics.fillRect(0, 0, width, height);

    // 2) Random starfield
    const starCount = 200;
    for (let i = 0; i < starCount; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const alpha = Phaser.Math.FloatBetween(0.3, 1);
      const size = Phaser.Math.Between(1, 3);

      bgGraphics.fillStyle(0xffffff, alpha);
      bgGraphics.fillPoint(x, y, size);
    }

    // 3) Title text
    this.titleText = this.add.text(width / 2, 100, "THE DAY OF\nSAGITTARIUS III", {
      fontFamily: 'Georgia, serif',
      fontSize: '48px',
      color: '#ffffff',
      stroke: '#00ff00',    
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5);

    // Helper to create a rectangular button with hover
    const createButton = (label, x, y, callback) => {
      const buttonWidth = 180;
      const buttonHeight = 50;

      // Button background
      const buttonBG = this.add.graphics();
      buttonBG.fillStyle(0x004400, 1);
      buttonBG.fillRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);

      // Button text
      const buttonText = this.add.text(x, y, label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        color: '#ffffff'
      }).setOrigin(0.5);

      // Interactive area
      buttonBG.setInteractive(
        new Phaser.Geom.Rectangle(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight),
        Phaser.Geom.Rectangle.Contains
      );

      // Click => callback
      buttonBG.on('pointerdown', callback);

      // Hover effects
      buttonBG.on('pointerover', () => {
        buttonBG.clear();
        buttonBG.fillStyle(0x008800, 1);
        buttonBG.fillRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);
      });
      buttonBG.on('pointerout', () => {
        buttonBG.clear();
        buttonBG.fillStyle(0x004400, 1);
        buttonBG.fillRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);
      });
    };

    // "Start" button => go to PlayScene
    createButton("Start", width / 2, 300, () => {
      this.scene.start('PlayScene');
    });

    // "Tutorial" (not implemented)
    createButton("Tutorial", width / 2, 400, () => {
      alert("Tutorial is not implemented yet!");
    });

    // Footer text
    this.add.text(width / 2, height - 30,
      "(C)2006 Kadokawa Shoten / Nagaru Tanigawa / SOS団",
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
  }
}
