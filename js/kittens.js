// This sectin contains some game constants. It is not super interesting
var GAME_WIDTH = 375;
var GAME_HEIGHT = 500;

// blah blah

var ENEMY_WIDTH = 75;
var ENEMY_HEIGHT = 156;
var MAX_ENEMIES = 3; // ENNEMIES !!!

var PLAYER_WIDTH = 75;
var PLAYER_HEIGHT = 54;

// These two constants keep us from using "magic numbers" in our code
var LEFT_ARROW_CODE = 37;
var RIGHT_ARROW_CODE = 40;
var SHOOT_ARROW_CODE = 38;

// These two constants allow us to DRY
var MOVE_LEFT = 'left';
var MOVE_RIGHT = 'right';

// Preload game images
var images = {};
['enemy.png', 'stars.png', 'player.png', 'kitten.png'].forEach(imgName => {
    var img = document.createElement('img');
    img.src = 'images/' + imgName;
    images[imgName] = img;
});


class Entity {

    render(ctx) {
        ctx.drawImage(this.sprite, this.x, this.y);
    }
}


// This section is where you will be doing most of your coding
class Enemy extends Entity {
    constructor(xPos) {
        super();
        this.x = xPos;
        this.y = -ENEMY_HEIGHT;
        this.sprite = images['enemy.png'];

        // Each enemy should have a different speed
        this.speed = Math.random() / 2 + 0.25;
    }

    update(timeDiff) {
        this.y = this.y + timeDiff * this.speed;
    }
}

class Player extends Entity {
    constructor() {
        super();
        this.x = 2 * PLAYER_WIDTH;
        this.y = GAME_HEIGHT - PLAYER_HEIGHT - 10;
        this.sprite = images['player.png'];

    }
    // This method is called by the game engine when left/right arrows are pressed
    move(direction) {
        if (direction === MOVE_LEFT && this.x > 0) {
            this.x = this.x - PLAYER_WIDTH;
        }
        else if (direction === MOVE_RIGHT && this.x < GAME_WIDTH - PLAYER_WIDTH) {
            this.x = this.x + PLAYER_WIDTH;
        }
    }

}

class Bullet extends Entity {
    constructor(xPos) {
        super();
        this.x = xPos;
        this.y = ENEMY_HEIGHT;
        this.sprite = images['kitten.png'];
        this.boom = false;

        // Each enemy should have a different speed
        this.speed = 0.2;
    }

    shoot(playerPos){
      this.x = playerPos;
      this.y = GAME_HEIGHT - (PLAYER_HEIGHT*3);
    }

    update(timeDiff) {
        this.y = this.y - timeDiff * this.speed;
    }

}




/*
This section is a tiny game engine.
This engine will use your Enemy and Player classes to create the behavior of the game.
The engine will try to draw your game at 60 frames per second using the requestAnimationFrame function
*/
class Engine {
    constructor(element) {
        // Setup the player
        this.player = new Player();
        this.bullet = new Bullet();
        // Setup enemies, making sure there are always three
        this.setupEnemies();

        // Setup the <canvas> element where we will be drawing
        var canvas = document.createElement('canvas');
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
        element.appendChild(canvas);

        this.ctx = canvas.getContext('2d');

        // Since gameLoop will be called out of context, bind it once here.
        this.gameLoop = this.gameLoop.bind(this);
    }

    /*
     The game allows for 5 horizontal slots where an enemy can be present.
     At any point in time there can be at most MAX_ENEMIES enemies otherwise the game would be impossible
     */
    setupEnemies() {
        if (!this.enemies) {
            this.enemies = [];
        }

        while (this.enemies.filter(e => !!e).length < MAX_ENEMIES) {
            this.addEnemy();
        }
    }


    // This method finds a random spot where there is no enemy, and puts one in there
    addEnemy() {
        var enemySpots = (GAME_WIDTH / ENEMY_WIDTH);

        var enemySpot; //UNDEFINED

        // Keep looping until we find a free enemy spot at random
        while (enemySpot === undefined || this.enemies[enemySpot]) {
            enemySpot = Math.floor(Math.random() * enemySpots);
        }

        //1ST STEP
        // enemySpot === undefined, this.enemies[enemySpot] === UNDEFINED
        // enemySpot ===1

        this.enemies[enemySpot] = new Enemy(enemySpot * ENEMY_WIDTH);
    }

