/***

starmap.js

hacky version of creating a 3D interactive star map of the galaxy
inspiration is : http://workshop.chromeexperiments.com/stars/

***/
var MAP_CONFIG = {
	MAX_INNERSTARS : 1000,
	MIN_INNERSTARS : 400,
	MAX_OUTERSTARS : 800,
	MIN_OUTERSTARS : 200,
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

	this.stars = { 
		outer:[], 
		inner : [] };

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
		this.camera_orig = new THREE.Vector3(1000,1000,800);
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
		this.starMaterial.color.setHSL(1.0, 0.0, 1.0);

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
			var radius = Math.random() * 5000 - 5000/2;
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
		this.scene.add(new THREE.ParticleSystem(this.outerStars, this.starMaterial));
		
		/*** Outer ring **/
		this.outerRing = new THREE.Geometry();
		color = [];
		var numStars = Math.floor(Math.random()*MAP_CONFIG.MIN_OUTERSTARS) + (MAP_CONFIG.MAX_OUTERSTARS-MAP_CONFIG.MIN_OUTERSTARS);
	    	for(var i = 0; i < numStars; i++)
	    	{
	    		var angle = Math.random() * Math.PI * 2;
	    		var radius = Math.random() * (MAP_CONFIG.PARTICLE_AREA/2) - MAP_CONFIG.PARTICLE_AREA/4;
	    		radius = Math.random() * 200 + 400;
				//var z = Math.random() * (2 * radius) - radius;
				//var phi = Math.random() * Math.PI * 2;
				//var theta = Math.asin(z / radius);
				
				var pX = Math.cos(angle) * radius,
					pY = Math.random()*70-35,
					pZ = Math.sin(angle) * radius;
				var pos = new THREE.Vector3(pX, pY, pZ);
				
				var h = Math.random() * (291 - 185) + 185,
					s = Math.random() * (66 - 34) + 34,
					v = Math.random() * (100 - 72) + 72;
				color[i] = new THREE.Color(0xffffff);
				color[i].setHSL(h / 360, s / 100, v / 100);
				this.stars.outer[i] = {
					index : i,
					color: color,
					hsl : [h/360,s/100,v/100],
					type : 'stage 3',
					name : 'Outer '+i,
					ring : 'outer',
					pos : pos
				};
				this.outerRing.vertices.push(pos);
			}
		this.outerRing.colors = color; 
		this.outerSystem = new THREE.ParticleSystem(this.outerRing, this.starMaterial);
		this.outerSystem.sortParticles = true;
		this.scene.add(this.outerSystem);

		/** SET Players Location to a random outer star **/
		this.player_star = Math.floor(Math.random()*this.stars.outer.length);
		this.cur_star = this.stars.outer[this.player_star];
		this.cur_star.name = getName(4,12,'',' '+this.player_star);
		$('#overlay_cur_star').attr('data-id',this.player_star).html(this.cur_star.name);

		/** INNER RING **/
		this.innerRing = new THREE.Geometry();
		color = [];
		numStars = Math.floor(Math.random()*MAP_CONFIG.MIN_INNERSTARS) + (MAP_CONFIG.MAX_INNERSTARS-MAP_CONFIG.MIN_INNERSTARS);
	    	
	    	for(var i = 0; i < numStars; i++)
	    	{
	    		var angle = Math.random() * Math.PI * 2;
				var radius = Math.random() * 350 + 1;
				var pX = Math.cos(angle) * radius,
					pY = Math.random() * 200 * (1 / radius) * (Math.random() > .5 ? 1 : -1),
					pZ = Math.sin(angle) * radius;
				var pos = new THREE.Vector3(pX, pY, pZ);
				
				var h = Math.random() * (291 - 185) + 185,
					s = Math.random() * (66 - 34) + 34,
					v = Math.random() * (100 - 72) + 72;
				color[i] = new THREE.Color(0xffffff);
				color[i].setHSL(h / 360, s / 100, v / 100);
				this.stars.inner[i] = {
					index : i,
					color: color,
					hsl : [h/360,s/100,v/100],
					type : 'stage 3',
					mass : 1.2,
					name : 'Inner '+i,
					ring : 'inner',
					pos : pos
				};

				this.innerRing.vertices.push(pos);
			}
		this.innerRing.colors = color; 
		this.innerSystem = new THREE.ParticleSystem(this.innerRing, this.starMaterial);
		this.innerSystem.sortParticles = true;
		this.scene.add(this.innerSystem);


		/*** CLOUDS ****/
		this.innerClouds = new THREE.Geometry();
		color = [];
		for (var p = 0; p < MAP_CONFIG.CLOUD_PARTICLES; p++) {
			var angle = Math.random() * Math.PI * 2;
			var radius = Math.random() * 350 + 1;
			var pX = Math.cos(angle) * radius,
				pY = Math.random() * 200 * (1 / radius) * (Math.random() > .5 ? 1 : -1),
				pZ = Math.sin(angle) * radius;
			this.innerClouds.vertices.push(new THREE.Vector3(pX, pY, pZ));
			
			var h = Math.random() * (291 - 185) + 185,
				s = Math.random() * (66 - 34) + 34,
				v = Math.random() * (100 - 72) + 72;
			color[p] = new THREE.Color(0xffffff);
			color[p].setHSL(h / 360, s / 100, v / 100);
		}
		this.innerClouds.colors = color;
		this.cloudSystem = new THREE.ParticleSystem(this.innerClouds, this.cloudMaterial);
		this.cloudSystem.sortParticles = true;
		this.scene.add(this.cloudSystem);


		this.outerClouds = new THREE.Geometry();
		color = [];
		for(var p = 0; p < MAP_CONFIG.CLOUD_PARTICLES; p++) {
			var angle = Math.random() * Math.PI * 2;
			var radius = Math.random() * 200 + 400;
			var pX = Math.cos(angle) * radius,
				pY = Math.random() * 70 - 35,
				pZ = Math.sin(angle) * radius;
			this.outerClouds.vertices.push(new THREE.Vector3(pX, pY, pZ));
			
			var h = Math.random() * (291 - 185) + 185,
				s = Math.random() * (66 - 34) + 34,
				v = Math.random() * (100 - 72) + 72;
			color[p] = new THREE.Color(0xffffff);
			color[p].setHSL(h / 360, s / 100, v / 100);
		}
		this.outerClouds.colors = color;
		this.cloudSystem2 = new THREE.ParticleSystem(this.outerClouds, this.cloudMaterial);
		this.cloudSystem2.sortParticles = true;
		this.scene.add(this.cloudSystem2);


		
	}; //done adding stars

	this.animate = function(){
		
		requestAnimationFrame( self.animate );

		if(self.animationPaused==false ){
			self.outerSystem.rotation.y += 0.0007*MAP_CONFIG.ROTATE_SPEED;
			//self.cloudSystem2.rotation.y += 0.0005*MAP_CONFIG.ROTATION_SPEED;
			self.innerSystem.rotation.y += 0.0011*MAP_CONFIG.ROTATE_SPEED;
			self.innerSystem.rotation.z = 0.3513*MAP_CONFIG.ROTATE_SPEED;
			//self.cloudSystem.rotation.y += 0.0011*MAP_CONFIG.ROTATION_SPEED;
			//self.cloudSystem.rotation.z = 0.3513*MAP_CONFIG.ROTATION_SPEED;

			if(self.camera_track != 'origin' && self.camera_track){
				//console.log(self.camera_track);
				self.camera.lookAt(self.stars.outer[self.camera_track].pos)
			}
		}



		self.renderer.render( self.scene, self.camera );
		//doStuff!

        
	}

	this.zoomStar = function(starID){
		if(starID < 0 || starID > this.stars.outer.length){
			this.resetCam(); return;
		}
		this.camera.position = new THREE.Vector3(this.camera_orig.x, this.camera_orig.y, this.camera_orig.z) ;
		this.camera.lookAt(this.stars.outer[starID].pos);
		this.cameraControll({moveZ:-1000});
		this.camera_track = parseInt(starID);
		this.outerSystem.rotation.y = 0;
		this.innerSystem.rotation.y = 0;
		this.innerSystem.rotation.z = 0;
		//this.cloudSystem.rotation.y = 0;
		//this.cloudSystem.rotation.z = 0;
		//this.cloudSystem2.rotation.y = 0;
		this.animationPaused = true;
	}

	this.resetCam = function(){
		this.camera.position = new THREE.Vector3(this.camera_orig.x, this.camera_orig.y, this.camera_orig.z) ;
		this.camera.lookAt(new THREE.Vector3(0,0,0));
		this.camera_track = 'origin';
		this.animationPaused = false;
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