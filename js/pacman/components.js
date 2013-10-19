/* Warning! All hands on deck! Nasty hack sighted! This is a red alert, repeat, red alert!
   (There's some issues with the bounds on the edges of the maps. This is basically a custom collision
    detection routine for the outermost walls.)*/
function check_for_bounds(p) {
  if(p.x >= 840-30) {
      p.x = 840-35;
      p.vx = 0;
  }
  else if(p.x <= 30) {
      p.x = 35;
      p.vx = 0;
  }
  else if(p.y >= 840-30) {
      p.y = 840-35;
      p.vy = 0;
  }
  else if(p.y <= 30) {
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
  defaults: { speed: default_speed, direction: 'up' },

  added: function() {
    var p = this.entity.p;
    this.time_elapsed = 0;
    this.time_to_ai = 20; // Seconds before AI kicks in

    Q._defaults(p,this.defaults);

    this.entity.on("step",this,"step");
  },

  step: function(dt) {
    // grab the entity's properties
    // for easy reference
    var p = this.entity.p;

    this.time_elapsed += dt;

    // If it's been time_elapsed or the player hits spacebar, 
    // change to ai control
    if(this.time_elapsed >= this.time_to_ai || Q.inputs['fire']) {
      p.playing = false;
      p.switched = true;
      this.time_elapsed = 0;
    }

    p.direction = Q.inputs['left']  ? 'left' :
                  Q.inputs['right'] ? 'right' :
                  Q.inputs['up']    ? 'up' :
                  Q.inputs['down']  ? 'down' : p.direction;

  

    check_for_bounds(p); // Check for a far wall; TODO: Refactor, this is silly
    rotate(p); // Rotate the sprite if necessary
    var coords = Q.colAndRow(p.x, p.y);
    
    p.location = [coords['row'],coords['col']];
    
    

    // based on our direction, try to add velocity
    // in that direction
    switch(p.direction) {
      case "left": p.vx = -p.speed; break;
      case "right":p.vx = p.speed; break;
      case "up":   p.vy = -p.speed; break;
      case "down": p.vy = p.speed; break;
    }


   }

});

