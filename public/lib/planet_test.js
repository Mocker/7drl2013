/** planet tests **/


var st = {
	c : null,
	self: this,
	earth: {
		//radius : 6371,
		radius : 3000,
		tilt : 0.41,
		rotationSpeed : 0.02,
		cloudsScale : 1.005,
		moonScale : 0.23,
		margin : 0,
	},
	thisTick : new Date().getTime(),

	sketchy : {
		canvas : null,
		isMouseDown : false,
		mouseStart : null,
		mouseFinish : null,

		drawPoint : function(evt){
			if(!st.sketchy.canvas || st.sketchy.paintColor==undefined || !st.sketchy.ctx) return;
			st.sketchy.ctx.fillStyle = st.sketchy.paintColor ;
			st.sketchy.ctx.fillRect(evt.clientX-st.sketchy.baseX-2,evt.clientY-st.sketchy.baseY-2,4,4);	
			//st.sketchy.ctx.fillRect(evt.pageX, evt.pageY);
			st.canvasTex.needsUpdate = true;
		},
	},

	gui : null,

};

st.init = function(c){

	if(st.c){ //already initialized
		//st.attachRenders();
		//return;
	}

	if(!st.gui){
		st.gui = new dat.GUI({
		});
	}

	st.c = c;

	if(!st.sketchy.canvas){
		var can = document.createElement('canvas');
		st.sketchy.canvas = can;
		can.width = 600;
		can.height = 350;
		can.id = 'sketchy';
		$(can).addClass('canvas_float');
		st.sketchy.ctx = can.getContext('2d');

		$('#canvases').append(can);
		//$('#sketchy').sketch();

		st.sketchy.baseX = can.offsetLeft;
		st.sketchy.baseY = can.offsetTop;
		var element = can.offsetParent;
		while(element !== null ){
			st.sketchy.baseX = parseInt(st.sketchy.baseX) + parseInt(element.offsetLeft);
			st.sketchy.baseY = parseInt(st.sketchy.baseY) + parseInt(element.offsetTop);
			element = element.offsetParent;
		}

		st.sketchy.isVisible = false;
		
		

		st.sketchy.paintColor = '#774545';
		st.gui.addColor(st.sketchy,'paintColor').onChange(function(val){
			//$('#sketchy').sketch('color', val);
		});

		$('#sketchy').on('mousedown',function(evt){ st.sketchy.isMouseDown = true; st.sketchy.mouseStart = evt; });
		$('#sketchy').on('mouseup',function(evt){ st.sketchy.isMouseDown = false; st.sketchy.mouseFinish = evt; st.sketchy.drawPoint(evt); });
		$('#sketchy').on('mousemove',function(evt){ if(!st.sketchy.isMouseDown){return; } st.sketchy.drawPoint(evt); });

		$(can).hide();

		st.gui.add(st.sketchy,'isVisible').onFinishChange(function(val){
			if(val){
				$(st.sketchy.canvas).show();
			}
			else {
				$(st.sketchy.canvas).hide();
			}
		});

	}

};

st.clear = function(){
	if(!st.c) return;
	st.c.animates = [];
	st.c.renders = [];
	for(var i=st.c.scene.children.length-1;i>0;i--){
				st.c.scene.remove(st.c.scene.children[i]);
		}
};

