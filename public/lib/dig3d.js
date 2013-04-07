

var dig3d = {
	c : null,
	self : this,
};

dig3d.init = function(c){
	if(dig3d.c){
		//already initialized;
	}

	dig3d.c = c;
	gui.destroy();
	gui = new dat.GUI({

	});

	dig3d.map = null;
	dig3d.crew = [];

	dig3d.lastTick = new Date().getTime();

	var params = {
		digShape : 'Rect',
		digShapes : ['Rect', 'Random Shape'],
		w : 50,
		h : 50,
		roomWidthMin : 5,
		roomWidthMax : 15,
		roomHeightMin : 5,
		roomHeightMax : 20,
		corriderLengthMin : 2,
		corriderLengthMax : 5,
		dugPercentage : 0.5,
		timeLimit : 5000,
		RedrawDigger : true,
		cellSize : 10,
		cellHeight: 40,
		crewSize : 4,
		basicMatColor : '#aaffaa',
		corBasicMatColor : '#aaaaff',
		roomMatColor : '#774444',
		corLineColor : '#ffffff',
		crewMatColor : '#908833',
		playerMatColor : '#ffffff',
		fogVisible : false,
		spotlightVisible : true,
		ambientVisible : true,
		spotLightColor : '#ffff00',
		ambientColor : '#a0a0a0',
	};

	dig3d.params = params;
	gui.add(params,'digShape',params.digShapes).onFinishChange(dig3d.digShapeChanged);
	gui.add(params,'w'); gui.add(params,'h');
	gui.add(params,'cellSize');
	gui.add(params, 'cellHeight');
	gui.add(params,'roomWidthMin'); gui.add(params,'roomWidthMax');
	gui.add(params,'roomHeightMin'); gui.add(params,'roomHeightMax');
	gui.add(params,'corriderLengthMin'); gui.add(params, 'corriderLengthMax');
	gui.add(params, 'dugPercentage');
	gui.add(params, 'timeLimit');
	gui.add(params, 'crewSize');

	//material colors
	gui.addColor(params, 'roomMatColor').onChange(function(val){
		val = val.replace('#','0x');
		if(dig3d.mats.roomFaceMat){
			for(var i=0;i<4;i++){
			dig3d.mats.roomFaceMat.materials[i].color = new THREE.Color(val*0x000001); }
		}
	});
	gui.addColor(params, 'crewMatColor').onChange(function(val){
		val = val.replace('#','0x');
		if(dig3d.mats.crewMat) dig3d.mats.crewMat.color = new THREE.Color(val*0x000001);
	});
	gui.addColor(params, 'playerMatColor').onChange(function(val){
		val = val.replace('#','0x');
		if(dig3d.player && dig3d.player.mesh.children.length >= 1) dig3d.player.mesh.children[0].material.color = new THREE.Color(val*0x000001);
		if(dig3d.player && dig3d.player.mesh.material) dig3d.player.mesh.material.color = new THREE.Color(val*0x000001);
	
	});

	gui.add(params, 'ambientVisible').onChange(function(val){ 
		if(dig3d.ambLight ) dig3d.ambLight.visible = val;
	});
	gui.add(params, 'spotlightVisible').onChange(function(val){
		if(dig3d.player && dig3d.player.spotlight ) dig3d.player.spotlight.visible = val;
	});
	gui.addColor(params, 'spotLightColor').onChange(function(val){
		val = val.replace('#','0x');
		if(dig3d.player && dig3d.player.spotlight) dig3d.player.spotlight.color = new THREE.Color(val*0x000001);
	});
	gui.addColor(params, 'ambientColor').onChange(function(val){
		val = val.replace('#','0x');
		if(dig3d.ambLight) dig3d.ambLight.color = new THREE.Color(val*0x000001);
	});



	gui.add(params, 'RedrawDigger').onFinishChange(dig3d.drawMap);

	dig3d.mats = {};
	dig3d.mats.basic = new THREE.MeshBasicMaterial( { 
		color: 0xaaffaa, 
		wireframe: true,
		transparent: true,
		opacity: 0.9,
		side: THREE.DoubleSide });
	dig3d.mats.corBasic = new THREE.MeshLambertMaterial( { 
		color: 0xaaaaff, 
		//wireframe: true,
		//transparent: true,
		//opacity: 0.5,
		side: THREE.DoubleSide });

	dig3d.mats.roomFaces = [];

	for ( var i = 0; i < 6; i ++ ) {
		var faceColor = (i<4)? 0x774444 : 0x000000;
		var isTran = (i>4)?true : false;
		var opa = (i<4)? 0.9 : 0.0;
    	dig3d.mats.roomFaces.push( new THREE.MeshLambertMaterial( { color: faceColor, transparent: isTran, opacity: opa, side: THREE.DoubleSide, blending: THREE.AdditiveBlending } ) );
		
	}
	dig3d.mats.roomFaceMat = new THREE.MeshFaceMaterial( dig3d.mats.roomFaces );


	dig3d.drawMap();

	c.renders = [dig3d.render];
	//dig3d.c.camera.position.set(-60, -273, -705);
	//dig3d.c.camera.lookAt( new THREE.Vector3(0, 0, 0) );
	dig3d.c.camera.position.setZ(-100);

}

