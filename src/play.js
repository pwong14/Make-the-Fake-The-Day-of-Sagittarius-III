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
    const headerHeight = 30; // Height for the window header

    // Set the physics world bounds.
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    // --- Create Cameras ---
    // Main camera for the battlefield.
    this.mainCamera = this.cameras.main;
    this.mainCamera.setBounds(0, 0, mapWidth, mapHeight);
    this.mainCamera.setZoom(1.5);

    // UI camera for fixed UI elements.
    this.uiCamera = this.cameras.add(0, 0, this.game.config.width, this.game.config.height);
    this.uiCamera.setScroll(0, 0);

    // Minimap camera for the battlefield.
    // The "LOCATION" window’s content area starts at y = 370 + headerHeight (i.e. 400) with size 320×320.
    this.minimapCamera = this.cameras.add(960, 400, 320, 320);
    this.minimapCamera.setBounds(0, 0, mapWidth, mapHeight);
    // To display the full map in a 320×320 viewport:
    this.minimapCamera.setZoom(320 / mapWidth);

    // --- Create Containers ---
    this.gameObjectsContainer = this.add.container(0, 0);
    this.uiContainer = this.add.container(0, 0);

    // Main and minimap cameras ignore the UI container.
    this.mainCamera.ignore(this.uiContainer);
    this.minimapCamera.ignore(this.uiContainer);
    // UI camera ignores game objects.
    this.uiCamera.ignore(this.gameObjectsContainer);

    // --- Draw the Grid Background for Main Map ---
    let gridGraphics = this.add.graphics();
    // Set background color for the main map to 0E121C.
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
    // Four windows:
    // 1. MAIN MAP: (0,0,960×720) -- live game world (0x0E121C already visible)
    // 2. STATUS: (960,0,320×150) -- static UI, fill with 0x192743
    // 3. CONDITION: (960,150,320×220) -- static UI, fill with 0x192743
    // 4. LOCATION (Minimap): (960,370,320×350) -- live minimap view (0x0E121C already visible)
    this.drawWindowFrame(0, 0, 960, 720, "MAIN MAP", 0x0E121C);
    this.drawWindowFrame(960, 0, 320, 150, "STATUS", 0x192743);
    this.drawWindowFrame(960, 150, 320, 220, "CONDITION", 0x192743);
    this.drawWindowFrame(960, 370, 320, 350, "LOCATION", 0x0E121C);

    // --- Input Handling ---
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

    // --- Formation Definitions ---
    const formationOffsets = [
      { x: -100, y: -100 },
      { x: 100,  y: -100 },
      { x: -100, y: 100 },
      { x: 100,  y: 100 },
      { x: 0,    y: 0 }
    ];
    const friendlyCenter = { x: 1500, y: mapHeight - 200 };
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
        speed: 50,
        defense: 40,
        offense: 30,
        isPlayer: true,
        alive: true,
        targetX: sprite.x,
        targetY: sprite.y,
        highlight: null,
        waypoint: null,
        waypointLine: null,
        currentTarget: null
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
        targetY: sprite.y,
        currentTarget: null
      };
      this.enemyGroups.push(dataObj);
    }

    // --- Set Up Physics Colliders ---
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

    // --- Bullet Tracers Collection & Combat Timers ---
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

    // --- UI Elements for STATUS & CONDITION Windows ---
    // STATUS window (content area starts at y = 0 + headerHeight = 30)
    this.selectedInfoText = this.add.text(960 + 10, 30 + 10, "NO FLEET SELECTED", {
      fontSize: '16px',
      color: '#ffffff'
    });
    this.uiContainer.add(this.selectedInfoText);

    // CONDITION window (content area: y = 150 + headerHeight = 180)
    this.conditionLines = [];
    for (let i = 0; i < 5; i++) {
      let line = this.add.text(960 + 10, 180 + 10 + i * 20, "", {
        fontSize: '16px',
        color: '#ffffff'
      });
      this.conditionLines.push(line);
      this.uiContainer.add(line);
    }

    // --- Minimap Overlay (to show main camera viewport within the minimap) ---
    this.overlayContainer = this.add.container(0, 0);
    this.mainCamera.ignore(this.overlayContainer);
    this.uiCamera.ignore(this.overlayContainer);
    this.minimapCamera.ignore(this.overlayContainer);
    this.minimapOverlay = this.add.graphics();
    this.overlayContainer.add(this.minimapOverlay);
    this.overlayContainer.setDepth(1000);

    this.updateConditionUI();
  }

  // Helper: Draw a window frame with a thicker header that holds the label.
  // For windows that display a live camera view ("MAIN MAP" and "LOCATION"),
  // we skip filling the content area so the underlying camera output remains visible.
  // For the others, fill the content area with the given bgColor.
  drawWindowFrame(x, y, width, height, label, bgColor) {
    const headerHeight = 30;
    // Only fill background for "STATUS" and "CONDITION"
    if (label === "STATUS" || label === "CONDITION") {
      let bg = this.add.graphics();
      bg.fillStyle(bgColor, 1);
      bg.fillRect(x, y + headerHeight, width, height - headerHeight);
      this.uiContainer.add(bg);
    }
    // Draw the border and header using the new border color 0x9FA8C6.
    let frame = this.add.graphics();
    frame.lineStyle(2, 0x9FA8C6, 1);
    frame.strokeRect(x, y, width, height);
    frame.fillStyle(0x9FA8C6, 1);
    frame.fillRect(x, y, width, headerHeight);
    // Place the label text with color 0x0E121C.
    let labelText = this.add.text(x + width / 2, y + headerHeight / 2, label, { fontSize: '20px', color: '#0E121C' });
    labelText.setOrigin(0.5);
    this.uiContainer.add(frame);
    this.uiContainer.add(labelText);
  }

  // Create a triangle (ship) with a label.
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
    container.body.setBounce(0.4);
    return container;
  }

  // Handle left-click: select a friendly group or issue a move command.
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
      this.playerGroups.forEach(g => {
        if (g.highlight) { g.highlight.destroy(); g.highlight = null; }
      });
      this.selectedGroup = clickedGroup;
      clickedGroup.highlight = this.add.graphics();
      clickedGroup.highlight.lineStyle(3, 0xffff00, 1);
      clickedGroup.highlight.strokeCircle(0, 0, 30);
      clickedGroup.sprite.add(clickedGroup.highlight);
      this.updateSelectedInfo();
    } else {
      if (this.selectedGroup) {
        this.moveGroupTo(this.selectedGroup, worldPoint.x, worldPoint.y);
      }
    }
  }

  // Command a group to move; also place a waypoint marker and connecting line.
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

  // Unselect the currently selected group.
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

  // Enemy AI: each enemy group moves toward its nearest friendly target.
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

  // Check combat range and deal damage.
  checkCombat() {
    this.playerGroups.forEach(player => {
      if (!player.alive) return;
      if (player.currentTarget && player.currentTarget.alive) {
        let dist = Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, player.currentTarget.sprite.x, player.currentTarget.sprite.y);
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
        let dist = Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, enemy.sprite.x, enemy.sprite.y);
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

    this.enemyGroups.forEach(enemy => {
      if (!enemy.alive) return;
      if (enemy.currentTarget && enemy.currentTarget.alive) {
        let dist = Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, enemy.currentTarget.sprite.x, enemy.currentTarget.sprite.y);
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
        let dist = Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, player.sprite.x, player.sprite.y);
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

  // Basic damage calculation.
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

  // Check if one side has been wiped out.
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

    // 2) Update the minimap overlay to show the main camera's viewport.
    if (this.minimapOverlay) {
      this.minimapOverlay.clear();
      this.minimapOverlay.lineStyle(2, 0xff0000, 1);
      let vwX = this.mainCamera.scrollX;
      let vwY = this.mainCamera.scrollY;
      let vwW = this.mainCamera.width / this.mainCamera.zoom;
      let vwH = this.mainCamera.height / this.mainCamera.zoom;
      let scale = this.minimapCamera.zoom;
      // Use the "LOCATION" window content origin (960, 400).
      let mmX = 960 + vwX * scale;
      let mmY = 400 + vwY * scale;
      let mmW = vwW * scale;
      let mmH = vwH * scale;
      this.minimapOverlay.strokeRect(mmX, mmY, mmW, mmH);
    }

    // 3) Update waypoint lines for player groups.
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

    // 4) Update animated bullet tracers.
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
  }

  // Draw a dashed line between two points on the provided graphics object.
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

  // Create an animated bullet tracer (dashed line) from attacker to defender.
  createBulletTracer(attacker, defender) {
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
}
