var SPRITE_PLAYER = 1;
var SPRITE_TILES = 2;
var SPRITE_ENEMY = 4;
var SPRITE_DOT = 8;

Q.gravityX = 0;
Q.gravityY = 0;

Q.Sprite.extend("Enemy", {
  init: function(p) {

    this._super(p,{
      sheet:"enemy",
      type: SPRITE_ENEMY,
      collisionMask: SPRITE_PLAYER | SPRITE_TILES
    });
    this.add("2d,enemyControls");
    this.on("hit.sprite",this,"hit");
  },

  hit: function(col) {
    if(col.obj.isA("Player")) {
      Q.stageScene("level1");
    }
  }
});

Q.Sprite.extend("Player", {
  init: function(p) {

    this._super(p,{
      sprite:"player",
      sheet:"player",
      type: SPRITE_PLAYER,
      collisionMask: SPRITE_TILES | SPRITE_ENEMY | SPRITE_DOT,
      playing: false, // If ai is playing, set to false, else true
      switched: false // Whether we just switched from the ai
    });

    this.add("2d");
    this.add("animation");

    if (this.p.playing) {
        this.add("pacManControls");
    }
    else {
         this.add("pacmanAI");
    }

  },
  step: function(dt) {
      // Switch between player control or AI control if needed
      if(this.p.playing && this.p.switched) {
          console.log("Switching to player control...");
          this.del("pacmanAI");
          this.add("pacManControls");
          this.p.switched = false;
      }
      else if(this.p.switched) {
          console.log("Switching to AI control...");            
          this.del("pacManControls");
          this.add("pacmanAI");
          this.p.switched = false;
      }
  }
});


// Pacman's basic eating animation (TODO: to turn it off when velocity is 0)
Q.animations('player', {
   eating: { frames: [0,1], rate: 1/3},
});


// Create the Dot sprite
Q.Sprite.extend("Dot", {
  init: function(p) {
    this._super(p,{
      sheet: 'dot',
      type: SPRITE_DOT,
      // Set sensor to true so that it gets notified when it's
      // hit, but doesn't trigger collisions itself that cause
      // the player to stop or change direction
      sensor: true
    });

    this.on("sensor");
    this.on("inserted");
  },

  // When a dot is hit..
  sensor: function() {
    // Destroy it and keep track of how many dots are left
    this.destroy();
    this.stage.dotCount--;
    // If there are no more dots left, just restart the game
    if(this.stage.dotCount == 0) {
      Q.stageScene("level1");
    }
  },

  // When a dot is inserted, use it's parent (the stage)
  // to keep track of the total number of dots on the stage
  inserted: function() {
    this.stage.dotCount = this.stage.dotCount || 0
    this.stage.dotCount++;
  }
});


// TODO: Implement
Q.Dot.extend("Tower", {
  init: function(p) {
    this._super(Q._defaults(p,{
      sheet: 'pacman'
    }));
  }
});

var tileSize = 70;
// Return a x and y location from a row and column
// in our tile map
Q.tilePos = function(col,row) {
  return { x: col*tileSize + tileSize/2, y: row*tileSize + tileSize/2 };
}