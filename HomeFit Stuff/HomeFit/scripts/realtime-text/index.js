"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var async_1 = require("async");
var Punycode = require("punycode");
/**
 * Calculate the erase and insert actions needed to describe the user's edit operation.
 *
 * Based on the code point buffers before and after the edit, we find the single erase
 * and insert actions needed to describe the full change. We are minimizing the number
 * of deltas, not minimizing the number of affected code points.
 *
 * @param oldText The original buffer of Unicode code points before the user's edit action.
 * @param newText The new buffer of Unicode code points after the user's edit action.
 */
function diff(oldText, newText) {
    var oldLen = oldText.length;
    var newLen = newText.length;
    var searchLen = Math.min(oldLen, newLen);
    var prefixSize = 0;
    for (prefixSize = 0; prefixSize < searchLen; prefixSize++) {
        if (oldText[prefixSize] !== newText[prefixSize]) {
            break;
        }
    }
    var suffixSize = 0;
    for (suffixSize = 0; suffixSize < searchLen - prefixSize; suffixSize++) {
        if (oldText[oldLen - suffixSize - 1] !== newText[newLen - suffixSize - 1]) {
            break;
        }
    }
    var matchedSize = prefixSize + suffixSize;
    var events = [];
    if (matchedSize < oldLen) {
        events.push({
            num: oldLen - matchedSize,
            pos: oldLen - suffixSize,
            type: 'erase'
        });
    }
    if (matchedSize < newLen) {
        var insertedText = newText.slice(prefixSize, prefixSize + newLen - matchedSize);
        events.push({
            pos: prefixSize,
            text: Punycode.ucs2.encode(insertedText),
            type: 'insert'
        });
    }
    return events;
}
exports.diff = diff;
/**
 * Class for processing RTT events and providing a renderable string of the resulting text.
 */
