/****

	define weapon base and invididuals

**/


function Weapon (type, opts) {
	this.type = type;

	var defaults = {
		name : 'Weapon X',
		isDestroyed : false,
		spritesheet : null,
		animations : null,
		resource : 'power',
		skillsRequired : {
			'weapons' : 4,
			'beam_weapons' : 1
		},
		fittingPower : 10,
		shotCost : {
			'power' : 2,
		},
		reloadSpeed : 1,
		range : [0,5,20,25,50], //range for min - ideal lower - ideal higher - max . penalties outside ideal to hit/dmg
		damage : {
			'shield' : 10,
			'hull' : 8
		}
	};

	$.extend(defaults, opts);
	this.opts = opts;

	
}