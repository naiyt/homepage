function Cell(x,  y, reachable) {
	this.reachable = reachable;
	this.x = x;
	this.y = y;
	this.parent = undefined;
	this.g = 0;
	this.h = 0;
	this.f = 0;
}

function AStar(game_map) {
	this.op = [];
	this.queue = PriorityQueue({low: true});
	this.cl = [];
	this.cells = [];
	this.gridWidth = 12;
	this.gridHeight = 12
	this.game_map = game_map;
}

AStar.prototype.init_grid = function() {
	var reachable = false;
	for(var row = 0; row < this.gridHeight; row++) {
		for(var col = 0; col < this.gridWidth; col++) {
			if(this.game_map[row][col] == 1) {
				reachable = false;
			}
			else {
				reachable = true;
			}
			cell = new Cell(row, col, reachable);
			this.cells.push(cell);
		}
	}
}




AStar.prototype.get_cell = function(x, y) {
	return this.cells[x * this.gridHeight + y];
}

AStar.prototype.get_adjacent_cells = function(cell) {
    var cells = []

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

    return cells	
}


// coords from CELL not cell.parent
// check if last val == curr value
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


		/* For testing purposes */
	var cell = this.end;
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
}

AStar.prototype.route = function(start, end) {
	this.start = this.get_cell(start[0],start[1]);
	this.end = this.get_cell(end[0],end[1]);
	
	this.queue.push([this.start.f, this.start]);

	var found = false;
	while(this.queue.size() > 0) {
		var next_cell = this.queue.pop();
		
		var f = next_cell[0];
		var cell = next_cell[1];
		
		this.cl.push(cell);
		if(cell === this.end) {
			found = true;
			return this.create_path();
		}

		var adj_cells = this.get_adjacent_cells(cell);
		//console.log("("+adj_cells[0].x+","+adj_cells[0].y +")");

		for(var c in adj_cells) {
			c = adj_cells[c];
			if(c.reachable && this.cl.indexOf(c) == -1) {	
				if(this.op.indexOf([c.f, c]) != -1) {
					if(c.g > cell.g + 10) {
						this.update_cell(c, cell);
					}
				}
				else {
					this.update_cell(c, cell);
					this.queue.push([c.f, c]);
				}
			
			}
		}

	}
	if(!found) {
		console.log("Terrible error! No path found!");
	}
};


function pathfind(start, end, map) {
	my_star = new AStar(map);
	my_star.init_grid();
	return my_star.route(start, end);
}