dig3d.render = function(){
	//move thing around or whatever
	var thisTick = new Date().getTime();

	for(var i=0;i<dig3d.crew.length;i++){
		dig3d.crew[i].moveTick( (thisTick-dig3d.lastTick) );
	}

	dig3d.lastTick = thisTick;
};

dig3d.drawMap = function(){
	if(dig3d.roomObjs){
		dig3d.c.scene.remove(dig3d.mapObj);
		$.each(dig3d.roomObjs,function(index){
			dig3d.c.scene.remove(this);
		});
		$.each(dig3d.corObjs,function(index){
			dig3d.c.scene.remove(this);
		});
	}

	//dig3d.c.renderer.shadowMapEnabled = true;

	var p = dig3d.params;
	dig3d.mapP = {
		roomWidth : [p.roomWidthMin, p.roomWidthMax],
		roomHeight : [p.roomHeightMin, p.roomHeightMax],
		corriderLength: [p.corriderLengthMin, p.corriderLengthMax],
		dugPercentage : p.dugPercentage
	};
	dig3d.map = new ROT.Map.Digger(p.w,p.h, dig3d.mapP);
	dig3d.mapArray = {};
	dig3d.freeCells = [];

	dig3d.rotDisplay = new ROT.Display({fontSize:p.cellSize/2});
	var rotC = dig3d.rotDisplay.getContainer();
	$(rotC).css('position','fixed').css('top','0').css('left','0');
	rotC.width = p.cellSize/2 * p.w; rotC.height = p.cellSize/2 * p.h;
	$(rotC).addClass('rotMap');
	$('#canvas_box').append(rotC);

	dig3d.digCallback = function(x, y, value){
		dig3d.rotDisplay.DEBUG(x, y, value);
		if(value) return;
		var key = x+","+y;
        dig3d.mapArray[key] = 'F';
        dig3d.freeCells.push(key);
	};


	var skyBoxGeometry = new THREE.CubeGeometry( 1000, 1000, 1000 );
	var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
	dig3d.skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );



	dig3d.map.create(dig3d.digCallback);	
	dig3d.mapObj = new THREE.Object3D();
	//dig3d.mapObj.castShadow = true;

	//create rect outline for ship
	var outMats = [dig3d.mats.basic, dig3d.mats.basic, dig3d.mats.basic, dig3d.mats.basic, dig3d.mats.basic, new THREE.MeshBasicMaterial( { 
		color: 0xaaffaa}) ];
	outMats = [];
	for (var i=0; i<6; i++) {
	  var img = new Image();
	  img.src = 'img/shippy_move2.png';
	  var tex = new THREE.Texture(img);
	  img.tex = tex;
	  img.onload = function(){
	  	this.tex.needsUpdate = true;
	  };
	  var mat = new THREE.MeshBasicMaterial({color: 0xffffff, map: tex});
	  outMats.push(mat);
	}
	console.log(outMats);
	var outgeo = new THREE.CubeGeometry(p.w*p.cellSize,p.h*p.cellSize,p.cellHeight, 1,1,1, outMats);
	console.log(outgeo);
	var outline = new THREE.Mesh(outgeo, new THREE.MeshFaceMaterial() );
	console.log(outline);
	outline = new THREE.Mesh(new THREE.CubeGeometry(p.w*p.cellSize,p.h*p.cellSize,p.cellHeight), dig3d.mats.basic);
	outline.position.set(  (p.w*p.cellSize)/2,  (p.h*p.cellSize)/2, 0);
	//dig3d.mapObj.add(outline);

	dig3d.mapCanvas = document.createElement("canvas");
	
	dig3d.mapCanvas.width = p.w*p.cellSize;
	dig3d.mapCanvas.height = p.h*p.cellSize;
	var ctx = dig3d.mapCanvas.getContext('2d');
	ctx.fillStyle = '#666';
	ctx.fillRect(0, 0, (p.w*p.cellSize, p.h*p.cellSize) );
	ctx.strokeStyle = '#161';
	for(var x=0;x<p.w;x++){
		ctx.beginPath();
		ctx.moveTo(x*p.cellSize, 0);
		ctx.lineTo(x*p.cellSize, p.h*p.cellSize);
		ctx.stroke();
	}
	for(var y=0;y<p.h;y++){
		ctx.beginPath();
		ctx.moveTo(0, y*p.cellSize);
		ctx.lineTo(p.w*p.cellSize, y*p.cellSize);
		ctx.stroke();
	}
	dig3d.canvasTex = new THREE.Texture(dig3d.mapCanvas);
	dig3d.canvasTex.needsUpdate = true;
	dig3d.mats.baseMat = new THREE.MeshLambertMaterial({
		map : dig3d.canvasTex,
		side: THREE.DoubleSide,
	});
	//dig3d.mats.roomFaceMat.materials[3] = dig3d.canvasTex;

	dig3d.baseMap = new THREE.Mesh(new THREE.PlaneGeometry(p.w*p.cellSize,p.h*p.cellSize), dig3d.mats.baseMat);
	//dig3d.baseMap.doubleSided = true;
	//dig3d.baseMap.position.set(-(p.w*p.cellSize)/2,  -(p.h*p.cellSize)/2, 15 );
	dig3d.baseMap.position.setZ(25);
	dig3d.baseMap.rotation.setY(Math.PI);
	//dig3d.c.scene.add(dig3d.baseMap);


	//create fog
	dig3d.fog = new THREE.FogExp2( 0x9999ff, 0.00025);
	dig3d.fog.visible = true;
	dig3d.c.scene.add(dig3d.fog);

	dig3d.ambLight = new THREE.AmbientLight(0xa0a0a0);
	dig3d.c.scene.add(dig3d.ambLight);

	//floor to show shadows

	dig3d.floorTex = new THREE.ImageUtils.loadTexture('img/checkerboard.jpg');
	dig3d.floorTex.wrapS = dig3d.floorTex.wrapT = THREE.RepeatWrapping;
	dig3d.floorTex.repeat.set(10,10);
	dig3d.mats.floor = new THREE.MeshLambertMaterial( { map: dig3d.floorTex , side : THREE.DoubleSide });
	dig3d.floorGeo  = new THREE.PlaneGeometry( p.w*p.cellSize, p.h*p.cellSize);
	dig3d.floor = new THREE.Mesh(dig3d.floorGeo, dig3d.mats.floor);
	dig3d.floor.position.set((p.w*p.cellSize)/2,  (p.h*p.cellSize)/2, 15 );
	dig3d.floor.rotation.setY(Math.PI);
	dig3d.floor.receiveShadow = true;
	dig3d.mapObj.add(dig3d.floor);


	//create rooms
	dig3d.rooms = dig3d.map.getRooms();
	dig3d.roomObjs = [];
	for(var i=0;i<dig3d.rooms.length; i++){
		var r = dig3d.rooms[i];
		var coords = { LeftTop: [r._x1, r._y1], RightBottom: [r._x2, r._y2 ] };
		r['coords'] = coords;
		var w = Math.abs(coords.LeftTop[0] - coords.RightBottom[0] );
		var h = Math.abs(coords.LeftTop[1] - coords.RightBottom[1] );
		var cube = new THREE.Mesh(new THREE.CubeGeometry(w*p.cellSize, h*p.cellSize, p.cellHeight, 1,1,1), dig3d.mats.roomFaceMat );
		//cube.position.set( coords.LeftTop[0]*p.cellSize - ((p.w*p.cellSize)/2), coords.LeftTop[1]*p.cellSize - ((p.h*p.cellSize)/2), 0);
		cube.position.set( coords.LeftTop[0]*p.cellSize + (w*p.cellSize)/2, coords.LeftTop[1]*p.cellSize + (h*p.cellSize)/2 , 0);
		cube.castShadow = true;

		dig3d.roomObjs.push(cube);
		r['cube'] = cube;
		
		//draw on 2d map texture
		//var ctx = dig3d.mapCanvas.getContext('2d');
		//ctx.fillStyle = 'rgba(220, 50, 20, 0.5)';
		//ctx.fillRect(coords.LeftTop[0]*p.cellSize + (w*p.cellSize)/2, coords.LeftTop[1]*p.cellSize + (h*p.cellSize)/2, r._y2*p.cellSize );
		//ctx.fillRect( coords.LeftTop[0]*p.cellSize, coords.LeftTop[1]*p.cellSize , (w*p.cellSize) , (h*p.cellSize) );
		//dig3d.canvasTex.needsUpdate = true;

		dig3d.mapObj.add(cube);

	}

	//create corridors
	dig3d.cors = dig3d.map.getCorridors();
	dig3d.corObjs = [];
	dig3d.mats.corLine = new THREE.LineBasicMaterial({color: 0xffffff });;
	for(var i=0;i<dig3d.cors.length; i++){
		var r = dig3d.cors[i];
		var coords = { LeftTop: [r._startX, r._startY], RightBottom: [r._endX, r._endY ] };
		r['coords'] = coords;
		var w = Math.abs(coords.LeftTop[0] - coords.RightBottom[0] );
		var h = Math.abs(coords.LeftTop[1] - coords.RightBottom[1] );
		//if(h==0) h = 1;
		//if(w==0) w = 1;
		//var lineGeo = new THREE.Geometry();
		//lineGeo.vertices.push(new THREE.Vector3(r._startX*p.cellSize - ((p.w*p.cellSize)/2), r._startY*p.cellSize - ((p.h*p.cellSize)/2), 0    ));
		//lineGeo.vertices.push(new THREE.Vector3(r._endX*p.cellSize - ((p.w*p.cellSize)/2), r._endY*p.cellSize - ((p.h*p.cellSize)/2), 0    ));
		//lineGeo.vertices.push(new THREE.Vector3(r._startX*p.cellSize+p.cellSize/2 , r._startY*p.cellSize +p.cellSize/2, 0    ));
		//lineGeo.vertices.push(new THREE.Vector3(r._endX*p.cellSize +p.cellSize/2, r._endY*p.cellSize+p.cellSize/2 , 0    ));
		//var cube = new THREE.Line(lineGeo, dig3d.mats.corLine );
		r['dims'] = {h:h,w:w};
		//var cube = new THREE.Mesh(new THREE.CubeGeometry(w*p.cellSize, h*p.cellSize, p.cellHeight), dig3d.mats.roomFaceMat);
		cube.position.set( coords.LeftTop[0]*p.cellSize +(w*p.cellSize)/2 , coords.LeftTop[1]*p.cellSize+(h*p.cellSize)/2, 0);
		//dig3d.corObjs.push(cube);
		r['cube'] = cube;
		//dig3d.c.scene.add(cube);

		//don't be stupid - create two planes instead of trying to make hollowed out cubes for some wierd reason
		//dig3d.baseMap = new THREE.Mesh(new THREE.PlaneGeometry(p.w*p.cellSize,p.h*p.cellSize), dig3d.mats.baseMat);

		if(w > h ){
			var midX = (r._startX+r._endX) / 2;
			w += 1;
			var top = new THREE.Mesh(new THREE.PlaneGeometry(w*p.cellSize,p.cellHeight), dig3d.mats.corBasic);
			top.position.set( midX*p.cellSize, r._startY*p.cellSize, 0);
			top.rotation.setX(Math.PI/2);
			var bot = new THREE.Mesh(new THREE.PlaneGeometry(w*p.cellSize,p.cellHeight), dig3d.mats.corBasic);
			bot.position.set( midX*p.cellSize, (r._startY+1)*p.cellSize, 0);
			bot.rotation.setX(Math.PI/2);
			r['sides'] = [top, bot];
			dig3d.corObjs.push(top); dig3d.corObjs.push(bot);
			dig3d.mapObj.add(top);
			dig3d.mapObj.add(bot);
		}
		else {
			var midY = (r._startY+r._endY) / 2;
			h+=1;
			var left = new THREE.Mesh(new THREE.PlaneGeometry(p.cellHeight,h*p.cellSize), dig3d.mats.corBasic);
			left.position.set( r._startX*p.cellSize,midY*p.cellSize, 0);
			left.rotation.setY(Math.PI/2);
			var right = new THREE.Mesh(new THREE.PlaneGeometry(p.cellHeight,h*p.cellSize), dig3d.mats.corBasic);
			right.position.set( (r._startX+1)*p.cellSize,midY*p.cellSize, 0);
			right.rotation.setY(Math.PI/2);
			r['sides'] = [left, right];
			dig3d.corObjs.push(left); dig3d.corObjs.push(right);
			dig3d.mapObj.add(left);
			dig3d.mapObj.add(right);
		}


		//draw on 2d map texture
		//var ctx = dig3d.mapCanvas.getContext('2d');
		//ctx.strokeStyle = '#fff';
		//ctx.moveTo(r._startX*p.cellSize+(p.cellSize/2), r._startY*p.cellSize+(p.cellSize/2) );
		//ctx.lineTo(r._endX*p.cellSize*(p.cellSize/2), r._endY*p.cellSize+p.cellSize/2);
		//ctx.lineWidth= p.cellSize/2;
		//ctx.stroke();
		
		//dig3d.canvasTex.needsUpdate = true;

		//dig3d.mapObj.add(cube);

	}

	//create crew
	dig3d.mats.crewMat = new THREE.MeshLambertMaterial( { color: 0x908833, wireframe: true } );
		
	dig3d.crew = [];
	for(var i=0;i<p.crewSize;i++){
		var crew = new dig3d.crewMember();
		var s = Math.floor(Math.random()*dig3d.freeCells.length);
		var pos = dig3d.freeCells[s].split(',');

		crew['pos'] = {x: parseInt(pos[0]), y: parseInt(pos[1]) };
		console.log("Positioning crew "+i,pos,crew.pos);
		crew['sphere'] = new THREE.Mesh( new THREE.SphereGeometry(p.cellSize/2, 32, 16), dig3d.mats.crewMat);
		crew.sphere.position.set( crew.pos.x+(p.cellSize/2), crew.pos.y+(p.cellSize/2), 0);
		crew.sphere.castShadow = true;
		dig3d.mapObj.add(crew.sphere);
		dig3d.crew.push(crew);
	}

	//add keyboard interactive player!
	dig3d.player = new dig3d.PC();
	if(dig3d.player && dig3d.player.mesh) dig3d.mapObj.add(dig3d.player.mesh);
	if(dig3d.player && dig3d.player.spotlight) dig3d.mapObj.add(dig3d.player.spotlight);
	dig3d.c.keyListener = dig3d.keyDown;
	dig3d.c.controls.target = dig3d.player.mesh.position;

	

	var axis = new THREE.AxisHelper(40);
	axis.position.set((p.w*p.cellSize)/2, (p.h*p.cellSize)/2, 0);
	dig3d.mapObj.add( axis );


	dig3d.mapObj.position.set( - ((p.w*p.cellSize)/2), - ((p.h*p.cellSize)/2), 0);
	dig3d.c.scene.add(dig3d.mapObj);

	ctx.strokeStyle = '#161';
	ctx.lineWidth = 1;
	for(var x=0;x<p.w;x++){
		ctx.beginPath();
		ctx.moveTo(x*p.cellSize, 0);
		ctx.lineTo(x*p.cellSize, p.h*p.cellSize);
		ctx.stroke();
	}
	for(var y=0;y<p.h;y++){
		ctx.beginPath();
		ctx.moveTo(0, y*p.cellSize);
		ctx.lineTo(p.w*p.cellSize, y*p.cellSize);
		ctx.stroke();
	}
	dig3d.canvasTex.needsUpdate = true;



	dig3d.c.camera.position.set(46.7, 261.75, -710);
	dig3d.c.camera.up.set( 0.02, -0.996, -0.096 );
	//dig3d.c.camera.lookAt( new THREE.Vector3(0, 0, 0) );
	dig3d.c.controls.target = new THREE.Vector3(0,0,0);
	

	$('#input_hidden').focus();

};

