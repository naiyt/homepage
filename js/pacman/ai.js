/* Big thanks to this article from Laurent Luce for some help on implementing the A*
   search Routine:

   http://www.laurentluce.com/posts/solving-mazes-using-python-simple-recursivity-and-a-search/

   I followed his basic class structure, just converted to Javascript. */

// Creates Cell objects
function Cell(x,  y, reachable) {
    this.reachable = reachable;
    this.x = x;
    this.y = y;
    this.parent = undefined;
    this.g = 0;
    this.h = 0;
    this.f = 0;
}

function AStar(game_map, type) {
    this.queue = []; // Our open queue; TODO - implement as priority queue
    this.cl = []; // Closed array
    this.cells = [];
    this.gridWidth = 12; // TODO - get the height and width from the map
    this.gridHeight = 12;
    this.game_map = game_map;
    this.type = type;
}

AStar.prototype.init_grid = function() {
    var reachable = false;
    for(var row = 0; row < this.gridHeight; row++) {
        for(var col = 0; col < this.gridWidth; col++) {
            if(this.game_map[row][col] === 1) {
                reachable = false;
            }
            // If you are pacman, set any tiles with a ghost as unreachable
            else if(this.type === "pacman") {
                if(this.ghost_in_tile(row,col)) {
                    reachable = false;
                }
                else reachable = true;
            }
            
            else reachable = true;

            cell = new Cell(row, col, reachable);
            this.cells.push(cell);
        }
    }
};

AStar.prototype.ghost_in_tile = function(row, col) {
    var tile_pos = Q.tilePos(col, row);
    return Q.stage().locate(tile_pos.x, tile_pos.y, SPRITE_ENEMY);
};

AStar.prototype.get_cell = function(x, y) {
    return this.cells[x * this.gridHeight + y];
};

AStar.prototype.get_adjacent_cells = function(cell) {
    var cells = [];
    // Down
    if(cell.x < this.gridHeight - 1) {
        cells.push(this.get_cell(cell.x+1,cell.y));
    }
    // Up
    if(cell.x > 0) {
        cells.push(this.get_cell(cell.x-1,cell.y));
    }
    // Left
    if(cell.y > 0) {
        cells.push(this.get_cell(cell.x,cell.y-1));
    }
    // Right
    if(cell.y < this.gridWidth -1) {
        cells.push(this.get_cell(cell.x,cell.y+1));
    }

    return cells;
};


/* This is what's actually passed to the game object. In the form:
   { 'dir': direction, 'coord': coordinates }

   e.g.: {'dir': 'left', 'coord': [0,3]} */
AStar.prototype.create_path = function() {
    var cell = this.end;
    var path = [];

    while(cell.parent) {
        
        curr_coords = [cell.parent.x,cell.parent.y];
        var len = path.length -1;

        // Left
        if(cell.parent.y > cell.y) {
            path.push({'dir': 'left', coord: curr_coords});
        }
        // Right
        else if(cell.parent.y < cell.y) {
            path.push({'dir': 'right', coord: curr_coords});
        }
        // Up
        else if(cell.parent.x > cell.x) {
            path.push({'dir': 'up', coord: curr_coords});
        }
        // Down
        else if(cell.parent.x < cell.x) {
            path.push({'dir': 'down', coord: curr_coords});
        }

        cell = cell.parent;
    }


    /* For testing purposes -- print out the path*/
    /*console.log("Note: in the format (row, col) not (x,y)");
    console.log("End at: (" + this.end.x + "," + this.end.y + ")");
    while(cell.parent != this.start) {
        cell = cell.parent;
        console.log("To: (" + cell.x + "," + cell.y + ")");
    }
    console.log("Start at: (" + this.start.x + "," + this.start.y + ")");*/
    /*path = path.reverse();
    for(var i = 0; i < path.length; i++) {
        console.log(path[i]['dir'] + ' at ' + path[i]['coord'][0] + "," + path[i]['coord'][1]);
    }*/
    return path;

};

AStar.prototype.update_cell = function(adj,cell) {
    adj.g = cell.g + 10;
    adj.h = this.get_heuristic(adj);
    adj.parent = cell;
    adj.f = adj.h + adj.g;
};


AStar.prototype.get_heuristic = function(cell) {
    return 10 * (Math.abs(cell.x - this.end.x) + Math.abs(cell.y - this.end.y));
};

/* I have no idea how efficient Javascript's sort is. Not running into any performance
   issues related to it currently. However, implementing this with a priority queue
   would definitely be the way to go if I was. */
AStar.prototype.sort = function(a, b) {
    if(a[0] < b[0]) return 1;
    if(a[0] > b[1]) return -1;
    return 0;
};

// Return a route from point A to B
AStar.prototype.route = function(start, end) {
    this.start = this.get_cell(start[0],start[1]);
    this.end = this.get_cell(end[0],end[1]);
    
    this.queue.push([this.start.f, this.start]);

    var found = false;
    while(this.queue.length > 0) {
        var next_cell = this.queue.pop();
        
        var f = next_cell[0];
        var cell = next_cell[1];
        
        this.cl.push(cell);
        if(cell === this.end) {
            found = true;
            return this.create_path();
        }

        var adj_cells = this.get_adjacent_cells(cell);

        for(var c in adj_cells) {
            c = adj_cells[c];
            if(c.reachable && this.cl.indexOf(c) == -1) {
                if(this.queue.indexOf([c.f, c]) != -1) {
                    if(c.g > cell.g + 10) {
                        this.update_cell(c, cell);
                    }
                }
                else {
                    this.update_cell(c, cell);
                    this.queue.push([c.f, c]);
                    this.queue.sort(this.sort);
                }
            
            }
        }

    }
    /* Cases where a path may not be found:
       - Stuck between two ghosts
       - A ghost or pacman accidentally clips off the side of the map
        (happens at super high speeds for some reason still. Guessing it's a bug
        with the Quintus collision detection). */
    if(!found) {
        //console.log("Terrible error! No path found!");
        return;
    }
};


function pathfind(start, end, map, type) {
    my_star = new AStar(map, type);
    my_star.init_grid();
    return my_star.route(start, end);
}
