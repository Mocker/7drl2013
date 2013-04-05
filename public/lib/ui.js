/** ui.js
    helper functions to deal with browser ui
**/

//constants for stats.. these shouldn't change
var STAT_INT=1, STAT_MEM=2, STAT_CHA=3, STAT_WIL=4,STAT_PER=5,STAT_TOU=6;
var STATS = ["","intelligence","memory","charisma","willpower","perception","toughness"];

//constants for skills.. these should be defined better with dependency heirarchies and crap, 
// need lots of skills! but starting off with the basics
var SKILL_MECH=1,SKILL_FIGHT=2,SKILL_NAV=3,SKILL_WEAP=4,SKILL_ELEC=5,SKILL_SCAN=6,SKILL_DIPLO=7,SKILL_HEAL=8;
var SKILLS = ["","mechanics","fighting","navigation","weaponry","electronics","scanners","diplomacy","healing"];



var UI = {
	show_notice : function(msg, callback)
	{

	},

	hide_notice : function(){
		$('#play_notice').hide();
	}
};


UI.jumpMenu = function(){
	//populate jump menu with locations and display it
	var sID = Crap.starmap.player_star;
	var routes = Crap.starmap.stars[sID].routes;
	var keys = Object.keys(routes);
	$('#jump_menu ul').children().remove();
	for(var i=0;i<keys.length;i++){
		var id = parseInt(keys[i]);
		var name = Crap.starmap.stars[id].name;
		$('#jump_menu ul').append('<li><button value="'+id+'">'+name+'</button></li>');
	}
	$('#jump_menu ul button').bind('click',function(){
		var starID = parseInt( $(this).val() );
		UI.jumpTo(starID);
	});

	$('#jump_menu').show();
};

//Jump button pressed. do things
UI.jumpTo = function(starID){
	console.log("JUMP TO "+starID);
	if(!Crap.starmap.stars[starID]) return;

	//set old route lines to different color mat
	var oldroutes = Crap.starmap.stars[Crap.starmap.player_star].routes;
	for(rtID in oldroutes){
		
		oldroutes[rtID].line.material = Crap.starmap.routeOldMat ;
	}

	Crap.starmap.player_star = starID;
	Crap.starmap.cur_star = starID;
	var s = Crap.starmap.stars[starID];

	Crap.starmap.star_arrow.position.set(s.pos.x, s.pos.y, s.pos.z-16 );
	Crap.starmap.star_marker.position.set(s.pos.x, s.pos.y, s.pos.z-16 );

	$('#overlay_cur_star').html( Crap.starmap.stars[starID].name );

	//auto discover star routes connected to this star
	var keys = Object.keys(Crap.starmap.stars[starID].routes);
	for(var i=0;i<keys.length;i++){
		Crap.starmap.stars[starID].routes[keys[i]].line.visible = true;
		Crap.starmap.stars[starID].routes[keys[i]].line.material = Crap.starmap.routeMat;
		Crap.starmap.stars[starID].routes[keys[i]].discovered = true;
	}

	Crap.starmap.resetCam();
	Crap.starmap.zoomStar(starID);

	if( $('#jump_menu').css('display')=='block' ) UI.jumpMenu();

};//


/*** do all the initial creation here for:
	player stats :
	player ship
	initial crew
	call galaxy generation
***/