dig3d.digShapeChanged = function(){

};

dig3d.keyDown = function(evt){
	//handle key events
	if(dig3d.player != undefined) dig3d.player.keyPressed(evt.keyCode);
	$('#input_hidden').text('');
};

dig3d.PC = function(){
	this.stats = {
		health : 100,
		isProperChap : true,
		name : 'Trogdor',
		speed : 1000,
		turnWait : 0, //when does an action set this to speed
		isFrozen : false,
	};

	this.meshSize = 8;
	this.mesh = null ; 
	

	this.createMesh = function(){
		var darkMaterial = new THREE.MeshBasicMaterial( { color: 0xffffcc } );
		var wireframeMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true, transparent: true } ); 
		this.multiMaterial = [ darkMaterial, wireframeMaterial ];

		//darkMaterial = new THREE.MeshPhongMaterial({ambient: 0x050505, color: 0xffffcc, specular: 0x555555, shininess: 30 })
		darkMaterial = new THREE.MeshLambertMaterial( { color: 0xffffcc } );
		//this.mesh = THREE.SceneUtils.createMultiMaterialObject( 
			// radiusAtTop, radiusAtBottom, height, segmentsAroundRadius, segmentsAlongHeight,
		//	new THREE.CylinderGeometry( 5, this.meshSize/2, 20, 4, 4 ), 
		//	this.multiMaterial );
		//this.mesh = new THREE.Mesh( new THREE.CylinderGeometry(5, this.meshSize/2, 20, 4, 4), darkMaterial );
		this.mesh = new THREE.Mesh( new THREE.SphereGeometry(this.meshSize/2, 16, 8), darkMaterial );
		this.mesh.rotation.setX(Math.PI*3/2);
		this.mesh.castShadow = true;

		this.spotlight = new THREE.SpotLight(0xffff00);
		//this.spotlight.shadowCameraVisible = true;
		//this.spotlight.shadowDarkness = 0.95;
		this.spotlight.intensity = 5;
		this.spotlight.castShadow = true;
		this.spotlight.target = this.mesh;
		this.spotlight.position.setZ(50);
	};

	this.moveTick = function(timeSince){
		if(this.stats.turnWait > 0 ) this.stats.turnWait -= timeSince ;
		
		//do updates and stuff whatever. I don't care. do whatchyawant	
	};

	this.keyPressed = function(keyCode){
		if(this.stats.isFrozen ==false && this.stats.turnWait < 1 && (keyCode==39||keyCode==37||keyCode==40||keyCode==38) ) this.moveDir(keyCode);
	};

	this.moveTo = function(target){

	};

	this.moveDir = function(dir){
		console.log("Move player "+dir);
		var newPos = [ this.pos.x+0, this.pos.y+0 ];
		var camOff = [0, 0];
		switch(dir) {
			case 38 : //UP
				newPos[1] -= 1;
				camOff[1] = 20;
				break;
			case 40 : //DOWN
				newPos[1] += 1;
				camOff[1] = -20;
				break;
			case 37 : //LEFT
				newPos[0] -= 1;
				camOff[0] = 20;
				break;
			case 39: //RIGHT
				newPos[0] += 1;
				camOff[0] = -20;
				break;
			default :
				//invalid direction
				return;
				break;
		}

		if( dig3d.mapArray[newPos[0]+','+newPos[1]]!='F' ) return; //BONK
		this.pos.x = newPos[0]; this.pos.y = newPos[1];
		this.mesh.position.set(this.pos.x*dig3d.params.cellSize, this.pos.y*dig3d.params.cellSize, 0);
		this.spotlight.position.set(this.pos.x*dig3d.params.cellSize+camOff[0], this.pos.y*dig3d.params.cellSize+camOff[1], -20 );
		//dig3d.c.camera.position.set( this.pos.x*dig3d.params.cellSize-(dig3d.params.w*dig3d.params.cellSize)/2, this.pos.y*dig3d.params.cellSize-(dig3d.params.w*dig3d.params.cellSize)/2, -200 )	;
		//dig3d.c.camera.lookAt( this.pos.x*dig3d.params.cellSize-(dig3d.params.w*dig3d.params.cellSize)/2, this.pos.y*dig3d.params.cellSize-(dig3d.params.w*dig3d.params.cellSize)/2, 0 )	;
		var relativeCameraOffset = new THREE.Vector3(0,50,200);

		var cameraOffset = relativeCameraOffset.applyMatrix4( this.mesh.matrixWorld );

		//dig3d.c.camera.position.x = cameraOffset.x;
		//dig3d.c.camera.position.y = cameraOffset.y;
		//dig3d.c.camera.position.z = cameraOffset.z;
		//dig3d.c.camera.lookAt( this.pos.x*dig3d.params.cellSize-(dig3d.params.w*dig3d.params.cellSize)/2, this.pos.y*dig3d.params.cellSize-(dig3d.params.w*dig3d.params.cellSize)/2, 0 )	;
		//dig3d.c.controls.target = new THREE.Vector3( this.mesh.position.x-(dig3d.params.w*dig3d.params.cellSize)/2, this.mesh.position.y-(dig3d.params.w*dig3d.params.cellSize)/2, 0);

	};


	
	this.createMesh();

	var s = Math.floor(Math.random()*dig3d.freeCells.length);
	var pos = dig3d.freeCells[s].split(',');
	this.pos = {x: parseInt(pos[0]), y: parseInt(pos[1]) };

	this.mesh.position.set(this.pos.x*dig3d.params.cellSize, this.pos.y*dig3d.params.cellSize, 0);
	this.spotlight.position.set(this.pos.x*dig3d.params.cellSize, this.pos.y*dig3d.params.cellSize-20, -20 );
	//this.spotlight.target = this.mesh;
	//this.spotlight.visible = dig3d.params.spotlightVisible;
	//dig3d.c.camera.position.set( this.pos.x*dig3d.params.cellSize-(dig3d.params.w*dig3d.params.cellSize)/2, this.pos.y*dig3d.params.cellSize-(dig3d.params.w*dig3d.params.cellSize)/2, -200 )	;
	//dig3d.c.controls.target = new THREE.Vector3( this.mesh.position.x-(dig3d.params.w*dig3d.params.cellSize)/2, this.mesh.position.y-(dig3d.params.w*dig3d.params.cellSize)/2, 0);
	//dig3d.c.camera.position.set( this.mesh.position.x-(dig3d.params.w*dig3d.params.cellSize)/2, this.mesh.position.y-(dig3d.params.w*dig3d.params.cellSize)/2, -100);

	return this;
};

