class PlayScene extends Phaser.Scene {
    constructor() {
      super({ key: 'PlayScene' });
    }
  
    init(data) {
      this.selectedLevel = data.level || 1;
    }
  
    create() {
      // --- Create Cameras ---
      // 1) Main camera for the battlefield
      this.mainCamera = this.cameras.main;
      this.mainCamera.setBounds(0, 0, 2000, 2000);
      this.mainCamera.setZoom(1);
  
      // 2) UI camera (fixed) for the right side + top overlays
      this.uiCamera = this.cameras.add(0, 0, this.game.config.width, this.game.config.height);
      this.uiCamera.setScroll(0, 0); // stays fixed
  
      // 3) Minimap camera for the battlefield, ignoring UI
      this.minimapCamera = this.cameras.add(980, 400, 300, 300).setZoom(0.15);
      this.minimapCamera.setBounds(0, 0, 2000, 2000);
  
      // --- Create Containers to separate game objects & UI ---
      this.gameObjectsContainer = this.add.container(0, 0);
      this.uiContainer = this.add.container(0, 0);
  
      // The main and minimap cameras ignore the UI container
      this.mainCamera.ignore(this.uiContainer);
      this.minimapCamera.ignore(this.uiContainer);
  
      // The UI camera ignores the game objects container
      this.uiCamera.ignore(this.gameObjectsContainer);
  
      // --- Draw a grid background in the gameObjectsContainer ---
      let gridGraphics = this.add.graphics();
      // Fill entire area black
      gridGraphics.fillStyle(0x000000, 1);
      gridGraphics.fillRect(0, 0, 2000, 2000);
  
      // Draw grid lines every 50px in a slightly lighter color
      gridGraphics.lineStyle(1, 0x444444, 1);
      for (let x = 0; x <= 2000; x += 50) {
        gridGraphics.beginPath();
        gridGraphics.moveTo(x, 0);
        gridGraphics.lineTo(x, 2000);
        gridGraphics.strokePath();
      }
      for (let y = 0; y <= 2000; y += 50) {
        gridGraphics.beginPath();
        gridGraphics.moveTo(0, y);
        gridGraphics.lineTo(2000, y);
        gridGraphics.strokePath();
      }
      this.gameObjectsContainer.add(gridGraphics);
  
      // Set up input for camera panning
      this.draggingCamera = false;
      this.input.mouse.disableContextMenu(); // no right-click menu
  
      this.input.on('pointerdown', (pointer) => {
        // Right-click => start dragging camera
        if (pointer.rightButtonDown()) {
          this.draggingCamera = true;
          this.dragStartX = pointer.x;
          this.dragStartY = pointer.y;
        } 
        // Left-click => selection or movement
        else if (pointer.leftButtonDown()) {
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
  
      // Create player's 5 groups (bottom cluster)
      this.playerGroups = [];
      this.playerGroupData = [];
  
      let clusterPositions = [
        { x: 900,  y: 1800 },
        { x: 1100, y: 1800 },
        { x: 900,  y: 1600 },
        { x: 1100, y: 1600 },
        { x: 1000, y: 1700 }
      ];
      for (let i = 0; i < 5; i++) {
        let sprite = this.createTriangle(
          clusterPositions[i].x, 
          clusterPositions[i].y, 
          0x00ff00, 
          (i+1).toString().padStart(2, '0')
        );
        // Add to the main game container
        this.gameObjectsContainer.add(sprite);
  
        let dataObj = {
          sprite: sprite,
          name: (i+1).toString().padStart(2, '0'),
          hp: 15000,
          maxHp: 15000,
          speed: 30,
          defense: 40,
          offense: 30,
          isPlayer: true,
          alive: true
        };
        this.playerGroups.push(dataObj);
        this.playerGroupData.push(dataObj);
      }
  
      // Create enemy's 5 groups at top cluster
      this.enemyGroups = [];
      let enemyClusterPositions = [
        { x: 900,  y: 200 },
        { x: 1100, y: 200 },
        { x: 900,  y: 400 },
        { x: 1100, y: 400 },
        { x: 1000, y: 300 }
      ];
      for (let i = 0; i < 5; i++) {
        let sprite = this.createTriangle(
          enemyClusterPositions[i].x, 
          enemyClusterPositions[i].y, 
          0xff0000, 
          (i+1).toString().padStart(2, '0')
        );
        // Add to the main game container
        this.gameObjectsContainer.add(sprite);
  
        let dataObj = {
          sprite: sprite,
          name: (i+1).toString().padStart(2, '0'),
          hp: 15000,
          maxHp: 15000,
          speed: 30,
          defense: 40,
          offense: 30,
          isPlayer: false,
          alive: true
        };
        this.enemyGroups.push(dataObj);
      }
  
      // No group selected initially
      this.selectedGroup = null;
  
      // Periodic check for combat
      this.time.addEvent({
        delay: 500,
        callback: () => { this.checkCombat(); },
        loop: true
      });
  
      // Periodic update for enemy AI
      this.time.addEvent({
        delay: 1000,
        callback: () => { this.updateEnemyAI(); },
        loop: true
      });
  
      // --- UI Elements (added to uiContainer so they don’t move) ---
      // 1) Draw a border around the main play area (0..960 x 0..720)
      let mainAreaBorder = this.add.graphics();
      mainAreaBorder.lineStyle(2, 0xffffff, 1);
      mainAreaBorder.strokeRect(0, 0, 960, 720);
      this.uiContainer.add(mainAreaBorder);
  
      // 2) Draw the background for the UI (960..1280 x 0..720)
      let uiBG = this.add.graphics();
      uiBG.lineStyle(2, 0xffffff, 1);
      uiBG.fillStyle(0x2f2f2f, 1); 
      uiBG.fillRect(960, 0, 320, 720);
      uiBG.strokeRect(960, 0, 320, 720);
      // Subdivide the UI horizontally:
      //  - top:    0..180   (STATUS info)
      //  - middle: 180..400 (CONDITION info)
      //  - bottom: 400..720 (Minimap)
      uiBG.beginPath();
      uiBG.moveTo(960, 180);
      uiBG.lineTo(1280, 180);
      uiBG.moveTo(960, 400);
      uiBG.lineTo(1280, 400);
      uiBG.strokePath();
      this.uiContainer.add(uiBG);
  
      // 3) Add the text fields
      // STATUS label
      this.statusText = this.add.text(970, 10, "STATUS", {
        fontSize: '24px',
        color: '#ffffff'
      });
      this.uiContainer.add(this.statusText);
  
      // Selected info text
      this.selectedInfoText = this.add.text(970, 40, "NO FLEET SELECTED", {
        fontSize: '16px',
        color: '#ffffff'
      });
      this.uiContainer.add(this.selectedInfoText);
  
      // CONDITION label
      this.conditionText = this.add.text(970, 190, "CONDITION OF YOUR SIDE", {
        fontSize: '20px',
        color: '#ffffff'
      });
      this.uiContainer.add(this.conditionText);
  
      // Condition lines for each of the 5 groups
      this.conditionLines = [];
      for (let i = 0; i < 5; i++) {
        let line = this.add.text(970, 220 + i*20, "", {
          fontSize: '16px',
          color: '#ffffff'
        });
        this.conditionLines.push(line);
        this.uiContainer.add(line);
      }
  
      // 4) Minimap area (980..1280 x 400..700)
      let minimapBG = this.add.graphics();
      minimapBG.lineStyle(2, 0xffffff, 1);
      minimapBG.fillStyle(0x000000, 1);
      minimapBG.fillRect(980, 400, 300, 300);
      minimapBG.strokeRect(980, 400, 300, 300);
      this.uiContainer.add(minimapBG);
  
      // Update the condition UI once
      this.updateConditionUI();
    }
  
    createTriangle(x, y, color, label) {
      // Make a container for the shape + text
      let container = this.add.container(x, y);
  
      // Triangle shape
      let graphics = this.add.graphics();
      graphics.fillStyle(color, 1);
      graphics.beginPath();
      graphics.moveTo(0, -20);
      graphics.lineTo(20, 20);
      graphics.lineTo(-20, 20);
      graphics.closePath();
      graphics.fillPath();
      container.add(graphics);
  
      // Label text
      let text = this.add.text(0, 0, label, { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
      container.add(text);
  
      // Enable physics
      this.physics.add.existing(container);
      container.body.setCollideWorldBounds(true);
      container.setSize(40, 40);
      container.body.setOffset(-20, -20);
  
      // Make it interactive
      container.setInteractive(
        new Phaser.Geom.Rectangle(-20, -20, 40, 40),
        Phaser.Geom.Rectangle.Contains
      );
  
      return container;
    }
  
    handleLeftClick(pointer) {
      let worldPoint = pointer.positionToCamera(this.mainCamera);
      let clickedGroup = null;
  
      // Check if we clicked on any player's group
      for (let grp of this.playerGroups) {
        if (!grp.alive) continue;
        let bounds = grp.sprite.getBounds();
        if (Phaser.Geom.Rectangle.Contains(bounds, worldPoint.x, worldPoint.y)) {
          clickedGroup = grp;
          break;
        }
      }
  
      if (clickedGroup) {
        // Select that group
        this.selectedGroup = clickedGroup;
        this.updateSelectedInfo();
      } else {
        // If we have a selected group, move it
        if (this.selectedGroup) {
          this.moveGroupTo(this.selectedGroup, worldPoint.x, worldPoint.y);
        }
      }
    }
  
    moveGroupTo(group, x, y) {
      let distance = Phaser.Math.Distance.Between(group.sprite.x, group.sprite.y, x, y);
      let duration = (distance / group.speed) * 1000; // speed in px/s
      this.tweens.add({
        targets: group.sprite,
        x: x,
        y: y,
        duration: duration
      });
    }
  
    updateEnemyAI() {
      // Each enemy group moves toward the nearest player group
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
          this.moveGroupTo(enemy, nearest.sprite.x, nearest.sprite.y);
        }
      }
    }
  
    checkCombat() {
      // Check each player group vs each enemy group
      for (let player of this.playerGroups) {
        if (!player.alive) continue;
        for (let enemy of this.enemyGroups) {
          if (!enemy.alive) continue;
          let dist = Phaser.Math.Distance.Between(
            player.sprite.x, player.sprite.y,
            enemy.sprite.x, enemy.sprite.y
          );
          // If within range, they damage each other
          if (dist < 200) {
            this.dealDamage(player, enemy);
            this.dealDamage(enemy, player);
          }
        }
      }
    }
  
    dealDamage(attacker, defender) {
      // Simple damage formula
      let damage = attacker.offense;
      damage = Math.max(0, damage - defender.defense * 0.1);
  
      defender.hp -= damage;
      if (defender.hp <= 0) {
        defender.hp = 0;
        defender.alive = false;
        defender.sprite.destroy();
        this.checkEndCondition();
      }
  
      // Update UI if it's a player group
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
        // You lose
        this.scene.start('EndScene', { result: 'lose', level: this.selectedLevel });
      } else if (enemyAliveCount === 0) {
        // You win
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
  }
  