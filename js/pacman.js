    // 1. Wait for the onload even
    window.addEventListener("load",function() {

      var top_left = $('#top-left');
      var canvas = $('#pacman');

      // Set up a basic Quintus object
      // with the necessary modules and controls
      var Q = window.Q = Quintus({ development: true })
              .include("Sprites, Scenes, Input, 2D, Anim")
              .setup('pacman',{width: 840, height: 840})
              .controls(true)

      // Add in the default keyboard controls
      // along with joypad controls for touch
      Q.input.keyboardControls();
      Q.input.joypadControls();

      Q.gravityX = 0;
      Q.gravityY = 0;

      var SPRITE_PLAYER = 1;
      var SPRITE_TILES = 2;
      var SPRITE_ENEMY = 4;
      var SPRITE_DOT = 8;


      /* Warning! All hands on deck! Nasty hack sighted! This is a red alert, repeat, red alert!
         (There's some issues with the bounds on the edges of the maps. This is basically a custom collision
          detection routine for the outermost walls.)*/
      function check_for_bounds(p) {
        if(p.x >= 840-35) {
            p.x = 840-35;
            p.vx = 0;
        }
        else if(p.x <= 35) {
            p.x = 35;
            p.vx = 0;
        }
        else if(p.y >= 840-35) {
            p.y = 840-35;
            p.vy = 0;
        }
        else if(p.y <= 35) {
            p.y = 35;
            p.vy = 0;
        }
      }

      function rotate(p) {
          // rotate the player
          // based on our velocity
          if(p.vx > 0) {
            p.angle = 0;
          } else if(p.vx < 0) {
            p.angle = 180;
          } else if(p.vy > 0) {
            p.angle = 90;
          } else if(p.vy < 0) {
            p.angle = -90;
          }
     }

      Q.component("pacManControls", {
        // default properties to add onto our entity
        defaults: { speed: 500, direction: 'up' },

        // called when the component is added to
        // an entity
        added: function() {
          var p = this.entity.p;
          this.time_elapsed = 0;
          this.time_to_ai = 20; // Seconds before AI kicks in

          // add in our default properties
          Q._defaults(p,this.defaults);

          // every time our entity steps
          // call our step method
          this.entity.on("step",this,"step");
        },

        step: function(dt) {
          // grab the entity's properties
          // for easy reference
          var p = this.entity.p;

          this.time_elapsed += dt;

          if(this.time_elapsed >= this.time_to_ai || Q.inputs['fire']) {
            p.playing = false;
            p.switched = true;
            this.time_elapsed = 0;
          }

          p.prev_direction = p.direction;
          // grab a direction from the input
          p.direction = Q.inputs['left']  ? 'left' :
                        Q.inputs['right'] ? 'right' :
                        Q.inputs['up']    ? 'up' :
                        Q.inputs['down']  ? 'down' : p.direction;

         
          check_for_bounds(p);
          rotate(p);
          // based on our direction, try to add velocity
          // in that direction
          switch(p.direction) {
            case "left": p.vx = -p.speed; break;
            case "right":p.vx = p.speed; break;
            case "up":   p.vy = -p.speed; break;
            case "down": p.vy = p.speed; break;
          }

          /*if(p.x < 30) {
            p.x = 30;
          }
          else if(p.x > 800) {
            p.x = 800;
          }
          else if(p.y < 30) {
            p.y = 30;
          }
          else if(p.y > 800) {
            p.y = 800;
          }*/
        }

      });


      Q.Sprite.extend("Player", {
        init: function(p) {

          this._super(p,{
            sprite:"player",
            sheet:"player",
            type: SPRITE_PLAYER,
            collisionMask: SPRITE_TILES | SPRITE_ENEMY | SPRITE_DOT,
            playing: false,
            switched: false
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


      // Tower is just a dot with a different sheet - use the same
      // sensor and counting functionality
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

      Q.TileLayer.extend("PacManMap",{
        init: function() {
          this._super({
            type: SPRITE_TILES,
            dataAsset: 'level.json',
            sheet: 'tiles',
            tileW: 70,
            tileH: 70
          });

        },
        
        setup: function() {
          // Clone the top level arriw
          var tiles = this.p.tiles = this.p.tiles.concat();
          var size = this.p.tileW;
          for(var y=0;y<tiles.length;y++) {
            var row = tiles[y] = tiles[y].concat();
            for(var x =0;x<row.length;x++) {
              var tile = row[x];
              
              if(tile == 0 || tile == 2) {
                var className = tile == 0 ? 'Dot' : 'Tower'
                this.stage.insert(new Q[className](Q.tilePos(x,y)));
                row[x] = 0;
              }
            }
          }
        }

      });

      Q.component("enemyControls", {
        defaults: { speed: 100, direction: 'left', switchPercent: 2 },

        added: function() {
          var p = this.entity.p;

          Q._defaults(p,this.defaults);

          this.entity.on("step",this,"step");
          this.entity.on('hit',this,"changeDirection");
        },

        step: function(dt) {
          var p = this.entity.p;
          check_for_bounds(p);
          if(Math.random() < p.switchPercent / 100) {
            this.tryDirection();
          }

          switch(p.direction) {
            case "left": p.vx = -p.speed; break;
            case "right":p.vx = p.speed; break;
            case "up":   p.vy = -p.speed; break;
            case "down": p.vy = p.speed; break;
          }
        },

        tryDirection: function() {
          var p = this.entity.p; 
          var from = p.direction;
          if(p.vy != 0 && p.vx == 0) {
            p.direction = Math.random() < 0.5 ? 'left' : 'right';
          } else if(p.vx != 0 && p.vy == 0) {
            p.direction = Math.random() < 0.5 ? 'up' : 'down';
          }
        },

        changeDirection: function(collision) {
          var p = this.entity.p;
          if(p.vx == 0 && p.vy == 0) {
            if(collision.normalY) {
              p.direction = Math.random() < 0.5 ? 'left' : 'right';
            } else if(collision.normalX) {
              p.direction = Math.random() < 0.5 ? 'up' : 'down';
            }
          }
        }
      });

      Q.component("pacmanAI", {
        defaults: { speed: 200, direction: 'left', switchPercent: 2 },

        added: function() {
          var p = this.entity.p;

          Q._defaults(p,this.defaults);
          this.entity.on("step",this,"step");
          this.entity.on('hit',this,"changeDirection");
        },

        step: function(dt) {
          if(Q.inputs['left'] || Q.inputs['right'] || Q.inputs['up'] || Q.inputs['down']) {
             this.entity.p.playing = true;
             this.entity.p.switched = true;
          } 

          var p = this.entity.p;
          check_for_bounds(p);
          rotate(p);

          if(Math.random() < p.switchPercent / 100) {
            this.tryDirection();
          }
          switch(p.direction) {
            case "left": p.vx = -p.speed; break;
            case "right":p.vx = p.speed; break;
            case "up":   p.vy = -p.speed; break;
            case "down": p.vy = p.speed; break;
          }
        },

        tryDirection: function() {
          var p = this.entity.p; 
          var from = p.direction;
          if(p.vy != 0 && p.vx == 0) {
            p.direction = Math.random() < 0.5 ? 'left' : 'right';
          } else if(p.vx != 0 && p.vy == 0) {
            p.direction = Math.random() < 0.5 ? 'up' : 'down';
          }
        },

        changeDirection: function(collision) {
          var p = this.entity.p;
          if(p.vx == 0 && p.vy == 0) {
            if(collision.normalY) {
              p.direction = Math.random() < 0.5 ? 'left' : 'right';
            } else if(collision.normalX) {
              p.direction = Math.random() < 0.5 ? 'up' : 'down';
            }
          }
        }
      });


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

      Q.scene("level1",function(stage) {
        var map = stage.collisionLayer(new Q.PacManMap());
        map.setup();

        player = new Q.Player(Q.tilePos(10,7));
        player.play("eating");
        stage.insert(player);

        stage.insert(new Q.Enemy(Q.tilePos(10,4)));
        stage.insert(new Q.Enemy(Q.tilePos(15,10)));
        stage.insert(new Q.Enemy(Q.tilePos(5,10)));
      });

      Q.load("sprites.png, sprites.json, level.json, tiles.png, Pacman.png", function() {
        Q.sheet("tiles","tiles.png", { tileW: 70, tileH: 70 });
        Q.sheet("player","Pacman.png", {tileW: 70, tileH: 70});
        
        Q.compileSheets("sprites.png","sprites.json");
        Q.stageScene("level1");
      });

    });