st.initEarth = function(){
	st.c.camera.position.setZ( st.earth.radius * 5);
	st.c.camera.lookAt( new THREE.Vector3(0,0,0) );
	st.c.scene.fog = new THREE.FogExp2(0x000000, 0.00000025);
	st.earth.dirLight = new THREE.DirectionalLight( 0xffffff );
	st.earth.dirLight.position.set( -1, 0, 1).normalize();
	st.c.scene.add( st.earth.dirLight );
	st.earth.ambientLight = new THREE.AmbientLight( 0x303050 );
	st.c.scene.add(st.earth.ambientLight);

	st.earth.texs = {
		planet : THREE.ImageUtils.loadTexture("img/earth_atmos_2048.jpg"),
		clouds   : THREE.ImageUtils.loadTexture( "img/earth_clouds_1024.png" ),
		normal   : THREE.ImageUtils.loadTexture( "img/earth_normal_2048.jpg" ),
		specular : THREE.ImageUtils.loadTexture( "img/earth_specular_2048.jpg" ),
		moon : THREE.ImageUtils.loadTexture("img/moon_1024.jpg"),
	};

	st.earth.shader = THREE.ShaderLib.normalmap;
	var uniforms = THREE.UniformsUtils.clone( st.earth.shader.uniforms );

	
	uniforms[ "tNormal" ].texture = st.earth.texs.normal;
	uniforms[ "uNormalScale" ].value = 0.45;

	uniforms[ "tDiffuse" ].texture = st.earth.texs.planet;
	uniforms[ "tSpecular" ].texture = st.earth.texs.specular;

	uniforms[ "enableAO" ].value = false;
	uniforms[ "enableDiffuse" ].value = true;
	uniforms[ "enableSpecular" ].value = true;

	uniforms[ "uDiffuseColor" ].value.setHex( 0xffffff );
	uniforms[ "uSpecularColor" ].value.setHex( 0x333333 );
	uniforms[ "uAmbientColor" ].value.setHex( 0x000000 );

	uniforms[ "uShininess" ].value = 15;
	
	st.earth.uniforms = uniforms;

	var parameters = {

					fragmentShader: st.earth.shader.fragmentShader,
					vertexShader: st.earth.shader.vertexShader,
					uniforms: uniforms,
					lights: true,
					fog: true

				};
	var materialNormalMap = new THREE.ShaderMaterial( parameters );
	materialNormalMap1 = new THREE.MeshLambertMaterial( {
		map : st.earth.texs.planet,

	});
	materialNormalMap1.specularMap = st.earth.texs.specular;
	materialNormalMap1.envMap = st.earth.texs.normal;
	//st.matNormalMap1 = materialNormalMap1;
	materialNormalMap2 = new THREE.MeshBasicMaterial( {
		color: 0xff0000,
		wireframe: true,
		side : THREE.DoubleSide,
	});

	st.canvasTex = new THREE.Texture( document.getElementById('sketchy') );
	st.canvasTex.needsUpdate = true;
	var matCanvas = new THREE.MeshLambertMaterial({
		map: st.canvasTex,
		side: THREE.DoubleSide,
	});
	st.earth.mats  = {
		matNormal: materialNormalMap,
		normal1 : materialNormalMap1,
		normal2 : materialNormalMap2,
		canvas : matCanvas,
	};
	

	// planet

	st.earth.geometry = new THREE.SphereGeometry( st.earth.radius, 100, 50 );
	st.earth.geometry.computeTangents();

	st.earth.meshPlanet = new THREE.Mesh( st.earth.geometry, materialNormalMap1 );
	st.earth.meshPlanet.rotation.y = 1.3;
	st.earth.meshPlanet.rotation.z = st.earth.tilt;
	st.c.scene.add( st.earth.meshPlanet );



	// clouds

	var materialClouds = new THREE.MeshLambertMaterial( { color: 0xffffff, map: st.earth.texs.clouds, transparent: true } );

	st.earth.meshClouds = new THREE.Mesh( st.earth.geometry, materialClouds );
	st.earth.meshClouds.scale.set( st.earth.cloudsScale, st.earth.cloudsScale, st.earth.cloudsScale );
	st.earth.meshClouds.rotation.z = st.earth.tilt;
	st.c.scene.add( st.earth.meshClouds );

	// moon

	var materialMoon = new THREE.MeshPhongMaterial( { color: 0xffffff, map: st.earth.texs.moon } );

	st.earth.meshMoon = new THREE.Mesh( st.earth.geometry, materialMoon );
	st.earth.meshMoon.position.set( st.earth.radius * 5, 0, 0 );
	st.earth.meshMoon.scale.set( st.earth.moonScale, st.earth.moonScale, st.earth.moonScale );
	st.c.scene.add( st.earth.meshMoon );

	st.c.renders = [st.renderEarth];
	//st.c.camera.position.set(1000, 1000, 1000);

	//draw earth texture to canvas in sketchy
	st.earth.loadEarthTex = function(){
		var imageObj = new Image();
		imageObj.onload = function(){
			$('#sketchy').width(400);
			$('#sketchy').height(300);
			if(st.sketchy.ctx){
				st.sketchy.ctx.scale(0.4,0.4);
				st.sketchy.ctx.drawImage(this, 0, 0);
				//st.sketchy.visible = true;
				//$('#sketchy').show();
				st.sketchy.ctx.scale(1,1);
				st.canvasTex.needsUpdate = true;
			}
		};
		imageObj.src = 'img/earth_atmos_2048.jpg';
	};

	st.earth.loadEarthTex();


	//terrain generator
	st.tGen = new terrainGeneration();


	var params = {
		earthTexture : ['matNormal','normal1','normal2','canvas'],
		curTexture : 'matNormal',
		reloadEarthTexture : false,
	};
	st.earth.params = params;

	st.gui.add(params, 'reloadEarthTexture').onChange(function(){
		st.earth.loadEarthTex();
		$('#sketchy').show();
	});

	st.gui.add(params,'curTexture',params.earthTexture).onFinishChange(function(val){
		if( st.earth.mats[val] == undefined ) return;
		
		st.earth.meshPlanet.material = st.earth.mats[val];
	});

	st.gui.add(st.tGen.params, 'mapDimension');
	st.gui.add(st.tGen.params, 'unitSize' );
	st.gui.add(st.tGen.params, 'roughness');
	st.gui.add(st.tGen.params, 'DrawDiamondAlgo').onChange(function(val){
		//trigger generator
		st.tGen.drawIt(st.sketchy.ctx);
		st.canvasTex.needsUpdate = true;
		$('#sketchy').show();
	});
	

};
st.animateEarth = function(){

};
st.renderEarth = function(){
	var thisTick = new Date().getTime();

	var delta = st.c.clock.getDelta();

	st.earth.meshPlanet.rotation.y += st.earth.rotationSpeed * delta;
	st.earth.meshClouds.rotation.y += 1.25 * st.earth.rotationSpeed * delta;

	st.lastTick = thisTick;
};