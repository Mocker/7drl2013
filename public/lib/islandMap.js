
function IslandMap(opts){
	var self = this;

	self.params = {
		w : 1024,
		h : 1024,
		quality : 16,
		ambientStep: 0.005,
	};
	self.ambHSL = [0.5, 0.8, 0.8];
	$.extend(self.params, opts);

	



self.generateMap = function(){
	self.data = self.generateHeight( self.params.w, self.params.h);
	self.texture = new THREE.Texture( self.generateTexture( self.data, self.params.w, self.params.h ) );
	self.texture.needsUpdate = true;

	self.materialBasic = new THREE.MeshLambertMaterial( { map: self.texture, overdraw: true, side: THREE.DoubleSide } );
	
	self.materialShader = new THREE.ShaderMaterial({
		uniforms: {
				seed: 12,
				type: { type: 'f', value: 0 },
				hidden: { type : 'i', value: 0},
				textures: { type: 't', value: 5, texture: self.texture }
			},
			vertexShader: document.getElementById( 'groundVertexShader' ).textContent,
			fragmentShader: document.getElementById( 'groundFragmentShader' ).textContent
		});


	var quality = self.params.quality, step = 1024 / quality;


	self.plane = new THREE.PlaneGeometry( 2000, 2000, quality - 1, quality - 1 );
	self.plane.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );


	for ( var i = 0, l = self.plane.vertices.length; i < l; i ++ ) {

		var x = i % quality, y = ~~ ( i / quality );
		self.plane.vertices[ i ].y = self.data[ ( x * step ) + ( y * step ) * 1024 ] * 2 - 128;

	}

	self.plane.computeCentroids();

	self.mesh = new THREE.Mesh( self.plane, self.materialBasic );
	self.mesh.receiveShadow = true;

	//create water
	self.water = new THREE.Mesh(
		new THREE.PlaneGeometry( 6000, 6000 ),
		new THREE.ShaderMaterial({
			uniforms: {
				water_level: { type: 'f', value: -2 },
				time: { type: 'f', value: 0 }
			},
			attributes: {
				displacement: { type: 'f', value: [] }
			},
			vertexShader: document.getElementById( 'waterVertexShaderChandler' ).textContent,
			fragmentShader: document.getElementById( 'waterFragmentShaderChandler' ).textContent,
			transparent: true
		})
	);
	self.water.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
	self.water.dynamic = true;
	self.water.displacement = self.water.material.attributes.displacement;
	for (var i = 0; i < self.water.geometry.vertices.length; i++) {
		self.water.material.attributes.displacement.value.push(1);
	}
	self.water.position.z = -2;
	self.mesh.add(self.water);

	self.ambLight = new THREE.AmbientLight(0xa0a0a0);
	self.mesh.add(self.ambLight);
};

//generation functions by mrdoob (mrdoob.github.io/three.sj/examples/canvas_geometry_terrain.html)
self.generateTexture = function( data, width, height ){

				var canvas, context, image, imageData,
				level, diff, vector3, sun, shade;

				vector3 = new THREE.Vector3( 0, 0, 0 );

				sun = new THREE.Vector3( 1, 1, 1 );
				sun.normalize();

				canvas = document.createElement( 'canvas' );
				canvas.width = width;
				canvas.height = height;

				context = canvas.getContext( '2d' );
				context.fillStyle = '#000';
				context.fillRect( 0, 0, width, height );

				image = context.getImageData( 0, 0, width, height );
				imageData = image.data;

				for ( var i = 0, j = 0, l = imageData.length; i < l; i += 4, j ++  ) {

					vector3.x = data[ j - 1 ] - data[ j + 1 ];
					vector3.y = 2;
					vector3.z = data[ j - width ] - data[ j + width ];
					vector3.normalize();

					shade = vector3.dot( sun );

					imageData[ i ] = ( 96 + shade * 128 ) * ( data[ j ] * 0.007 );
					imageData[ i + 1 ] = ( 32 + shade * 96 ) * ( data[ j ] * 0.007 );
					imageData[ i + 2 ] = ( shade * 96 ) * ( data[ j ] * 0.007 );

				}

				context.putImageData( image, 0, 0 );

				return canvas;
};

self.cycleAmbient = function(){
	if(self.ambHSL[2] < 0.001 && self.params.ambientStep > 0 ) self.params.ambientStep *= -1;
	if(self.ambHSL[2] > (0.999) && self.params.ambientStep < 0) self.params.ambientStep *= -1;
	self.ambHSL[2] -= self.params.ambientStep;;
	self.ambHSL[0] -= self.params.ambientStep/2;
	self.ambHSL[1] -= self.params.ambientStep/2;
	self.ambLight.color.setHSL( self.ambHSL[0], self.ambHSL[1], self.ambHSL[2] );
	//console.log(self.ambHSL);
}

self.generateHeight = function( width, height){
	var data = Float32Array ? new Float32Array( width * height ) : [], perlin = new ImprovedNoise(),
				size = width * height, quality = 2, z = Math.random() * 100;

	for ( var i = 0; i < size; i ++ ) {

		data[ i ] = 0

	}

	for ( var j = 0; j < 4; j ++ ) {

		quality *= 4;

		for ( var i = 0; i < size; i ++ ) {

			var x = i % width, y = ~~ ( i / width );
			data[ i ] += Math.floor( Math.abs( perlin.noise( x / quality, y / quality, z ) * 0.5 ) * quality + 10 );


		}

	}

	return data;
};




} //end IslandMap definition