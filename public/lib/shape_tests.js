/** shape tests **/


var st = {
	c : null,
	self: this,

};

st.init = function(c){

	if(st.c){ //already initialized
		//st.attachRenders();
		//return;
	}

	st.c = c;
	st.tubeObj = false;
	gui.destroy();
	gui = new dat.GUI({
			

		});

	var params = {
		shapeSelected : 'GrannyKnot',
		shapes : ['GrannyKnot','Torus','Sphere','Klein Bottle','Mobius Strip'],
		shapeLoaders : {
			'GrannyKnot':st.drawGranny,
			'Torus' : st.drawTorus,
			'Sphere' : st.drawSphere,
			'Klein Bottle' : st.drawKlein,
			'Mobius Strip' : st.drawMobius,
		},
		animationOn : true,
	};
	st.params = params;

	st.ambient = new THREE.AmbientLight( 0x404040);
	st.light = new THREE.DirectionalLight( 0xffffff );
	st.light.position.set( 0, 0, 1);
	c.scene.add(st.ambient);
	c.scene.add(st.light);

	st.mats = {};
	st.mats.basic = new THREE.MeshBasicMaterial( { 
		color: 0xffffff, 
		wireframe: true,
		transparent: true,
		opacity: 0.5,
		side: THREE.DoubleSide });

	console.log(params);
	st.guiswitch = gui.add(params, 'shapeSelected',params.shapes).onFinishChange(st.shapeChanged);
	gui.add(params,'animationOn');

	st.drawGranny();

	c.renders = [st.render];
	c.camera.position.set(150, 150, 150);
	c.camera.lookAt(new THREE.Vector3(0,0,0) );

	//attach gui options
};

st.clear = function(){

};

st.shapeChanged = function(){
	if( st.params.shapeLoaders[st.params.shapeSelected] ){
		st.c.scene.remove(st.tubeObj);
		st.params.shapeLoaders[st.params.shapeSelected]();
	}
}

st.drawTorus = function(){
	var heightScale = 1;
	var p = 2;
	var q = 3;
	var radius = 150, tube = 10, segmentsR = 50, segmentsT = 20;
	st.tube = new THREE.ParametricGeometries.TorusKnotGeometry( radius, tube, segmentsR, segmentsT, p , q, heightScale );
	st.tubeObj = new THREE.Mesh( st.tube, st.mats.basic );
	st.c.scene.add(st.tubeObj);
				
};
st.drawSphere = function(){
	var heightScale = 1;
	var p = 2;
	var q = 3;
	var radius = 150, tube = 10, segmentsR = 50, segmentsT = 20;
	st.tube = new THREE.ParametricGeometries.SphereGeometry( 75, 20, 10 );
	st.tubeObj = new THREE.Mesh( st.tube, st.mats.basic );
	
	st.c.scene.add(st.tubeObj);
};
st.drawKlein = function(){
	st.tube =  new THREE.ParametricGeometry( THREE.ParametricGeometries.klein, 20, 20 );
	st.tubeObj = new THREE.Mesh(st.tube, st.mats.basic);
	st.tubeObj.scale.multiplyScalar( 50 );
	st.c.scene.add(st.tubeObj);
};
st.drawMobius = function(){
	st.tube =  new THREE.ParametricGeometry( THREE.ParametricGeometries.mobius, 20, 20 );
	st.tubeObj = new THREE.Mesh(st.tube, st.mats.basic);
	st.tubeObj.scale.multiplyScalar( 50 );
	st.c.scene.add(st.tubeObj);
};

st.drawGranny = function(){
	st.c.scene.remove(st.tubeObj);
	st.GrannyKnot = new THREE.Curves.GrannyKnot();
	st.tube = new THREE.ParametricGeometries.TubeGeometry( new THREE.Curves.TrefoilPolynomialKnot(), 150, 5, 18, true, false );
	st.tubeObj = new THREE.Mesh( st.tube, st.mats.basic );
	st.c.scene.add(st.tubeObj);
};



st.attachRenders = function(){
	st.c.renders = [st.render];

};

st.render = function(){
	if(!st.tubeObj || !st.params.animationOn) return;
	st.tubeObj.rotation.y += 0.55 * (THREED.config.FRAME_RATE / 1000 );
	st.tubeObj.rotation.x += 0.55 * (THREED.config.FRAME_RATE / 1000 );
};