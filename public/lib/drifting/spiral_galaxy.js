/*** spiral galaxy generator - seperated from drifting starmap for readability ***/

//galaxy = new Galaxy(skymap, NSTARS, stars.length),
var sqrt = Math.sqrt,
    cos = Math.cos,
    sin = Math.sin,
    abs = Math.abs,
    log = Math.log,
    random = Math.random,
    PI = Math.PI,
    floor = Math.floor,
    FPSCounter, // make jslint happy;
    NSTARS = 5000,
    STARSIZE = 5
    ;

var spiralConfig = {
	NSTARS : 5000,
	MINSTARS : 2000,
	MAXSTARS : 2500,
	CLOUD_PARTICLES: 150,
	SPIRAL_RADIUS : 1000,
	CLOUD_RADIUS : 600,
	NUM_SPIRALS : 3,
	SPIRAL_SPREAD : 280
};

var spiral, spiralStars, spiralCloud;

function createSpiralGalaxy()
{
	$ = jQuery;
	$('#css-camera').children().remove();
	var color = [];
	stars = [];
	var starCount = 0;

	var spiralGeo = new THREE.Geometry();
	var numStars = Math.floor(Math.random()*spiralConfig.MINSTARS)+(spiralConfig.MAXSTARS-spiralConfig.MINSTARS);
	console.log("Generating "+numStars+" stars");
	galObjects = [];
	var pX=1, pY=1;
	for(var i=0; i<numStars; i++)
	{
		do {
            pX = random()*2-1;
            pY = random()*2-1;
        } while( pX*pX + pY*pY > random()*0.3);
        var pZ = log(random()) * (random() > 0.5 ? 0.1 : -0.1),
        mass = random()+1.0;
        pX = pX * spiralConfig.SPIRAL_RADIUS; pY = pY*spiralConfig.SPIRAL_RADIUS; 

        //console.log("Placing at ",pX,pY,pZ);
        var pos = new THREE.Vector3(pX,pY,pZ);
        spiralGeo.vertices.push( pos );

        var h = Math.random() * (291 - 185) + 185,
			s = Math.random() * (66 - 34) + 34,
			v = Math.random() * (100 - 72) + 72;
		var c = Math.random() * 0x808008 + 0x808080*(i/numStars);
		c = 0x808000;
		var c = 0xff0000 * (pX/300) ;
		var dist = config.ORIGIN.distanceTo( pos );
		color[i] = new THREE.Color();
		//color[i].setHSL( 1, 0.5, mass );
		//color[i].setHSL( (i/numStars) , s / 100, v / (100/(mass*10)) );
		//color[i].setHSL(h / 360, s / 100, v / 100);
		//color[i].setHSL( (i/numStars)*291, s / 100, v / 100);
		//color[i].setRGB( (pX/1000+0.5), 0.2, 0.2 );
		color[i].setHSL( dist/1000, s/100, (mass-1)+0.5 );

		stars[starCount] = {
			index : starCount,
			spiral : 1,
			mass : mass,
			name : getName(3,15,'',''),
			hsl : [h/360, s/100, v/100],
			color : color[i],
			type : 'collapsed nova',
			pos : pos
		};

		starCount++;
        
	}
	console.log("Done generating stars");

	spiralGeo.colors = color;
	spiral = new THREE.ParticleSystem(spiralGeo, starMaterial);
	spiral.sortParticles = true;
	//scene.add(spiral);

	var numArms = 2;
	generateSpiralArms(spiralConfig.NUM_SPIRALS,numStars, 0.8);
	//generateSpiralArm(numStars/2, 0.3);
	//galObjects[1].rotation.y = 0.4;

	//create clouds
	innerClouds = new THREE.Geometry();
	color = [];

  
	for (var p = 0; p < spiralConfig.CLOUD_PARTICLES; p++) {
		var angle = Math.random() * Math.PI * 2;
		var radius = Math.random() * spiralConfig.CLOUD_RADIUS + 1;
		var pX = Math.cos(angle) * radius,
			pY = Math.random() * 200 * (1 / radius) * (Math.random() > .5 ? 1 : -1),
			//pZ = log(random()) * (random() > 0.5 ? 0.1 : -0.1);
			pZ = Math.sin(angle) * radius;
		innerClouds.vertices.push(new THREE.Vector3(pX, pY, pZ));
		
		var h = Math.random() * (291 - 185) + 185,
			s = Math.random() * (66 - 34) + 34,
			v = Math.random() * (100 - 72) + 72;
		color[p] = new THREE.Color(0xffffff);
		color[p].setHSL(h / 360, s / 100, v / 100);
	}
	innerClouds.colors = color;
	cloudSystem = new THREE.ParticleSystem(innerClouds, cloudMaterial);
	cloudSystem.sortParticles = true;
	cloudSystem.rotation.x = 1.6;
	scene.add(cloudSystem);

	galRender = renderSpiral;
	galRemove = removeSpiral;

}

