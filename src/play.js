class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data) {
    this.selectedLevel = data.level || 1;
  }

  create() {
    // Define map dimensions.
    const mapWidth = 3000;
    const mapHeight = 3000;

    // Set the physics world bounds to match the map.
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    // --- Create Cameras ---
    // Main camera for the battlefield.
    this.mainCamera = this.cameras.main;
    this.mainCamera.setBounds(0, 0, mapWidth, mapHeight);
    this.mainCamera.setZoom(1.5);

    // UI camera (fixed) for the right panel.
    this.uiCamera = this.cameras.add(0, 0, this.game.config.width, this.game.config.height);
    this.uiCamera.setScroll(0, 0);

    // Minimap camera for the battlefield.
    this.minimapCamera = this.cameras.add(980, 400, 300, 300);
    this.minimapCamera.setBounds(0, 0, mapWidth, mapHeight);
    // With a 3000×3000 map, zoom=0.1 shows the entire map.
    this.minimapCamera.setZoom(0.1);

    // --- Create Containers ---
    this.gameObjectsContainer = this.add.container(0, 0);
    this.uiContainer = this.add.container(0, 0);

    // Main and minimap cameras ignore the UI container.
    this.mainCamera.ignore(this.uiContainer);
    this.minimapCamera.ignore(this.uiContainer);
    // UI camera ignores game objects.
    this.uiCamera.ignore(this.gameObjectsContainer);

    // --- Draw Grid Background ---
    let gridGraphics = this.add.graphics();
    gridGraphics.fillStyle(0x000000, 1);
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

    // --- Camera Panning (right-click) ---
    this.draggingCamera = false;
    this.input.mouse.disableContextMenu();
    this.input.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown()) {
        this.draggingCamera = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
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

    // --- Formation Definitions ---
    // Formation offsets for a 2x2 grid with center.
    // Using 100px spacing for clear separation.
    const formationOffsets = [
      { x: -100, y: -100 }, // top left
      { x: 100,  y: -100 }, // top right
      { x: -100, y: 100 },  // bottom left
      { x: 100,  y: 100 },  // bottom right
      { x: 0,    y: 0 }     // center
    ];

    // Friendly formation center (near bottom of map)
    const friendlyCenter = { x: 1500, y: mapHeight - 200 };
    // Enemy formation center (near top of map)
    const enemyCenter = { x: 1500, y: 200 };

    // --- Create Friendly Groups ---
    this.playerGroups = [];
    this.playerGroupData = [];
    for (let i = 0; i < formationOffsets.length; i++) {
      let pos = {
        x: friendlyCenter.x + formationOffsets[i].x,
        y: friendlyCenter.y + formationOffsets[i].y
      };
      let sprite = this.createTriangle(pos.x, pos.y, 0x00ff00, (i + 1).toString().padStart(2, '0'));
      this.gameObjectsContainer.add(sprite);
      let dataObj = {
        sprite: sprite,
        name: (i + 1).toString().padStart(2, '0'),
        hp: 15000,
        maxHp: 15000,
        speed: 50, // speed in pixels/sec
        defense: 40,
        offense: 30,
        isPlayer: true,
        alive: true,
        targetX: sprite.x,
        targetY: sprite.y,
        highlight: null
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
      let sprite = this.createTriangle(pos.x, pos.y, 0xff0000, (i + 1).toString().padStart(2, '0'));
      this.gameObjectsContainer.add(sprite);
      let dataObj = {
        sprite: sprite,
        name: (i + 1).toString().padStart(2, '0'),
        hp: 15000,
        maxHp: 15000,
        speed: 50,
        defense: 40,
        offense: 30,
        isPlayer: false,
        alive: true,
        targetX: sprite.x,
        targetY: sprite.y
      };
      this.enemyGroups.push(dataObj);
    }

    // --- Physics Colliders for Collision Prevention ---
    this.allShipSprites = [];
    this.playerGroups.forEach(g => this.allShipSprites.push(g.sprite));
    this.enemyGroups.forEach(g => this.allShipSprites.push(g.sprite));
    for (let i = 0; i < this.allShipSprites.length; i++) {
      for (let j = i + 1; j < this.allShipSprites.length; j++) {
        this.physics.add.collider(this.allShipSprites[i], this.allShipSprites[j]);
      }
    }

    // --- Center Main Camera on Friendly Formation ---
    this.mainCamera.centerOn(friendlyCenter.x, friendlyCenter.y);

    // --- Combat and AI Timers ---
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

    // --- UI Elements in UI Container ---
    // Draw main play area border (left side)
    let mainAreaBorder = this.add.graphics();
    mainAreaBorder.lineStyle(2, 0xffffff, 1);
    mainAreaBorder.strokeRect(0, 0, 960, 720);
    this.uiContainer.add(mainAreaBorder);

    // Draw UI panel on right side.
    let uiBG = this.add.graphics();
    uiBG.lineStyle(2, 0xffffff, 1);
    uiBG.fillStyle(0x2f2f2f, 1);
    uiBG.fillRect(960, 0, 320, 720);
    uiBG.strokeRect(960, 0, 320, 720);
    uiBG.beginPath();
    uiBG.moveTo(960, 180);
    uiBG.lineTo(1280, 180);
    uiBG.moveTo(960, 400);
    uiBG.lineTo(1280, 400);
    uiBG.strokePath();
    this.uiContainer.add(uiBG);

    // STATUS text
    this.statusText = this.add.text(970, 10, "STATUS", {
      fontSize: '24px',
      color: '#ffffff'
    });
    this.uiContainer.add(this.statusText);

    this.selectedInfoText = this.add.text(970, 40, "NO FLEET SELECTED", {
      fontSize: '16px',
      color: '#ffffff'
    });
    this.uiContainer.add(this.selectedInfoText);

    this.conditionText = this.add.text(970, 190, "CONDITION OF YOUR SIDE", {
      fontSize: '20px',
      color: '#ffffff'
    });
    this.uiContainer.add(this.conditionText);

    this.conditionLines = [];
    for (let i = 0; i < 5; i++) {
      let line = this.add.text(970, 220 + i * 20, "", {
        fontSize: '16px',
        color: '#ffffff'
      });
      this.conditionLines.push(line);
      this.uiContainer.add(line);
    }

    // --- Minimap Area ---
    let minimapBG = this.add.graphics();
    minimapBG.lineStyle(2, 0xffffff, 1);
    minimapBG.fillStyle(0x000000, 1);
    minimapBG.fillRect(980, 400, 300, 300);
    minimapBG.strokeRect(980, 400, 300, 300);
    this.uiContainer.add(minimapBG);
    // Set minimap background depth low.
    minimapBG.setDepth(0);

    // Minimap overlay for main camera viewport.
    this.minimapOverlay = this.add.graphics();
    this.uiContainer.add(this.minimapOverlay);
    this.uiContainer.bringToTop(this.minimapOverlay);
    // Set overlay depth very high so it appears above the minimap.
    this.minimapOverlay.setDepth(100);

    this.updateConditionUI();
  }

  // Create a triangle container with label.
  createTriangle(x, y, color, label) {
    const container = this.add.container(x, y);
    const graphics = this.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.beginPath();
    graphics.moveTo(0, -20);
    graphics.lineTo(20, 20);
    graphics.lineTo(-20, 20);
    graphics.closePath();
    graphics.fillPath();
    container.add(graphics);

    const text = this.add.text(0, 0, label, { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
    container.add(text);

    this.physics.add.existing(container);
    container.body.setCollideWorldBounds(true);
    container.setSize(40, 40);
    container.body.setOffset(-20, -20);
    container.setInteractive(new Phaser.Geom.Rectangle(-20, -20, 40, 40), Phaser.Geom.Rectangle.Contains);
    // Add a slight bounce.
    container.body.setBounce(0.4);
    return container;
  }

  // When clicking, if a friendly group is clicked, select it and highlight it.
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
      // Clear any previous highlights.
      this.playerGroups.forEach(g => {
        if (g.highlight) { g.highlight.destroy(); g.highlight = null; }
      });
      this.selectedGroup = clickedGroup;
      // Add a highlight (a yellow circle) around the selected group.
      clickedGroup.highlight = this.add.graphics();
      clickedGroup.highlight.lineStyle(3, 0xffff00, 1);
      clickedGroup.highlight.strokeCircle(0, 0, 30);
      // Attach the highlight to the group so it moves with it.
      clickedGroup.sprite.add(clickedGroup.highlight);
      this.updateSelectedInfo();
    } else {
      if (this.selectedGroup) {
        this.moveGroupTo(this.selectedGroup, worldPoint.x, worldPoint.y);
      }
    }
  }

  /**
   * Move a group using physics velocity so that collisions work.
   * Updates the group's target position and uses physics.moveTo.
   */
  moveGroupTo(group, x, y) {
    group.targetX = x;
    group.targetY = y;
    this.physics.moveTo(group.sprite, x, y, group.speed);
  }

  /**
   * Enemy AI: for each enemy group, pick the nearest friendly group and move toward it.
   */
  updateEnemyAI() {
    for (let enemy of this.enemyGroups) {
      if (!enemy.alive) continue;
      let nearest = null;
      let nearestDist = Infinity;
      for (let player of this.playerGroups) {
        if (!player.alive) continue;
        let dist = Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, player.sprite.x, player.sprite.y);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = player;
        }
      }
      if (nearest) {
        // Only update movement if enemy is not too close to prevent overlap.
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

  /**
   * Check if groups are in firing range and deal damage.
   */
  checkCombat() {
    for (let player of this.playerGroups) {
      if (!player.alive) continue;
      for (let enemy of this.enemyGroups) {
        if (!enemy.alive) continue;
        let dist = Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, enemy.sprite.x, enemy.sprite.y);
        if (dist < 200) {
          this.dealDamage(player, enemy);
          this.dealDamage(enemy, player);
        }
      }
    }
  }

  /**
   * Basic damage calculation.
   */
  dealDamage(attacker, defender) {
    let damage = attacker.offense;
    damage = Math.max(0, damage - defender.defense * 0.1);
    defender.hp -= damage;
    if (defender.hp <= 0) {
      defender.hp = 0;
      defender.alive = false;
      defender.sprite.destroy();
      this.checkEndCondition();
    }
    if (defender.isPlayer) {
      this.updateConditionUI();
      if (this.selectedGroup === defender) {
        this.updateSelectedInfo();
      }
    }
  }

  /**
   * Check if one side has been wiped out.
   */
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
    // 1) Stop ships when they reach their target.
    [...this.playerGroups, ...this.enemyGroups].forEach(group => {
      if (!group.alive) return;
      const dx = group.targetX - group.sprite.x;
      const dy = group.targetY - group.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 4) {
        group.sprite.body.setVelocity(0, 0);
      }
    });

    // 2) Update the minimap overlay to show main camera's viewport.
    if (this.minimapOverlay) {
      this.minimapOverlay.clear();
      this.minimapOverlay.lineStyle(2, 0xff0000, 1);
      // Main camera's viewport (world coordinates)
      let vwX = this.mainCamera.scrollX;
      let vwY = this.mainCamera.scrollY;
      let vwW = this.mainCamera.width / this.mainCamera.zoom;
      let vwH = this.mainCamera.height / this.mainCamera.zoom;
      // Convert to minimap coordinates (minimap camera positioned at 980,400)
      let scale = this.minimapCamera.zoom; // 0.1
      let mmX = 980 + vwX * scale;
      let mmY = 400 + vwY * scale;
      let mmW = vwW * scale;
      let mmH = vwH * scale;
      this.minimapOverlay.strokeRect(mmX, mmY, mmW, mmH);
    }
  }
}
