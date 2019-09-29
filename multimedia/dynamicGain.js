// ==UserScript==
// @name         YTANormalize
// @namespace    http://www.youtube.com/
// @version      1.1
// @description  Processes the audio data decoded from a YouTube video and takes down the gain based on the peak value in a defined time frame.
// @author       nullvideo
// @match        https://*.youtube.com/watch*
// @grant        none
// ==/UserScript==

/**
 * Subroutine that takes two ranges and a real number, and returns
 * the mapping of the real number from the first to the second range.
 */
Math.map = (x, a, b, c, d) =>
  ((x - a) * (d - c) / (b - a)) + c;

// Converts linear audio amplitude into logarithmic scale (deciBels).
// y = 20 * log  x
//             10
const pow2db =
      x => 20 * Math.log10(x);


// Lower values than the thresold are considered the slicense.
// -120dB is the appox. range of human hearing.
const silence_thresold = LEAST_FLOAT;

(function() {
    /**
     * Size of the time-domain buffer. The less the more frequent the gain will change.
     * Lower values might cause audible distortions and higher ones make a smooth transition.
     */
    const FFT_SIZE = 32768;

    /**
     * YouTube video which we're going to extract the audio data from.
     * The audio gets decoded beforehand. We just play with the audio and make it good.
     */
    var VIDEO_ELEMENT = document.querySelector('video.video-stream, video.html5-main-video');

    /**
     * An interface to use the WebAudio API. The base node for all the other nodes.
     * (audioContext.destination) works like a sink where every sample of audio goes in.
     */
    const audioContext = new AudioContext();
    const audioNodes = {
        source: audioContext.createMediaElementSource(VIDEO_ELEMENT),
        gain: audioContext.createGain(),
        analyser: audioContext.createAnalyser()
    };

    // Sets the buffer size of AnalyserNode.
    audioNodes.analyser.fftSize = FFT_SIZE;

    /**
     * Connect all the nodes to create a "Node-Graph".
     * And, flow the PCM data through the nodes.
     */
    with(audioNodes) {
        source.connect(analyser);
        analyser.connect(gain);
        gain.connect(audioContext.destination);
    }

    /**
     * Buffer to store the audio data in. Samples are stored as 32-bit Float ([-1..1]).
     * Size of the buffer depends on the (audioNodes.analyser.fftSize).
     */
    var timeDomain = new Float32Array(audioNodes.analyser.fftSize);

    (function normalise() {
        requestAnimationFrame(normalise);

        audioNodes.analyser.getFloatTimeDomainData(timeDomain);
        /**
         * (1/max) would result the coefficient to be mutiplied
         * to normalize amplitude to (+1). Taking peak of 32767 samples.
         * (VIDEO_ELEMENT.volume) is a linear coefficent for
         * adjusting the gain value.
         */
        try {
            audioNodes.gain.gain.value = (1/Math.max.apply(this, timeDomain)) * VIDEO_ELEMENT.volume;
        } catch(err) {
            audioNodes.gain.gain.value = 1;
        }
    })();
})();
