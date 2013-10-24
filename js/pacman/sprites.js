var SPRITE_PLAYER = 1;
var SPRITE_TILES = 2;
var SPRITE_ENEMY = 4;
var SPRITE_DOT = 8;

Q.gravityX = 0;
Q.gravityY = 0;
Q.deaths = 0;
Q.wins = 0;

//var totalFrames = 0; 
//var totalTime = 0;

// Ghosts!
Q.Sprite.extend("Enemy", {
  init: function(p) {

    this._super(p,{
      sheet:"enemy",
      type: SPRITE_ENEMY,
      collisionMask: SPRITE_PLAYER | SPRITE_TILES
    });
    this.add("2d,ghostAI");
    this.on("hit.sprite",this,"hit");
  },

  hit: function(col) {
    if(col.obj.isA("Player")) {
      Q.deaths += 1;
      $('#deaths').html(Q.deaths);
      Q.stageScene("level1");
    }
  },

  set_ai: function(ai) {
    if(ai === 0) {
      this.add("smartGhost");
    }
    else {
      this.add("dumbGhost");
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
      switched: false, // Whether we just switched from the ai
      vx: Q.default_speed
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

      // Uncomment if you want to keep track of FPS
      //totalTime += dt;
      //totalFrames += 1;
      //$('#fps').text("FPS: " + Math.round(totalFrames/totalTime) + " MS: " + Math.round(totalFrames/totalTime));

      // Switch between player control or AI control if needed
      if(this.p.playing && this.p.switched) {
          $('#player').text('You!');
          this.del("pacmanAI");
          this.add("pacManControls");
          this.p.switched = false;
      }
      else if(this.p.switched) {
          $('#player').text('AI');
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
// Mmmmm...dots....
Q.Sprite.extend("Dot", {
  init: function(p) {
    this._super(p,{
      sheet: 'dot',
      type: SPRITE_DOT,
      sensor: true,
    });
    var coord = Q.colAndRow(this.p.x, this.p.y);
    this.p.col = coord.col;
    this.p.row = coord.row;

    this.on("sensor");
    this.on("inserted");
  },

  sensor: function() {
    Q.currMap[this.p.row][this.p.col] = -1;
    this.destroy();
    this.stage.dotCount--;
    // If there are no more dots left, just restart the game
    if(this.stage.dotCount === 0) {
      // TODO - Extract winning processing to separate method
      //          (it's dumb to have it here)
      Q.wins += 1;
      $('#wins').html(Q.wins);
      Q.stageScene("level1");
      Q.default_speed *= 1.3;

      if(Q.default_speed > Q.max_speed) {
        Q.default_speed = 300;
      }
    }
  },

  // When a dot is inserted, use it's parent (the stage)
  // to keep track of the total number of dots on the stage
  inserted: function() {
    this.stage.dotCount = this.stage.dotCount || 0;
    this.stage.dotCount++;
  }
});