function renderSpiral() {
	if(isPaused) return;
	//spiral.rotation.z += 0.001*config.ROTATION_SPEED;
	cloudSystem.rotation.y += 0.001*config.ROTATION_SPEED;
	//rotate galObjects which are the spiral arms
	for(var i=0;i<galObjects.length;i++){
		galObjects[i].rotation.z += 0.001*config.ROTATION_SPEED;
	}
}

function removeSpiral(){
	clearScene();
	spiral = undefined;
	innerClouds = undefined;
	cloudSystem = undefined;
	stars = [];
	$('#css-camera').children().remove();
}

function generateSpiralArms(numArms,numStars, h){
	
	var spread = spiralConfig.SPIRAL_SPREAD;
	var starsPerArm = numStars / numArms;
	var fArmAngle = (360 / numArms ); //360 / numOfArms % 360
	var fAngularSpread = spread / numArms; //180 / (numOfArms * 2)
	var rotation = 1;
	var color = [];

	for(var arm=0;arm<numArms; arm++){
		var armgeo = new THREE.Geometry();
		var hue = (30/360) * ((arm)/numArms) + 0.05;
		console.log("Arm "+arm, hue);
		color = [];
		for(var i=0; i<numStars;i++){

			var fR = fHatRandom(spiralConfig.SPIRAL_RADIUS); //Math.random()*64;
			var fQ = fLineRandom(fAngularSpread) ;//Math.random()*fAngularSpread * 1;
			var fK = 1;
			//var fA = (Math.random % 1 /*numOfArms*/) * fArmAngle;
			var fA = arm * (fArmAngle);
			var fX = fR * Math.cos( deg2rads(fA+fR*fK+fQ) ) ;
			var fY = fR * Math.sin( deg2rads(fA+fR*fK+fQ) ) ;


			armgeo.vertices.push( new THREE.Vector3(fX, fY, 0) );
			var c = new THREE.Color();
			//c.setHSL = (hue, 0.8, (i/numStars)+0.3 );
			//c.setRGB(hue,0,0);
			//c.setHSL( hue, 0.8, 0.8);
			color[i] = c;
			color[i].setHSL( hue, 1, 0.85);

			if(i<5){
				console.log("Generated star "+i+" of "+numStars,fR,fQ,fX,fY);
			}
		}
		armgeo.colors = color;
		var arms = new THREE.ParticleSystem(armgeo, starMaterial);
		arms.sortParticles = true;
		galObjects.push(arms);
		scene.add(arms);
	}
	

}

function fHatRandom(fRange)
{
	var fArea = 4*Math.atan(6.0);
	var fP = fArea * Math.random();
	return Math.tan(fP/4) * fRange / 6.0;
}

function fLineRandom(fRange)
{
	var fArea = fRange * fRange / 2;
	var fP = fArea * Math.random();
	return fRange - Math.sqrt( fRange * fRange - 2*fP);
}

function deg2rads(degs){ return degs * (Math.PI / 180 ); }
function rads2degs(rads){ return rads * (180/Math.PI); }

//function spiralGetSpeed(x, y ){
//}
/*
function SpiralGalaxy(nstars, nsprites) {
    this.stars = [];
    var x=1, y=1;
    while(nstars--){
        do {
            x = random()*2-1;
            y = random()*2-1;
        } while( x*x + y*y > random()*0.3);
        var z = log(random()) * (random() > 0.5 ? 0.1 : -0.1),
            mass = random()+1.0,
            sprite = floor(random()*nsprites);
        this.stars.push(
            new Star(x,
                z*0.1,
                y,
                mass,
                sprite));
    }
}
SpiralGalaxy.prototype = {
	//render animation
    tick: function(td) {
        var alpha = td*0.05,
            i = this.stars.length;
        while(i--) {
            var star = this.stars[i],
                a = alpha*(1.10-this.skymap.getSpeed(star.x, star.z))*star.mass,
                sin_ = sin(a),
                cos_ = cos(a);
            star.x = star.x * cos_ - star.z * sin_;
            star.z = star.z * cos_ + star.x * sin_;
        }
    }
};
*/









/*** helper functions for algorithm from Jonas Wagner http://29a.ch/2010/8/18/javascript-galaxy-simulation **/



function assert(condition) {
    if(!condition) {
        throw Error('Assertion error');
    }
}