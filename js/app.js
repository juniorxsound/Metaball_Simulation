		if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

		var SCREEN_WIDTH = window.innerWidth;
		var SCREEN_HEIGHT = window.innerHeight;

		var container, stats;

		var camera, scene, renderer;

		var light, pointLight, ambientLight;

		var meta, metaMat, resolution, numBlobs;

		var metaStand, standMat;

		var time = 0;
		var clock = new THREE.Clock();

		var metaController = {
			
			//Metaball simulation
			speed: 1.0,
			numBlobs: 10,
			resolution: 50,
			isolation: 80,

			//Camera control
			cameraRotate: function(){
				if(controls.autoRotate){
					controls.autoRotate = false;
				} else {
					controls.autoRotate = true;
				}
			},

			cameraReset: function(){
				camera.position.set( 0, 0, 5000 );
			},

			//Metaball material
			metaColor: "#000000",
			metaSpec: "#888888",
			metaShine: 250,

			standColor: "#000000",
			standSpec: "#FFD700",
			standShine: 250
		}


		//When the window loads run the init scene which will trigger rendering once models load
		window.onload = function(){

			init();

		}

		

		function init() {

			container = document.getElementById( 'container' );

			// CAMERA
			camera = new THREE.PerspectiveCamera( 45, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 100000 );
			camera.position.set( 0, 0, 5000 );

			// SCENE
			scene = new THREE.Scene();

			//META STAND
			var loader = new THREE.JSONLoader();

			loader.load(
				'assets/models/meta_stand_geo.json',
				//Load the model
				function ( geometry, materials ) {
					standMat = new THREE.MeshPhongMaterial( { color: 0x000000, specular: 0xFFD700, shininess: 250 } )
					var object = new THREE.Mesh( geometry, standMat );
					metaStand = object;
					metaStand.scale.set(400,400,400);
					metaStand.position.set(0,-1800,0);
					scene.add( metaStand );

					//Start animating once the model loads
					animate();

					//And make the canvas visible		
					container.style.display = "block";
				},    
				// called when download progresses
				function ( loaded, total ) {
					console.log( (Math.round(loaded / total * 100)) + '% loaded' );
				},

				//  called when download errors
				function ( xhr ) {
					console.error( 'An error happened' );
				}
			);

			// LIGHTS
			light = new THREE.DirectionalLight( 0xffffff );
			light.position.set( 0.5, 0.5, 1 );
			scene.add( light );

			ambientLight = new THREE.AmbientLight( 0x080808 );
			scene.add( ambientLight );

			// METABALLS
			resolution = 28;
			numBlobs = 10;

			metaMat =  new THREE.MeshPhongMaterial( { color: 0x000000, specular: 0x888888, shininess: 250 } );
			meta = new THREE.MarchingCubes( 50, metaMat, true, true );
			meta.position.set( 0, 700, 0 );
			meta.scale.set( 700, 700, 700 );

			scene.add( meta );

			// RENDERER

			renderer = new THREE.WebGLRenderer();
			renderer.setClearColor( 0xffffff );
			renderer.setPixelRatio( window.devicePixelRatio );
			renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

			container.appendChild( renderer.domElement );

			renderer.gammaInput = true;
			renderer.gammaOutput = true;

			// CONTROLS

			controls = new THREE.OrbitControls( camera, renderer.domElement );

			controls.autoRotate = true;

			// STATS
			stats = new Stats();
			container.appendChild( stats.dom );


			// EVENTS
			window.addEventListener( 'resize', onWindowResize, false );

			//setup GUI
			setupGui();

		}

		//

		function onWindowResize( event ) {

			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();

			renderer.setSize( window.innerWidth, window.innerHeight );

		}

		// this controls content of marching cubes voxel field

		function updateCubes( object, time, numblobs ) {

			object.reset();

			// fill the field with some metaballs

			var i, ballx, bally, ballz, subtract, strength;

			subtract = 12;
			strength = 1.2 / ( ( Math.sqrt( numblobs ) - 1 ) / 4 + 1 );

			for ( i = 0; i < numblobs; i ++ ) {

				ballx = Math.sin( i + 1.26 * time * ( 1.03 + 0.5 * Math.cos( 0.21 * i ) ) ) * 0.27 + 0.5;
				bally = Math.abs( Math.cos( i + 1.12 * time * Math.cos( 1.22 + 0.1424 * i ) ) ) * 0.27 + 0.5;
				ballz = Math.cos( i + 1.32 * time * 0.1 * Math.sin( ( 0.92 + 0.53 * i ) ) ) * 0.27 + 0.5;

				object.addBall(ballx, bally, ballz, strength, subtract);

			}

		}


		function animate() {

			requestAnimationFrame( animate );

			render();

			stats.update();

		}

		function render() {

			var delta = clock.getDelta();

			time += delta * metaController.speed * 0.5;

			controls.update( delta );

			// Metaball simulation GUI
			if ( metaController.resolution !== resolution ) {

				resolution = metaController.resolution;
				meta.init( Math.floor( resolution ) );

			}

			if ( metaController.isolation !== meta.isolation ) {

				meta.isolation = metaController.isolation;

			}

			//Metaball Material GUI
			metaMat.color = new THREE.Color(metaController.metaColor);
			metaMat.specular = new THREE.Color(metaController.metaSpec);

			if(metaMat.shininess !== metaController.metaShine){
				metaMat.shininess = metaController.metaShine;
			}

			//Stand material GUI
			standMat.color = new THREE.Color(metaController.standColor);
			standMat.specular = new THREE.Color(metaController.standSpec);

			if(standMat.shininess !== metaController.standShine){
				standMat.shininess = metaController.standShine;
			}

			updateCubes( meta, time, metaController.numBlobs );

				renderer.clear();
				renderer.render( scene, camera );

		}

		function setupGui(){
			var gui = new dat.GUI();

			var h = gui.addFolder("Camera");
			h.add(metaController, "cameraRotate");
			h.add(metaController, "cameraReset");

			var h = gui.addFolder("Metaballs");
			h.add(metaController, "speed", 0.0, 10.0);
			h.add(metaController, "numBlobs", 0, 20);
			h.add(metaController, "resolution", 50, 100);
			h.add(metaController, "isolation", 50, 450);

			var h = gui.addFolder("Meta Material");
			h.addColor(metaController, "metaColor");
			h.addColor(metaController, "metaSpec");
			h.add(metaController, "metaShine", 0, 250);

			var h = gui.addFolder("Stand Material");
			h.addColor(metaController, "standColor");
			h.addColor(metaController, "standSpec");
			h.add(metaController, "standShine", 0, 250);
		}