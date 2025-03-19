class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayScene' });
  }

  preload() {
    // Load sounds
    this.load.audio('explosion', 'assets/explosion.mp3');
    this.load.audio('spaceAttack', 'assets/spaceAttack.mp3');

    // Load portrait images
    this.load.image('asahina', 'assets/asahina.png');
    this.load.image('haruhi', 'assets/haruhi.png');
    this.load.image('nagato', 'assets/nagato.png');
    this.load.image('koizumi', 'assets/koizumi.png');
    this.load.image('kyon', 'assets/kyon.png');
  }

  init(data) {
    this.selectedLevel = data.level || 1;
  }

  create() {
    // Track active portraits
    this.activePortraits = [];

    // Map dimensions
    const mapWidth = 3000;
    const mapHeight = 3000;

    // Arcade physics bounds
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    // Disable fixed-step so timeScale changes actually speed/slow physics
    this.physics.world.useFixedStep = false;

    // Cameras
    this.mainCamera = this.cameras.main;
    this.mainCamera.setBounds(0, 0, mapWidth, mapHeight);
    this.mainCamera.setZoom(1.5);

    this.uiCamera = this.cameras.add(0, 0, this.game.config.width, this.game.config.height);
    this.uiCamera.setScroll(0, 0);

    this.minimapCamera = this.cameras.add(960, 400, 320, 320);
    this.minimapCamera.setBounds(0, 0, mapWidth, mapHeight);
    this.minimapCamera.setZoom(320 / mapWidth);

    // Containers
    this.gameObjectsContainer = this.add.container(0, 0);
    this.uiContainer = this.add.container(0, 0);

    // Exclude UI from main & minimap cameras
    this.mainCamera.ignore(this.uiContainer);
    this.minimapCamera.ignore(this.uiContainer);

    // Exclude game objects from the UI camera
    this.uiCamera.ignore(this.gameObjectsContainer);

    // A small helper to highlight exactly one button, unhighlight the rest
    this.highlightButton = (btn) => {
      // Reset them all to black
      this.speedButtons.oneX.setStyle({ backgroundColor: '#000000' });
      this.speedButtons.twoX.setStyle({ backgroundColor: '#000000' });
      this.speedButtons.threeX.setStyle({ backgroundColor: '#000000' });

      // Now highlight the chosen one
      if (btn) {
        btn.setStyle({ backgroundColor: '#444444' });
      }
    };

    // --- Create Speed Buttons Only ---
    // Move them down to avoid overlapping window titles
    const buttonY = 50;
    this.speedButtons = {};

    // 1x speed
    this.speedButtons.oneX = this.add.text(10, buttonY, '1x', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#000000'
    })
      .setPadding(5)
      .setInteractive();

    this.speedButtons.oneX.on('pointerdown', () => {
      // Ships move normal speed
      this.physics.world.timeScale = 1;
      // Keep UI updates normal
      this.time.timeScale = 1;
      this.tweens.timeScale = 1;
      // Highlight this button
      this.highlightButton(this.speedButtons.oneX);
    });

    // 2x speed (in your code, you use 0.6 as "faster")
    this.speedButtons.twoX = this.add.text(70, buttonY, '2x', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#000000'
    })
      .setPadding(5)
      .setInteractive();

    this.speedButtons.twoX.on('pointerdown', () => {
      // "2x" => 0.6 in your code
      this.physics.world.timeScale = 0.6;
      this.time.timeScale = 1;
      this.tweens.timeScale = 1;
      this.highlightButton(this.speedButtons.twoX);
    });

    // 3x speed (you use 0.3 to be "faster")
    this.speedButtons.threeX = this.add.text(130, buttonY, '3x', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#000000'
    })
      .setPadding(5)
      .setInteractive();

    this.speedButtons.threeX.on('pointerdown', () => {
      // "3x" => 0.3 in your code
      this.physics.world.timeScale = 0.3;
      this.time.timeScale = 1;
      this.tweens.timeScale = 1;
      this.highlightButton(this.speedButtons.threeX);
    });

    // Add them to the UI
    this.uiContainer.add([
      this.speedButtons.oneX,
      this.speedButtons.twoX,
      this.speedButtons.threeX
    ]);

    // --- Draw the Grid Background ---
    let gridGraphics = this.add.graphics();
    gridGraphics.fillStyle(0x0E121C, 1);
    gridGraphics.fillRect(0, 0, mapWidth, mapHeight);
    gridGraphics.lineStyle(1, 0x444444, 1);
    for (let x = 0; x <= mapWidth; x += 50) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(x, 0);
      gridGraphics.lineTo(x, mapHeight);
      gridGraphics.strokePath();
    }
    for (let y = 0; y <= mapHeight; y += 50) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(0, y);
      gridGraphics.lineTo(mapWidth, y);
      gridGraphics.strokePath();
    }
    this.gameObjectsContainer.add(gridGraphics);

    // --- Draw Window Frames ---
    this.drawWindowFrame(0, 0, 960, 720, "Map (x 1)", 0x0E121C);
    this.drawWindowFrame(960, 0, 320, 150, "STATUS", 0x192743);
    this.drawWindowFrame(960, 150, 320, 220, "CONDITION OF YOUR SIDE", 0x192743);
    this.drawWindowFrame(960, 370, 320, 350, "LOCATION", 0x0E121C);

    // Input Handling
    this.draggingCamera = false;
    this.input.mouse.disableContextMenu();

    this.input.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown()) {
        if (this.selectedGroup) {
          this.unselectGroup();
        } else {
          this.draggingCamera = true;
          this.dragStartX = pointer.x;
          this.dragStartY = pointer.y;
        }
      } else if (pointer.leftButtonDown()) {
        this.handleLeftClick(pointer);
      }
    });
    this.input.on('pointerup', (pointer) => {
      if (pointer.rightButtonReleased()) {
        this.draggingCamera = false;
      }
    });
    this.input.on('pointermove', (pointer) => {
      if (this.draggingCamera) {
        let dx = pointer.x - this.dragStartX;
        let dy = pointer.y - this.dragStartY;
        this.mainCamera.scrollX -= dx;
        this.mainCamera.scrollY -= dy;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });

    // Formation Definitions
    const formationOffsets = [
      { x: -100, y: -100 },
      { x: 100, y: -100 },
      { x: -100, y: 100 },
      { x: 100, y: 100 },
      { x: 0, y: 0 }
    ];
    const friendlyCenter = { x: 1500, y: mapHeight - 200 };
    const enemyCenter = { x: 1500, y: 200 };

    // Portrait keys
    const portraitKeys = ['asahina', 'haruhi', 'nagato', 'koizumi', 'kyon'];

    // --- Create Friendly Groups ---
    this.playerGroups = [];
    this.playerGroupData = [];
    for (let i = 0; i < formationOffsets.length; i++) {
      let pos = {
        x: friendlyCenter.x + formationOffsets[i].x,
        y: friendlyCenter.y + formationOffsets[i].y
      };
      // Friendly => color 0x00FF00
      let sprite = this.createTriangle(pos.x, pos.y, 0x00ff00, "はるか");
      this.gameObjectsContainer.add(sprite);

      let dataObj = {
        sprite: sprite,
        name: (i + 1).toString().padStart(2, '0'),
        hp: 15000,
        maxHp: 15000,
        speed: 50,
        defense: 40,
        offense: 120,
        isPlayer: true,
        alive: true,
        targetX: sprite.x,
        targetY: sprite.y,
        highlight: null,
        waypoint: null,
        waypointLine: null,
        currentTarget: null,
        portraitKey: portraitKeys[i]
      };

      this.playerGroups.push(dataObj);
      this.playerGroupData.push(dataObj);
    }

    // --- Create Enemy Groups ---
    this.enemyGroups = [];
    for (let i = 0; i < formationOffsets.length; i++) {
      let pos = {
        x: enemyCenter.x + formationOffsets[i].x,
        y: enemyCenter.y + formationOffsets[i].y
      };
      // Enemy => color 0xFF0000
      let sprite = this.createTriangle(pos.x, pos.y, 0xff0000, "はるか");
      this.gameObjectsContainer.add(sprite);

      let dataObj = {
        sprite: sprite,
        name: (i + 1).toString().padStart(2, '0'),
        hp: 15000,
        maxHp: 15000,
        speed: 50,
        defense: 40,
        offense: 120,
        isPlayer: false,
        alive: true,
        targetX: sprite.x,
        targetY: sprite.y,
        currentTarget: null
      };

      this.enemyGroups.push(dataObj);
    }

    // Physics colliders
    this.allShipSprites = [];
    this.playerGroups.forEach(g => this.allShipSprites.push(g.sprite));
    this.enemyGroups.forEach(g => this.allShipSprites.push(g.sprite));
    for (let i = 0; i < this.allShipSprites.length; i++) {
      for (let j = i + 1; j < this.allShipSprites.length; j++) {
        this.physics.add.collider(this.allShipSprites[i], this.allShipSprites[j]);
      }
    }

    // Center camera on friendly group
    this.mainCamera.centerOn(friendlyCenter.x, friendlyCenter.y);

    // Bullet Tracers + Timers
    this.bulletTracers = [];
    this.time.addEvent({
      delay: 500,
      callback: () => this.checkCombat(),
      loop: true
    });
    this.time.addEvent({
      delay: 1000,
      callback: () => this.updateEnemyAI(),
      loop: true
    });

    // UI (STATUS & CONDITION windows)
    this.selectedInfoText = this.add.text(960 + 10, 30 + 10, "NO FLEET SELECTED", {
      fontSize: '16px',
      color: '#ffffff'
    });
    this.uiContainer.add(this.selectedInfoText);

    this.conditionLines = [];
    for (let i = 0; i < 5; i++) {
      let line = this.add.text(960 + 10, 180 + 10 + i * 20, "", {
        fontSize: '16px',
        color: '#ffffff'
      });
      this.conditionLines.push(line);
      this.uiContainer.add(line);
    }

    // Overlay container for minimap viewport rectangle
    this.overlayContainer = this.add.container(0, 0);
    this.mainCamera.ignore(this.overlayContainer);
    this.uiCamera.ignore(this.overlayContainer);
    this.minimapCamera.ignore(this.overlayContainer);
    this.minimapOverlay = this.add.graphics();
    this.overlayContainer.add(this.minimapOverlay);
    this.overlayContainer.setDepth(1000);

    // Update UI for condition lines
    this.updateConditionUI();
  }

  // Helper to draw a window frame
  drawWindowFrame(x, y, width, height, label, bgColor) {
    const headerHeight = 20;
    // Fill background for certain labels
    if (label === "STATUS" || label === "CONDITION OF YOUR SIDE") {
      let bg = this.add.graphics();
      bg.fillStyle(bgColor, 1);
      bg.fillRect(x, y + headerHeight, width, height - headerHeight);
      this.uiContainer.add(bg);
    }
    let frame = this.add.graphics();
    frame.lineStyle(2, 0x9FA8C6, 1);
    frame.strokeRect(x, y, width, height);
    frame.fillStyle(0x9FA8C6, 1);
    frame.fillRect(x, y, width, headerHeight);
    let labelText = this.add.text(x + 10, y + headerHeight / 2, label, { 
      fontSize: '14px', 
      color: '#0E121C',
      fontFamily: "Arial Unicode MS",
      align: 'left'
    });
    labelText.setOrigin(0, 0.5);
    this.uiContainer.add(frame);
    this.uiContainer.add(labelText);
  }

  // Creates a triangular "ship"
  createTriangle(x, y, mainColor, label) {
    const color = mainColor;
    const opacity = 0.6;
    const container = this.add.container(x, y);
    const graphics = this.add.graphics();

    const v1 = { x: 0, y: -40 };
    const v2 = { x: 25, y: 20 };
    const v3 = { x: -25, y: 20 };

    graphics.fillStyle(color, opacity);
    graphics.beginPath();
    graphics.moveTo(v1.x, v1.y);
    graphics.lineTo(v2.x, v2.y);
    graphics.lineTo(v3.x, v3.y);
    graphics.closePath();
    graphics.fillPath();

    // Additional small triangles
    const smallTriangleHeight = 10;
    const smallTriangleBaseHalf = 5;
    const center = {
      x: (v1.x + v2.x + v3.x) / 3,
      y: (v1.y + v2.y + v3.y) / 3
    };

    function drawSmallTriangleTop(vertex) {
      const D = { x: 0, y: -1 };
      const origApex = { x: vertex.x + D.x * smallTriangleHeight, y: vertex.y + D.y * smallTriangleHeight };
      const tangent = { x: -D.y, y: D.x };
      const origBaseLeft = { x: vertex.x + tangent.x * smallTriangleBaseHalf, y: vertex.y + tangent.y * smallTriangleBaseHalf };
      const origBaseRight = { x: vertex.x - tangent.x * smallTriangleBaseHalf, y: vertex.y - tangent.y * smallTriangleBaseHalf };
      const centerY = (origApex.y + origBaseLeft.y + origBaseRight.y) / 3;
      const flippedApex = { x: origApex.x, y: 2 * centerY - origApex.y };
      const flippedBaseLeft = { x: origBaseLeft.x, y: 2 * centerY - origBaseLeft.y };
      const flippedBaseRight = { x: origBaseRight.x, y: 2 * centerY - origBaseRight.y };
      graphics.fillStyle(color, opacity);
      graphics.beginPath();
      graphics.moveTo(flippedApex.x, flippedApex.y);
      graphics.lineTo(flippedBaseLeft.x, flippedBaseLeft.y);
      graphics.lineTo(flippedBaseRight.x, flippedBaseRight.y);
      graphics.closePath();
      graphics.fillPath();
    }

    function drawSmallTriangleAtVertex(vertex) {
      const dir = { x: vertex.x - center.x, y: vertex.y - center.y };
      const mag = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
      const D = { x: dir.x / mag, y: dir.y / mag };
      const apex = vertex;
      const baseCenter = { x: vertex.x + D.x * smallTriangleHeight, y: vertex.y + D.y * smallTriangleHeight };
      const tangent = { x: -D.y, y: D.x };
      const baseLeft = { x: baseCenter.x + tangent.x * smallTriangleBaseHalf, y: baseCenter.y + tangent.y * smallTriangleBaseHalf };
      const baseRight = { x: baseCenter.x - tangent.x * smallTriangleBaseHalf, y: baseCenter.y - tangent.y * smallTriangleBaseHalf };
      graphics.fillStyle(color, opacity);
      graphics.beginPath();
      graphics.moveTo(apex.x, apex.y);
      graphics.lineTo(baseLeft.x, baseLeft.y);
      graphics.lineTo(baseRight.x, baseRight.y);
      graphics.closePath();
      graphics.fillPath();
    }

    drawSmallTriangleTop(v1);
    drawSmallTriangleAtVertex(v2);
    drawSmallTriangleAtVertex(v3);

    container.add(graphics);

    // Add label text
    const text = this.add.text(0, 0, label, {
      fontSize: '10px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    container.add(text);

    // If enemy, flip vertically to face up
    if (color === 0xff0000) {
      container.setScale(0.8, -0.8);
      text.scaleY = -1;
      let hpText = this.add.text(0, 30, "15000", {
        fontSize: '10px',
        color: '#ffffff',
        align: 'center'
      });
      hpText.setOrigin(0.5, 1);
      hpText.scaleY = -1;
      container.add(hpText);
      container.hpText = hpText;
    } else {
      // Friendly => face down
      container.setScale(0.8);
    }

    // Physics
    this.physics.add.existing(container);
    container.setSize(50, 50);
    container.body.setCollideWorldBounds(true);
    container.body.setOffset(-25, -25);
    container.setInteractive(new Phaser.Geom.Rectangle(-25, -25, 50, 50), Phaser.Geom.Rectangle.Contains);
    container.body.setBounce(0.4);

    return container;
  }

  // Left-click: select or move
  handleLeftClick(pointer) {
    const worldPoint = pointer.positionToCamera(this.mainCamera);
    let clickedGroup = null;

    for (let grp of this.playerGroups) {
      if (!grp.alive) continue;
      const bounds = grp.sprite.getBounds();
      if (Phaser.Geom.Rectangle.Contains(bounds, worldPoint.x, worldPoint.y)) {
        clickedGroup = grp;
        break;
      }
    }

    if (clickedGroup) {
      // Un-highlight any previously selected
      this.playerGroups.forEach(g => {
        if (g.highlight) {
          g.highlight.destroy();
          g.highlight = null;
        }
      });
      // Select the new group
      this.selectedGroup = clickedGroup;
      clickedGroup.highlight = this.add.graphics();
      clickedGroup.highlight.fillStyle(0x92ABFF, 0.3);
      clickedGroup.highlight.fillCircle(0, 0, 60);
      clickedGroup.sprite.addAt(clickedGroup.highlight, 0);
      this.updateSelectedInfo();
    } else {
      // If we have a selected group, move it
      if (this.selectedGroup) {
        this.moveGroupTo(this.selectedGroup, worldPoint.x, worldPoint.y);
      }
    }
  }

  moveGroupTo(group, x, y) {
    group.targetX = x;
    group.targetY = y;
    this.physics.moveTo(group.sprite, x, y, group.speed);

    if (group.waypoint) {
      group.waypoint.destroy();
      group.waypoint = null;
    }
    if (group.waypointLine) {
      group.waypointLine.destroy();
      group.waypointLine = null;
    }

    group.waypoint = this.add.graphics();
    group.waypoint.fillStyle(0xffff00, 1);
    group.waypoint.fillTriangle(x - 10, y, x + 10, y, x, y + 15);

    group.waypointLine = this.add.graphics();
    group.waypointLine.lineStyle(2, 0xffff00, 1);
    group.waypointLine.beginPath();
    group.waypointLine.moveTo(group.sprite.x, group.sprite.y);
    group.waypointLine.lineTo(x, y);
    group.waypointLine.strokePath();
  }

  // Unselect currently selected group
  unselectGroup() {
    if (this.selectedGroup) {
      if (this.selectedGroup.highlight) {
        this.selectedGroup.highlight.destroy();
        this.selectedGroup.highlight = null;
      }
      if (this.selectedGroup.waypoint) {
        this.selectedGroup.waypoint.destroy();
        this.selectedGroup.waypoint = null;
      }
      if (this.selectedGroup.waypointLine) {
        this.selectedGroup.waypointLine.destroy();
        this.selectedGroup.waypointLine = null;
      }
      this.selectedGroup = null;
      this.updateSelectedInfo();
    }
  }

  // Enemy AI
  updateEnemyAI() {
    for (let enemy of this.enemyGroups) {
      if (!enemy.alive) continue;
      let nearest = null;
      let nearestDist = Infinity;

      for (let player of this.playerGroups) {
        if (!player.alive) continue;
        let dist = Phaser.Math.Distance.Between(
          enemy.sprite.x, enemy.sprite.y,
          player.sprite.x, player.sprite.y
        );
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = player;
        }
      }
      if (nearest) {
        if (nearestDist > 50) {
          enemy.targetX = nearest.sprite.x;
          enemy.targetY = nearest.sprite.y;
          this.physics.moveTo(enemy.sprite, enemy.targetX, enemy.targetY, enemy.speed);
        } else {
          enemy.sprite.body.setVelocity(0, 0);
        }
      }
    }
  }

  // Check combat range and deal damage
  checkCombat() {
    // Player side
    this.playerGroups.forEach(player => {
      if (!player.alive) return;
      if (player.currentTarget && player.currentTarget.alive) {
        let dist = Phaser.Math.Distance.Between(
          player.sprite.x, player.sprite.y,
          player.currentTarget.sprite.x, player.currentTarget.sprite.y
        );
        if (dist < 200) {
          this.dealDamage(player, player.currentTarget);
          this.createBulletTracer(player, player.currentTarget);
          return;
        }
      }
      let closest = null;
      let minDist = Infinity;
      this.enemyGroups.forEach(enemy => {
        if (!enemy.alive) return;
        let dist = Phaser.Math.Distance.Between(
          player.sprite.x, player.sprite.y,
          enemy.sprite.x, enemy.sprite.y
        );
        if (dist < minDist && dist < 200) {
          minDist = dist;
          closest = enemy;
        }
      });
      player.currentTarget = closest;
      if (closest) {
        this.dealDamage(player, closest);
        this.createBulletTracer(player, closest);
      }
    });

    // Enemy side
    this.enemyGroups.forEach(enemy => {
      if (!enemy.alive) return;
      if (enemy.currentTarget && enemy.currentTarget.alive) {
        let dist = Phaser.Math.Distance.Between(
          enemy.sprite.x, enemy.sprite.y,
          enemy.currentTarget.sprite.x, enemy.currentTarget.sprite.y
        );
        if (dist < 200) {
          this.dealDamage(enemy, enemy.currentTarget);
          this.createBulletTracer(enemy, enemy.currentTarget);
          return;
        }
      }
      let closest = null;
      let minDist = Infinity;
      this.playerGroups.forEach(player => {
        if (!player.alive) return;
        let dist = Phaser.Math.Distance.Between(
          enemy.sprite.x, enemy.sprite.y,
          player.sprite.x, player.sprite.y
        );
        if (dist < minDist && dist < 200) {
          minDist = dist;
          closest = player;
        }
      });
      enemy.currentTarget = closest;
      if (closest) {
        this.dealDamage(enemy, closest);
        this.createBulletTracer(enemy, closest);
      }
    });
  }

  // Basic damage logic
  dealDamage(attacker, defender) {
    let damage = attacker.offense;
    damage = Math.max(0, damage - defender.defense * 0.1);
    defender.hp -= damage;

    if (defender.hp <= 0) {
      defender.hp = 0;
      defender.alive = false;
      this.sound.play('explosion');
      if (attacker.isPlayer) {
        this.showPortrait(attacker.portraitKey);
      }
      defender.sprite.destroy();
      this.checkEndCondition();
    }

    // If a player took damage, update condition UI
    if (defender.isPlayer) {
      this.updateConditionUI();
      if (this.selectedGroup === defender) {
        this.updateSelectedInfo();
      }
    }
  }

  checkEndCondition() {
    let playerAliveCount = this.playerGroups.filter(g => g.alive).length;
    let enemyAliveCount = this.enemyGroups.filter(g => g.alive).length;

    if (playerAliveCount === 0) {
      this.scene.start('EndScene', { result: 'lose', level: this.selectedLevel });
    } else if (enemyAliveCount === 0) {
      this.scene.start('EndScene', { result: 'win', level: this.selectedLevel });
    }
  }

  updateSelectedInfo() {
    if (this.selectedGroup) {
      this.selectedInfoText.setText(
        `SHIPS LEFT: ${this.selectedGroup.hp}/${this.selectedGroup.maxHp}\n` +
        `SPEED: ${this.selectedGroup.speed}\n` +
        `DEFENSIVE POWER: ${this.selectedGroup.defense}\n` +
        `OFFENSIVE POWER: ${this.selectedGroup.offense}`
      );
    } else {
      this.selectedInfoText.setText("NO FLEET SELECTED");
    }
  }

  updateConditionUI() {
    for (let i = 0; i < this.playerGroupData.length; i++) {
      let g = this.playerGroupData[i];
      if (g.alive) {
        this.conditionLines[i].setText(`▶ ${g.name}  ${g.hp}/${g.maxHp}`);
      } else {
        this.conditionLines[i].setText(`▶ ${g.name}  0/${g.maxHp}`);
      }
    }
  }

  update() {
    // Stop ships near target
    [...this.playerGroups, ...this.enemyGroups].forEach(group => {
      if (!group.alive) return;
      const dx = group.targetX - group.sprite.x;
      const dy = group.targetY - group.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 4) {
        group.sprite.body.setVelocity(0, 0);
      }
    });

    // Draw camera viewport on minimap
    if (this.minimapOverlay) {
      this.minimapOverlay.clear();
      this.minimapOverlay.lineStyle(2, 0xff0000, 1);

      let vwX = this.mainCamera.scrollX;
      let vwY = this.mainCamera.scrollY;
      let vwW = this.mainCamera.width / this.mainCamera.zoom;
      let vwH = this.mainCamera.height / this.mainCamera.zoom;
      let scale = this.minimapCamera.zoom;

      let mmX = 960 + vwX * scale;
      let mmY = 400 + vwY * scale;
      let mmW = vwW * scale;
      let mmH = vwH * scale;

      this.minimapOverlay.strokeRect(mmX, mmY, mmW, mmH);
    }

    // Update waypoints
    this.playerGroups.forEach(group => {
      if (group.waypoint && group.alive) {
        const dx = group.targetX - group.sprite.x;
        const dy = group.targetY - group.sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 4) {
          group.waypoint.destroy();
          group.waypointLine.destroy();
          group.waypoint = null;
          group.waypointLine = null;
        } else if (group.waypointLine) {
          group.waypointLine.clear();
          group.waypointLine.lineStyle(2, 0xffff00, 1);
          group.waypointLine.beginPath();
          group.waypointLine.moveTo(group.sprite.x, group.sprite.y);
          group.waypointLine.lineTo(group.targetX, group.targetY);
          group.waypointLine.strokePath();
        }
      }
    });

    // Update bullet tracers
    for (let i = this.bulletTracers.length - 1; i >= 0; i--) {
      let tracer = this.bulletTracers[i];
      let elapsed = this.time.now - tracer.startTime;
      if (elapsed > tracer.lifetime) {
        tracer.graphics.destroy();
        this.bulletTracers.splice(i, 1);
      } else {
        tracer.dashOffset += 0.5;
        tracer.graphics.clear();
        tracer.graphics.lineStyle(2, 0xffff00, 1);
        tracer.graphics.beginPath();
        this.drawDashedLine(
          tracer.graphics,
          tracer.attacker.sprite.x, tracer.attacker.sprite.y,
          tracer.defender.sprite.x, tracer.defender.sprite.y,
          10, 5, tracer.dashOffset
        );
        tracer.graphics.strokePath();
      }
    }

    // Update enemy HP text if applicable
    this.enemyGroups.forEach(enemy => {
      if (enemy.alive && enemy.sprite && enemy.sprite.hpText) {
        enemy.sprite.hpText.setText(enemy.hp.toString());
      }
    });
  }

  drawDashedLine(graphics, x1, y1, x2, y2, dashLength, gapLength, offset = 0) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const distance = Phaser.Math.Distance.Between(x1, y1, x2, y2);
    let drawn = -offset;

    while (drawn < distance) {
      let start = Math.max(drawn, 0);
      let end = drawn + dashLength;
      if (end > distance) {
        end = distance;
      }
      if (start < distance) {
        let startX = x1 + Math.cos(angle) * start;
        let startY = y1 + Math.sin(angle) * start;
        let endX = x1 + Math.cos(angle) * end;
        let endY = y1 + Math.sin(angle) * end;
        graphics.moveTo(startX, startY);
        graphics.lineTo(endX, endY);
      }
      drawn += dashLength + gapLength;
    }
  }

  // Each shot -> "spaceAttack" + bullet tracer
  createBulletTracer(attacker, defender) {
    this.sound.play('spaceAttack');
    let tracer = {
      graphics: this.add.graphics(),
      attacker: attacker,
      defender: defender,
      dashOffset: 0,
      lifetime: 500,
      startTime: this.time.now
    };
    this.bulletTracers.push(tracer);
  }

  // Show portrait on main map for 4s
  showPortrait(portraitKey) {
    // Fade out any currently active portraits
    if (this.activePortraits && this.activePortraits.length > 0) {
      this.activePortraits.forEach(portrait => {
        this.tweens.add({
          targets: portrait,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            portrait.destroy();
          }
        });
      });
      this.activePortraits = [];
    }

    const startX = -200;
    const bottomY = this.game.config.height;
    let portrait = this.add.image(startX, bottomY, portraitKey);
    portrait.setScrollFactor(0);
    portrait.setDepth(9999);
    portrait.setScale(0.75);
    portrait.setOrigin(0.5, 1);

    // Exclude from minimap + UI cameras
    this.minimapCamera.ignore(portrait);
    this.uiCamera.ignore(portrait);

    this.activePortraits.push(portrait);

    // Slide in, wait 4s, fade out
    this.tweens.add({
      targets: portrait,
      x: 350,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        this.time.delayedCall(4000, () => {
          this.tweens.add({
            targets: portrait,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
              portrait.destroy();
              const index = this.activePortraits.indexOf(portrait);
              if (index !== -1) {
                this.activePortraits.splice(index, 1);
              }
            }
          });
        });
      }
    });
  }
}
