class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload() {
    // Load the battle theme so it can be played
    this.load.audio('battleTheme', 'assets/battleTheme.mp3');
  }

  create() {
    // Start music (loop, ~10% volume)
    this.bgm = this.sound.add('battleTheme', { loop: true, volume: 0.1 });
    this.bgm.play();

    const { width, height } = this.sys.game.config;

    // 1) Background: black + subtle gradient + starfield
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 1);
    bg.fillRect(0, 0, width, height);

    const steps = height;
    for (let i = 0; i < steps; i++) {
      let t = i / steps;
      const r1 = 27, g1 = 28, b1 = 58;
      const r2 = 11, g2 = 58, b2 = 58;
      const r = Phaser.Math.Linear(r1, r2, t);
      const g = Phaser.Math.Linear(g1, g2, t);
      const b = Phaser.Math.Linear(b1, b2, t);
      let color = ((r|0) << 16) | ((g|0) << 8) | (b|0);
      bg.fillStyle(color, 1);
      bg.fillRect(0, i, width, 1);
    }

    const starCount = 250;
    for (let i = 0; i < starCount; i++) {
      let sx = Phaser.Math.Between(0, width);
      let sy = Phaser.Math.Between(0, height);
      let alpha = Phaser.Math.FloatBetween(0.3, 1);
      let size = Phaser.Math.Between(1, 2);
      bg.fillStyle(0xffffff, alpha);
      bg.fillPoint(sx, sy, size);
    }

    // 2) Main Title Layout
    const sagText = this.add.text(width / 2, 150, "SAGITTARIUS", {
      fontFamily: 'Georgia, serif',
      fontSize: '72px',
      color: '#ffffff',
      stroke: '#79ff79',
      strokeThickness: 4
    }).setOrigin(0.5, 0);

    // Position "THE DAY OF" near the top-left of SAGITTARIUS
    const sagLeft = sagText.x - sagText.displayWidth / 2;
    const sagTop  = sagText.y;
    this.add.text(sagLeft - 10, sagTop - 30, "THE DAY OF", {
      fontFamily: 'Georgia, serif',
      fontSize: '32px',
      color: '#e0e0e0',
      stroke: '#79ff79',
      strokeThickness: 2
    });

    // "III" bigger, below SAGITTARIUS
    const iiiTextY = sagTop + sagText.displayHeight + 10;
    this.add.text(width / 2, iiiTextY, "III", {
      fontFamily: 'Georgia, serif',
      fontSize: '64px',
      color: '#ffaa33',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5, 0);

    // 3) Create a single smooth gradient button
    const createGradientButton = (label, x, y, callback) => {
      const buttonWidth = 180;
      const buttonHeight = 50;

      // Draw the button with a vertical gradient (top->bottom)
      let btnGfx = this.add.graphics();
      btnGfx.fillGradientStyle(
        0x2b3b55,  // top-left color
        0x2b3b55,  // top-right color (same for a vertical gradient)
        0x4f6a8c,  // bottom-left color
        0x4f6a8c,  // bottom-right color
        1
      );
      btnGfx.fillRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);

      // Button text
      let txt = this.add.text(x, y, label, {
        fontFamily: 'Georgia, serif',
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#79ff79',
        strokeThickness: 2
      }).setOrigin(0.5);

      // Make the Graphics interactive
      btnGfx.setInteractive(
        new Phaser.Geom.Rectangle(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight),
        Phaser.Geom.Rectangle.Contains
      );

      btnGfx.on('pointerdown', callback);

      // Hover effects: lighten the gradient
      btnGfx.on('pointerover', () => {
        btnGfx.clear();
        btnGfx.fillGradientStyle(
          0x4f6a8c,  // top-left
          0x4f6a8c,  // top-right
          0x6f8aaa,  // bottom-left
          0x6f8aaa,  // bottom-right
          1
        );
        btnGfx.fillRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);
      });

      btnGfx.on('pointerout', () => {
        btnGfx.clear();
        btnGfx.fillGradientStyle(
          0x2b3b55, // top-left
          0x2b3b55, // top-right
          0x4f6a8c, // bottom-left
          0x4f6a8c, // bottom-right
          1
        );
        btnGfx.fillRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);
      });
    };

    // 4) Buttons, with a smooth gradient
    createGradientButton("Start", width / 2, 360, () => {
      this.scene.start('PlayScene');
    });

    createGradientButton("Tutorial", width / 2, 420, () => {
      this.scene.start('TutorialScene');
    });

    // 5) Footer
    this.add.text(width / 2, height - 30,
      "(C)2006 Kadokawa Shoten / Nagaru Tanigawa / SOS団",
      {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
  }
}
