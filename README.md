<h2>WebVR Helper</h2>
<a href="https://travis-ci.org/axaq/webvr-helper"><img src="https://travis-ci.org/axaq/webvr-helper.svg?branch=master" /></a> 
<!-- <img src="https://img.shields.io/david/hodgef/js-library-boilerplate-basic.svg" /> <a href="https://david-dm.org/hodgef/js-library-boilerplate-basic?type=dev"><img src="https://img.shields.io/david/dev/hodgef/js-library-boilerplate-basic.svg" /></a>  -->
<img src="https://api.dependabot.com/badges/status?host=github&repo=axaq/webvr-helper" />
 
#### A three.js helper library to check and run VR sessions on web with a stereo-effect-view backup.

## Features

This library provides features to 
- Check weather VR is available in a loose and synchronous way (you can use this to decide weather to load other VR specific resources)
- Check weather VR is available in a stronger, feature-based and asynchronous way (more reliable)
- Setup necessary components depending on which VR type is available
- Setup necessary callbacks and methods to inform your app about the state of VR sessions

The availability check is done in the following order
- WebXR API
- Legacy WebVr API
- Fallback threejs stereo-effect to simulate VR view for Cardboard-style headsets

## Usage

### npm
```
import WebVRHelper from 'webvr-helper';

let anyVRAvailable = WebVRHelper.checkAvailabilityLoose();
WebVRHelper.checkAvailabilityFull((anyVRAvailable) => {});
...
```

### self-host
```
<script src="build/webvrhelper.min.js"></script>


let WebVRHelper = window.WebVRHelper.default;

let container = document.createElement('div');
document.body.appendChild(container);

let scene = new THREE.Scene();
scene.background = new THREE.Color(0x505050);

let camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10);
scene.add(camera);

let renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.vr.enabled = true;
container.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
    WebVRHelper.onResize();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

// Check VR availability
console.log('Loose sync availability check', WebVRHelper.checkAvailabilityLoose());
// Strong and async feature check
WebVRHelper.checkAvailabilityFull((anyVRAvailable) => {
    if (anyVRAvailable) {
        // setup renderer
        WebVRHelper.postAvailabilitySetup(renderer, () => {
            console.log('VR session has changed');
        });
    }
    // start the render
    animate();
});

let animate = () => {
    renderer.setAnimationLoop(render);
};
let render = () => {
    // Render on WebVRHelper if VR is supported
    if (WebVRHelper.isAnyVRSupported()) {
        WebVRHelper.render(scene, camera);
    } else {
        renderer.render(scene, camera);
    }
};
...
```

> **Note:** Check the example in demo folder for a more detailed working example.

## Build

```
git clone https://github.com/axaq/webvr-helper.git
npm install
npm run build
```
