var config = {
  type: Phaser.AUTO, 
  parent: 'gameSection',
  width: 800,
  height: 640,
  physics: {
      default: 'arcade',
      arcade: {
          debug: false,
          gravity: { y: 1500 } 
      }
  },
  scene: {
      preload: preload,
      create: create,
      update: update
  }
};

var game = new Phaser.Game(config);
var cursors;
var jumpReset = true;
var exit = false;
var life;
var lives = 3;
var livesText;
var winText;
var loseText;
var lifeTimer;
var jumpTimer = 0;

function preload () {
  this.load.image('background1', './assets/images/background-original.png');
  this.load.image('background2', './assets/images/background-front.png');
  this.load.image('burrito', './assets/images/burrito.png');
  this.load.atlas('cat', './assets/images/cat.png', './assets/images/cat.json');
  this.load.image('exitDoor', './assets/images/exitDoor.png')
  this.load.image('tiles', './assets/tilesets/tilesheet.png');
  this.load.tilemapTiledJSON('map', './assets/tilemaps/level1.json')
}

function create () {
  
  //----------   Scrolling Backgrounds   ------------//
  this.bg_1 = this.add.tileSprite(0, 0, 10000, game.config.height, 'background1'); // Background Image 1
  this.bg_1.setOrigin(0, 0).setScrollFactor(.25);
  this.bg_1 = this.add.tileSprite(0, 0, 10000, game.config.height, 'background2'); // Background Image 2
  this.bg_1.setOrigin(0, 0).setScrollFactor(.5);
  const map = this.make.tilemap({ key: 'map' });    // Bring in JSON tilemap
  const tileset = map.addTilesetImage('hungryCat', 'tiles');  // Create Tileset from JSON
  const platforms = map.createStaticLayer('Platforms', tileset, 0, 0);  // Bring in Platforms per JSON
  platforms.setCollisionByExclusion(-1, true);
  cursors = this.input.keyboard.createCursorKeys(); 

  //----------   Exit Door   ------------//
  //exitDoor = this.physics.add.image(450, 165, 'exitDoor');
  exitDoor = this.physics.add.image(6304, 165, 'exitDoor');
  this.physics.add.collider(exitDoor, platforms);
  
  //----------   Player   ------------//
  player = this.physics.add.sprite(100, 325, 'cat', 'Jump06.png');
  player.setMaxVelocity(1000,1000);

  //********  Decrease Player & Exit Door Boundaries  *******/
  this.time.addEvent({ 
    delay: 1000, 
    callback: () => {
      player.body.setSize(player.width - 50, player.height, true) 
      exitDoor.body.setSize(exitDoor.width - 50, exitDoor.height - 75).setOffset(25, 75);
    },
    callbackScope: this, 
    loop: false
  });
  //*********************************************************/

  this.physics.world.setBounds(0, -50, 6400, 790)  // allow player to jump above screen and fall into pit
  player.setCollideWorldBounds(true);
  player.body.onWorldBounds = true;
  // Check for a fall into a pit
  this.physics.world.on('worldbounds', (body, up, down) => { 
    if (down) {
      lifeTimer.remove();
      lives--;
      livesText.setText('Lives: ' + lives);
      this.physics.pause();
      death();
      if (lives === 0) gameOver('lose') 
      else {
        delay = this.time.addEvent({ 
          delay: 1000, 
          callback: () => { this.scene.restart()}, 
          callbackScope: this, 
        });
      }
    };
  });  

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

  //--------------   Life Bar   ---------------//
  life = 100;
  let lifeBarText = this.add.text(20, 5, 'Health', { fontsize: '8px', fill: '#000'});
  lifeBarText.setScrollFactor(0);
  let lifeBar = this.add.graphics({x: 15, y: 20});
  lifeBar.fillStyle('0x2ecc71', 1).fillRect(0,0,200,15).setScrollFactor(0);
  livesText = this.add.text(20 , 40, 'Lives: ' + lives, { fontsize: '8px', fill: '#000'}) 
  livesText.setScrollFactor(0);

  function collectBurrito (player, burrito) {  // life is gained for every burrito
    burrito.disableBody(true, true)
    if (life >= 96) life = 100;
    else life += 5;
    lifeBar.scaleX = life / 100 ;
  }
  this.physics.add.overlap(player, this.burritos, collectBurrito, null, this);

  lifeTimer = this.time.addEvent({   // life is depleted every 1 second
    delay: 1200, 
    callback: () => {
      if (life >= 5) life -= 5;
      lifeBar.scaleX = life / 100 ;
      if (life <= 0) {
        lifeTimer.remove();
        lives = lives-1;
        livesText.setText('Lives: ' + lives);
        death()               // play death animation
        if (lives === 0) gameOver('lose');
        else {
          this.time.addEvent({ 
            delay: 1000, 
            callback: () => { this.scene.restart()}, 
            callbackScope: this, 
          });
        }
      }
    },
    callbackScope: this,
    loop: true
  })

  //----------   Win Condition   ------------//
  function win () { exit = true }
  winText = this.add.text(400, 320, 'You Win!', { fontSize: '72px', fill: '#000' });
  winText.setOrigin(0.5).setBackgroundColor('#FFF').setScrollFactor(0);
  winText.visible = false;
  deathText = this.add.text(400, 320, 'You Died!', { fontSize: '72px', fill: '#000' });
  deathText.setOrigin(0.5).setBackgroundColor('#FFF').setScrollFactor(0);
  deathText.visible = false;
  loseText = this.add.text(400, 320, 'Game Over!', { fontSize: '72px', fill: '#000' });
  loseText.setOrigin(0.5).setBackgroundColor('#FFF').setScrollFactor(0);
  loseText.visible = false;
  this.physics.add.overlap(player, exitDoor, win, null, this);

  //----------   Character sprite animations   ------------//
  this.anims.create({   // Run
    key: 'run',
    frames: this.anims.generateFrameNames('cat', { 
      prefix: 'Run',
      suffix: '.png',
      start: 1, 
      end: 8, 
      zeroPad: 2
    }),
    frameRate: 10,
    repeat: -1
  });

  this.anims.create({   // Idle

    key: 'idle',
    frames: this.anims.generateFrameNames('cat', { 
      prefix: 'Idle',
      suffix: '.png',
      start: 1, 
      end: 10, 
      zeroPad: 2
    }),
    frameRate: 10,
    repeat: -1
  });

  this.anims.create({   // Jump
    key: 'jump',
    repeat: 0,
    frames: this.anims.generateFrameNames('cat', { 
      prefix: 'Jump',
      suffix: '.png',
      start: 1, 
      end: 8,
      zeroPad: 2
    }),
    frameRate: 10,
  });

  this.anims.create({   // Dead
    key: 'dead',
    frames: this.anims.generateFrameNames('cat', { 
      prefix: 'Dead',
      suffix: '.png',
      start: 1, 
      end: 10, 
      zeroPad: 2
    }),
    frameRate: 10,
  });
}  

