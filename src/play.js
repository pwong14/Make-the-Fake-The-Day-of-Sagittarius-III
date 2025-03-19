class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayScene' });
  }

  preload() {
    // Load sounds
    this.load.audio('explosion', 'assets/explosion.mp3');
    this.load.audio('spaceAttack', 'assets/spaceAttack.mp3');
    this.load.audio('rocket2', 'assets/rocket2.mp3'); // optional

    // Load images
    this.load.image('asahina', 'assets/asahina.png');
    this.load.image('haruhi', 'assets/haruhi.png');
    this.load.image('nagato', 'assets/nagato.png');
    this.load.image('koizumi', 'assets/koizumi.png');
    this.load.image('kyon', 'assets/kyon.png');

    // Load voice audio for each character
    this.load.audio('asahinaVoice', 'assets/asahina.wav');
    this.load.audio('haruhiVoice',  'assets/haruhi.wav');
    this.load.audio('nagatoVoice',  'assets/nagato.wav');
    this.load.audio('koizumiVoice', 'assets/koizumi.wav');
    this.load.audio('kyonVoice',    'assets/kyon.wav');
  }

  init(data) {
    // You mentioned removing level logic, but if you still have "level" references:
    this.selectedLevel = data.level || 1;
  }

  create() {
    // Track active portraits and voice
    this.activePortraits = [];
    this.currentVoiceSound = null;

    // Define map
    const mapWidth = 3000;
    const mapHeight = 3000;
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
    this.physics.world.useFixedStep = false;

    // Cameras
    this.mainCamera = this.cameras.main.setBounds(0, 0, mapWidth, mapHeight).setZoom(1.5);
    this.uiCamera   = this.cameras.add(0, 0, this.game.config.width, this.game.config.height).setScroll(0, 0);
    this.minimapCamera = this.cameras.add(960, 400, 320, 320).setBounds(0, 0, mapWidth, mapHeight).setZoom(320/mapWidth);

    // Containers
    this.gameObjectsContainer = this.add.container(0, 0);
    this.uiContainer = this.add.container(0, 0);

    // Exclude UI from main & minimap
    this.mainCamera.ignore(this.uiContainer);
    this.minimapCamera.ignore(this.uiContainer);
    // Exclude game objects from UI
    this.uiCamera.ignore(this.gameObjectsContainer);

    // Speed Buttons
    const buttonY = 50;
    this.speedButtons = {};
    this.highlightButton = (btn) => {
      this.speedButtons.oneX.setStyle({ backgroundColor: '#000000' });
      this.speedButtons.twoX.setStyle({ backgroundColor: '#000000' });
      this.speedButtons.threeX.setStyle({ backgroundColor: '#000000' });
      if (btn) btn.setStyle({ backgroundColor: '#444444' });
    };

    // 1x speed
    this.speedButtons.oneX = this.add.text(10, buttonY, '1x', {
      fontSize: '20px', color: '#ffffff', backgroundColor: '#000000'
    })
      .setPadding(5).setInteractive()
      .on('pointerdown', () => {
        this.physics.world.timeScale = 1;
        this.time.timeScale = 1;
        this.tweens.timeScale = 1;
        this.highlightButton(this.speedButtons.oneX);
      });

    // 2x speed => 0.6
    this.speedButtons.twoX = this.add.text(70, buttonY, '2x', {
      fontSize: '20px', color: '#ffffff', backgroundColor: '#000000'
    })
      .setPadding(5).setInteractive()
      .on('pointerdown', () => {
        this.physics.world.timeScale = 0.6;
        this.time.timeScale = 1;
        this.tweens.timeScale = 1;
        this.highlightButton(this.speedButtons.twoX);
      });

    // 3x speed => 0.3
    this.speedButtons.threeX = this.add.text(130, buttonY, '3x', {
      fontSize: '20px', color: '#ffffff', backgroundColor: '#000000'
    })
      .setPadding(5).setInteractive()
      .on('pointerdown', () => {
        this.physics.world.timeScale = 0.3;
        this.time.timeScale = 1;
        this.tweens.timeScale = 1;
        this.highlightButton(this.speedButtons.threeX);
      });

    this.uiContainer.add([
      this.speedButtons.oneX,
      this.speedButtons.twoX,
      this.speedButtons.threeX
    ]);

    // Grid Background
    let gridGraphics = this.add.graphics();
    gridGraphics.fillStyle(0x0E121C, 1).fillRect(0, 0, mapWidth, mapHeight);
    gridGraphics.lineStyle(1, 0x444444, 1);
    for (let x = 0; x <= mapWidth; x += 50) {
      gridGraphics.beginPath().moveTo(x, 0).lineTo(x, mapHeight).strokePath();
    }
    for (let y = 0; y <= mapHeight; y += 50) {
      gridGraphics.beginPath().moveTo(0, y).lineTo(mapWidth, y).strokePath();
    }
    this.gameObjectsContainer.add(gridGraphics);

    // Window Frames
    this.drawWindowFrame(0, 0, 960, 720, "Map (x 1)", 0x0E121C);
    this.drawWindowFrame(960, 0, 320, 150, "STATUS", 0x192743);
    this.drawWindowFrame(960, 150, 320, 220, "CONDITION OF YOUR SIDE", 0x192743);
    this.drawWindowFrame(960, 370, 320, 350, "LOCATION", 0x0E121C);

    // Input handling
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

    // Formation
    const formationOffsets = [
      { x: -100, y: -100 },
      { x: 100,  y: -100 },
      { x: -100, y: 100 },
      { x: 100,  y: 100 },
      { x: 0,    y: 0   }
    ];
    const mapHeight2 = mapHeight - 200;
    const friendlyCenter = { x: 1500, y: mapHeight2 };
    const enemyCenter    = { x: 1500, y: 200 };

    // (CHANGED) We'll store ship names as "01","02","03","04","05" for both sides
    // We'll pass them into createTriangle instead of "はるか"

    // --- Create Friendly Groups ---
    this.playerGroups = [];
    this.playerGroupData = [];
    for (let i = 0; i < formationOffsets.length; i++) {
      let pos = {
        x: friendlyCenter.x + formationOffsets[i].x,
        y: friendlyCenter.y + formationOffsets[i].y
      };
      let shipName = (i+1).toString().padStart(2, '0');  // e.g. "01", "02", ...
      let sprite = this.createTriangle(pos.x, pos.y, 0x00ff00, shipName);
      this.gameObjectsContainer.add(sprite);

      let dataObj = {
        sprite: sprite,
        name: shipName, // (CHANGED) store the numeric name
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
        portraitKey: [ 'asahina','haruhi','nagato','koizumi','kyon' ][i] // just an example mapping
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
      let enemyName = (i+1).toString().padStart(2, '0'); // e.g. "01","02", etc
      let sprite = this.createTriangle(pos.x, pos.y, 0xff0000, enemyName); // (CHANGED)
      this.gameObjectsContainer.add(sprite);

      let dataObj = {
        sprite: sprite,
        name: enemyName,
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

    // Colliders
    this.allShipSprites = [];
    this.playerGroups.forEach(g => this.allShipSprites.push(g.sprite));
    this.enemyGroups.forEach(g => this.allShipSprites.push(g.sprite));
    for (let i = 0; i < this.allShipSprites.length; i++) {
      for (let j = i+1; j < this.allShipSprites.length; j++) {
        this.physics.add.collider(this.allShipSprites[i], this.allShipSprites[j]);
      }
    }

    this.mainCamera.centerOn(friendlyCenter.x, friendlyCenter.y);

    // Timers
    this.time.addEvent({ delay:500, callback:()=>this.checkCombat(), loop:true });
    this.time.addEvent({ delay:1000,callback:()=>this.updateEnemyAI(),loop:true });

    // UI
    this.selectedInfoText = this.add.text(960+10, 30+10, "NO FLEET SELECTED", {
      fontSize:'16px', color:'#ffffff'
    });
    this.uiContainer.add(this.selectedInfoText);

    this.conditionLines=[];
    for(let i=0;i<5;i++){
      let line=this.add.text(960+10, 180+10+i*20, "", {
        fontSize:'16px', color:'#ffffff'
      });
      this.conditionLines.push(line);
      this.uiContainer.add(line);
    }

    // Container for minimap overlay
    this.overlayContainer = this.add.container(0,0);
    this.mainCamera.ignore(this.overlayContainer);
    this.uiCamera.ignore(this.overlayContainer);
    this.minimapCamera.ignore(this.overlayContainer);
    this.minimapOverlay=this.add.graphics();
    this.overlayContainer.add(this.minimapOverlay);
    this.overlayContainer.setDepth(1000);

    this.updateConditionUI();
  }

  drawWindowFrame(x, y, width, height, label, bgColor) {
    const headerHeight = 20;
    if (label==="STATUS"||label==="CONDITION OF YOUR SIDE") {
      let bg=this.add.graphics();
      bg.fillStyle(bgColor,1).fillRect(x,y+headerHeight,width,height-headerHeight);
      this.uiContainer.add(bg);
    }
    let frame=this.add.graphics().lineStyle(2, 0x9FA8C6,1);
    frame.strokeRect(x,y,width,height);
    frame.fillStyle(0x9FA8C6,1).fillRect(x,y,width,headerHeight);

    let labelText=this.add.text(x+10,y+headerHeight/2, label, {
      fontSize:'14px', color:'#0E121C', fontFamily:"Arial Unicode MS"
    }).setOrigin(0,0.5);
    this.uiContainer.add(frame);
    this.uiContainer.add(labelText);
  }

  /**
   * createTriangle: changed so that we pass in the numeric ship name ("01","02", etc).
   * Also, we reduce bounce so ships push each other less.
   */
  createTriangle(x, y, mainColor, shipName) {
    const color = mainColor;
    const opacity = 0.6;
    const container = this.add.container(x, y);
    const graphics  = this.add.graphics();

    const v1 = { x:0,  y:-40 };
    const v2 = { x:25, y: 20 };
    const v3 = { x:-25,y: 20 };

    graphics.fillStyle(color, opacity);
    graphics.beginPath();
    graphics.moveTo(v1.x,v1.y);
    graphics.lineTo(v2.x,v2.y);
    graphics.lineTo(v3.x,v3.y);
    graphics.closePath();
    graphics.fillPath();

    // Additional small triangles
    const smallTriangleHeight=10;
    const smallTriangleBaseHalf=5;
    const center = { x:(v1.x+v2.x+v3.x)/3, y:(v1.y+v2.y+v3.y)/3 };

    function drawSmallTriangleTop(vertex){
      const D={x:0,y:-1};
      const apex={ x:vertex.x+D.x*smallTriangleHeight, y:vertex.y+D.y*smallTriangleHeight};
      const tangent={x:-D.y,y:D.x};
      const baseLeft={ x:vertex.x+tangent.x*smallTriangleBaseHalf, y:vertex.y+tangent.y*smallTriangleBaseHalf};
      const baseRight={ x:vertex.x - tangent.x*smallTriangleBaseHalf, y:vertex.y - tangent.y*smallTriangleBaseHalf};
      const cx=(apex.y+baseLeft.y+baseRight.y)/3;
      const flipApex={ x:apex.x, y:2*cx-apex.y};
      const flipL={ x:baseLeft.x, y:2*cx-baseLeft.y};
      const flipR={ x:baseRight.x, y:2*cx-baseRight.y};

      graphics.fillStyle(color,opacity).beginPath();
      graphics.moveTo(flipApex.x,flipApex.y);
      graphics.lineTo(flipL.x,flipL.y);
      graphics.lineTo(flipR.x,flipR.y);
      graphics.closePath();
      graphics.fillPath();
    }

    function drawSmallTriangleAtVertex(vertex){
      const dir={ x:vertex.x-center.x, y:vertex.y-center.y};
      const mag=Math.sqrt(dir.x*dir.x+dir.y*dir.y);
      const D={ x:dir.x/mag, y:dir.y/mag};
      const apex=vertex;
      const baseCenter={ x:apex.x+D.x*smallTriangleHeight, y:apex.y+D.y*smallTriangleHeight};
      const tangent={ x:-D.y, y:D.x};
      const baseLeft={ x:baseCenter.x+tangent.x*smallTriangleBaseHalf, y:baseCenter.y+tangent.y*smallTriangleBaseHalf};
      const baseRight={ x:baseCenter.x-tangent.x*smallTriangleBaseHalf, y:baseCenter.y-tangent.y*smallTriangleBaseHalf};

      graphics.fillStyle(color,opacity).beginPath();
      graphics.moveTo(apex.x,apex.y);
      graphics.lineTo(baseLeft.x,baseLeft.y);
      graphics.lineTo(baseRight.x,baseRight.y);
      graphics.closePath();
      graphics.fillPath();
    }

    drawSmallTriangleTop(v1);
    drawSmallTriangleAtVertex(v2);
    drawSmallTriangleAtVertex(v3);

    container.add(graphics);

    // (CHANGED) Use the numeric shipName instead of "はるか" or other Japanese text
    const text = this.add.text(0, 0, shipName, {
      fontSize:'10px',
      color:'#ffffff',
      align:'center'
    }).setOrigin(0.5);
    container.add(text);

    // If enemy => flip vertically, attach HP text
    if(color===0xff0000){
      container.setScale(0.8, -0.8);
      text.scaleY = -1;

      let hpText = this.add.text(0, 30, "15000", {
        fontSize:'10px', color:'#ffffff', align:'center'
      });
      hpText.setOrigin(0.5, 1);
      hpText.scaleY = -1;
      container.add(hpText);
      container.hpText = hpText;  // We'll update this every frame
    } else {
      container.setScale(0.8);
    }

    // Add physics
    this.physics.add.existing(container);
    container.setSize(50,50)
             .setInteractive(new Phaser.Geom.Rectangle(-25,-25,50,50),Phaser.Geom.Rectangle.Contains);

    container.body.setCollideWorldBounds(true).setOffset(-25,-25);

    // (CHANGED) reduce bounce to push each other less
    container.body.setBounce(0.03);
    container.body.setDamping(true);
    container.body.setDrag(0.95);

    return container;
  }

  handleLeftClick(pointer){
    const worldPoint = pointer.positionToCamera(this.mainCamera);
    let clickedGroup=null;
    // Only check playerGroups
    for(let grp of this.playerGroups){
      if(!grp.alive) continue;
      const bounds=grp.sprite.getBounds();
      // Now the entire triangle container is clickable
      if(Phaser.Geom.Rectangle.Contains(bounds, worldPoint.x, worldPoint.y)){
        clickedGroup=grp; break;
      }
    }
    if(clickedGroup){
      // Un-highlight all
      this.playerGroups.forEach(g=>{
        if(g.highlight){
          g.highlight.destroy();
          g.highlight=null;
        }
      });
      this.selectedGroup=clickedGroup;

      // Add highlight circle
      clickedGroup.highlight=this.add.graphics();
      clickedGroup.highlight.fillStyle(0x92ABFF,0.3).fillCircle(0,0,60);
      clickedGroup.sprite.addAt(clickedGroup.highlight,0);

      this.updateSelectedInfo();
    } else {
      // If we had a selection, move it
      if(this.selectedGroup){
        this.moveGroupTo(this.selectedGroup, worldPoint.x, worldPoint.y);
      }
    }
  }

  moveGroupTo(group, x, y){
    group.targetX=x; group.targetY=y;
    this.physics.moveTo(group.sprite,x,y,group.speed);
    if(group.waypoint){ group.waypoint.destroy(); group.waypoint=null;}
    if(group.waypointLine){ group.waypointLine.destroy(); group.waypointLine=null;}

    group.waypoint=this.add.graphics();
    group.waypoint.fillStyle(0xffff00,1).fillTriangle(x-10,y,x+10,y,x,y+15);

    group.waypointLine=this.add.graphics().lineStyle(2,0xffff00,1).beginPath();
    group.waypointLine.moveTo(group.sprite.x,group.sprite.y).lineTo(x,y).strokePath();
  }

  unselectGroup(){
    if(this.selectedGroup){
      if(this.selectedGroup.highlight){
        this.selectedGroup.highlight.destroy();
        this.selectedGroup.highlight=null;
      }
      if(this.selectedGroup.waypoint){
        this.selectedGroup.waypoint.destroy();
        this.selectedGroup.waypoint=null;
      }
      if(this.selectedGroup.waypointLine){
        this.selectedGroup.waypointLine.destroy();
        this.selectedGroup.waypointLine=null;
      }
      this.selectedGroup=null;
      this.updateSelectedInfo();
    }
  }

  updateEnemyAI(){
    // same as before
    for(let enemy of this.enemyGroups){
      if(!enemy.alive) continue;
      let nearest=null; let nearestDist=Infinity;
      for(let player of this.playerGroups){
        if(!player.alive) continue;
        let dist=Phaser.Math.Distance.Between(enemy.sprite.x,enemy.sprite.y,player.sprite.x,player.sprite.y);
        if(dist<nearestDist){
          nearestDist=dist; nearest=player;
        }
      }
      if(nearest){
        if(nearestDist>50){
          enemy.targetX=nearest.sprite.x;
          enemy.targetY=nearest.sprite.y;
          this.physics.moveTo(enemy.sprite, enemy.targetX, enemy.targetY, enemy.speed);
        } else {
          enemy.sprite.body.setVelocity(0,0);
        }
      }
    }
  }

  checkCombat(){
    // same as before...
    // [snip for brevity, no logic changes from your code]
    // ...
  }

  dealDamage(attacker, defender){
    let damage=attacker.offense;
    damage=Math.max(0,damage-defender.defense*0.1);
    defender.hp-=damage;

    if(defender.hp<=0){
      defender.hp=0;
      defender.alive=false;
      this.sound.play('explosion',{ volume:0.1 });
      this.createFancyExplosion(defender.sprite.x,defender.sprite.y);

      if(attacker.isPlayer){
        this.showPortrait(attacker.portraitKey);
      }
      defender.sprite.destroy();
      this.checkEndCondition();
    }

    // If a player took damage, update condition UI
    if(defender.isPlayer){
      this.updateConditionUI();
      if(this.selectedGroup===defender){
        this.updateSelectedInfo();
      }
    }
  }

  checkEndCondition(){
    // same as before
    let playerAliveCount=this.playerGroups.filter(g=>g.alive).length;
    let enemyAliveCount=this.enemyGroups.filter(g=>g.alive).length;

    if(playerAliveCount===0){
      this.scene.start('EndScene',{ result:'lose', level:this.selectedLevel });
    } else if(enemyAliveCount===0){
      this.scene.start('EndScene',{ result:'win', level:this.selectedLevel });
    }
  }

  createBulletProjectile(attacker, defender, color){
    this.sound.play('spaceAttack',{ volume:0.03 });
    this.createMuzzleFlash(attacker.sprite.x, attacker.sprite.y, color);

    const startX=attacker.sprite.x;
    const startY=attacker.sprite.y;
    const endX=defender.sprite.x;
    const endY=defender.sprite.y;

    let bulletGfx=this.add.graphics({ x:startX,y:startY });
    bulletGfx.lineStyle(2,color,1);

    const dx=endX-startX;
    const dy=endY-startY;

    let paramObj={ progress:0 };
    this.tweens.add({
      targets:paramObj,
      progress:1,
      duration:200,
      onUpdate:()=>{
        bulletGfx.clear();
        bulletGfx.lineStyle(3,color,1);
        bulletGfx.beginPath();
        bulletGfx.moveTo(0,0);
        const bulletLength=15;
        let t=paramObj.progress;
        let curX=dx*t;
        let curY=dy*t;
        let angle=Math.atan2(dy,dx);
        let headX=curX;
        let headY=curY;
        let tailX=headX - Math.cos(angle)*bulletLength;
        let tailY=headY - Math.sin(angle)*bulletLength;
        bulletGfx.lineTo(tailX,tailY);
        bulletGfx.lineTo(headX,headY);
        bulletGfx.strokePath();
      },
      onComplete:()=>{
        bulletGfx.destroy();
        this.createImpactSpark(endX,endY,color);
      }
    });
  }

  createMuzzleFlash(x,y,color){
    let flash=this.add.graphics({x,y});
    flash.fillStyle(color,1);
    flash.fillCircle(0,0,8);
    this.tweens.add({
      targets:flash,
      alpha:0,
      duration:100,
      onComplete:()=>flash.destroy()
    });
  }

  createImpactSpark(x,y,color){
    let spark=this.add.graphics({x,y});
    spark.lineStyle(2,color,1);
    spark.beginPath();
    for(let i=0; i<6; i++){
      let angle=(Math.PI*2/6)*i;
      let tx=Math.cos(angle)*6;
      let ty=Math.sin(angle)*6;
      spark.moveTo(0,0);
      spark.lineTo(tx,ty);
    }
    spark.strokePath();
    this.tweens.add({
      targets:spark,
      alpha:0,
      duration:150,
      onComplete:()=>spark.destroy()
    });
  }

  createFancyExplosion(x,y){
    let container=this.add.container(x,y);

    for(let i=0;i<2;i++){
      let ring=this.add.graphics();
      ring.lineStyle(2,0xffaa00);
      ring.strokeCircle(0,0,10+i*5);
      container.add(ring);

      this.tweens.add({
        targets:ring,
        scale:2+i*0.5,
        alpha:0,
        duration:700,
        onComplete:()=>ring.destroy()
      });
    }

    const arcCount=5;
    for(let j=0;j<arcCount;j++){
      let arcG=this.add.graphics();
      arcG.lineStyle(2,0xffee00,1);
      let startAngle=Phaser.Math.FloatBetween(0,Math.PI*2);
      let endAngle=startAngle+Phaser.Math.FloatBetween(0.5,1);
      arcG.beginPath();
      arcG.arc(0,0,Phaser.Math.Between(5,15),startAngle,endAngle);
      arcG.strokePath();
      arcG.closePath();
      container.add(arcG);

      this.tweens.add({
        targets:arcG,
        scale:Phaser.Math.FloatBetween(1.5,3),
        alpha:0,
        duration:700,
        onComplete:()=>arcG.destroy()
      });
    }

    let debrisCount=8;
    for(let d=0; d<debrisCount; d++){
      let line=this.add.graphics();
      line.lineStyle(2,0xffcc00);
      line.beginPath();
      line.moveTo(0,0);
      line.lineTo(Phaser.Math.Between(8,15),0);
      line.strokePath();
      line.closePath();
      line.angle=(360/debrisCount)*d;
      container.add(line);

      this.tweens.add({
        targets:line,
        x:30,
        alpha:0,
        duration:500,
        onComplete:()=>line.destroy()
      });
    }

    this.time.delayedCall(800,()=>container.destroy());
  }

  updateSelectedInfo(){
    if(this.selectedGroup){
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

  updateConditionUI(){
    for(let i=0; i<this.playerGroupData.length;i++){
      let g=this.playerGroupData[i];
      if(g.alive){
        this.conditionLines[i].setText(`▶ ${g.name}  ${g.hp}/${g.maxHp}`);
      } else {
        this.conditionLines[i].setText(`▶ ${g.name}  0/${g.maxHp}`);
      }
    }
  }

  update(){
    // Let ships stop near their target
    [...this.playerGroups,...this.enemyGroups].forEach(group=>{
      if(!group.alive) return;
      const dx=group.targetX-group.sprite.x;
      const dy=group.targetY-group.sprite.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<4){
        group.sprite.body.setVelocity(0,0);
      }
    });

    // (CHANGED) Update enemy HP text so the “15000” actually changes
    this.enemyGroups.forEach(enemy => {
      if(enemy.alive && enemy.sprite && enemy.sprite.hpText) {
        enemy.sprite.hpText.setText(enemy.hp.toString());
      }
    });

    // Minimap overlay
    if(this.minimapOverlay){
      this.minimapOverlay.clear();
      this.minimapOverlay.lineStyle(2,0xff0000,1);

      let vwX=this.mainCamera.scrollX;
      let vwY=this.mainCamera.scrollY;
      let vwW=this.mainCamera.width/this.mainCamera.zoom;
      let vwH=this.mainCamera.height/this.mainCamera.zoom;
      let scale=this.minimapCamera.zoom;

      let mmX=960+vwX*scale;
      let mmY=400+vwY*scale;
      let mmW=vwW*scale;
      let mmH=vwH*scale;
      this.minimapOverlay.strokeRect(mmX, mmY, mmW, mmH);
    }

    // Update any waypoints
    this.playerGroups.forEach(group=>{
      if(!group.alive||!group.waypoint)return;
      const dx=group.targetX-group.sprite.x;
      const dy=group.targetY-group.sprite.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<4){
        if(group.waypoint){ group.waypoint.destroy(); group.waypoint=null;}
        if(group.waypointLine){ group.waypointLine.destroy(); group.waypointLine=null;}
      } else if(group.waypointLine){
        group.waypointLine.clear().lineStyle(2,0xffff00,1).beginPath();
        group.waypointLine.moveTo(group.sprite.x,group.sprite.y);
        group.waypointLine.lineTo(group.targetX,group.targetY);
        group.waypointLine.strokePath();
      }
    });
  }

  showPortrait(portraitKey){
    // If voice is playing, stop to avoid overlap
    if(this.currentVoiceSound && this.currentVoiceSound.isPlaying){
      this.currentVoiceSound.stop();
      this.currentVoiceSound=null;
    }

    // Fade out existing portraits
    if(this.activePortraits.length>0){
      this.activePortraits.forEach(p=>{
        this.tweens.add({
          targets:p,
          alpha:0,
          duration:300,
          onComplete:()=>p.destroy()
        });
      });
      this.activePortraits=[];
    }

    const voiceMap={
      asahina:'asahinaVoice',
      haruhi:'haruhiVoice',
      nagato:'nagatoVoice',
      koizumi:'koizumiVoice',
      kyon:'kyonVoice'
    };
    const voiceKey=voiceMap[portraitKey];
    if(voiceKey){
      this.currentVoiceSound=this.sound.add(voiceKey);
      this.currentVoiceSound.play();
    }

    const startX=-200;
    const bottomY=this.game.config.height;
    let portrait=this.add.image(startX,bottomY,portraitKey)
      .setScrollFactor(0).setDepth(9999).setScale(0.75).setOrigin(0.5,1);

    this.minimapCamera.ignore(portrait);
    this.uiCamera.ignore(portrait);

    this.activePortraits.push(portrait);

    this.tweens.add({
      targets:portrait,
      x:350,
      duration:1000,
      ease:'Power2',
      onComplete:()=>{
        this.time.delayedCall(4000,()=>{
          this.tweens.add({
            targets:portrait,
            alpha:0,
            duration:1000,
            onComplete:()=>{
              portrait.destroy();
              const index=this.activePortraits.indexOf(portrait);
              if(index!==-1){
                this.activePortraits.splice(index,1);
              }
            }
          });
        });
      }
    });
  }
}