UI.roll_player = function(crap) {

	//generate starship plan
	crap.player.ship = new Ship('starter');
	crap.player.ship.name = "Civic Explorer";
	crap.player.ship.init();
	crap.player.ship.draw();

	crap.player.crew_markers = {};

	//crew members
	$('#crew_list').children().remove();
	for(var i=0;i<2;i++){
		var name = getName(3,10,'','');
		
		crap.player.crew[name] = new Crew();
		crap.player.crew[name].name = name;
		crap.player.crew[name].stats = [];
		crap.player.crew[name].skills = [];
		crap.player.crew[name].id = i+1;
		crap.player.crew[name].status = "healthy";

		//find available marker
		for(var n=0;n<name.length;n++){
			if(crap.player.crew_markers[name[n]]==undefined){
				crap.player.crew[name].marker = name[n];
				crap.player.crew_markers[name[n]] = name;
				break;
			}
		}


		$('#crew_list').append('<li data-name="'+name+'"><span class="crew_marker">'+crap.player.crew[name].marker+'</span> - <span class="crew_name">'+name+'</span> (<span class="crew_status">healthy</status>) (<span class="crew_activity">Wandering</span>)</li>');

		for(var s=1;s<STATS.length;s++){
			crap.player.crew[name].stats[s] = Math.floor(Math.random()*4)+4;
		}
		//TODO:: change this to setup just the core skills and have to track uses of random in order to recreate
		for(s=1;s<SKILLS.length;s++){
			crap.player.crew[name].skills[s] = (Math.random()<0.4) ? Math.floor(Math.random()*3)+1 : 1;
		}

		//place crew member in empty ship cell
		var s = Math.floor(Math.random()*crap.player.ship.freeCells.length);
		var pos = crap.player.ship.freeCells[s];
		//crap.player.ship.freeCells.slice(s,1);
		crap.player.crew[name].pos = pos.split(',');
		crap.player.crew[name].pos = {
			x : parseInt(crap.player.crew[name].pos[0] ),
			y : parseInt(crap.player.crew[name].pos[1] ),
		};

		crap.engine.addActor(crap.player.crew[name]);
		crap.scheduler.add(crap.player.crew[name]);

	}

	//bind crew listing to popup that displays info
	$('#crew_list li').unbind('click').bind('click',function(){
		UI.hide_notice();
		var name = $(this).attr('data-name');
		var c = Crap.player.crew[name];
		if(!c) return;
		var html = '<h4>'+name+'</h4><ul>'+
		'<li><b>Status:</b>'+c.status+'</li>'+
		'<li><b>Stats:</b><ul>';
		for(var s=1; s<c.stats.length;s++){
			html+= '<li>'+c.stats[s]+' : '+STATS[s]+'</li>';
		}
		html += '</ul></li><li><b>Skills:</b><ul>';
		for(var s=1; s<c.skills.length;s++){
			html+= '<li>'+c.skills[s]+' : '+SKILLS[s]+'</li>';
		}
		html += '</ul></li>';

		$('#play_notice').unbind('click').html(html).bind('click',function(){ UI.hide_notice(); }).show();
	});

	

}


/** bind events for map control / overlay **/

UI.bind_map = function(){
	$('#overlay_cur_star').unbind('click').bind('click',function(evt){
		Crap.starmap.zoomStar( parseInt( $(this).attr('data-id') ) );
	});
	$('#overlay_cur_galaxy').bind('click',function(evt){
		Crap.starmap.resetCam();
	});
}








/*** random helper functions    ***/



/****
  Name generation functions - written by leonti.us.to 
  ***/

  function $(e){return document.getElementById(e);}

function rnd(minv, maxv){
	if (maxv < minv) return 0;
	return Math.floor(Math.random()*(maxv-minv+1)) + minv;
}

function getName(minlength, maxlength, prefix, suffix)
{
	prefix = prefix || '';
	suffix = suffix || '';
	//these weird character sets are intended to cope with the nature of English (e.g. char 'x' pops up less frequently than char 's')
	//note: 'h' appears as consonants and vocals
	var vocals = 'aeiouyh' + 'aeiou' + 'aeiou';
	var cons = 'bcdfghjklmnpqrstvwxz' + 'bcdfgjklmnprstvw' + 'bcdfgjklmnprst';
	var allchars = vocals + cons;
	//minlength += prefix.length;
	//maxlength -= suffix.length;
	var length = rnd(minlength, maxlength) - prefix.length - suffix.length;
	if (length < 1) length = 1;
	//alert(minlength + ' ' + maxlength + ' ' + length);
	var consnum = 0;
	//alert(prefix);
	/*if ((prefix.length > 1) && (cons.indexOf(prefix[0]) != -1) && (cons.indexOf(prefix[1]) != -1)) {
		//alert('a');
		consnum = 2;
	}*/
	if (prefix.length > 0) {
		for (var i = 0; i < prefix.length; i++) {
			if (consnum == 2) consnum = 0;
			if (cons.indexOf(prefix[i]) != -1) {
				consnum++;
			}
		}
	}
	else {
		consnum = 1;
	}
	
	var name = prefix;
	
	for (var i = 0; i < length; i++)
	{
		//if we have used 2 consonants, the next char must be vocal.
		if (consnum == 2)
		{
			touse = vocals;
			consnum = 0;
		}
		else touse = allchars;
		//pick a random character from the set we are goin to use.
		c = touse.charAt(rnd(0, touse.length - 1));
		name = name + c;
		if (cons.indexOf(c) != -1) consnum++;
	}
	name = name.charAt(0).toUpperCase() + name.substring(1, name.length) + suffix;
	return name;
}

