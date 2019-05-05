/* jshint -W097 */// jshint strict:false
/*jslint node: true */

"use strict";

// you have to require the utils module and call adapter function
var utils = require('@iobroker/adapter-core'); // Get common adapter utils
var adapter = utils.Adapter({
    name: 'robonect', // adapter name
    useFormatDate: true // load from system.config the global date format
});
var Robonect = require(__dirname + '/lib/robonect');

var robonect;


// is called when adapter shuts down - callback has to be called under any circumstances!
adapter.on('unload', function (callback) {
    try {
        adapter.log.info('cleaned everything up...');
        callback();
    } catch (e) {
        callback();
    }
});

// is called if a subscribed object changes
adapter.on('objectChange', function (id, obj) {
    // Warning, obj can be null if it was deleted
    if(typeof obj == 'object') {
        adapter.log.info('objectChange ' + id + ' ' + JSON.stringify(obj));
    }
});

// is called if a subscribed state changes
adapter.on('stateChange', function (id, state) {
    // Warning, state can be null if it was deleted
    if (typeof state == 'object' && !state.ack) {
        if (id === adapter.namespace + ".extension.gpio1.status") {
            robonect.updateExtensionStatus('gpio1', state.val);
        } else if (id === adapter.namespace + ".extension.gpio2.status") {
            robonect.updateExtensionStatus('gpio2', state.val);
        } else if (id === adapter.namespace + ".extension.out1.status") {
            robonect.updateExtensionStatus('out1', state.val);
        } else if (id === adapter.namespace + ".extension.out2.status") {
            robonect.updateExtensionStatus('out2', state.val);
        } else if (id === adapter.namespace + ".status.mode") {
            robonect.updateMode(state.val);
        }
    }
});

// Some message was sent to adapter instance over message box. Used by email, pushover, text2speech, ...
adapter.on('message', function (obj) {
    if (typeof obj == 'object' && obj.message) {
        if (obj.command == 'send') {
            // e.g. send email or pushover or whatever
            console.log('send command');

            // Send response in callback if required
            if (obj.callback) adapter.sendTo(obj.from, obj.command, 'Message received', obj.callback);
        }
    }
});

// is called when databases are connected and adapter received configuration.
// start here!
adapter.on('ready', main);

function main() {
    robonect = new Robonect(adapter);

    if (adapter.config.ip === undefined || adapter.config.ip === '') {
        adapter.log.error('No IP address set. Adapter will not be executed.');
        adapter.setState('info.connection', false, true);

        return;
    }
    
    // Initialize the adapter and create missinf states
    robonect.initialize();

    // Do the initial polling
    robonect.poll('Initial');

    adapter.subscribeStates("*");

    setInterval(function() { robonect.poll('Info') }, robonect.infoInterval * 1000);
    setInterval(function() { robonect.poll('Status') }, robonect.statusInterval * 1000);

    adapter.log.info('Done');
}
