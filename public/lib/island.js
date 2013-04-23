/** 
	The Island - Main Game code
	author: Ryan Guthrie (ryanguthrie.com)

**/


var island = {
	c : null,
	self: this,
	map : {},
	mats : {},
	thisTick : new Date().getTime(),

	gui : null,
	opts : {

	},

};

island.init = function(c, opts){
	var self = island;
	if(opts) $.extend(self.opts, opts);

	self.c = c;
	//self.container = document.getElementById('canvas_box');

	self.map = new IslandMap( {
		w: this.opts.mapWidth,
		h: this.opts.mapHeight
		}
	);

	self.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 10000 );
	self.camera.position.z = 500;

	//self.c.curCamera = self.camera;

	//create skybox
	self.mats.roomFaces = [];
	var faceColor = 0x2222FF;
	for ( var i = 0; i < 6; i ++ ) {
		//var faceColor = (i<4)? 0x774444 : 0x000000;
		var isTran = (i<0)?true : false;
		var opa = (i>-1)? 0.9 : 0.0;
    	self.mats.roomFaces.push( new THREE.MeshLambertMaterial( { color: faceColor, side: THREE.BackSide, blending: THREE.AdditiveBlending } ) );
		
	}
	self.mats.roomFaceMat = new THREE.MeshFaceMaterial( self.mats.roomFaces );
	var skyGeo = new THREE.CubeGeometry(6000,6000,6000, 1,1,1);
	self.skyBox = new THREE.Mesh(skyGeo, self.mats.roomFaceMat);
	//self.skyBox.castShadow = true;
	//self.skyBox.receiveShadow = true;
	self.c.scene.add(self.skyBox);

	//sun spotlight
	self.spotlight = new THREE.SpotLight(0xffff00);
	self.spotlight.intensity = 5;
	self.spotlight.castShadow = true;
	self.spotlight.position.setZ(2500);


	self.map.generateMap();
	if( self.map.mesh ) self.c.scene.add(self.map.mesh);
	
	self.spotlight.target = self.map.mesh;
	self.c.scene.add(self.spotlight);

	/*
	self.stats = new Stats();
	self.stats.domElement.style.position = 'absolute';
	self.stats.domElement.style.top = '0px';
	self.c.container.appendChild( stats.domElement );
	*/

	//load models
	island.morphs = [];
	loaderModel('/3d/human_1.js', { scene : self.c.scene, cb : function(obj){
		island.morphs.push(obj);
	} } );


	self.c.renders = [island.render];
}


island.render = function(){
	island.map.cycleAmbient();

	if(island.morphs.length ){
		for ( var i = 0; i < island.morphs.length; i ++ ){
						//island.morphs[ i ].updateAnimation( 1000 * 0.001 );
		}
	}

};

/*
function loadModel(_model, meshMat) {
    var group = new THREE.Object3D();
    var material = meshMat || new THREE.MeshBasicMaterial({
        color: '0x' + Math.floor(Math.random() * 16777215).toString(16),
        wireframe: true
    });
    var loader = new THREE.JSONLoader();
    loader.load({
        model: _model,
        callback: function(geometry) {
            geometry.computeTangents();
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = mesh.position.y = mesh.position.z = 0;
            mesh.rotation.x = mesh.rotation.y = mesh.rotation.z = 0;
            mesh.scale.x = mesh.scale.y = mesh.scale.z = 700;
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
            group.addChild(mesh);
        }
    });

    return group;
}

*/

function loaderModel(path, opts ){
	var loader = new THREE.JSONLoader();
	loader.load( path, function ( geometry, materials ) {

		console.log("model loaded ",path,opts,geometry,materials);

		// adjust color a bit

		var material = materials[ 0 ];
		//material.morphTargets = true;
		//material.color.setHex( 0xffaaaa );
		//material.ambient.setHex( 0x222222 );

		island.guyMats = materials;
		island.guyMesh = new THREE.MorphAnimMesh( geometry, materials[1]);
		island.guyMesh.scale.set(200,200,200);
		island.guyMesh.position.set(0,0,50);
		island.c.scene.add(island.guyMesh);

		var faceMaterial = new THREE.MeshFaceMaterial( materials );

		for ( var i = 0; i < 15; i ++ ) {

			// random placement in a grid

			//var x = ( ( i % 27 )  - 13.5 ) * 100 + THREE.Math.randFloatSpread( 1 );
			//var z = ( Math.floor( i / 27 ) - 13.5 ) * 100 + THREE.Math.randFloatSpread( 1 );
			var x = Math.floor(Math.random()*30)*50 - 750;
			var y = Math.floor(Math.random()*30)*50 - 750;

			// leave space for big monster

			//if ( Math.abs( x ) < 2 && Math.abs( z ) < 2 ) continue;

			morph = new THREE.MorphAnimMesh( geometry, faceMaterial );

			// one second duration

			morph.duration = 1000;

			// random animation offset

			morph.time = 1000 * Math.random();

			var s = THREE.Math.randFloat( 80.00075, 100.001 );
			morph.scale.set( s, s, s );

			morph.position.set( x, 100, y );
			//morph.rotation.y = THREE.Math.randFloat( -0.25, 0.25 );

			morph.matrixAutoUpdate = false;
			morph.updateMatrix();

			if(opts.scene != undefined ) {
				opts.scene.add(morph); }
			if(opts.cb != undefined ) {
				opts.cb(morph); }			

			//morphs.push( morph );
		}
	});
}

