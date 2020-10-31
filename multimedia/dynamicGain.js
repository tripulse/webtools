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
     * Target size of the time-domain buffer to capture upon calling .getFloatTimeDomainData(),
     * higher sizes take better running averages, but still there's a down-side, if the audio
     * is likely to change amplitude in less samples than this, some portions might sound quieter.
     */
    const WINDOW_SIZE = 32768;

    var VIDEO_ELEMENT = document.querySelector('video.video-stream, video.html5-main-video');

    const audioContext = new AudioContext();
    const audioNodes = {
        source: audioContext.createMediaElementSource(VIDEO_ELEMENT),
        gain: audioContext.createGain(),
        analyser: audioContext.createAnalyser()
    };

    // Sets the buffer size of AnalyserNode.
    audioNodes.analyser.fftSize = FFT_SIZE;

    with(audioNodes) {
        source.connect(analyser);
        analyser.connect(gain);
        gain.connect(audioContext.destination);
    }

    var timeDomain = new Float32Array(audioNodes.analyser.fftSize);

    (function normalise() {
        requestAnimationFrame(normalise);

        audioNodes.analyser.getFloatTimeDomainData(timeDomain);
        try {
            audioNodes.gain.gain.value = (1/Math.max.apply(this, timeDomain)) * VIDEO_ELEMENT.volume;
        } catch(e) {
            audioNodes.gain.gain.value = 1;
        }
    })();
})();
