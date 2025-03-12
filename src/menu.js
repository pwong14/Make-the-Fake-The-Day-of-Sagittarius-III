class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.sys.game.config;

    // 1) Draw a dark background
    const bgGraphics = this.add.graphics();
    bgGraphics.fillStyle(0x000000, 1);
    bgGraphics.fillRect(0, 0, width, height);

    // 2) Generate random stars for a starfield effect
    const starCount = 200;
    for (let i = 0; i < starCount; i++) {
      // Random positions
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);

      // Random alpha and star size
      const alpha = Phaser.Math.FloatBetween(0.3, 1);
      const size = Phaser.Math.Between(1, 3);

      bgGraphics.fillStyle(0xffffff, alpha);
      bgGraphics.fillPoint(x, y, size);
    }

    // 3) Title text (large, centered, stylized)
    //    - Using white fill + a colored stroke to give a glow/outline look
    this.titleText = this.add.text(width / 2, 100, "THE DAY OF\nSAGITTARIUS III", {
      fontFamily: 'Georgia, serif',
      fontSize: '48px',
      color: '#ffffff',
      stroke: '#00ff00',    // greenish stroke
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5);

    // 4) Helper function to create a rectangular button with hover effects
    const createButton = (label, x, y, callback) => {
      // Button dimensions
      const buttonWidth = 180;
      const buttonHeight = 50;

      // Draw the button background as a Phaser Graphics object
      const buttonBG = this.add.graphics();
      buttonBG.fillStyle(0x004400, 1); // dark green
      buttonBG.fillRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);

      // Button text on top of the background
      const buttonText = this.add.text(x, y, label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        color: '#ffffff'
      }).setOrigin(0.5);

      // Make the rectangle area interactive
      buttonBG.setInteractive(
        new Phaser.Geom.Rectangle(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight),
        Phaser.Geom.Rectangle.Contains
      );

      // On click, run callback
      buttonBG.on('pointerdown', callback);

      // Hover effects: lighten/darken the background
      buttonBG.on('pointerover', () => {
        buttonBG.clear();
        buttonBG.fillStyle(0x008800, 1); // lighter green on hover
        buttonBG.fillRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);
      });
      buttonBG.on('pointerout', () => {
        buttonBG.clear();
        buttonBG.fillStyle(0x004400, 1);
        buttonBG.fillRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);
      });
    };

    // 5) "Start" button
    createButton("Start", width / 2, 300, () => {
      this.scene.start('LevelSelectScene');
    });

    // 6) "Tutorial" button
    createButton("Tutorial", width / 2, 400, () => {
      alert("Tutorial is not implemented yet!");
    });

    // 7) Small copyright text at bottom
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
