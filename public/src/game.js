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
  this.load.image('background1', './assets/images/background-original.png');
  this.load.image('background2', './assets/images/background-front.png');
  this.load.image('burrito', './assets/images/burrito.png');
  this.load.spritesheet('cat', 
    './assets/cat.png',
    { frameWidth: 82, frameHeight: 72 }
    );
  this.load.image('exitDoor', './assets/exitDoor.png')
  this.load.image('tiles', './assets/tilesets/tilesheet.png');
  this.load.tilemapTiledJSON('map', './assets/tilemaps/level1.json')
}

function create () {
  
  //----------   Scrolling Backgrounds   ------------//
  this.bg_1 = this.add.tileSprite(0, 0, 10000, game.config.height, 'background1'); // Background Image 1
  this.bg_1.setOrigin(0, 0);
  this.bg_1.setScrollFactor(.25);
  this.bg_1 = this.add.tileSprite(0, 0, 10000, game.config.height, 'background2'); // Background Image 2
  this.bg_1.setOrigin(0, 0);
  this.bg_1.setScrollFactor(.5);
  const map = this.make.tilemap({ key: 'map' });    // Bring in JSON tilemap
  const tileset = map.addTilesetImage('hungryCat', 'tiles');  // Create Tileset from JSON
  const platforms = map.createStaticLayer('Platforms', tileset, 0, 0);  // Bring in Platforms per JSON
  platforms.setCollisionByExclusion(-1, true);
  cursors = this.input.keyboard.createCursorKeys(); 

  //----------   Exit Door   ------------//
  exitDoor = this.physics.add.image(6304, 165, 'exitDoor');
  this.physics.add.collider(exitDoor, platforms);

  //----------   Player   ------------//
  player = this.physics.add.sprite(100, 450, 'cat');
  player.setMaxVelocity(1000,1000);
  this.physics.world.setBounds(0, -50, 6400, 690)
  player.setCollideWorldBounds(true);
  this.myCam = this.cameras.main.setBounds(0, 0, 6400, 640)
  this.myCam.startFollow(player);
  this.physics.add.collider(player, platforms);
  

  this.bg_1.tilePositionX = this.myCam.scrollX * 5;
  
  //----------   Items (Burritos) ------------//
  this.burritos = this.physics.add.group({
    allowGravity: false,
    immovable: true
  });
  const burritoObjects = map.getObjectLayer('Burritos')['objects'];
  burritoObjects.forEach(burritoObject => {
    const burrito = this.burritos.create(burritoObject.x+21, burritoObject.y-11, 'burrito');
  });

  //----------   Life Bar   ------------//
  let lifeBarText = this.add.text(20, 5, 'Health', { fontsize: '8px', fill: '#000'});
  lifeBarText.setScrollFactor(0);
  let lifeBar = this.add.graphics();
  lifeBar.fillStyle('0x2ecc71', 1);
  lifeBar.fillRect(15,20,200,15);
  lifeBar.setScrollFactor(0); 
  
  function collectBurrito (player, burrito) {  // life is gained for every burrito
    burrito.disableBody(true, true)
    if (life >= 96) life = 100;
    else life += 5;
    lifeBar.scaleX = life / 100 ;
  }
  this.physics.add.overlap(player, this.burritos, collectBurrito, null, this);
  timedEvent = this.time.addEvent({   // life is depleted every 1.25 seconds
    delay: 1000, 
    callback: () => {
      if (life >= 5) life -= 5;
      lifeBar.scaleX = life / 100 ;
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
  this.physics.add.overlap(player, exitDoor, win, null, this);

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
  }
} 


