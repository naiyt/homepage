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

var default_speed = 500;

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
  defaults: { speed: default_speed/2, direction: 'left', switchPercent: 2 },

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
  defaults: { speed: default_speed, direction: 'left', switchPercent: 2 },

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
