/***

starmap.js

hacky version of creating a 3D interactive star map of the galaxy
inspiration is : http://workshop.chromeexperiments.com/stars/

***/
var MAP_CONFIG = {
	MAX_INNERSTARS : 500,
	MIN_INNERSTARS : 100,
	//MAX_OUTERSTARS : 800,
	//MIN_OUTERSTARS : 200,
	SPRITE_STAR : "img/star.png",
	SPRITE_CLOUD : "img/cloud.png",
	PARTICLE_SIZE : 50,
	ROTATE_SPEED : 1.2,
	CAMERA_FOV : 45,
	CAMERA_ASPECT : 800 / 600,
	CAMERA_NEAR : 1,
	CAMERA_FAR : 5000,
	FOG_COLOR : 0x000000,
	FOG_DENSITY : 0.0002,
	PARTICLE_AREA : 2000,
	MAP_OVERLAY : '#star_overlay',
	CLOUD_PARTICLES : 200,
	CLOUD_SIZE : 300,
};

function StarMap(divID){
	this.container = divID;
	//this.canvas = document.createElement('canvas');
	this.w = $(divID).width();
	this.h = $(divID).height();
	MAP_CONFIG.CAMERA_ASPECT = this.w / this.h ;


	this.animationPaused = false;
	this.camera, this.scene, this.renderer;
	this.geometry, this.material, this.mesh, this.camera_track;
	this.galObjs = [];
	this.arms = [];

	this.stars = { 
		 };

	var self = this;

	this.init = function(){
		//this.crenderer = new THREE.CanvasRenderer();
		this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize( this.w, this.h );
        //this.renderer.setClearColor(0x000000, 1);
		$(this.container).append( this.renderer.domElement );
		this.context = this.renderer.domElement.getContext('2d');

		this.drawNotice("Setting up 3D Renderer..");
		this.camera = new THREE.PerspectiveCamera( MAP_CONFIG.CAMERA_FOV, 
													MAP_CONFIG.CAMERA_ASPECT, 
													MAP_CONFIG.CAMERA_NEAR, 
													MAP_CONFIG.CAMERA_FAR );
		this.camera_orig = new THREE.Vector3(100,800,1000);
		this.camera.position = new THREE.Vector3(this.camera_orig.x, this.camera_orig.y, this.camera_orig.z) ;
        //this.camera.position.z = 1000;
        //this.camera.position.y = 1500;
        //this.camera.position.x = 1500;
        this.camera.useQuaternion = true;

        this.clear2D(); this.drawNotice("Creating Scene..");
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(MAP_CONFIG.FOG_COLOR, MAP_CONFIG.FOG_DENSITY);
        //this.scene.add(this.camera);

        this.clear2D(); this.drawNotice("Generating Galaxy");
        this.addStars();

        this.controls = new THREE.TrackballControls( this.camera, document.getElementById(this.container.substr(1)) );
		this.controls.target.set( 0, 0 , 0);
		this.controls.rotateSpeed = 1.0;
		this.controls.zoomSpeed = 1.2;
		this.controls.panSpeed = 0.8;

		this.controls.noZoom = false;
		this.controls.noPan = false;

		this.controls.staticMoving = true;
		this.controls.dynamicDampingFactor = 0.3;

		this.controls.keys = [ 65, 83, 68 ];

        
        this.animate();
        //this.camera.lookAt(this.cur_star.pos );
        $(MAP_CONFIG.MAP_OVERLAY).show();
        this.camera.lookAt(new THREE.Vector3(0,0,0));
        this.camera_track = 'origin';
        console.log(this.camera_track);

	};

	this.addStars = function(){
		this.galaxy_name = getName(4,10,'','');
		$('#overlay_cur_galaxy').html(this.galaxy_name);

		this.starMaterial = new THREE.ParticleBasicMaterial({size : MAP_CONFIG.PARTICLE_SIZE,
                    //map : THREE.ImageUtils.loadTexture("img/eNXGj.png"),
                    map : THREE.ImageUtils.loadTexture(MAP_CONFIG.SPRITE_STAR),
                    color: 0xFFFFFF,
                    blending : THREE.AdditiveBlending,
                    vertexColors: true,
                    depthTest : false,
                    transparent : true});
		this.starMaterial.color.setHSL(1.0, 0.0, 0.8);

		this.cloudMaterial = new THREE.ParticleBasicMaterial({
			size: 300,
			map: THREE.ImageUtils.loadTexture(
				MAP_CONFIG.SPRITE_CLOUD
			),
			blending: THREE.AdditiveBlending,
			vertexColors: true,
			transparent: true,
			depthTest: false
		});

		this.outerStars = new THREE.Geometry();
		var color = [];
		for(var i = 0; i < 1000; i++)
		{
			var radius = Math.random() * 3000 + 1500 ;
			var z = Math.random() * (2 * radius) - radius;
			var phi = Math.random() * Math.PI * 2;
			var theta = Math.asin(z / radius);
			
			var pX = Math.cos(theta) * Math.cos(phi) * radius,
				pY = Math.cos(theta) * Math.sin(phi) * radius,
				pZ = z;
			
			this.outerStars.vertices.push(new THREE.Vector3(pX, pY, pZ));
			color[i] = new THREE.Color(0xFFFFFF);
		}
		this.outerStars.colors = color; 
		this.outerStarsP = new THREE.ParticleSystem(this.outerStars, this.starMaterial);
		this.scene.add(this.outerStarsP);
		//this.outerStarsP.visible = false;
		
		var numStars = Math.floor(Math.random()*MAP_CONFIG.MIN_INNERSTARS)+(MAP_CONFIG.MAX_INNERSTARS-MAP_CONFIG.MIN_INNERSTARS);
		var numArms = Math.floor(Math.random()*3 )+1;
		armGeos = generateSpiralArms(numArms, numStars);
		console.log(armGeos);
		for(var i=0;i<armGeos.armGeos.length;i++){
			var arm = new THREE.ParticleSystem(armGeos.armGeos[i], this.starMaterial);
			arm.sortParticles = true;
			this.galObjs.push(arm);
			this.arms.push(arm);
			this.scene.add(arm);
		}
		this.stars = armGeos.stars;



		/** SET Players Location to a random outer star **/
		
		this.player_star = Math.floor(Math.random()*Math.random()*(this.stars.length/2));
		this.cur_star = this.stars[this.player_star];
		this.cur_star.name = getName(4,12,'',' '+this.player_star);
		$('#overlay_cur_star').attr('data-id',this.player_star).html(this.cur_star.name);
		//create overlay div for current location
		var basicMat = new THREE.MeshBasicMaterial( { color: 0x779977, wireframe: true } );
		this.star_marker = new THREE.Mesh( new THREE.SphereGeometry(20, 32, 32), basicMat);
		this.star_marker.position.set(this.cur_star.pos.x, this.cur_star.pos.y, this.cur_star.pos.z);
		this.scene.add(this.star_marker);
		//this.star_arrow = new THREE.ArrowHelper(1, new THREE.Vector3(this.cur_star.pos.x, this.cur_star.pos.y, this.cur_star.pos.z),200);
		//fuck it we'll do it live
		var arrow_color = 0x779977;
		this.star_arrow = new THREE.Object3D();
		this.star_arrow.position.set(this.cur_star.pos.x, this.cur_star.pos.y, this.cur_star.pos.z-16);
		this.star_arrow.visible = true;
		var cone = new THREE.Mesh( new THREE.CylinderGeometry( 0, 0.2, 0.5, 5, 1 ), new THREE.MeshBasicMaterial( { color: arrow_color } ) );
		cone.position.set(0, 0, 0);
		cone.rotation.set(Math.PI,0,0);
		var lineGeometry = new THREE.Geometry();
		lineGeometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
		lineGeometry.vertices.push( new THREE.Vector3( 0, 1, 0 ) );
		var line = new THREE.Line( lineGeometry, new THREE.LineBasicMaterial( { color: arrow_color } ) );
		this.star_arrow.add(line);
		this.star_arrow.add(cone);
		this.star_arrow.scale.set( 50, 50, 50);
		this.star_arrow.rotation.set(Math.PI/2*3, 0, 0);
		this.scene.add(this.star_arrow);
		
		//create routes between stars
		this.routeMap = new THREE.Object3D();
		//this just draws a line between each star in numeric index.. which makes no sense
		//for(var i=1; i<Crap.starmap.stars.length-1; i++){ var s=Crap.starmap.stars[i]; var geo = new THREE.Geometry(); geo.vertices.push(Crap.starmap.stars[i-1].pos); geo.vertices.push(s.pos); var line = new THREE.Line(geo, new THREE.LineBasicMaterial({color: 0xff0000 }) ); if(!s.routes){ s.routes = {}; } s.routes[i-1] = {line:line, discovered:false}; routeMap.add(line); }
		var maxRouteDist = 105;
		var routeChance = 0.2; //random has to be lower than this to create a route
		this.routeMat = new THREE.LineBasicMaterial({color: 0xff0000 });
		this.routeOldMat = new THREE.LineBasicMaterial({color: 0x0000ff });
		var maxRoutes = 3;
		for(var i=0; i<Crap.starmap.stars.length-1; i++){
			var matches = this.findNearStars(i, maxRouteDist);
			this.stars[i].closeStars = matches;
			for(var m=0;m<matches.length;m++){
				var r = Math.random();
				if(r> routeChance) continue;
				if( !this.stars[matches[m]]['routes'] ){
					this.stars[matches[m]]['routes'] = {};
					this.stars[matches[m]]['routeNum'] = 0;
				}
				else if( this.stars[matches[m]].routeNum >= maxRoutes ){
					continue;
				}
				if(this.stars[matches[m]].routes[i] ) continue;
				if(this.stars[i].routeNum && this.stars[i].routeNum >= maxRoutes) continue;
				var geo = new THREE.Geometry();
				geo.vertices.push( this.stars[matches[m]].pos );
				geo.vertices.push( this.stars[i].pos );
				var line = new THREE.Line(geo, this.routeMat);
				line.visible = (i==this.player_star||matches[m]==this.player_star)?true:false;
				if(!this.stars[i].routes ){
					this.stars[i].routes = {};
					this.stars[i].routeNum = 0;
				}
				this.stars[i].routes[matches[m]] = {
						line : line,
						discovered : (i==this.player_star||matches[m]==this.player_star)?true:false,
					};
				this.stars[matches[m]].routes[i] = {
					line : line,
					discovered : (i==this.player_star||matches[m]==this.player_star)?true:false,
				};
				this.routeMap.add(line);
				this.stars[matches[m]]['routeNum'] += 1;

				this.stars[i].routeNum += 1;
			}
		}
		this.scene.add(this.routeMap);

		


		
	}; //done adding stars


	this.findNearStars = function(starID, minDist){
		var matches = [];

		for(var i=0;i<self.stars.length;i++){
			if(i==starID) continue;
			var dist = self.stars[i].pos.distanceTo( self.stars[starID].pos );
			if(dist <= minDist) matches.push(i);
		}

		return matches;
	};

	this.animate = function(){
		
		requestAnimationFrame( self.animate );

		if(self.animationPaused==false ){
			
			/*
			if(self.camera_track != 'origin' && self.camera_track){
				//console.log(self.camera_track);
				self.camera.lookAt(self.stars.outer[self.camera_track].pos)
			}
			else if( self.camera_track == 'origin' ){
				self.camera.lookAt(THREE.Vector3(0,0,0) );
			}
			*/

			//self.controls.update();
		}

		self.controls.update();

		self.renderer.render( self.scene, self.camera );
		//doStuff!

        
	}

	this.zoomStar = function(starID){
		if(starID < 0 || starID > this.stars.length){
			this.resetCam(); return;
		}
		console.log("zoomStar "+starID, this.stars[starID]);
		//this.camera.position = new THREE.Vector3(this.stars[starID].pos.x, this.stars[starID].pos.y, this.camera_orig.z-400) ;
		//self.camera.lookAt(new THREE.Vector3(this.stars[starID].pos.x, this.stars[starID].pos.y, this.stars[starID].pos.z));
		//
		this.controls.target.set(this.stars[starID].pos.x, this.stars[starID].pos.y, this.stars[starID].pos.z);
		this.cameraControll({moveZ:-1500});
		//this.camera.position.setZ(300);
		this.camera_track = parseInt(starID);
		//this.animationPaused = true;
	}

	this.resetCam = function(){
		console.log('reset Cam');
		/*
		this.camera.position.set(this.camera_orig.x, this.camera_orig.y, this.camera_orig.z) ;
		this.camera.lookAt(new THREE.Vector3(0,0,0));
		this.camera_track = 'origin';
		this.animationPaused = false;
		*/
		this.controls.reset();
	}

	this.cameraControll = function(param) {
	
		if(this.camera && this.camera.position) {
		
			var rx = (param.rotateX) ? param.rotateX : 0;
			var ry = (param.rotateY) ? param.rotateY : 0;
			var rz = (param.rotateZ) ? param.rotateZ : 0;
			var mx = (param.moveX) ? param.moveX : 0;
			var my = (param.moveY) ? param.moveY : 0;
			var mz = (param.moveZ) ? param.moveZ : 0;
			
			var quaternion = new THREE.Quaternion().setFromEuler(new THREE.Vector3(rx, ry, rz));
			this.camera.quaternion.multiply(quaternion);
			this.camera.translateX(mx);
			this.camera.translateY(my);
			this.camera.translateZ(mz);
		}
		return false;
	}

	/** 2D FUNCTIONS **/
	this.clear2D = function(){
		return;
		//2D renderer disabled
		console.log("Starmap overlay cleared");
		this.context.clearRect(0,0,this.w,this.h);
	};

	this.drawNotice = function(txt, position, color, timer){
		return;
		//TODO-- cannot mix 2d renderer with webgl renderer
		var clr = color || '#eee';
		var pos = position || {x: 250, y: 200 };
		this.context.font         = '30px sans-serif';
		this.context.fillStyle = clr;
		//this.context.strokeStyle = "#ccc";
		this.context.fillText(txt,pos.x,pos.y);
		console.log("Drew "+txt+" at ",pos);

		if(timer!=undefined){
			setTimeout(this,clear2D,timer);
		}
	};



}







