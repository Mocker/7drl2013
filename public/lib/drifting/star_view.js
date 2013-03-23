/****
star canvas
display star - and controllable view of solar system on demand
*****/


var starCanvas = {
	container : null,
	width: 400,
	height: 400,
	context : null,
	camera : null,
	scene : null,
	starID : null,
	objs : {},
	mats : {},
	starSize : 1,
	controls : null,
	sc : this,
	isStarCanvas : true,
	isPaused : false,
	uniforms: null,


	setup : function(containerID){
		if(!this['isStarCanvas']) this=starCanvas; 
		this.container = $(containerID);
		this.width = this.container.width();
		this.height = this.container.height();
		this.camera = new THREE.PerspectiveCamera(
										45,
	                                     this.width/this.height,
	                                     1,
	                                     5000);
		
		if(!this.container) return;
		this.camera.position.x = 10;
		this.camera.position.y = 10;
		this.camera.position.z = 10;
		this.camera.useQuaternion = true;
		this.scene = new THREE.Scene();
		this.scene.fog = new THREE.FogExp2(config.FOG_COLOR, config.FOG_DENSITY);
		
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setSize(this.width, this.height);
		this.container[0].appendChild(this.renderer.domElement);
		this.renderer.setClearColorHex( 0x050505, 0 );

		this.controls = new THREE.TrackballControls( this.camera, document.getElementById('star_canvas') );
		this.controls.target.set( 0, 0 , 0);
		controls.rotateSpeed = 1.0;
		this.controls.zoomSpeed = 1.2;
		this.controls.panSpeed = 0.8;
		this.controls.noZoom = false;
		this.controls.noPan = false;
		this.controls.staticMoving = true;
		this.controls.dynamicDampingFactor = 0.3;

		this.controls.keys = [ 65, 83, 68 ];

		//create outer stars
		this.outerStars = new THREE.Geometry();
		var color = [];
		var thisRadius = 200;
    	for(var i = 0; i < config.PARTICLE_NUMBER*2; i++)
    	{
    		var radius = Math.random() * 5000 - 5000/2;
			var z = Math.random() * (2 * thisRadius) - thisRadius;
			var phi = Math.random() * Math.PI * 2;
			var theta = Math.asin(z / thisRadius);
			
			var pX = Math.cos(theta) * Math.cos(phi) * thisRadius,
				pY = Math.cos(theta) * Math.sin(phi) * thisRadius,
				pZ = z;
			
			this.outerStars.vertices.push(new THREE.Vector3(pX, pY, pZ));
			color[i] = new THREE.Color(0xFFFFFF);
		}
		this.outerStars.colors = color; 
		this.basicMat = new THREE.MeshBasicMaterial( { color: 0x908833, wireframe: true } );
		this.starMaterial = new THREE.ParticleBasicMaterial({size : 6,
		                                                //map : THREE.ImageUtils.loadTexture("img/eNXGj.png"),
		                                                map : THREE.ImageUtils.loadTexture("img/star.png"),
		                                                color: 0xFFFFFF,
		                                                blending : THREE.AdditiveBlending,
		                                                vertexColors: true,
		                                                depthTest : false,
		                                                transparent : true});
		this.starMaterial.color.setHSL(1.0, 0.0, 1.0);

		this.scene.add(new THREE.ParticleSystem(this.outerStars, this.starMaterial));

		//TODO- replace this with something dynamic for the 
		

		//animate();
		//rendering();

		//prepare shader material for loading into stars
		this.uniforms = {
			time: 	{ type: "f", value: 1.0 },
			scale: 	{ type: "f", value: 1.5 }
		};
		this.vertShader = document.getElementById('vertexShader').innerHTML;

		this.fragShader = document.getElementById('fragmentShader').innerHTML;

		camera.lookAt(new THREE.Vector3(0, 0, 0) );
	},

	loadStar : function(starID){
		if(!this['isStarCanvas']) this=starCanvas; 

		console.log('loading star '+starID);
		this.starID = starID;
		//generate random shader material
		//start_time = new Date().getTime();

		

		

		var attributes = {};

		 this.uniforms1 = {

		  delta: {type: 'f', value: 0.0},

		  scale: {type: 'f', value: 1.0},

		  alpha: {type: 'f', value: 1.0}

		};

		//console.log(uniforms);
		var material = new THREE.ShaderMaterial( {
			attributes: attributes,
			uniforms: this.uniforms,
			vertexShader: this.vertShader,
			fragmentShader: this.fragShader,
			//transparent : true,
		} );


		//var dShaders = THREE.ShaderLib[]
		var sMaterial1 = new THREE.ShaderMaterial( {
			attributes: attributes,
			uniforms: this.uniforms1,
			vertexShader: THREE.ShaderLib.lambert.vertexShader,
			fragmentShader: THREE.ShaderLib.lambert.fragmentShader,
			transparent : true,
		} );

		var size = 0.75;
		console.log(material,size);
		//this.objs.starMesh = new THREE.Mesh( new THREE.SphereGeometry( this.starSize, 64, 32 ), material );
		this.objs.starMesh =  new THREE.Mesh( new THREE.SphereGeometry(1.5, 64, 32), material);;
		

		console.log(this.objs.starMesh);
		this.scene.add( this.objs.starMesh );

		//generate random planets orbiting the star
		this.objs.planets = [];
		var numPlanets = Math.floor(Math.random()*7)+1;
		var lastDist = 0;
		var minDist = 5;
		for(var p=0;p<numPlanets;p++){
			var r = Math.random()*12+lastDist+minDist;
			var material = new THREE.ShaderMaterial( {
				uniforms: this.uniforms,
				vertexShader: this.vertShader,
				fragmentShader: this.fragShader,
			} );
			var size = Math.random()/2+0.5;
			var mesh = new THREE.Mesh( new THREE.SphereGeometry(size, 64, 32), this.basicMat);

			//place in random spot in orbit r distance from 0,0
			var angle = Math.random()*Math.PI*2;
			mesh.position.setX(Math.cos(angle)*r);
			mesh.position.setY(Math.sin(angle)*r);

			var planet = {
				mesh : mesh,
				size: size,
				r : r,
				index : p,
				angle : angle,
				orbitSpeed : Math.random()
			};
			this.objs.planets.push(planet);
			this.scene.add(planet.mesh);
			lastDist = r;
		}




		this.animate();
		this.render();

		this.isPaused = false;
		this.renderTO = setInterval(this.render, 1000/ config.FRAME_RATE);
	},

	clearStar : function(){
		if(!this['isStarCanvas']) this=starCanvas; 
		
		//this.objs = {};
		this.renderTO = null;
		this.starID = null;
		this.isPaused = true;
		for(var i=starCanvas.scene.children.length-1;i>0;i--){
			starCanvas.scene.remove( starCanvas.scene.children[i]);
		}
	},

	render : function(){
		//if(!this['isStarCanvas']) this=starCanvas; 
		if(starCanvas.isPaused) return;
		var tickSpeed = (1000/config.FRAME_RATE);

		//starCanvas.uniforms1.delta.value += 0.1;
		starCanvas.uniforms.time.value += 0.001 * tickSpeed;
		starCanvas.objs.starMesh.rotation.y += 0.0002*tickSpeed;
		starCanvas.objs.starMesh.rotation.x += 0.0002*tickSpeed;

		
		for(var p=0;p<starCanvas.objs.planets.length;p++){
			starCanvas.objs.planets[p].angle += 0.0001*tickSpeed*(1/(starCanvas.objs.planets[p].r/50) );
			starCanvas.objs.planets[p].mesh.position.x = Math.cos(starCanvas.objs.planets[p].angle)*starCanvas.objs.planets[p].r;
			starCanvas.objs.planets[p].mesh.position.y = Math.sin(starCanvas.objs.planets[p].angle)*starCanvas.objs.planets[p].r;
		}
		

		starCanvas.renderer.render(starCanvas.scene, starCanvas.camera);
	},

	animate : function(){

		//if(!this['isStarCanvas']) this=starCanvas; 
		requestAnimationFrame( starCanvas.animate );
		starCanvas.controls.update();
	},

	echo : function(){
		console.log("starcanvas!",this);
	},

};