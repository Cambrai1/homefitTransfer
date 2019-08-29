# Realtime Text
**Input and display Realtime Text**


## What is this?

The `realtime-text` module provides a `DisplayBuffer` and `InputBuffer` for tracking the state of incoming or outgoing realtime text, and for generating the proper edit actions to send.

## What is Realtime Text?

Realtime text (RTT) is text that is broadcasted as you type, so that others can follow the conversation without waiting. 

Supporting RTT provides valuable accessibility support to people with disabilities (e.g deaf or hard-of-hearing), facilitating higher bandwidth conversations.

For more information about realtime text, see [realtimetext.org](http://www.realtimetext.org).

## Usage

```javascript
var rtt = require('realtime-text');

var display = new rtt.DisplayBuffer({ text, cursorPosition, synced } => {
    // Trigger render update
});

// Update the display state based on an RTT event
var rttEvent = {
    event: 'edit',
    actions: [
        { type: 'insert', text: 'Tea'},
        { type: 'wait', num: 32},
        { type: 'erase', num: 1},
        { type: 'wait', num: 28},
        { type: 'insert', text: 'st'}
    ]
};

display.process(rttEvent);

// Once the message is "done"
display.commit();
```

The `display.text` field can be bound to a template to render the incoming text.

```javascript
var input = new rtt.InputBuffer();

// To start a formal RTT session
var initialEvent = input.start();

// Whenever the input source changes
input.update("New full text of message");

// Generate an RTT event based on changes since the last diff
var rttEvent = input.diff();

// Once the input source is "done", commit to start on a new message
input.commit();

// To formally end the RTT session
var endEvent = input.stop();
```

## License

MIT

## Created By

If you like this, follow [@lancestout](http://twitter.com/lancestout) on twitter.
