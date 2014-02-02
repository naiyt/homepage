// rotate the player
// based on our velocity
function rotate(p) {
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

/* Warning! All hands on deck! Nasty hack sighted! This is a red alert, repeat, red alert!
   (There's some issues with the bounds on the edges of the maps. This is basically a custom collision
    detection routine for the outermost walls.)*/
var out_of_bound_max = 35;
function check_for_bounds(p) {
  if(p.x >= 840-out_of_bound_max) {
      p.x = 840-35;
      p.vx = 0;
  }
  else if(p.x <= out_of_bound_max) {
      p.x = 35;
      p.vx = 0;
  }
  else if(p.y >= 840-out_of_bound_max) {
      p.y = 840-35;
      p.vy = 0;
  }
  else if(p.y <= out_of_bound_max) {
      p.y = 35;
      p.vy = 0;
  }
}

// Controls for a human player
Q.component("pacManControls", {
  defaults: { speed: Q.default_speed, direction: 'up' },

  added: function() {
    var p = this.entity.p;
    this.time_elapsed = 0;
    this.time_to_ai = 20; // Seconds before AI kicks in

    Q._defaults(p,this.defaults);

    this.entity.on("step",this,"step");
  },

  step: function(dt) {

    var p = this.entity.p;
    // Increment a counter if we haven't input anything for a certain amount of time; return
    // to AI automatically if > 20 seconds or spacebar is hit
    if(Q.inputs['left'] || Q.inputs['right'] || Q.inputs['up'] || Q.inputs['down']) {
      this.time_elapsed = 0;
    }
    else {
      this.time_elapsed += dt;
    }

    if(this.time_elapsed >= this.time_to_ai || Q.inputs['fire']) {
      p.playing = false;
      p.switched = true;
      this.time_elapsed = 0;
    }

    p.direction = Q.inputs['left']  ? 'left' :
                  Q.inputs['right'] ? 'right' :
                  Q.inputs['up']    ? 'up' :
                  Q.inputs['down']  ? 'down' : p.direction;

    var coords = Q.colAndRow(p.x, p.y);
    
    p.location = [coords['row'],coords['col']];
    

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

    p.prev_location = p.location; // For consistency with the pacmanAI
   }

});


// Pacman AI that uses an A* algorithm to find the shortest path to the next dot
Q.component('pacmanAI', {
  defaults: {
    speed: Q.default_speed,
    searching: true,
    directions: [], // Directions to next dot
    curr_direction: 'right',
    prev_location: [7,8],
    stuck: 0,
    search_wait: 0.06, // Wait a brief moment before re-searching, so we don't immediately change direction
                      // before actually gobbling a tasty dot
    search_time: 0.06,
    re_searches: 0, // Amount of re-searches when escaping an enemy
    max_re: 4, // Total amount of re-searches allowed
    begin_turning: 65 // # of pixels to wait before turning

  },

  added: function() {
    Q._defaults(this.entity.p,this.defaults);
    this.entity.on('step',this,'step');
  },

  step: function(dt) {
    var p = this.entity.p;
    p.speed = Q.default_speed; // To combat a bug with increasing speeds between levels

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

    // If we DON'T find a path (blocked by ghosts, for example),
    // don't execute the rest of the step!
    var continuing = true;

    // Time to search for the next dot; get a random dot and get the path to it
    if(p.searching && p.search_time >= p.search_wait) {
      var searched = this.search_for_dot(5);
      if(!searched) {
        continuing = false;
      }
    }



    if(continuing) {
      if(p.directions.length === 0) { // Out of directions! Search for a new dot next step
        p.search_time += dt;
        p.searching = true;
      }
      else {
        var next = p.directions[p.directions.length-1]; // Reference our next direction without popping it off yet
        temp_coord = [p.coord.row,p.coord.col]; // Just for easier access
  
        this.check_and_turn(next); // Changing directions if necessary
        this.check_if_stuck(temp_coord); // Are we stuck?
  
        var ghosted = this.check_for_ghosts(p.curr_direction['dir']); // This returns the direction we want to go
  
        // When we see a ghost, make sure we're heading in the opposite direction.
        // Once the next path kicks in, Pacman should have found a new path that
        // does not collide with a ghost
        if(ghosted) {
          this.changeDirection(ghosted);
          p.searching = true;
          p.search_time = p.search_wait;
        } else {
          // Quintus removes velocity during a collision;
          // just keep applying velocity in that direction until we start moving in that direction
          this.changeDirection(p.curr_direction['dir']);
        }
  
        p.prev_location = temp_coord;
      }
    }
    
  },

  /* Occasionaly pac-man gets stuck in a loop or in a corner. A hack to get him out.
     If I had more time (and a need) to work on this, I would find the underlying problem
     and get rid of this. */
  check_if_stuck: function(temp_coord) {
      var p = this.entity.p;
      // Keep track of how many times we've been on the same grid
      if(temp_coord[0] == p.prev_location[0] && temp_coord[1] == p.prev_location[1]) {
        p.stuck += 1;
      } else {
        p.stuck = 0;
      }

      // .. and, if we've been on it too long, search for a new dot.
      if(p.stuck >= 15) {
        p.searching = true;
        p.search_time = p.search_wait;
        p.stuck = 0;
      }
  },

  // Determine if we need to change direction
  check_and_turn: function(next) {
      var p = this.entity.p;
      // Get the tile we need to turn on, 
      var to_turn_pos = Q.tilePos(next['coord'][0],next['coord'][1]);
      var row_diff = Math.abs(to_turn_pos['x'] - p.y);
      var col_diff = Math.abs(to_turn_pos['y'] - p.x);
    
      if((row_diff <= p.begin_turning && col_diff <= p.begin_turning)) {
        if(p.curr_direction != next) {
          p.curr_direction = p.directions.pop();
        }
      }
  },

  search_for_dot: function(max) {
    var p = this.entity.p;
    var total_searches = 0;
    while(total_searches < max) {
      dot = next_dot(Q.currMap);
      p.directions = pathfind([p.coord.row,p.coord.col],dot,Q.currMap,"pacman");
      // On occasion pathfind might not return a path (if, for example, there
      // are ghosts blocking both possible directions). Allow him to 
      // recalculate max times before giving up.
      if(!p.directions) {
        total_searches += 1;
      }
      else {
        break;
      }
    }

    if(!p.directions) {
      return false;
    }

    p.searching = false;
    p.search_time = 0;

    //var next = p.directions[p.directions.length-1];

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

  // Checks up to two tiles in front of us, and tries to look around corners.
  // The corners don't seem to work very well at the moment.
  check_for_ghosts: function(direction) {
    var p = this.entity.p;
    var dist = 140;
    switch(direction) {
      case "left":
        if(Q.stage().locate(p.x-dist,p.y,SPRITE_ENEMY) ||
         Q.stage().locate(p.x-dist/2,p.y,SPRITE_ENEMY) ||
         Q.stage().locate(p.x-dist/2,p.y-dist/2,SPRITE_ENEMY) ||
         Q.stage().locate(p.x-dist/2,p.y+dist/2,SPRITE_ENEMY)) {
            return 'right';
        }
        break;
      case "right":
        if(Q.stage().locate(p.x+dist,p.y,SPRITE_ENEMY) ||
          Q.stage().locate(p.x+dist/2,p.y,SPRITE_ENEMY) ||
          Q.stage().locate(p.x+dist/2,p.y-dist/2,SPRITE_ENEMY) ||
          Q.stage().locate(p.x-dist/2,p.y+dist/2,SPRITE_ENEMY)) {
            return 'left';
        }
        break;
      case "up":
        if(Q.stage().locate(p.x,p.y-dist,SPRITE_ENEMY) ||
          Q.stage().locate(p.x,p.y-dist/2,SPRITE_ENEMY)||
          Q.stage().locate(p.x-dist/2,p.y-dist/2,SPRITE_ENEMY) ||
          Q.stage().locate(p.x+dist/2,p.y-dist/2,SPRITE_ENEMY)) {
            return 'down';
        }
        break;
      case "down":
        if(Q.stage().locate(p.x,p.y+dist,SPRITE_ENEMY) ||
          Q.stage().locate(p.x,p.y+dist/2,SPRITE_ENEMY) ||
          Q.stage().locate(p.x-dist/2,p.y+dist/2,SPRITE_ENEMY) ||
          Q.stage().locate(p.x+dist/2,p.y+dist/2,SPRITE_ENEMY)) {
            return 'up';
        }
        break;
    }

    }
  
});

var ghost_diff = 0.30; // Make ghosts this percentage of the speed of Pacman

Q.component('smartGhost', {
  defaults: {
    speed: Q.default_speed * ghost_diff,
    searching: true,
    direct: [], // Directions to next dot
    curr_direction: 'right',
    location: [7,8],
    stuck: 0,
    begin_turning: 65
  },

  added: function() {
    var p = this.entity.p;
    Q._defaults(p,this.defaults);
    this.entity.on('step',this,'step');
  },

  step: function(dt) {
    var p = this.entity.p;
    p.speed = Q.default_speed * 0.30;

    check_for_bounds(p);

    var coord = Q.colAndRow(p.x, p.y);

    // Time to search for the next dot; get a random dot and get the path to it
    if(p.searching) {
      //dot = next_dot(Q.currMap);
      p.direct = pathfind([coord.row,coord.col],player.p.prev_location,Q.currMap, "ghost");
      p.searching = false;
    }
    if(p.direct) {
      if(p.direct.length === 0) { // Out of directions! What ever shall we do.
        p.searching = true;
      }
      else {
        var next = p.direct[p.direct.length-1];
        coord = [coord.row,coord.col];
  
        var to_turn_pos = Q.tilePos(next['coord'][0],next['coord'][1]);
        var row_diff = Math.abs(to_turn_pos['x'] - p.y);
        var col_diff = Math.abs(to_turn_pos['y'] - p.x);
  
        if((row_diff <= p.begin_turning && col_diff <= p.begin_turning)) {
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
          p.searching = true;
          p.stuck = 0;
        }
  
        // To keep track of our last location
        p.location = coord;
      }
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


// Ghost that picks a random direction
Q.component("dumbGhost", {
  defaults: {
    speed: Q.default_speed * ghost_diff,
    direction: 'left',
    switchPercent: 2,
    location:[0,0]},

  added: function() {
    var p = this.entity.p;
    Q._defaults(p,this.defaults);
    this.entity.on("step",this,"step");
    this.entity.on('hit',this,"changeDirection");
  },

  step: function(dt) {

    var p = this.entity.p;
    p.speed = Q.default_speed * ghost_diff;
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

    var coord = Q.colAndRow(p.x, p.y);

    if(coord[0] == p.location[0] && coord[1] == p.location[1]) {
      p.stuck += 1;
    } else {
      p.stuck = 0;
    }

    if(p.stuck >= 20) {
      this.tryDirection();
      p.stuck = 0;
    }

    p.location = coord;
  },

  tryDirection: function() {
    var p = this.entity.p;
    var from = p.direction;
    if(p.vy !== 0 && p.vx === 0) {
      p.direction = Math.random() < 0.5 ? 'left' : 'right';
    } else if(p.vx !== 0 && p.vy === 0) {
      p.direction = Math.random() < 0.5 ? 'up' : 'down';
    }
    else {
      var rand = Math.random();
      if(rand < 0.25) p.direction = 'up';
      else if (rand < 0.5) p.direction = 'down';
      else if (rand < 0.75) p.direction = 'left';
      else p.direction = 'right';
    }
  },

  changeDirection: function(collision) {
    var p = this.entity.p;
    if(p.vx === 0 && p.vy === 0) {
      if(collision.normalY) {
        p.direction = Math.random() < 0.5 ? 'left' : 'right';
      } else if(collision.normalX) {
        p.direction = Math.random() < 0.5 ? 'up' : 'down';
      }
    }
  }
});


// Just choosing a random dot for now. May try to come up with something more sophisticated
function next_dot(map) {
  var possible_dots = [];
  for(var row = 0; row <= 11; row++) {
    for(var col = 0; col <= 11; col++) {
      if(map[row][col] === 0) {
        possible_dots.push([row,col]);
      }
    }
  }

  var randIndex = Math.floor(Math.random() * (possible_dots.length-1));
  return possible_dots[randIndex];
}


// Return a x and y location from a row and column
// in our tile map
Q.tilePos = function(col,row) {
  return { x: col*tileSize + tileSize/2, y: row*tileSize + tileSize/2 };
};

// Given an x and y coordinate, returns it's position on the grid
Q.colAndRow = function(col,row) {
  return {
    col: Math.round((col - tileSize/2)/tileSize),
    row: Math.round((row - tileSize/2)/tileSize)
  };
};
