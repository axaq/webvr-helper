import WebVRHelper from '../src/index';

test('Runs loose availability check without problems', () => {
    WebVRHelper.checkAvailabilityLoose();
});

test('Runs full availability check without problems', () => {
    WebVRHelper.checkAvailabilityFull( () => {
        console.log('onVRAvailabilityCallback fired');
    });
});
