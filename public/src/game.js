var config = {
  type: Phaser.AUTO, 
  parent: 'gameSection',
  width: 800,
  height: 640,
  physics: {
      default: 'arcade',
      arcade: {
          gravity: { y: 1500 } //2000
      }
  },
  scene: {
      preload: preload,
      create: create,
      update: update
  }
};

var game = new Phaser.Game(config);
var direction = 'right';
var jumpReset = true;
var exit = false;
var life = 100;
var lifeText = 100;
var winText;
var loseText;

function preload () {
    this.load.image('background', './assets/images/background.png');
    this.load.spritesheet('cat', 
      './assets/cat.png',
      { frameWidth: 82, frameHeight: 72 }
      );
    this.load.image('burrito', './assets/burrito.png');
    this.load.image('exitDoor', './assets/exitDoor.png')
    this.load.image('tiles', './assets/tilesets/platformPack_tilesheet.png');
    this.load.tilemapTiledJSON('map', './assets/tilemaps/level1.json')
}

function create () {

  this.scene = this.add.tileSprite(1600, 320, 3200, 640, 'background');
  const map = this.make.tilemap({ key: 'map' });
  const tileset = map.addTilesetImage('hungryCat', 'tiles');
  const platforms = map.createStaticLayer('Platforms', tileset, 0, 0);
  platforms.setCollisionByExclusion(-1, true);
  
  cursors = this.input.keyboard.createCursorKeys(); 

  //----------   Exit Door   ------------//
  exitDoors = this.physics.add.group({
    key: 'exitDoor',
    setXY: { x: 3104, y: 165}
  })
  this.physics.add.collider(exitDoors, platforms);
  
  //----------   Player   ------------//
  player = this.physics.add.sprite(100, 450, 'cat');
  this.physics.world.setBounds(0,0, 3200, 640)
  player.setCollideWorldBounds(true);

  this.cameras.main.setBounds(0,0,3200, 640)
  this.cameras.main.startFollow(player);
  this.physics.add.collider(player, platforms);
  
  //----------   Items  ------------//
  burritos = this.physics.add.group({
    key: 'burrito',
    repeat: 31,
    setXY: { x: 32, y: 0, stepX: 170 }
  });
  burritos.children.iterate(function(child) {
    child.setBounceY(Phaser.Math.FloatBetween(0.2, 0.4));
  });
  this.physics.add.collider(burritos, platforms);
  
  //----------   Life Bar   ------------//
  lifeText = this.add.text(16,16, 'Life: 100%', { fontSize: '32px', fill: '#000' });
  lifeText.setScrollFactor(0);   // Moves life text with camera

  function makeBar(x,y,color) {
    let bar = this.add.graphics();
    bar.fillStyle(color, 1);
    bar.fillRect(200,30,200,50);
    bar.x = x;
    bar.y = y;
    return bar;
  }
  
  function setValue(bar, percentage) {
    bar.scaleX = percentage/100;
  }

  let lifeBar = makeBar(140,100,0x2ecc71);
  this.setValue(lifeBar, 50);

  function collectBurrito (player, burrito) {  // life is gained for every burrito
    burrito.disableBody(true, true)
    if (life >= 96) life = 100;
    else life += 5;
    lifeText.setText('Life: ' + life + '%');
  }

  this.physics.add.overlap(player, burritos, collectBurrito, null, this);
  timedEvent = this.time.addEvent({   // life is depleted every 1s
    delay: 1000, 
    callback: () => {
      if (life >= 5) life -= 5;
      lifeText.setText('Life: ' + life + '%');
    },
    callbackScope: this,
    loop: true
  })

  //----------   Win Condition   ------------//
  function win () { exit = true }
  winText = this.add.text(400, 320, 'You Win!', { fontSize: '72px', fill: '#000' });
  winText.setOrigin(0.5).setBackgroundColor('#FFF').setScrollFactor(0);
  winText.visible = false;
  loseText = this.add.text(400, 320, 'Game Over!', { fontSize: '72px', fill: '#000' });
  loseText.setOrigin(0.5).setBackgroundColor('#FFF').setScrollFactor(0);
  loseText.visible = false;
  this.physics.add.overlap(player, exitDoors, win, null, this);

  //----------   Character sprite animations   ------------//
  this.anims.create({
    key: 'left',
    frames: this.anims.generateFrameNumbers('cat', { start: 0, end: 7 }),
    frameRate: 10,
    repeat: -1
  });
  this.anims.create({
    key: 'right',
    frames: this.anims.generateFrameNumbers('cat', { start: 8, end: 15 }),
    frameRate: 10,
    repeat: -1
  });
  this.anims.create({
    key: 'idle-left',
    frames: this.anims.generateFrameNumbers('cat', { start: 16, end: 25 }),
    frameRate: 10,
    repeat: -1
  });
  this.anims.create({
    key: 'idle-right',
    frames: this.anims.generateFrameNumbers('cat', { start: 26, end: 36 }),
    frameRate: 10,
    repeat: -1
  });
  this.anims.create({
    key: 'jump-left',
    frames: [ {key: 'cat', frame: 2 }],
    frameRate: 20,
  });
  this.anims.create({
    key: 'jump-right',
    frames: [ {key: 'cat', frame: 10 }],
    frameRate: 20,
  });
}  

function update () {
  // Keyboard control
  if (cursors.left.isDown) {  
    player.setVelocityX(-220);
    direction = 'left';
    if (player.body.onFloor()) player.anims.play('left', true);  // walk left
    else player.anims.play('jump-left');  // jump left
  } else if (cursors.right.isDown){ 
    player.setVelocityX(220);
    direction = 'right';
    if (player.body.onFloor()) player.anims.play('right', true);  // walk right
    else player.anims.play('jump-right');  // jump right
  } else {
      player.setVelocityX(0);
      player.anims.play('idle-' + direction, true);
  } 
  if (cursors.space.isDown && player.body.onFloor()) {  // Jump
    if (jumpReset === true) {
      player.setVelocityY(-800);  //900
      jumpReset = false;
    }
  }
  if (cursors.space.isUp) jumpReset = true;

  // Win Detection
  if (cursors.up.isDown && exit === true) {
    gameOver('win');
    exit = false;
    this.physics.pause();
    location.reload();
    
  }

  // Death by fall or health
  if (player.y > 600 || life === 0)  {   
    player.setTint(0xff0000);
    gameOver('lose');
    this.physics.pause();
  }
}



function gameOver(result) {
  console.log('game over function');
  if (result === 'win') {
    console.log('You won the game, congratulations!');
    this.winText.setVisible(true);
  } else {
    this.loseText.visible = true;
    console.log('You Lost!');
    //location.reload();
  }
} 


