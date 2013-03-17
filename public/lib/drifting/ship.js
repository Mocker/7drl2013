/****

	define ship stuff

**/


function Ship (type, opts) {
	this.type = type;
	this.name = "A Ship";
	this.display = undefined;
	this.displayDiv = undefined;
	this.displayHeight = 300;
	this.displayWidth = 200; 
	this.w = 150;
	this.h = 200;

	var defaults = {
		isDestroyed : false,
		isPlayer : true,
		spritesheet : null,
		animations : null,
		warpSpeed : 10,
		thrustSpeed : 15,
		weapons : null,
		turretHooks : [null,null,null],
		basePower : 100,
		hullArmour : 100,
		hooks : [null,null,null,null],
		cargoSpace : 100,
		crewSpace : 4
	};

	$.extend(defaults, opts);
	this.opts = opts;

	this.hullArmour = 100;
	this.shields = null;

	this.init = function() {
		this.createDisplay("#status_panel");
		this.createRandom(this.w,this.h);
	};
	
	this.createDisplay = function(divID) {
		this.container = divID;
		this.display = new ROT.Display({spacing:1.0, width:this.displayWidth/5, height:this.displayHeight/10, fontSize:10});
        $(this.container).append(this.display.getContainer());

	};

	this.createRandom = function(w,h) {
		//this.digger = new ROT.Map.Digger(this.w,this.h,5,0.7,1000);
		this.digger = new ROT.Map.Digger(this.displayWidth/5,this.displayHeight/10,5,0.7,1000);
		//SHOW(this.display.getContainer());
		//this.digger.create(this.display.DEBUG);
		//return;
		this.freeCells = [];
		this.map = {};
		var self = this;

		var digCallback = function(x,y,value) {
			if (value) return;
			var key = x+","+y;
			self.map[key] = ".";
			self.freeCells.push(key);
		};
		this.digger.create(digCallback.bind(this));

		//assign rooms
		this.rooms = this.digger.getRooms();
		var rooms_needed = [ROOM_BRIDGE,ROOM_ENGINE,ROOM_CARGO,ROOM_REACTOR,ROOM_BUNK];
		var room_types_placed = {};
		$('#room_list').children().remove();
		for(var i=0;i<this.rooms.length;i++){
			if(i>=rooms_needed.length) continue;
			this.rooms[i]['type'] = rooms_needed[i];
			if(room_types_placed[rooms_needed[i]] ==undefined){
				var c = (MAP_COLORS.ROOMS[rooms_needed[i]]==undefined)?MAP_COLORS.ROOM : MAP_COLORS.ROOMS[rooms_needed[i]];
				$('#room_list').append('<li data-id="'+i+'" data-type="'+rooms_needed[i]+'" style="color: '+c+';">'+ROOMS[rooms_needed[i]]+'</li>');
				room_types_placed[rooms_needed[i]] = 1;
				this.rooms[i].name = ROOMS[rooms_needed[i]];
			}
			else {
				room_types_placed[rooms_needed[i]] += 1;
				this.rooms[i].name = ROOMS[rooms_needed[i]] + room_types_placed[rooms_needed[i]];
			}

		}
		this.bridge = this.rooms[0];
		this.engine_room = this.rooms[1];
		this.reactor_room = this.rooms[3];
		//color rooms
		this.map_colors = {};
        for(var i=0;i<this.rooms.length;i++){
        	var r = this.rooms[i];
        	var c = (r.type==undefined)?MAP_COLORS.ROOM: (MAP_COLORS.ROOMS[r.type]==undefined)?MAP_COLORS.ROOM : MAP_COLORS.ROOMS[r.type];
        	for(var x=r._x1;x<=r._x2;x++){
        		for(var y=r._y1;y<=r._y2;y++){
        			this.map_colors[x+','+y] = c;
        		}
        	}
        }
	};

	this.draw = function(){
		 for (var key in this.map) {
            var parts = key.split(",");
            var x = parseInt(parts[0]);
            var y = parseInt(parts[1]);
            if( this.map_colors[key]!=undefined){
            	this.display.draw(x, y, this.map[key],null,this.map_colors[key]);
            }
            else {
            	this.display.draw(x, y, this.map[key],null,MAP_COLORS.DEFAULT);
            }
        }
        //color rooms
        /*
        for(var i=0;i<this.rooms.length;i++){
        	var r = this.rooms[i];
        	var c = (r.type==undefined)?MAP_COLORS.ROOM: (MAP_COLORS.ROOMS[r.type]==undefined)?MAP_COLORS.ROOM : MAP_COLORS.ROOMS[r.type];
        	console.log("Drawing room "+i,c,r);
        	for(var x=r._x1;x<=r._x2;x++){
        		for(var y=r._y1;y<=r._y2;y++){

        			this.display.draw(x,y,this.map[x+','+y],null,c);
        		}
        	}
        }
        */
	};

	this.drawCrew = function(crew){

	};
};


var MAP_COLORS = {
	DEFAULT : '#aac',
	ROOM : '#ddd',
	ROOMS : ['','#ddf','#afa','#aa6']
};



//hardcode definition for player ship
//rooms - bridge, crew bunks, engines, cargo, fuel, weapon mounts, equipment hooks, reactor
var ROOM_BRIDGE=1,ROOM_BUNK=2,ROOM_ENGINE=3,ROOM_CARGO=4,ROOM_FUEL=5,ROOM_WPN_MOUNT=6,ROOM_EQUIP=7,ROOM_REACTOR=8;
var ROOMS = ["","bridge","bunk","engine","cargo","fuel","weapon mount","equipment slot","reactor"];



/*** Crew object type - implement crew members as ROT actors
-For now keeping all the initialization crap in UI.js 
***/
function Crew(){
	//all the internal variables will get set from UI.js
	this._mood = "surly";
	this._activity = "wandering";
	this._assigned_room = undefined;
	this._speed = 100;
	this._laziness = Math.random()/2;

	//TODO: speed function should vary based on location of crew member (if outside/boarding/etc) and status
	this.getSpeed = function(){ return this._speed; }

	this.act = function(){
		//do something!
		var whut=Math.random();
		//dude doesn't like to do much 
		//console.log(this.name+" rolled "+whut);
		if(whut < this._laziness) return;
		whut=Math.random();
		if(whut<0.4){ //walk somewhere
			//collect available spaces
			var avail = [];
			for(var x=this.pos.x-1;x<=this.pos.x+1;x++){
				for(var y=this.pos.y-1;y<=this.pos.y+1;y++){
					if(y==this.pos.y&&x==this.pos.x) continue;
					//TODO:: need to check this spot is not taken by an npc or object
					//TODO:: also needs to check relevant map if not on player ship
					if(Crap.player.ship.map[x+','+y]=='.' ) avail.push([x,y]);
				}
			}
			//console.log(this.name,avail);
			if(avail.length>0){
				var which = Math.floor(Math.random()*avail.length);
				var bg = Crap.player.ship.map_colors[this.pos.x+','+this.pos.y] || MAP_COLORS.DEFAULT;
				Crap.player.ship.display.draw(this.pos.x,this.pos.y,Crap.player.ship.map[this.pos.x+','+this.pos.y],'#aaa',bg);
				this.pos.x = avail[which][0]; this.pos.y = avail[which][1];
				bg = Crap.player.ship.map_colors[this.pos.x+','+this.pos.y] || MAP_COLORS.DEFAULT;
				//bg = '#000';
				Crap.player.ship.display.draw(this.pos.x,this.pos.y,this.id,'#000',bg);
			}
		} 
	}

};