function update () {
  // Turn player sprite left or right based on movement
  if (player.body.velocity.x < 0) player.flipX = true;
  if (player.body.velocity.x > 0) player.flipX = false;

  // Keyboard control, player movements
  if (cursors.right.isDown  && life > 0){ 
    player.setVelocityX(220);
    if (player.body.onFloor()) player.play('run', true);  // Run right
    else player.play('jump', true);  // Falling Right
  } else if (cursors.left.isDown && life > 0) {  
    player.setVelocityX(-220);
    if (player.body.onFloor()) player.play('run', true);  // Run left
    else player.play('jump', true); // Falling Left
  } else {
    player.setVelocityX(0);
    if (player.body.onFloor() && life > 0) player.play('idle', true);
  } 
  if (cursors.space.isDown && life > 0) {  // Jump with different velocities
      if (player.body.onFloor() && jumpTimer === 0) {  // Initiate Jump
        jumpTimer = 1;
        player.setVelocityY(-500);
        player.play('jump');
      } else if (jumpTimer > 0 && jumpTimer < 17) { // Jump button is held, keep jumping higher
        jumpTimer++;
        player.setVelocityY(-500 + (jumpTimer*2));
      }    
  }
  if (cursors.space.isUp) jumpTimer = 0; // player is no longer holding the jump button
  
  // Win Detection
  if (exit === true) {
    gameOver('win');
    exit = false;
    lifeTimer.remove();
    this.physics.pause();
    player.destroy();
    setTimeout(() => {
      lives = 3;
      this.scene.restart()
    }, 3000);
  }

}

function death() {
  player.setTint(0xff0000);
  player.play('dead');
  this.deathText.visible = true;
}

function gameOver(result) {
  if (result === 'win') this.winText.setVisible(true);
  else {
    this.deathText.visible = false;
    this.loseText.visible = true;
  }
} 


