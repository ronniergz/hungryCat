var config = {
  type: Phaser.AUTO,
  parent: 'gameSection',
  width: 800,
  height: 1040,
  input: {
    activePointers: 4,
  },
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
var exit = false;
var life;
var lives = 3;
var livesText;
var winText;
var loseText;
var lifeTimer;
var jumpTimer = 0;
// On Screen buttons
var moveLeft = false;
var moveRight = false;
var jumpPressed = false;
var joystickX = 175;
var joystickY = 850;

function preload() {
  this.load.image('background1', './assets/images/background-original.png');
  this.load.image('background2', './assets/images/background-front.png');
  this.load.image('background3', './assets/images/background-buttons.jpg');
  this.load.image('burrito', './assets/images/burrito.png');
  this.load.atlas('cat', './assets/images/cat.png', './assets/images/cat.json');
  this.load.image('exitDoor', './assets/images/exitDoor.png')
  this.load.image('joystick', "./assets/images/joystick.png");
  this.load.image('button-left', "./assets/images/button-left.png");
  this.load.image('button-right', "./assets/images/button-right.png");
  this.load.image('button-jump', "./assets/images/button-jump.png");
  this.load.image('tiles', './assets/tilesets/tilesheet.png');
  this.load.tilemapTiledJSON('map', './assets/tilemaps/level1.json');
}

function create() {

  //----------   Scrolling Backgrounds   ------------//
  this.bg_1 = this.add.tileSprite(0, 0, 10000, 640, 'background1'); // Background Image 1
  this.bg_1.setOrigin(0, 0).setScrollFactor(.25);
  this.bg_2 = this.add.tileSprite(0, 0, 10000, 640, 'background2'); // Background Image 2
  this.bg_2.setOrigin(0, 0).setScrollFactor(.5);
  const map = this.make.tilemap({ key: 'map' });    // Bring in JSON tilemap
  const tileset = map.addTilesetImage('hungryCat', 'tiles');  // Create Tileset from JSON
  const platforms = map.createStaticLayer('Platforms', tileset, 0, 0);  // Bring in Platforms per JSON
  platforms.setCollisionByExclusion(-1, true);

  //----------   Exit Door   ------------//
  //exitDoor = this.physics.add.image(450, 165, 'exitDoor');
  exitDoor = this.physics.add.image(6304, 165, 'exitDoor');
  this.physics.add.collider(exitDoor, platforms);

  //----------   Player   ------------//
  player = this.physics.add.sprite(100, 325, 'cat', 'Jump06.png');
  player.setMaxVelocity(1000, 1000);

  //------------   Button Background ------------//
  this.bg_3 = this.add.tileSprite(0, 640, 10000, 400, 'background3');  // Background for buttons
  this.bg_3.setOrigin(0, 0);

  //-------  Keyboard Control Buttons  --------//
  this.input.keyboard.addKey('SPACE', true);   // Capture SPACE key to remove page scroll

  this.input.keyboard.on('keydown', (event) => {
    if (event.code === 'ArrowLeft') moveLeft = true;
    if (event.code === 'ArrowRight') moveRight = true;
    if (event.code === 'Space') jumpPressed = true;
  });
  this.input.keyboard.on('keyup', (event) => {
    if (event.code === 'ArrowLeft') moveLeft = false;
    if (event.code === 'ArrowRight') moveRight = false;
    if (event.code === 'Space') jumpPressed = false;
  });

  //-------  On Screen Control Buttons  --------//
  // - - - - -   Joystick  - - - - -  //
  joystick = this.add.image(joystickX, joystickY, 'joystick');
  joystick.setScrollFactor(0).setInteractive({ draggable: true });
  this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
    if (dragX > (joystickX + 50) || dragX < (joystickX - 50)) return;
    if (dragY > (joystickY + 50) || dragY < (joystickY - 50)) return;
    gameObject.x = dragX;
    gameObject.y = dragY;
    if (dragX > joystickX) {
      moveRight = true;
      moveLeft = false;
    } else if (dragX < joystickX) {
      moveLeft = true;
      moveRight = false;
    };
  });
  this.input.on('dragend', (pointer, gameObject, dragX, dragY) => {
    gameObject.x = joystickX;
    gameObject.y = joystickY;
    moveRight = false;
    moveLeft = false;
  });
  // - - - - -   Jump  - - - - -  //
  buttonJump = this.add.image(625, 850, 'button-jump');
  buttonJump.setScrollFactor(0).setInteractive();
  this.input.on('gameobjectdown', (pointer, gameObject, event) => {
    if (gameObject == buttonJump) jumpPressed = true;
  });
  this.input.on('gameobjectmove', (pointer, gameObject, event) => {
    if (gameObject == buttonJump) jumpPressed = false;
  });

  // - - - -   Reset Buttons on release  - - - -  //

  this.input.on('gameobjectup', (pointer, gameObject, event) => {
    console.log(gameObject);
    if (gameObject == buttonJump) jumpPressed = false;
  });



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
          callback: () => { this.scene.restart() },
          callbackScope: this,
        });
      }
    };
  });
  //---------------   Camera   ---------------//

  this.myCam = this.cameras.main.setViewport(0, 0, 800, 1040).setBounds(0, 0, 6400, 640)
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
    const burrito = this.burritos.create(burritoObject.x + 21, burritoObject.y - 11, 'burrito');
  });

  //--------------   Life Bar   ---------------//
  life = 100;
  let lifeBarText = this.add.text(20, 5, 'Health', { fontsize: '8px', fill: '#000' });
  lifeBarText.setScrollFactor(0);
  let lifeBar = this.add.graphics({ x: 15, y: 20 });
  lifeBar.fillStyle('0x2ecc71', 1).fillRect(0, 0, 200, 15).setScrollFactor(0);
  livesText = this.add.text(20, 40, 'Lives: ' + lives, { fontsize: '8px', fill: '#000' })
  livesText.setScrollFactor(0);

  function collectBurrito(player, burrito) {  // life is gained for every burrito
    burrito.disableBody(true, true)
    if (life >= 96) life = 100;
    else life += 5;
    lifeBar.scaleX = life / 100;
  }
  this.physics.add.overlap(player, this.burritos, collectBurrito, null, this);

  lifeTimer = this.time.addEvent({   // life is depleted every 1 second
    delay: 1200,
    callback: () => {
      if (life >= 5) life -= 5;
      lifeBar.scaleX = life / 100;
      if (life <= 0) {
        lifeTimer.remove();
        lives = lives - 1;
        livesText.setText('Lives: ' + lives);
        death()               // play death animation
        if (lives === 0) gameOver('lose');
        else {
          this.time.addEvent({
            delay: 1000,
            callback: () => { this.scene.restart() },
            callbackScope: this,
          });
        }
      }
    },
    callbackScope: this,
    loop: true
  })

  //----------   Win Condition   ------------//
  function win() { exit = true }
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

function update() {
  if (life > 0) {

    // Turn player sprite left or right based on movement
    if (player.body.velocity.x < 0) player.flipX = true;
    if (player.body.velocity.x > 0) player.flipX = false;

    // Keyboard control, player movements
    if (moveRight) {
      player.setVelocityX(220);
      if (player.body.onFloor()) player.play('run', true);  // Run right
      else player.play('jump', true);  // Falling Right
    } else if (moveLeft) {
      player.setVelocityX(-220);
      if (player.body.onFloor()) player.play('run', true);  // Run left
      else player.play('jump', true); // Falling Left
    } else {
      player.setVelocityX(0);
      if (player.body.onFloor()) player.play('idle', true);
    }
    if (jumpPressed) {  // Jump with different velocities
      if (player.body.onFloor() && jumpTimer === 0) {  // Initiate Jump
        jumpTimer = 1;
        player.setVelocityY(-500);
        player.play('jump');
      } else if (jumpTimer > 0 && jumpTimer < 17) { // Jump button is held, keep jumping higher
        jumpTimer++;
        player.setVelocityY(-500 + (jumpTimer * 2));
      }
    }
    if (jumpPressed === false) jumpTimer = 0; // player is no longer holding the jump button

  }


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


