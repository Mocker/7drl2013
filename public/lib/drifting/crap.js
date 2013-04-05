/***

messy game code ignoring the engine and shit for now to get something running


***/

var Crap = {
	primarySeed : null,
	gameStarted : null,
	display : null,
	container : null,
	map: {},
	engine : null,
	player: null,
	planets: null,
	entities: null,
	npcs : null,
	isPaused : true,
	turnCallback : undefined,
	turnTimeout : 100,
	starmap : null,

	init : function(divID,playerName) {
		this.display = new ROT.Display({spacing:1.1});
		this.container = divID;
        //$(this.container).append(this.display.getContainer());
        this.player = Player;
        this.player.name = playerName;
        this.gameStarted = new Date;
        var seedTxt = $('#game_seed').val();
        this.primarySeed = (seedTxt && seedTxt.length > 0) ? seedTxt : playerName+this.gameStarted.getTime();
        Math.seedrandom(this.primarySeed);

        this.scheduler = new ROT.Scheduler();
		this.engine = new ROT.Engine();
        //on initial start create player with ship n crew
        UI.roll_player(this);
        this.player.drawCrew();
        //this.engine.start();
        this.resumeGame();

        //init StarMap (and galaxy generator)
        //TODO:: game should be paused until map is generated and running
        this.starmap = new StarMap(divID);
        this.starmap.init();
        
        UI.bind_map();
	},

	//player entered a sector (system/planet/area). generate the appropriate ROT map and load it
	loadSector : function() {
		//this._generateMap();
        //this.engine = new ROT.Engine();
        //this.engine.start();
	},

	pauseGame : function(){
		this.engine.lock();
		this.isPaused = true;
		this.turnCallback = undefined;
	},

	resumeGame : function(){
		this.isPaused = false;
		//this.engine.unlock();
		this.turnCallback = setTimeout(this._doTick,this.turnTimeout);
	},

	_generateMap : function() {
		var digger = new ROT.Map.Digger();
        var freeCells = [];
        
        var digCallback = function(x, y, value) {
            if (value) { return; }
            
            var key = x+","+y;
            this.map[key] = "·";
            freeCells.push(key);
        }
        digger.create(digCallback.bind(this));
	},

	_drawWholeMap: function() {
        for (var key in this.map) {
            var parts = key.split(",");
            var x = parseInt(parts[0]);
            var y = parseInt(parts[1]);
            this.display.draw(x, y, this.map[key]);
        }
    },


    _doTick	: function() {
    	//do a bunch of stuff every 'turn'
    	//fetch scheduler actors
    	var next = Crap.scheduler.next();
    	next.act();

    	//setup next callback if game doesn't get paused
    	if(!Crap.isPaused) this.turnCallback = setTimeout(Crap._doTick,Crap.turnTimeout);
    },


};

var STATUS = {
	"healthy" : {'color':'#000'},
	"wounded" : {'color':'#400' },
	"dead" : {'color': '#900' }
};

var Player = {
	name : "Player 1",
	crew : {},
	ship : null,
	cargo : [],
	cur : {
		'cargoUsed': 0,
	},

	//go through each crew member and draw
	drawCrew : function(){
		if(!this.ship) return;
		for(var c in this.crew){
			console.log('drawing crew', this.crew[c]);
			var bg = this.ship.map_colors[this.crew[c].pos.x+','+this.crew[c].pos.y] || MAP_COLORS.DEFAULT;
			//bg = '#000';
			this.ship.display.draw(this.crew[c].pos.x,this.crew[c].pos.y,this.crew[c].id, STATUS[this.crew[c].status].color,bg);
		}
	},

};