dig3d.crewMember = function(){
	this.stats = {
		timeWait : 500, //how much time between ticks before moving
		timeLeft : 500, //how much time left before next action
		laziness : 0.4,
	};
	this.moveTick = function(timeSince){
		this.stats.timeLeft -= timeSince;
		if(this.stats.timeLeft > 0 ) return;
		this.stats.timeLeft = this.stats.timeWait;
		//console.log('crew tick');
		var whut = Math.random();
		if(whut < this.stats.laziness) return;
		//console.log("Attempting to move crew");
		var avail = [];
			for(var x=this.pos.x-1;x<=this.pos.x+1;x++){
				for(var y=this.pos.y-1;y<=this.pos.y+1;y++){
					if(y==this.pos.y&&x==this.pos.x) continue;
					//TODO:: need to check this spot is not taken by an npc or object
					//TODO:: also needs to check relevant map if not on player ship
					if(dig3d.mapArray[x+','+y]=='F' ) avail.push([x,y]);
				}
			}
			//console.log(this.name,avail);
			if(avail.length>0){
				//console.log("crew moving!");
				var which = Math.floor(Math.random()*avail.length);
				this.pos.x = avail[which][0]; this.pos.y = avail[which][1];
				this.sphere.position.set( this.pos.x*dig3d.params.cellSize +dig3d.params.cellSize/2, this.pos.y*dig3d.params.cellSize+dig3d.params.cellSize/2 , 0);
				
			}
	}; 
};