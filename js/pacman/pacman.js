var initial_map =
[
[1,1,1,0,0,0,0,0,0,1,1,1],
[0,0,0,0,1,1,1,1,0,0,0,0],
[0,1,1,0,0,0,0,0,0,1,1,0],
[0,0,0,0,1,1,1,1,0,0,0,0],
[0,1,1,0,1,1,1,1,0,1,1,0],    
[0,0,0,0,0,0,0,0,0,0,0,0],
[0,1,1,0,1,1,1,1,0,1,1,0],
[0,0,0,0,1,1,1,1,0,0,0,0],
[0,1,1,0,0,0,0,0,0,1,1,0],
[0,1,1,0,1,1,1,1,0,1,1,0],
[0,0,0,0,0,0,0,0,0,0,0,0],
[1,1,1,1,1,1,1,1,1,1,1,1]
];

var Q = window.Q = Quintus({ development: true })
        .include("Sprites, Scenes, Input, 2D, Anim")
        .setup('pacman',{width: 840, height: 840})
        .controls(true)

Q.currMap = jQuery.extend(true, {}, initial_map);
Q.input.keyboardControls();
Q.input.joypadControls();
var tileSize = 70;

Q.scene("level1",function(stage) {
  Q.currMap = jQuery.extend(true, {}, initial_map);
  var map = stage.collisionLayer(new Q.PacManMap());
  map.setup();

  player = new Q.Player(Q.tilePos(5,0));
  player.play("eating");

  stage.insert(player);
  stage.insert(new Q.Enemy(Q.tilePos(1,11)));
  //stage.insert(new Q.Enemy(Q.tilePos(15,10)));
  //stage.insert(new Q.Enemy(Q.tilePos(5,10)));
});

Q.load("sprites.png, sprites.json, level.json, tiles.png, Pacman.png", function() {
  Q.sheet("tiles","tiles.png", { tileW: tileSize, tileH: tileSize });
  Q.sheet("player","Pacman.png", {tileW: tileSize, tileH: tileSize});
  
  Q.compileSheets("sprites.png","sprites.json");
  Q.stageScene("level1");
});


Q.TileLayer.extend("PacManMap",{
  init: function() {
    this._super({
      type: SPRITE_TILES,
      dataAsset: 'level.json',
      sheet: 'tiles',
      tileW: tileSize,
      tileH: tileSize
    });

  },
  
  setup: function() {
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

// Return a x and y location from a row and column
// in our tile map
Q.tilePos = function(col,row) {
  return { x: col*tileSize + tileSize/2, y: row*tileSize + tileSize/2 };
}

// Given an x and y coordinate, returns it's position on the grid
Q.colAndRow = function(col,row) {
  return {
    col: Math.round((col - tileSize/2)/tileSize),
    row: Math.round((row - tileSize/2)/tileSize)
  };
}
