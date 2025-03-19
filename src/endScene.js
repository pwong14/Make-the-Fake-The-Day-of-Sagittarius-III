class EndScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EndScene' });
  }

  init(data) {
    this.result = data.result; // 'win' or 'lose'
    this.level = data.level || 1;
  }

  create() {
    const { width, height } = this.sys.game.config;
    
    // Create background (black with subtle gradient and starfield)
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
    
    // End message styling
    let message = (this.result === 'win') ? "YOU WIN!" : "YOU LOSE!";
    this.add.text(width / 2, 150, message, {
      fontFamily: 'Georgia, serif',
      fontSize: '48px',
      color: '#ffffff',
      stroke: (this.result === 'win' ? '#79ff79' : '#ff0000'),
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Helper: create a gradient button (same design as in MenuScene)
    const createGradientButton = (label, x, y, callback) => {
      const buttonWidth = 180;
      const buttonHeight = 50;
      let btnGfx = this.add.graphics();
      btnGfx.fillGradientStyle(
        0x2b3b55, // top-left & top-right
        0x2b3b55,
        0x4f6a8c, // bottom-left & bottom-right
        0x4f6a8c,
        1
      );
      btnGfx.fillRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);
      
      let txt = this.add.text(x, y, label, {
        fontFamily: 'Georgia, serif',
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#79ff79',
        strokeThickness: 2
      }).setOrigin(0.5);
      
      btnGfx.setInteractive(
        new Phaser.Geom.Rectangle(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight),
        Phaser.Geom.Rectangle.Contains
      );
      
      btnGfx.on('pointerdown', callback);
      
      // Hover effects: lighten the gradient
      btnGfx.on('pointerover', () => {
        btnGfx.clear();
        btnGfx.fillGradientStyle(
          0x4f6a8c,
          0x4f6a8c,
          0x6f8aaa,
          0x6f8aaa,
          1
        );
        btnGfx.fillRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);
      });
      
      btnGfx.on('pointerout', () => {
        btnGfx.clear();
        btnGfx.fillGradientStyle(
          0x2b3b55,
          0x2b3b55,
          0x4f6a8c,
          0x4f6a8c,
          1
        );
        btnGfx.fillRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);
      });
    };

    // Add buttons based on win/lose outcome
    if (this.result === 'win') {
      if (this.level < 5) {
        createGradientButton("Next Level", width / 2, 250, () => {
          this.scene.start('PreGameScene', { level: this.level + 1 });
        });
      }
      createGradientButton("Main Menu", width / 2, 320, () => {
        this.scene.start('MenuScene');
      });
    } else {
      createGradientButton("Main Menu", width / 2, 250, () => {
        this.scene.start('MenuScene');
      });
    }
  }
}
