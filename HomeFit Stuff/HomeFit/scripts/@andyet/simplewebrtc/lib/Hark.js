"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var events_1 = require("events");
var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
var AudioContext = window.AudioContext || window.webkitAudioContext;
// Check if the volume of fundamental freq is > threshold
function frequencyAnalyser(analyser, range, freqSpread, bins) {
    analyser.getFloatFrequencyData(bins);
    var start = range[0];
    var end = range[1];
    var startIndex = Math.round(start / freqSpread);
    var endIndex = Math.round(end / freqSpread);
    var fundamentalFreqArray = bins.slice(startIndex, endIndex);
    var avgVol = fundamentalFreqArray.reduce(function (a, b) { return a + b; }, 0) / fundamentalFreqArray.length;
    return avgVol;
}
var defaultSettings = {
    threshold: -65
};
function setGlobalVoiceActivityThreshold(threshold) {
    defaultSettings.threshold = threshold;
}
exports.setGlobalVoiceActivityThreshold = setGlobalVoiceActivityThreshold;
var Hark = /** @class */ (function (_super) {
    tslib_1.__extends(Hark, _super);
    function Hark(audioStream, opts) {
        if (opts === void 0) { opts = {}; }
        var _this = _super.call(this) || this;
        _this.running = false;
        _this.smoothing = 0.1;
        _this.interval = 50;
        _this.history = 10;
        _this.speakingHistory = [];
        _this.frequencyRange = [85, 300];
        _this.fftSize = 512;
        _this.speaking = false;
        _this.previousVolume = -Infinity;
        _this.stoppedReceivingVolume = Date.now();
        if (!AudioContext) {
            return _this;
        }
        if (!Hark.audioContext) {
            Hark.audioContext = new AudioContext();
            // workaround for Chrome 66+ suspending the audio context due to autoplay policy changes.
            // See https://bugs.chromium.org/p/chromium/issues/detail?id=835767
            var check_1 = function () {
                if (!(_this.running && Hark.audioContext) || Hark.audioContext.state !== 'suspended') {
                    return;
                }
                setTimeout(check_1, 1000);
                Hark.audioContext.resume();
            };
            setTimeout(check_1, 1000);
        }
        _this.smoothing = opts.smoothing || 0.1;
        _this.interval = opts.interval || 50;
        _this.threshold = opts.threshold;
        _this.history = opts.history || 10;
        _this.frequencyRange = opts.frequencyRange || [85, 300]; // [85, 255] is the typical fundamental freq range for human speech
        _this.fftSize = opts.fftSize || 512;
        if (isSafari) {
            _this.threshold = -20;
        }
        _this.analyser = Hark.audioContext.createAnalyser();
        _this.analyser.fftSize = _this.fftSize;
        _this.analyser.smoothingTimeConstant = _this.smoothing;
        _this.fftBins = new Float32Array(_this.analyser.frequencyBinCount);
        _this.frequencySpread = Hark.audioContext.sampleRate / _this.analyser.fftSize;
        _this.sourceNode = Hark.audioContext.createMediaStreamSource(audioStream);
        _this.sourceNode.connect(_this.analyser);
        _this.start();
        return _this;
    }
    Hark.prototype.stop = function () {
        this.running = false;
        this.emit('volume', -100, this.threshold || defaultSettings.threshold);
        if (this.speaking) {
            this.speaking = false;
            this.emit('stopped-speaking');
        }
        clearInterval(this.intervalTimer);
        this.analyser.disconnect();
        this.sourceNode.disconnect();
        return;
    };
    Hark.prototype.start = function () {
        var _this = this;
        this.running = true;
        this.speakingHistory = new Array(this.history).fill(0);
        this.intervalTimer = setInterval(function () {
            var e_1, _a;
            if (!_this.running) {
                return;
            }
            var threshold = _this.threshold || defaultSettings.threshold;
            var avgVolume = frequencyAnalyser(_this.analyser, _this.frequencyRange, _this.frequencySpread, _this.fftBins);
            var aboveThreshold = avgVolume > threshold ? 1 : 0;
            var stoppedReceivingVolume;
            if (!isFinite(avgVolume) || avgVolume <= -100) {
                if (isFinite(_this.previousVolume) && _this.previousVolume > -100) {
                    stoppedReceivingVolume = Date.now();
                }
                else {
                    stoppedReceivingVolume = _this.stoppedReceivingVolume;
                }
            }
            _this.emit('volume', avgVolume, threshold);
            if (stoppedReceivingVolume !== _this.stoppedReceivingVolume) {
                if (stoppedReceivingVolume) {
                    _this.emit('stopped-receiving-volume', stoppedReceivingVolume);
                }
                else {
                    _this.emit('started-receiving-volume');
                }
            }
            _this.previousVolume = avgVolume;
            _this.stoppedReceivingVolume = stoppedReceivingVolume;
            var timesAboveThreshold = 0;
            try {
                for (var _b = tslib_1.__values(_this.speakingHistory), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var hist = _c.value;
                    timesAboveThreshold += hist;
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (aboveThreshold && !_this.speaking) {
                if (timesAboveThreshold >= 5) {
                    _this.speaking = true;
                    _this.emit('speaking');
                }
            }
            else if (!aboveThreshold && _this.speaking) {
                if (timesAboveThreshold === 0) {
                    _this.speaking = false;
                    _this.emit('stopped-speaking');
                }
            }
            _this.speakingHistory.shift();
            _this.speakingHistory.push(aboveThreshold);
        }, this.interval);
    };
    return Hark;
}(events_1.EventEmitter));
exports.default = Hark;
