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

	//crew members
	$('#crew_list').children().remove();
	for(var i=0;i<2;i++){
		var name = getName(3,10,'','');
		/*
		crap.player.crew[name] = {
			name : name,
			stats : [],
			skills : [],
			id : i+1,
			status : "healthy",
		};
		*/
		crap.player.crew[name] = new Crew();
		crap.player.crew[name].name = name;
		crap.player.crew[name].stats = [];
		crap.player.crew[name].skills = [];
		crap.player.crew[name].id = i+1;
		crap.player.crew[name].status = "healthy";

		$('#crew_list').append('<li data-name="'+name+'">'+(i+1)+' - '+name+' (healthy)</li>');

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
	$('#overlay_cur_star').bind('click',function(evt){
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

