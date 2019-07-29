var WebVRHelper = window.WebVRHelper.default;

var App = {

    init: function () {
        this.clock = new THREE.Clock();

        this.container = document.createElement('div');
        document.body.appendChild(this.container);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x505050);

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10);
        this.scene.add(this.camera);

        this.room = new THREE.LineSegments(
            new THREE.BoxLineGeometry(6, 6, 6, 10, 10, 10),
            new THREE.LineBasicMaterial({ color: 0x808080 })
        );
        this.room.position.y = 3;
        this.scene.add(this.room);

        this.scene.add(new THREE.HemisphereLight(0x606060, 0x404040));

        var light = new THREE.DirectionalLight(0xffffff);
        light.position.set(1, 1, 1).normalize();
        this.scene.add(light);
        
        // Create cubes to float around
        var geometry = new THREE.BoxBufferGeometry(0.15, 0.15, 0.15);

        for (var i = 0; i < 200; i++) {
            var object = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }));

            object.position.x = Math.random() * 4 - 2;
            object.position.y = Math.random() * 4 - 2;
            object.position.z = Math.random() * 4 - 2;

            object.rotation.x = Math.random() * 2 * Math.PI;
            object.rotation.y = Math.random() * 2 * Math.PI;
            object.rotation.z = Math.random() * 2 * Math.PI;

            object.scale.x = Math.random() + 0.5;
            object.scale.y = Math.random() + 0.5;
            object.scale.z = Math.random() + 0.5;

            object.userData.velocity = new THREE.Vector3();
            object.userData.velocity.x = Math.random() * 0.01 - 0.005;
            object.userData.velocity.y = Math.random() * 0.01 - 0.005;
            object.userData.velocity.z = Math.random() * 0.01 - 0.005;

            this.room.add(object);
        }

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.vr.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        window.addEventListener('resize', this.onWindowResize.bind(this), false);

        window.addEventListener('vrdisplaypointerrestricted', this.onPointerRestricted.bind(this), false);
        window.addEventListener('vrdisplaypointerunrestricted', this.onPointerUnrestricted.bind(this), false);

        // Check VR availability (loose)
        console.log('WebVRHelper.checkAvailabilityLoose',WebVRHelper.checkAvailabilityLoose());
        // Check VR availability (strong)
        WebVRHelper.checkAvailabilityFull(this.onVRAvailability.bind(this));
    },

    onVRAvailability: function (anyVRAvailable) {
        console.log('onVRAvailability anyVRAvailable ', anyVRAvailable);

        // create a toggle button for vr mode
        var button = document.createElement( 'button' );
        button.style.display = '';
        button.style.position = 'absolute';
        button.style.bottom = '20px';
        button.style.padding = '12px 6px';
        button.style.border = '1px solid #fff';
        button.style.borderRadius = '4px';
        button.style.background = 'rgba(0,0,0,0.1)';
        button.style.color = '#fff';
        button.style.font = 'normal 13px sans-serif';
        button.style.textAlign = 'center';
        button.style.opacity = '0.5';
        button.style.outline = 'none';
        button.style.zIndex = '999';

        button.style.cursor = 'auto';
        button.style.left = 'calc(100% - 170px)';
        button.style.width = '150px';

        if (anyVRAvailable) {
            // setup the renderer 
            WebVRHelper.postAvailabilitySetup(this.renderer, THREE.StereoEffect, this.onSessionChange.bind(this));

            button.textContent = 'ENTER/EXIT VR';

            button.onmouseenter = function () { button.style.opacity = '1.0'; };
			button.onmouseleave = function () { button.style.opacity = '0.5'; };

			button.onclick = function () { WebVRHelper.startStopVRSession(); };
        } else {
            button.textContent = 'VR NOT FOUND';

			button.onmouseenter = null;
			button.onmouseleave = null;

			button.onclick = null;
        }

        document.body.appendChild(button);
        // start the render
        this.animate();
    },

    onSessionChange: function () {
        console.log('onSessionChange');
    },

    onPointerRestricted: function () {
        var pointerLockElement = this.renderer.domElement;
        if (pointerLockElement && typeof (pointerLockElement.requestPointerLock) === 'function') {
            pointerLockElement.requestPointerLock();
        }
    },
    
    onPointerUnrestricted: function () {
        var currentPointerLockElement = document.pointerLockElement;
        var expectedPointerLockElement = this.renderer.domElement;
        if (currentPointerLockElement && currentPointerLockElement === expectedPointerLockElement && typeof (document.exitPointerLock) === 'function') {
            document.exitPointerLock();
        }
    },
    
    onWindowResize: function () {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        WebVRHelper.onResize();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    },

    animate: function () {
        this.renderer.setAnimationLoop(this.render.bind(this));
    },

    render: function () {
        var delta = this.clock.getDelta() * 60;
    
        // Keep cubes inside room
        for (var i = 0; i < this.room.children.length; i++) {
            var cube = this.room.children[i];
            cube.userData.velocity.multiplyScalar(1 - (0.001 * delta));
            cube.position.add(cube.userData.velocity);
            if (cube.position.x < - 3 || cube.position.x > 3) {
                cube.position.x = THREE.Math.clamp(cube.position.x, - 3, 3);
                cube.userData.velocity.x = - cube.userData.velocity.x;
            }
            if (cube.position.y < - 3 || cube.position.y > 3) {
                cube.position.y = THREE.Math.clamp(cube.position.y, - 3, 3);
                cube.userData.velocity.y = - cube.userData.velocity.y;
            }
            if (cube.position.z < - 3 || cube.position.z > 3) {
                cube.position.z = THREE.Math.clamp(cube.position.z, - 3, 3);
                cube.userData.velocity.z = - cube.userData.velocity.z;
            }
            cube.rotation.x += cube.userData.velocity.x * 2 * delta;
            cube.rotation.y += cube.userData.velocity.y * 2 * delta;
            cube.rotation.z += cube.userData.velocity.z * 2 * delta;
        }
        // Render on WebVRHelper if VR is supported
        if (WebVRHelper.isAnyVRSupported()) {
            WebVRHelper.render(this.scene, this.camera);
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
};

App.init();