/*** misc helper functions ***/

/* Fixes the difference between WebGL coordinates to CSS coordinates    */
function toCSSMatrix(threeMat4, b) {
  var a = threeMat4, f;
  if (b) {
    f = [
      a.elements[0], -a.elements[1], a.elements[2], a.elements[3],
      a.elements[4], -a.elements[5], a.elements[6], a.elements[7],
      a.elements[8], -a.elements[9], a.elements[10], a.elements[11],
      a.elements[12], -a.elements[13], a.elements[14], a.elements[15]
    ];
  } else {
    f = [
      a.elements[0], a.elements[1], a.elements[2], a.elements[3],
      a.elements[4], a.elements[5], a.elements[6], a.elements[7],
      a.elements[8], a.elements[9], a.elements[10], a.elements[11],
      a.elements[12], a.elements[13], a.elements[14], a.elements[15]
    ];                 
  }
  for (var e in f) {
    f[e] = epsilon(f[e]);
  }
  return "matrix3d(" + f.join(",") + ")";
}




/** GALAXY Generation Algorithms **/
function generateSpiralArms(numArms,numStars, config){
	
	//TODO expand with config
	var defaults = {
		h : 0.3,
		radius : 800,
		spread : 250,
	}

	var spread =defaults.spread;
	var starsPerArm = numStars / numArms;
	var fArmAngle = (360 / numArms ); //360 / numOfArms % 360
	var fAngularSpread = spread / numArms; //180 / (numOfArms * 2)
	var rotation = 1;
	var color = [];
	var basicMat = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } );
	var armsAll = [];	
	var stars = [];

	//var trackStars = Math.floor( (numStars * numArms) / config.MAX_TRACKED );
	var starCount = 0;
	for(var arm=0;arm<numArms; arm++){
		var armgeo = new THREE.Geometry();
		var hue = (defaults.h/360) * ((arm)/numArms) + 0.05;
		console.log("Arm "+arm, hue);
		color = [];
		for(var i=0; i<numStars;i++){

			var fR = fHatRandom(defaults.radius); //Math.random()*64;
			var fQ = fLineRandom(fAngularSpread) ;//Math.random()*fAngularSpread * 1;
			var fK = 1;
			//var fA = (Math.random % 1 /*numOfArms*/) * fArmAngle;
			var fA = arm * (fArmAngle);
			var fX = fR * Math.cos( deg2rads(fA+fR*fK+fQ) ) ;
			var fY = fR * Math.sin( deg2rads(fA+fR*fK+fQ) ) ;
			var fZ = Math.random()*10-5;

			var mass = (Math.random()*50*Math.random())+1.0;


			var pos = new THREE.Vector3(fX, fY, fZ);
			armgeo.vertices.push( pos);
			var c = new THREE.Color();
			//c.setHSL = (hue, 0.8, (i/numStars)+0.3 );
			//c.setRGB(hue,0,0);
			//c.setHSL( hue, 0.8, 0.8);
			color[i] = c;
			color[i].setHSL( (hue+(mass*0.005)) , 0.9, 0.8);



			stars[starCount] = {
				index : starCount,
				spiral : i,
				mass : mass,
				name : getName(3,15,'',''),
				hsl : [hue, 1, 0.85],
				color : color[i],
				type : 'collapsed nova',
				pos : pos
			};

			//create html text label and update it to match this item
			

			starCount++;
		}
		armgeo.colors = color;
		//var arms = new THREE.ParticleSystem(armgeo, starMaterial);
		//arms.sortParticles = true;
		//galObjects.push(arms);
		armsAll.push(armgeo);

		
	}
	return {armGeos: armsAll, stars: stars};	

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