    // This method kicks off the game
    start() {
        this.score = 0;
        this.lastFrame = Date.now();

        // Listen for keyboard left/right and update the player
        document.addEventListener('keydown', e => {
            if (e.keyCode === LEFT_ARROW_CODE) {
                this.player.move(MOVE_LEFT);
            }
            else if (e.keyCode === RIGHT_ARROW_CODE) {
                this.player.move(MOVE_RIGHT);
            } else if (e.keyCode === SHOOT_ARROW_CODE) {
                this.bullet.shoot(this.player.x);
            }
        });

        this.gameLoop();
    }

    rrestart() {
        this.score = 0;
        this.lastFrame = Date.now();

        // Listen for keyboard left/right and update the player
        document.addEventListener('keydown', e => {
            if (e.keyCode === LEFT_ARROW_CODE) {
                this.player.move(MOVE_LEFT);
            }
            else if (e.keyCode === RIGHT_ARROW_CODE) {
                this.player.move(MOVE_RIGHT);
            }
        });

        this.gameLoop();
    }

    /*
    This is the core of the game engine. The `gameLoop` function gets called ~60 times per second
    During each execution of the function, we will update the positions of all game entities
    It's also at this point that we will check for any collisions between the game entities
    Collisions will often indicate either a player death or an enemy kill

    In order to allow the game objects to self-determine their behaviors, gameLoop will call the `update` method of each entity
    To account for the fact that we don't always have 60 frames per second, gameLoop will send a time delta argument to `update`
    You should use this parameter to scale your update appropriately
     */

    gameLoop() {
        // Check how long it's been since last frame
        var currentFrame = Date.now();
        var timeDiff = currentFrame - this.lastFrame;

        // Increase the score!
        this.score += timeDiff;

        // Call update on all enemies
        this.enemies.forEach(enemy => enemy.update(timeDiff));
        // Call update on all the bullet
        this.bullet.update(timeDiff);


        // Draw everything!
        this.ctx.drawImage(images['stars.png'], 0, 0); // draw the star bg
        this.enemies.forEach(enemy => enemy.render(this.ctx)); // draw the enemies
        this.player.render(this.ctx); // draw the player
        this.bullet.render(this.ctx); // draw the player


        this.killCat();



        // Check if any enemies should die
        this.enemies.forEach((enemy, enemyIdx) => {
            if (enemy.y > GAME_HEIGHT) {
                delete this.enemies[enemyIdx];
            }
        });

        this.setupEnemies();



        // Check if player is dead
        if (this.isPlayerDead()) {
            // If they are dead, then it's game over!
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(this.score + ' GAME OVER', 5, 30);
            this.ctx.fillText('START AGAIN?', 100, 200);
            this.ctx.fillText('PRESS RESTART', 95, 280);
            console.log("dead");
            // create button
            // var button = {}; //initialized
            //
            var button = document.createElement("button");
            var theNode = document.createTextNode("RESTART");
            var body = document.getElementsByTagName('body')[0];
            button.appendChild(theNode);
            body.appendChild(button);
            button.addEventListener('click', () => {
              this.score = 0;
              this.gameLoop();
            })

        }
        else {
            // If player is not dead, then draw the score
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(this.score, 5, 30);

            // Set the time marker and redraw
            this.lastFrame = Date.now();
            requestAnimationFrame(this.gameLoop);
        }
    }

    killCat() {
      for (var i=0; i<5; i++){
        if (this.enemies[i] != undefined &&
        this.enemies[i].x == this.bullet.x &&
      this.enemies[i].y > (this.bullet.y - 100))
        { delete this.enemies[i];
          var audio = document.getElementById("song");
          audio.play();
        }
        //
      }
    }


    isPlayerDead() {
        // TODO: fix this function!
        // this.y = GAME_HEIGHT - PLAYER_HEIGHT - 10;
        // this.x = 2 * PLAYER_WIDTH;
        var dead = false;
        // var heightLIM = GAME_HEIGHT - (PLAYER_HEIGHT/2) - 10 +(ENEMY_HEIGHT/2);

        for(var i=0; i<5; i++){
          if (this.enemies[i] != undefined) {
            if (this.enemies[i].x == this.player.x
              && this.enemies[i].y >= GAME_HEIGHT - PLAYER_HEIGHT - 50 &&
            this.enemies[i].y <= GAME_HEIGHT - (PLAYER_HEIGHT/2)){
              dead = true;
            }
          }
        }
        //var ENEMY_WIDTH = 75;
        //var ENEMY_HEIGHT = 156;
        //var MAX_ENEMIES = 3; // ENNEMIES !!!
        return dead;
    }
}


// This section will start the game
var gameEngine = new Engine(document.getElementById('app'));
gameEngine.start();