var DisplayBuffer = /** @class */ (function () {
    function DisplayBuffer(onStateChange, ignoreWaits) {
        if (ignoreWaits === void 0) { ignoreWaits = false; }
        this.synced = false;
        this.cursorPosition = 0;
        this.sequenceNumber = 0;
        this.ignoreWaits = false;
        this.onStateChange = onStateChange || function noop() {
            return;
        };
        this.ignoreWaits = ignoreWaits;
        this.buffer = [];
        this.resetActionQueue();
    }
    Object.defineProperty(DisplayBuffer.prototype, "text", {
        /**
         * The encoded Unicode string to display.
         */
        get: function () {
            return Punycode.ucs2.encode(this.buffer.slice());
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Mark the RTT message as completed and reset state.
     */
    DisplayBuffer.prototype.commit = function () {
        this.resetActionQueue();
    };
    /**
     * Accept an RTT event for processing.
     *
     * A single event can contain multiple edit actions, including
     * wait pauses.
     *
     * Events must be processed in order of their `seq` value in order
     * to stay in sync.
     *
     * @param event {RTTEvent} The RTT event to process.
     */
    DisplayBuffer.prototype.process = function (event) {
        if (event.event === 'cancel' || event.event === 'init') {
            this.resetActionQueue();
        }
        else if (event.event === 'reset' || event.event === 'new') {
            this.resetActionQueue();
            if (event.seq) {
                this.sequenceNumber = event.seq;
            }
        }
        else if (event.seq !== this.sequenceNumber) {
            this.synced = false;
        }
        if (event.actions) {
            var baseTime = Date.now();
            var accumulatedWait = 0;
            for (var _i = 0, _a = event.actions; _i < _a.length; _i++) {
                var action = _a[_i];
                action.baseTime = baseTime + accumulatedWait;
                if (action.type === 'wait') {
                    accumulatedWait += action.num;
                }
                this.actionQueue.push(action);
            }
        }
        this.sequenceNumber = this.sequenceNumber + 1;
    };
    /**
     * Insert text into the Unicode code point buffer
     *
     * By default, the insertion position is the end of the buffer.
     *
     * @param text The raw text to insert
     * @param position The position to start the insertion
     */
    DisplayBuffer.prototype.insert = function (text, position) {
        if (text === void 0) { text = ''; }
        if (position === void 0) { position = this.buffer.length; }
        if (text.normalize) {
            text = text.normalize('NFC');
        }
        var insertedText = Punycode.ucs2.decode(text);
        (_a = this.buffer).splice.apply(_a, [position, 0].concat(insertedText));
        this.cursorPosition = position + insertedText.length;
        this.emitState();
        var _a;
    };
    /**
     * Erase text from the Unicode code point buffer
     *
     * By default, the erased text length is `1`, and the position is the end of the buffer.
     *
     * @param length The number of code points to erase from the buffer, starting at {position} and erasing to the left.
     * @param position The position to start erasing code points. Erasing continues to the left.
     */
    DisplayBuffer.prototype.erase = function (length, position) {
        if (length === void 0) { length = 1; }
        if (position === void 0) { position = this.buffer.length; }
        position = Math.max(Math.min(position, this.buffer.length), 0);
        length = Math.max(Math.min(length, this.text.length), 0);
        this.buffer.splice(Math.max(position - length, 0), length);
        this.cursorPosition = Math.max(position - length, 0);
        this.emitState();
    };
    DisplayBuffer.prototype.emitState = function (additional) {
        if (additional === void 0) { additional = {}; }
        this.onStateChange(tslib_1.__assign({ cursorPosition: this.cursorPosition, synced: this.synced, text: this.text }, additional));
    };
    /**
     * Reset the processing state and queue.
     *
     * Used when 'init', 'new', 'reset', and 'cancel' RTT events are processed.
     */
    DisplayBuffer.prototype.resetActionQueue = function () {
        var _this = this;
        if (this.actionQueue) {
            this.actionQueue.kill();
        }
        this.sequenceNumber = 0;
        this.synced = true;
        this.buffer = [];
        this.emitState();
        this.actionQueue = async_1.queue(function (action, done) {
            var currentTime = Date.now();
            if (action.type === 'insert') {
                _this.insert(action.text, action.pos);
                return done();
            }
            else if (action.type === 'erase') {
                _this.erase(action.num, action.pos);
                return done();
            }
            else if (action.type === 'wait') {
                if (_this.ignoreWaits) {
                    return done();
                }
                if (action.num > 700) {
                    action.num = 700;
                }
                if (currentTime >= (action.baseTime + action.num)) {
                    return done();
                }
                else {
                    setTimeout(function () { return done(); }, action.num);
                }
            }
            else {
                return done();
            }
        });
        this.actionQueue.drain = function () {
            _this.emitState({ drained: true });
        };
    };
    return DisplayBuffer;
}());
exports.DisplayBuffer = DisplayBuffer;
/**
 * Class for tracking changes in a source text, and generating RTT events based on those changes.
 */
var InputBuffer = /** @class */ (function () {
    function InputBuffer(onStateChange, ignoreWaits) {
        if (ignoreWaits === void 0) { ignoreWaits = false; }
        this.resetInterval = 10000;
        this.ignoreWaits = false;
        this.isStarting = false;
        this.isReset = false;
        this.changedBetweenResets = false;
        this.onStateChange = onStateChange || function noop() {
            return;
        };
        this.ignoreWaits = ignoreWaits;
        this.buffer = [];
        this.actionQueue = [];
        this.sequenceNumber = 0;
    }
    Object.defineProperty(InputBuffer.prototype, "text", {
        get: function () {
            return Punycode.ucs2.encode(this.buffer.slice());
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Generate action deltas based on the new full state of the source text.
     *
     * The text provided here is the _entire_ source text, not a diff.
     *
     * @param text The new state of the user's text.
     */
    InputBuffer.prototype.update = function (text) {
        var actions = [];
        if (text !== undefined) {
            if (text.normalize) {
                text = text.normalize('NFC');
            }
            var newBuffer = Punycode.ucs2.decode(text || '');
            actions = diff(this.buffer, newBuffer.slice());
            this.buffer = newBuffer;
            this.emitState();
        }
        var now = Date.now();
        if (this.changedBetweenResets && (now - this.lastResetTime) > this.resetInterval) {
            this.actionQueue = [];
            this.actionQueue.push({
                pos: 0,
                text: this.text,
                type: 'insert'
            });
            this.isReset = true;
            this.lastActionTime = now;
            this.lastResetTime = now;
            this.changedBetweenResets = false;
        }
        else if (actions.length) {
            var wait = now - (this.lastActionTime || now);
            if (wait > 0 && !this.ignoreWaits) {
                this.actionQueue.push({
                    num: wait,
                    type: 'wait'
                });
            }
            for (var _i = 0, actions_1 = actions; _i < actions_1.length; _i++) {
                var action = actions_1[_i];
                this.actionQueue.push(action);
            }
            this.lastActionTime = now;
            this.changedBetweenResets = true;
        }
    };
    /**
     * Formally start an RTT session.
     *
     * Generates a random starting event sequence number.
     *
     * @param resetInterval {Milliseconds} Time to wait between using RTT reset events during editing.
     */
    InputBuffer.prototype.start = function (resetInterval) {
        if (resetInterval === void 0) { resetInterval = this.resetInterval; }
        this.commit();
        this.isStarting = true;
        this.resetInterval = resetInterval;
        this.sequenceNumber = Math.floor(Math.random() * 10000 + 1);
        return {
            event: 'init'
        };
    };
    /**
     * Formally stops the RTT session.
     */
    InputBuffer.prototype.stop = function () {
        this.commit();
        return {
            event: 'cancel'
        };
    };
    /**
     * Generate an RTT event based on queued edit actions.
     *
     * The edit actions included in the event are all those made since the last
     * time a diff was requested.
     */
    InputBuffer.prototype.diff = function () {
        this.update();
        if (!this.actionQueue.length) {
            return null;
        }
        var event = {
            actions: this.actionQueue,
            seq: this.sequenceNumber++
        };
        if (this.isStarting) {
            event.event = 'new';
            this.isStarting = false;
            this.lastResetTime = Date.now();
        }
        else if (this.isReset) {
            event.event = 'reset';
            this.isReset = false;
        }
        this.actionQueue = [];
        return event;
    };
    /**
     * Reset the RTT session state to prepare for a new message text.
     */
    InputBuffer.prototype.commit = function () {
        this.sequenceNumber = 0;
        this.lastActionTime = 0;
        this.actionQueue = [];
        this.buffer = [];
    };
    InputBuffer.prototype.emitState = function () {
        this.onStateChange({
            text: this.text
        });
    };
    return InputBuffer;
}());
exports.InputBuffer = InputBuffer;
//# sourceMappingURL=index.js.map