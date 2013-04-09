
function terrainGeneration(){
	// Set these variables to adjust how the map is generated
	var self = this;
	this.params = {
		mapDimension : 1024,
		unitSize : 8, // Power of 2
		roughness : 5,
		genPerspective : false,
		genShadows : false, 
		sunX : 300, sunY : 300,
		mapType : 'gray',
		map : null,
		DrawDiamondAlgo : true,
	};

	var unitSize, mapDimension, map;
	self.map = null;

	// Setup the map array for use
	function create2DArray(d1, d2) {
		var x = new Array(d1),
		i = 0,
		j = 0;
		
		for (i = 0; i < d1; i += 1) {
			x[i] = new Array(d2);
		}
	  
		for (i=0; i < d1; i += 1) {
			for (j = 0; j < d2; j += 1) {
				x[i][j] = 0;
			}
		}

		return x;
	}

	this.drawIt = function(ctx){
		mapDimension = self.mapDimension = parseInt(self.params.mapDimension);
		self.ctx = ctx;
		self.roughness = parseInt(self.params.roughness);
		unitSize = self.unitSize = parseInt(self.params.unitSize);
		self.mapType = 2; //gray scale add param later
		self.genPerspective = false;
		self.genShadows = false;

		if(isNaN(self.roughness) || self.roughness < 0 ) self.roughness = 1;
		if(isNaN(self.mapDimension) || self.mapDimension < 0 ) self.mapDimension = 256;
		if(isNaN(self.unitSize) || self.unitSize < 0 ) self.unitSize = 1;
		if(self.genShadows ){
			self.sunX = 300;
			self.sunY = 300;
		}

		$('#sketchy').width = mapDimension;
		$('#sketchy').height = mapDimension;
		map = self.map = create2DArray(self.mapDimension+1, self.mapDimension+1);

		startDisplacement();
	};		
	
	this.clickIt = function(){
		var elTerDimension = document.getElementById('terdim'),
			elRoughness = document.getElementById('roughness'),
			elUnitsize = document.getElementById('unitsize'),
			selMapType = document.getElementById('maptype'),
			chkPerspective = document.getElementById('perspective'),
			chkShadowMap = document.getElementById('shadowmap');
			elSunX = document.getElementById("sunx"),
			elSunY = document.getElementById("suny");			
			
		roughness = parseInt(elRoughness.value);
		mapDimension = parseInt(elTerDimension.value);
		unitSize = parseInt(elUnitsize.value);
		mapType = parseInt(selMapType.options[selMapType.selectedIndex].value);
		genPerspective = chkPerspective.checked;
		genShadows = chkShadowMap.checked;
		
		if(roughness < 0 || isNaN(roughness)){
			roughness = 1;
		}
		
		if(mapDimension < 0 || isNaN(mapDimension)){
			mapDimension = 256;
		}
		
		if(unitSize < 1 || isNaN(unitSize)){
			unitSize = 1;
		}
		
		if(genShadows){
			sunX = parseInt(elSunX.value);
			sunY = parseInt(elSunY.value);
			
			if(isNaN(sunX)){
				sunX = 300;
			}
			
			if(isNaN(sunY)){
				sunY = 300;
			}
		}
		
		mapCanvas.width = mapDimension;
		mapCanvas.height = mapDimension;
		
		map = create2DArray(mapDimension+1, mapDimension+1);
		
		startDisplacement();
	};
	
	
	// Random function to offset the center
	function displace(num){
		var max = num / (self.mapDimension + self.mapDimension) * self.roughness;       
		return (Math.random(1.0)- 0.5) * max;  
	}
	
	// Normalize the value to make sure its within bounds
	function normalize(value){
		if( value > 1){
			value = 1;
		}else if(value < 0){
			value = 0;
		}
		return value;
	}
	
	// Round to nearest pixel
	function round(n)
	{
		if (n-(parseInt(n)) >= 0.5){
			return parseInt(n)+1;
		}else{
			return parseInt(n);
		}
	}
	
	// Create color gradients Taken from http://www.elctech.com/snippets/javascript-color-fade-function-find-the-hex-value-between-two-hex-values  .... Its bugged however 
	colorFade = function(h1, h2, p) { return ((h1>>16)+((h2>>16)-(h1>>16))*p)<<16|(h1>>8&0xFF)+((h2>>8&0xFF)-(h1>>8&0xFF))*p<<8|(h1&0xFF)+((h2&0xFF)-(h1&0xFF))*p; }
	
	// Workhorse of the terrain generation.
	function midpointDisplacment(dimension){
		var newDimension = dimension / 2, 
			top, topRight, topLeft, bottom, bottomLeft, bottomRight, right, left, center,
			i, j;
		
		if (newDimension > self.unitSize){
			for(i = newDimension; i <= mapDimension; i += newDimension){
				for(j = newDimension; j <= mapDimension; j += newDimension){
					x = i - (newDimension / 2);
					y = j - (newDimension / 2);
					
					topLeft = self.map[i - newDimension][j - newDimension]; 
					topRight = self.map[i][j - newDimension];
					bottomLeft = self.map[i - newDimension][j];
					bottomRight = self.map[i][j];
					
					// Center				
					self.map[x][y] = (topLeft + topRight + bottomLeft + bottomRight) / 4 + displace(dimension);
					self.map[x][y] = normalize(self.map[x][y]);
					center = self.map[x][y];	
					
					// Top
					if(j - (newDimension * 2) + (newDimension / 2) > 0){
						self.map[x][j - newDimension] = (topLeft + topRight + center + self.map[x][j - dimension + (newDimension / 2)]) / 4 + displace(dimension);;
					}else{
						self.map[x][j - newDimension] = (topLeft + topRight + center) / 3+ displace(dimension);
					}
					
					map[x][j - newDimension] = normalize(map[x][j - newDimension]);
			
					// Bottom
					if(j + (newDimension / 2) < self.mapDimension){
						self.map[x][j] = (bottomLeft + bottomRight + center + self.map[x][j + (newDimension / 2)]) / 4+ displace(dimension);
					}else{
						self.map[x][j] = (bottomLeft + bottomRight + center) / 3+ displace(dimension);
					}
					
					self.map[x][j] = normalize(self.map[x][j]);

					
					//Right
					if(i + (newDimension / 2) < self.mapDimension){
						self.map[i][y] = (topRight + bottomRight + center + self.map[i + (newDimension / 2)][y]) / 4+ displace(dimension);
					}else{
						self.map[i][y] = (topRight + bottomRight + center) / 3+ displace(dimension);
					}
					
					self.map[i][y] = normalize(self.map[i][y]);
					
					// Left
					if(i - (newDimension * 2) + (newDimension / 2) > 0){
						self.map[i - newDimension][y] = (topLeft + bottomLeft + center + self.map[i - dimension + (newDimension / 2)][y]) / 4 + displace(dimension);;
					}else{
						self.map[i - newDimension][y] = (topLeft + bottomLeft + center) / 3+ displace(dimension);
					}
					
					map[i - newDimension][y] = normalize(map[i - newDimension][y]);
				}
			}
			midpointDisplacment(newDimension);
		}
	}
	
	//Create Shadowmap
	function drawShadowMap(size, sunPosX, sunPosY, sunHeight){
		//var ctx = mapCanvas.getContext("2d"),
		var ctx = self.stx,
		x = 0, y = 0,
		idx,
		colorFill = 0,
		sunX, sunY, sunZ, 
		pMag, pX, pY, pZ,
		mag, dX, dY, dZ,
		ambLight;
		
		// Suns position
		sunX = sunPosX;
		sunY = sunPosY;
		sunZ = sunHeight;
		ambLight = 0;
		
		for(x = 0; x <= self.mapDimension; x += self.unitSize){
			for(y = 0; y <=  self.mapDimension; y += self.unitSize){		
				dX = sunX - x;
				dY = sunY - y;
				dZ = sunZ - self.map[x][y];
				
				mag = Math.sqrt(dX * dX + dY * dY + dZ * dZ);
				
				dX = (dX / mag);
				dY = (dY / mag);
				dZ = (dZ / mag);
				
				pX = x;
				pY = y;
				pZ = self.map[x][y];
				
				while(pX >= 0 && pX < self.mapDimension && pY >= 0 && pY < self.mapDimension && pZ <= sunZ){
					
					if((self.map[round(pX)][round(pY)]) > pZ){
					
						ctx.fillStyle = "rgba(" + 0 + "," +  0 + "," + 0 +"," + 0.7 + ")";
						ctx.fillRect (x, y, self.unitSize, self.unitSize);
						break;
					}
					
					pX += (dX * self.unitSize);
					pY += (dY * self.unitSize);
					pZ += (dZ * self.unitSize);
				}
			}
		}
	}
	
	//Create Voxel View
	function drawRenderedMap(size, viewAngle, yaw, camHeight, camX, camY){
		//var ctx = voxCanvas.getContext("2d"),
		//	sCtx = mapCanvas.getContext("2d"),
		var ctx = self.ctx,
			sCtx = self.ctx,
			sCanvasData = sCtx.getImageData(0, 0, self.mapDimension, self.mapDimension),
			idx;
		
		ctx.clearRect(0,0,self.mapDimension,self.mapDimension);
		
		document.onkeydown = function(evt){
			if (evt.keyCode === 39){
				drawRenderedMap(size, viewAngle, yaw, camHeight, camX+=5, camY);
			}else if (evt.keyCode === 37){
				drawRenderedMap(size, viewAngle, yaw, camHeight, camX-=5, camY);
			}else if (evt.keyCode === 38){
				drawRenderedMap(size, viewAngle, yaw, camHeight, camX, camY-=5);
			}else if (evt.keyCode === 40){
				drawRenderedMap(size, viewAngle, yaw, camHeight, camX, camY+=5);
			}else if (evt.keyCode === 107){
				drawRenderedMap(size, viewAngle, yaw, camHeight-=5, camX, camY);
			}else if (evt.keyCode === 109){
				drawRenderedMap(size, viewAngle, yaw, camHeight+=5, camX, camY);
			}				
		};
		
		
		var Ray = 0, AngRay, iRay, ix, iy, iz, px, py, pz, dx, dy, dz, idz, fov, Highest, VxHigh, ScreenAt, MidOut, vy;
		
		//Field of view
		fov = 1;		
		iRay = fov / mapDimension;

		// Gets the distance multiplier for the camera
		ScreenAt = parseInt((mapDimension / 2) * Math.tan(fov / 2));
		
		// Angle of view
		vy = viewAngle;
		
		// Camera height
		MidOut = yaw;
		
		for (AngRay=(vy-(fov/2)); Ray < mapDimension; Ray+=unitSize, AngRay+=iRay) {
			
			// Camera position
			px = camX;
			py = camY;
			
			// how much to increment based on the angle for the ray
			ix = Math.cos (AngRay); 
			iy = Math.sin (AngRay);

			idy = Math.cos (AngRay - (vy));
			dy = idy;
			
			// Set the current position at the bottom of the image
			Highest = mapDimension;
			
			  while (px>=0 && px<mapDimension && py>=0 && py<(mapDimension+200)) {
			  
				VxHigh = (((map[round(px)][round(py)]* camHeight)  * (ScreenAt  / dy)) + MidOut) / map[round(px)][round(py)] ;

				/* If it's above the highest point drawn so far. */
				 if (VxHigh < Highest) {
										 
					idx = (round(px) + round(py) * mapDimension) * 4;
					ctx.fillStyle = "rgb(" + sCanvasData.data[idx + 0] + "," +  sCanvasData.data[idx + 1] + "," + sCanvasData.data[idx + 2] +")";
					ctx.fillRect(Ray, VxHigh, unitSize,  Highest - VxHigh);

					// Uncomment this line to see the overhead perspective of what your looking at
					//ctx.fillRect (round(px), round(py), unitSize, unitSize);
					
					if (VxHigh < 0){
						break;	
					}
					
					Highest = VxHigh + 0.5;
				 }
				 
				px += ix; 
				py += iy;
				dy += idy;
			 }
		}
		
	}
			
	
	// Draw the map
	function drawMap(size, canvasId, mapData, mapType){
		//var canvas = document.getElementById(canvasId),
		//ctx = canvas.getContext("2d"),
		var ctx = self.ctx,
		unitSize = self.unitSize,
		map = self.map,
		mapDimension = self.mapDimension,
		canvasData = ctx.getImageData(0, 0, self.mapDimension, self.mapDimension),
		x = 0,
		y = 0,
		r = 0, g = 0, b = 0, gamma = 500,
		colorFill = 0;
		
		for(x = 0; x <= size; x += unitSize){
			for(y = 0; y <= size; y += unitSize){
				switch(mapType){
					case 1: // Color map
						if(mapData[x][y] < 0){
							colorFill = "001b92";
						}else if(mapData[x][y] >= 0 && mapData[x][y] <= 0.3){
							colorFill = colorFade("0x001b92","0x234af1",(mapData[x][y] * 200)/(0.4 * 200)).toString(16);
						}else if(mapData[x][y] > 0.3 && mapData[x][y] <= 0.8){
							colorFill = colorFade("0xe3deb0","0x3a8e40",(mapData[x][y] * 200)/(0.8 * 200)).toString(16);
						}else if(mapData[x][y] > 0.8 && mapData[x][y] <= 0.98){
							colorFill = colorFade("0x3a8e40","0x7e7e7e",(mapData[x][y] * 200)/(0.98 * 200)).toString(16);
						}else if(mapData[x][y] > 0.98 && mapData[x][y] <= 1){
							colorFill = colorFade("0x7e7e7e","0xdfdfdf",(mapData[x][y] * 200)/(1 * 200)).toString(16);
						}else if(mapData[x][y] >= 1){
							colorFill = "c6c6c6";
						}
						ctx.fillStyle = "#" + colorFill;
						break;
					case 2: // Standard
						colorFill = Math.floor(map[x][y] * 250);
						ctx.fillStyle = "rgb(" + colorFill + "," +  colorFill + "," + colorFill +")";
						break;
					case 3: // 10 shades
						if(mapData[x][y] <= 0){
							colorFill  = 0;
						}else if(mapData[x][y] > 0 && mapData[x][y] <= 0.1){
							colorFill = 20;
						}else if(mapData[x][y] > 0.1 && mapData[x][y] <= 0.2){
							colorFill = 40;
						}else if(mapData[x][y] > 0.2 && mapData[x][y] <= 0.3){
							colorFill = 60;
						}else if(mapData[x][y] > 0.3 && mapData[x][y] <= 0.4){
							colorFill = 80;
						}else if(mapData[x][y] > 0.4 && mapData[x][y] <= 0.5){
							colorFill = 100;
						}else if(mapData[x][y] > 0.5 && mapData[x][y] <= 0.6){
							colorFill = 120;
						}else if(mapData[x][y] > 0.6 && mapData[x][y] <= 0.7){
							colorFill = 140;
						}else if(mapData[x][y] > 0.7 && mapData[x][y] <= 0.8){
							colorFill = 160;
						}else if(mapData[x][y] > 0.8 && mapData[x][y] <= 0.9){
							colorFill = 180;
						}else if(mapData[x][y] > 0.9 && mapData[x][y] <= 1){
							colorFill = 200;
						}else if(mapData[x][y] >= 1){
							colorFill = 210;
						}
						
						ctx.fillStyle = "rgb(" + colorFill + "," +  colorFill + "," + colorFill +")";
						break;
					case 4: // 2 shades
						if(mapData[x][y] <= 0.5){
							mapData[x][y] = 0;
						}else if(mapData[x][y] > 0.5){
							mapData[x][y] = 220;
						}
						
						colorFill = mapData[x][y];
						ctx.fillStyle = "rgb(" + colorFill + "," +  colorFill + "," + colorFill +")";
						break;
					case 5:
						// Section of code modified from http://www.hyper-metrix.com/processing-js/docs/index.php?page=Plasma%20Fractals
						if (mapData[x][y] < 0.5) {  
						 r = mapData[x][y] * gamma;  
						} else {  
						 r = (1.0 - mapData[x][y]) * gamma;  
						}  

						if (mapData[x][y] >= 0.3 && mapData[x][y] < 0.8) {  
							g = (mapData[x][y] - 0.3) * gamma;  
						} else if (mapData[x][y] < 0.3) {  
							g = (0.3 - mapData[x][y]) * gamma;  
						} else {  
							g = (1.3 - mapData[x][y]) * gamma;  
						}  

						if (mapData[x][y] >= 0.5) {  
							b = (mapData[x][y] - 0.5) * gamma;  
						} else {  
							b = (0.5 - mapData[x][y]) * gamma;  
						}  
						
						ctx.fillStyle = "rgb(" + Math.floor(r) + "," +  Math.floor(g) + "," + Math.floor(b) +")";
						break;
				}
				
				ctx.fillRect (x, y, unitSize, unitSize);
			}
		}
	}
	
	// Starts off the map generation, seeds the first 4 corners
	function startDisplacement(){
		var mapDimension = self.mapDimension,
		ctx = self.ctx,
		sunX = self.sunX,
		sunY = self.sunY,
		genShadows = self.genShadows,
		genPerspective = self.genPerspective,
		unitSize = self.unitSize;
		var x = mapDimension,
			y = mapDimension,
			tr, tl, t, br, bl, b, r, l, center;
		
		// top left
		map[0][0] = Math.random(1.0);
		tl = map[0][0];
		
		// bottom left
		map[0][mapDimension] = Math.random(1.0);
		bl = map[0][mapDimension];
		
		// top right
		map[mapDimension][0] = Math.random(1.0);
		tr = map[mapDimension][0];
		
		// bottom right
		map[mapDimension][mapDimension] = Math.random(1.0);
		br = map[mapDimension][mapDimension]
		
		// Center
		map[mapDimension / 2][mapDimension / 2] = map[0][0] + map[0][mapDimension] + map[mapDimension][0] + map[mapDimension][mapDimension] / 4;
		map[mapDimension / 2][mapDimension / 2] = normalize(map[mapDimension / 2][mapDimension / 2]);
		center = map[mapDimension / 2][mapDimension / 2];
		
		map[mapDimension / 2][mapDimension] = bl + br + center / 3;
		map[mapDimension / 2][0] = tl + tr + center / 3;
		map[mapDimension][mapDimension / 2] = tr + br + center / 3;
		map[0][mapDimension / 2] = tl + bl + center / 3;
		
		// Call displacment 
		midpointDisplacment(mapDimension);
		
		// Draw everything after the terrain vals are generated
		drawMap(mapDimension, "canvas", map, self.mapType);
		
		if(genShadows){					
			drawShadowMap(mapDimension, sunX, sunY, 3);
		}
		
		if(genPerspective){
			voxCanvas.width = mapDimension;
			voxCanvas.height = mapDimension;
			
			drawRenderedMap(mapDimension, 300, mapDimension / 8, 300, mapDimension / 2, mapDimension + 50);
		}
		
		//btnSaveMap.style.display = "block";
	}
};	