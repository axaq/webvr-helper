import { StereoEffect } from "three/examples/jsm/effects/StereoEffect";

var WebVRHelper = {
    supportsXR: false,
    supportsVR: false,
    supportsStereoView: false,

    renderer: null,
    sessionChangeCallback: null,
    onVRAvailabilityCallback: null,
    currentXRSession: null,
    currentVRDisplay: null,

    sessionActive: false,
    stereoEffectActive: false,

    fullscreenSupported: false,

    checkAvailabilityLoose: function() {
        // console.log("Library checkAvailabilityLoose method fired");
        return (
            ("xr" in navigator && "supportsSession" in navigator.xr) ||
            "getVRDisplays" in navigator ||
            (navigator.userAgent.match(
                /SamsungBrowser|OculusBrowser|Firefox/i
            ) &&
                navigator.userAgent.match(/Mobile VR/i)) ||
            this.checkFullscreenSupport()
        );
    },

    checkAvailabilityFull: function(onVRAvailabilityCallback) {
        // console.log("Library checkAvailabilityFull method fired");
        this.onVRAvailabilityCallback = onVRAvailabilityCallback;

        this.checkXRAvailability();
    },

    postAvailabilitySetup: function(
        renderer,
        sessionChangeCallback,
        samsungSkyImageOptions,
        referenceSpaceType
    ) {
        if (!renderer) {
            console.log("three.js renderer is not found. Aborting!");
            return;
        }
        this.renderer = renderer;

        this.sessionChangeCallback = sessionChangeCallback;

        if (
            !!referenceSpaceType &&
            "setReferenceSpaceType" in this.renderer.vr
        ) {
            this.renderer.vr.setReferenceSpaceType(referenceSpaceType);
        }

        if (!!samsungSkyImageOptions && "SamsungChangeSky" in window) {
            window.SamsungChangeSky(samsungSkyImageOptions);
        }

        if (this.supportsXR) {
            this.onXRSessionStarted = function(session) {
                session.addEventListener("end", this.onXRSessionEnded);
                this.renderer.vr.setSession(session);
                this.currentXRSession = session;
                this.sessionActive = true;
                if (this.sessionChangeCallback) {
                    this.sessionChangeCallback();
                }
            }.bind(this);

            this.onXRSessionEnded = function(event) {
                this.currentXRSession.removeEventListener(
                    "end",
                    this.onXRSessionEnded
                );
                this.renderer.vr.setSession(null);
                this.currentXRSession = null;
                this.sessionActive = false;
                if (this.sessionChangeCallback) {
                    this.sessionChangeCallback();
                }
            }.bind(this);

            this.errorOnXRSessionRequest = function(err) {
                console.log(
                    "Error while requesting XR session. Removing XR support flag.",
                    err
                );
                this.supportsXR = false;
            }.bind(this);
        } else if (this.supportsVR) {
            this.renderer.vr.enabled = true;
            this.onVRDisplayConnectDisconnect = function(display) {
                this.currentVRDisplay = display;
                this.renderer.vr.setDevice(this.currentVRDisplay);
                if (this.sessionChangeCallback) {
                    this.sessionChangeCallback();
                }
            };
            window.addEventListener(
                "vrdisplayconnect",
                function(event) {
                    this.onVRDisplayConnectDisconnect(event.display);
                }.bind(this),
                false
            );
            window.addEventListener(
                "vrdisplaydisconnect",
                function() {
                    this.onVRDisplayConnectDisconnect(null);
                }.bind(this),
                false
            );
            window.addEventListener(
                "vrdisplaypresentchange",
                function(event) {
                    this.sessionActive = event.display.isPresenting;
                    if (this.sessionChangeCallback) {
                        this.sessionChangeCallback();
                    }
                }.bind(this),
                false
            );
            window.addEventListener(
                "vrdisplayactivate",
                function(event) {
                    event.display.requestPresent([
                        { source: this.renderer.domElement }
                    ]);
                }.bind(this),
                false
            );
        } else if (this.supportsStereoView) {
            this.isInFullScreen = function() {
                return (
                    (document.fullscreenElement &&
                        document.fullscreenElement !== null) ||
                    (document.webkitFullscreenElement &&
                        document.webkitFullscreenElement !== null) ||
                    (document.mozFullScreenElement &&
                        document.mozFullScreenElement !== null) ||
                    (document.msFullscreenElement &&
                        document.msFullscreenElement !== null)
                );
            };

            this.enterExitFullscreen = function(enter) {
                if (enter) {
                    if (document.documentElement.requestFullscreen) {
                        document.documentElement.requestFullscreen();
                    } else if (document.documentElement.msRequestFullscreen) {
                        document.documentElement.msRequestFullscreen();
                    } else if (document.documentElement.mozRequestFullScreen) {
                        document.documentElement.mozRequestFullScreen();
                    } else if (
                        document.documentElement.webkitRequestFullscreen
                    ) {
                        document.documentElement.webkitRequestFullscreen();
                    }
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.msExitFullscreen) {
                        document.msExitFullscreen();
                    } else if (document.mozCancelFullScreen) {
                        document.mozCancelFullScreen();
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    }
                }
            };

            this.onFullscreenChange = function(e) {
                if (!this.isInFullScreen()) {
                    if (this.stereoEffectActive) {
                        this.startStopVRSession();
                    }
                }
            }.bind(this);

            if (document.documentElement.requestFullscreen) {
                document.documentElement.addEventListener(
                    "fullscreenchange",
                    this.onFullscreenChange
                );
            } else if (document.documentElement.msRequestFullscreen) {
                document.documentElement.addEventListener(
                    "msfullscreenchange",
                    this.onFullscreenChange
                );
            } else if (document.documentElement.mozRequestFullScreen) {
                document.documentElement.addEventListener(
                    "mozfullscreenchange",
                    this.onFullscreenChange
                );
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.addEventListener(
                    "webkitfullscreenchange",
                    this.onFullscreenChange
                );
            }
        }
    },

    checkFullscreenSupport: function() {
        this.fullscreenSupported =
            this.fullscreenSupported ||
            !!(
                document.documentElement.requestFullscreen ||
                document.documentElement.msRequestFullscreen ||
                document.documentElement.mozRequestFullScreen ||
                document.documentElement.webkitRequestFullscreen
            );
        return this.fullscreenSupported;
    },

    checkXRAvailability: function() {
        if ("xr" in navigator && "supportsSession" in navigator.xr) {
            navigator.xr
                .supportsSession("immersive-vr")
                .then(
                    function(device) {
                        this.supportsXR = true;
                        this.endOfAvailabilityCheck();
                    }.bind(this)
                )
                .catch(
                    function(err) {
                        console.log(
                            "Error while checking native XR support. Moving on to checking native legacy VR support.",
                            err
                        );
                        this.checkLegacyVRAvailability();
                    }.bind(this)
                );
        } else {
            this.checkLegacyVRAvailability();
        }
    },

    checkLegacyVRAvailability: function() {
        if ("getVRDisplays" in navigator) {
            navigator
                .getVRDisplays()
                .then(
                    function(displays) {
                        if (displays.length > 0) {
                            this.currentVRDisplay = displays[0];
                            this.supportsVR = true;
                            this.endOfAvailabilityCheck();
                        } else {
                            this.checkStereoViewAvailability();
                        }
                    }.bind(this)
                )
                .catch(
                    function(err) {
                        console.log(
                            "Error while checking native legacy VR support. Moving on to checking three.js stereo view support.",
                            err
                        );
                        this.checkStereoViewAvailability();
                    }.bind(this)
                );
        } else {
            this.checkStereoViewAvailability();
        }
    },

    checkStereoViewAvailability: function() {
        this.supportsStereoView = this.checkFullscreenSupport();
        this.endOfAvailabilityCheck();
    },

    endOfAvailabilityCheck: function() {
        console.log("supportsXR: " + this.supportsXR);
        console.log("supportsVR: " + this.supportsVR);
        console.log("supportsStereoView: " + this.supportsStereoView);
        if (this.onVRAvailabilityCallback) {
            this.onVRAvailabilityCallback(this.isAnyVRSupported());
        }
    },

    // General Methods

    startStopVRSession: function() {
        if (this.supportsXR) {
            if (this.currentXRSession === null) {
                navigator.xr
                    .requestSession("immersive-vr")
                    .then(this.onXRSessionStarted)
                    .catch(this.errorOnXRSessionRequest);
            } else {
                this.currentXRSession.end();
            }
        } else if (this.supportsVR && this.currentVRDisplay) {
            if (this.currentVRDisplay.isPresenting) {
                this.currentVRDisplay.exitPresent();
            } else {
                this.renderer.vr.setDevice(this.currentVRDisplay);
                this.currentVRDisplay.requestPresent([
                    { source: this.renderer.domElement }
                ]);
            }
        } else if (this.supportsStereoView) {
            this.stereoEffectActive = !this.stereoEffectActive;
            if (this.stereoEffectActive) {
                if (!this.currentStereoEffect) {
                    this.currentStereoEffect = new StereoEffect(this.renderer);
                }
                this.currentStereoEffect.setSize(
                    window.innerWidth,
                    window.innerHeight
                );
                this.currentStereoEffect.setEyeSeparation((2.5 * 0.0254) / 2);
                // this.currentStereoEffect.setEyeSeparation(0.064);
                this.enterExitFullscreen(true);
            } else {
                this.currentStereoEffect = null;
                this.renderer.setSize(
                    window.innerWidth,
                    window.innerHeight,
                    false
                );
            }
            if (this.sessionChangeCallback) {
                this.sessionChangeCallback();
            }
        }
    },

    isAnyVRSupported: function() {
        return this.supportsXR || this.supportsVR || this.supportsStereoView;
    },

    inVRView: function() {
        return this.stereoEffectActive || this.sessionActive;
    },

    onResize: function() {
        if (this.stereoEffectActive && this.currentStereoEffect) {
            this.currentStereoEffect.setSize(
                window.innerWidth,
                window.innerHeight
            );
        }
    },

    render: function(scene, camera) {
        if (this.stereoEffectActive && this.currentStereoEffect) {
            this.currentStereoEffect.render(scene, camera);
        } else {
            this.renderer.render(scene, camera);
        }
    }
};

export default WebVRHelper;