Q.component("enemyControls", {
  defaults: { speed: default_speed - 100, direction: 'left', switchPercent: 2 },

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
    else {
      var rand = Math.random();
      if(rand < .25) p.direction = 'up';
      else if (rand < .5) p.direction = 'down';
      else if (rand < .75) p.direction = 'left';
      else p.direction = 'right';
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

var default_speed = 300;

Q.component('pacmanAI', {
  defaults: {
    speed: default_speed,
    searching: true,
    direct: [], // Directions to next dot
    curr_direction: 'right',
    location: [7,8],
    stuck: 0,
    search_wait: .08, // Wait a brief moment before re-searching, so we don't immediately change direction
                      // before actually gobbling a tasty dot
    search_time: .08,
    re_searches: 0, // Amount of re-searches when escaping an enemy
    max_re: 5 // Total amount of re-searches allowed

  },

  added: function() {
    var p = this.entity.p;
    Q._defaults(p,this.defaults);
    this.entity.on('step',this,'step');
  },

  step: function(dt) {
    var p = this.entity.p;
    p.speed = default_speed;
    // If an arrow key is pressed, remove the ai and allow filthy humans to play
    if(Q.inputs['left'] || Q.inputs['right'] || Q.inputs['up'] || Q.inputs['down']) {
       p.playing = true;
       p.switched = true;
       p.searching = true;
       p.search_time = p.search_wait;
       return;
    }

    p.coord = Q.colAndRow(p.x, p.y);

    check_for_bounds(p);
    rotate(p);
    


    // Time to search for the next dot; get a random dot and get the path to it
    if(p.searching && p.search_time >= p.search_wait) {

      while(!this.search_for_dot()) { }

    }

    if(p.direct.length === 0) { // Out of directions! What ever shall we do.
      p.search_time += dt;
      p.searching = true;
    }
    else {
      var next = p.direct[p.direct.length-1];
      coord = [p.coord.row,p.coord.col];

      var to_turn_pos = Q.tilePos(next['coord'][0],next['coord'][1]);
      var row_diff = Math.abs(to_turn_pos['x'] - p.y);
      var col_diff = Math.abs(to_turn_pos['y'] - p.x);

      if((row_diff <= 40 && col_diff <= 40)) {
        if(p.curr_direction != next) {
          p.curr_direction = p.direct.pop();
        }
      }

      var ghosted = this.check_for_ghosts(p.curr_direction['dir']);
      if(ghosted) {
        p.ghost_direction = ghosted;
        this.changeDirection(ghosted);
        p.searching = true;
        p.search_time += dt;
      } else {
        this.changeDirection(p.curr_direction['dir']);
      }

      // Keep track of how many times we've been on the same grid
      if(coord[0] == p.location[0] && coord[1] == p.location[1]) {
        p.stuck += 1;
      } else {
        p.stuck = 0;
      }

      // .. and, if we've been on it too long, search for a new dot.
      // Otherwise Mr. PacMan will occasionally get stuck in a corner or something
      if(p.stuck >= 15) {      
        console.log("stuck");
        p.searching = true;
        p.search_time = p.search_wait;
        p.stuck = 0;
      }

      // To keep track of our last location

      p.location = coord;
    }
    
  },

  search_for_dot: function(max) {
    var p = this.entity.p;

    dot = next_dot(Q.currMap);
    p.direct = pathfind([p.coord.row,p.coord.col],dot,Q.currMap);
    p.searching = false;
    p.search_time = 0;          

    if(p.re_searches >= p.max_re) {
      p.re_searches = 0;
      return true;
    }

    var next = p.direct[p.direct.length-1];

    if(p.ghost_direction && next) {
      p.re_searches += 1;
      if(next['dir'] != p.ghost_direction) return false;
    }

    p.ghost_direction = undefined;
    p.re_searches = 0;
    return true;


  },

  changeDirection: function(direction) {
    var p = this.entity.p;
    switch(direction) {
      case "left": p.vx = -p.speed; break;
      case "right":p.vx = p.speed; break;
      case "up": p.vy = -p.speed; break;
      case "down": p.vy = p.speed; break;
     }
    },

    check_for_ghosts: function(direction) {
      var p = this.entity.p;
      var dist = 140;
      switch(direction) {
        case "left": 
          if(Q.stage().locate(p.x-dist,p.y,SPRITE_ENEMY) ||Q.stage().locate(p.x-dist/2,p.y,SPRITE_ENEMY)) {
            console.log("He's left!");
            return 'right';
          }
          break;
        case "right":
          if(Q.stage().locate(p.x+dist,p.y,SPRITE_ENEMY) ||Q.stage().locate(p.x+dist/2,p.y,SPRITE_ENEMY)) {
            console.log("He's right!");
            return 'left';
          }
          break;

        case "up":
          if(Q.stage().locate(p.x,p.y-dist,SPRITE_ENEMY)  ||Q.stage().locate(p.x,p.y-dist/2,SPRITE_ENEMY)) {
            console.log("He's up!");
            return 'down';
          }
          break;

        case "down":
          if(Q.stage().locate(p.x,p.y+dist,SPRITE_ENEMY)  ||Q.stage().locate(p.x,p.y+dist/2,SPRITE_ENEMY)) {
            console.log("He's down!");
            return 'up';
          }
          break;
      }

    }


  
});


Q.component('ghostAI', {
  defaults: {
    speed: default_speed - 100,
    searching: true,
    direct: [], // Directions to next dot
    curr_direction: 'right',
    location: [7,8],
    stuck: 0,
    search_wait: .05, // Wait a brief moment before re-searching, so we don't immediately change direction
                      // before actually gobbling a tasty dot
    search_time: .05
  },

  added: function() {
    var p = this.entity.p;
    Q._defaults(p,this.defaults);
    this.entity.on('step',this,'step');
  },

  step: function(dt) {
    var p = this.entity.p;
    p.speed = default_speed - 100;
    // If an arrow key is pressed, remove the ai and allow filthy humans to play
    if(Q.inputs['left'] || Q.inputs['right'] || Q.inputs['up'] || Q.inputs['down']) {
       p.playing = true;
       p.switched = true;
       p.searching = true;
       p.search_time = p.search_wait;
       return;
    }

    check_for_bounds(p);

    var coord = Q.colAndRow(p.x, p.y);

    // Time to search for the next dot; get a random dot and get the path to it
    if(p.searching && p.search_time >= p.search_wait) {
      //dot = next_dot(Q.currMap);
      p.direct = pathfind([coord.row,coord.col],player.p.location,Q.currMap);
      p.searching = false;
      p.search_time = 0;
    }

    if(p.direct.length === 0) { // Out of directions! What ever shall we do.
      p.search_time += dt;
      p.searching = true;
    }
    else {
      var next = p.direct[p.direct.length-1];
      coord = [coord.row,coord.col];

      var to_turn_pos = Q.tilePos(next['coord'][0],next['coord'][1]);
      var row_diff = Math.abs(to_turn_pos['x'] - p.y);
      var col_diff = Math.abs(to_turn_pos['y'] - p.x);

      if((row_diff <= 40 && col_diff <= 40)) {
        if(p.curr_direction != next) {
          p.curr_direction = p.direct.pop();
        }
      }

      this.changeDirection(p.curr_direction['dir']);

      // Keep track of how many times we've been on the same grid
      if(coord[0] == p.location[0] && coord[1] == p.location[1]) {
        p.stuck += 1;
      } else {
        p.stuck = 0;
      }

      // .. and, if we've been on it too long, search for a new dot.
      // Otherwise Mr. PacMan will occasionally get stuck in a corner or something
      if(p.stuck >= 20) {      
        console.log("Stuck");
        p.searching = true;
        p.search_time = p.search_wait;
        p.stuck = 0;
      }

      // To keep track of our last location
      p.location = coord;
    }
    
  },

  changeDirection: function(direction) {
    var p = this.entity.p;
    switch(direction) {
      case "left": p.vx = -p.speed; break;
      case "right":p.vx = p.speed; break;
      case "up": p.vy = -p.speed; break;
      case "down": p.vy = p.speed; break;
    }

  }
});

// Just choosing a random dot for now. May try to come up with something more sophisticated
function next_dot(map) {
  var possible_dots = []
  for(var row = 0; row <= 11; row++) {
    for(var col = 0; col <= 11; col++) {
      if(map[row][col] == 0) {
        possible_dots.push([row,col])
      }
    }
  }

  var randIndex = Math.floor(Math.random() * (possible_dots.length-1));
  //console.log(possible_dots.length);
  //console.log("To: " + possible_dots[randIndex]);
  // console.log(randIndex);
  return possible_dots[randIndex];
}