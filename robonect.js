'use strict';
const adapterName = require('./io-package.json').common.name;
const utils = require('@iobroker/adapter-core'); // Get common adapter utils


/*
 * internal libraries
 */
const Library = require('./lib/library.js');


/*
 * variables initiation
 */
let adapter;
let library;
var infoInterval;
var statusInterval;


/*
 * ADAPTER
 */
function startAdapter(options)
{
	options = options || {};
	adapter = new utils.Adapter({ ...options, name: adapterName });
	
	/*
	 * ADAPTER READY
	 */
	adapter.on('ready', function()
	{
		library = new Library(adapter);

        if (adapter.config.robonectIp === undefined || adapter.config.robonectIp === '') {
            adapter.log.error('No IP address set. Adapter will not be executed.');
            adapter.setState('info.connection', false, true);

            return;
        }

        // Do the initial polling
        library.poll('Initial');

        adapter.subscribeStates('*');

        infoInterval = setInterval(function() { library.poll('Info') }, library.infoInterval * 1000);
        statusInterval = setInterval(function() { library.poll('Status') }, library.statusInterval * 1000);

        adapter.log.info('Done');
	});

    /*
     * OBJECT CHANGE
     */
    adapter.on('objectChange', function (id, obj) {
        // Warning, obj can be null if it was deleted
        if(typeof obj == 'object') {
            adapter.log.info('objectChange ' + id + ' ' + JSON.stringify(obj));
        }
    });

	/*
	 * STATE CHANGE
	 */
	adapter.on('stateChange', function(id, state)
	{
		// Warning, state can be null if it was deleted
        if (typeof state == 'object' && !state.ack) {
            if (id === adapter.namespace + '.extension.gpio1.status') {
                library.updateExtensionStatus('gpio1', state.val);
            } else if (id === adapter.namespace + '.extension.gpio2.status') {
                library.updateExtensionStatus('gpio2', state.val);
            } else if (id === adapter.namespace + '.extension.out1.status') {
                library.updateExtensionStatus('out1', state.val);
            } else if (id === adapter.namespace + '.extension.out2.status') {
                library.updateExtensionStatus('out2', state.val);
            } else if (id === adapter.namespace + '.status.mode') {
                library.updateMode(state.val);
            }
        }		
    });
    
    /*
     * MESSAGE
     */
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
	
	/*
	 * ADAPTER UNLOAD
	 */
	adapter.on('unload', function(callback)
	{
		try {
            clearInterval(infoInterval);
            clearInterval(statusInterval);
    
            adapter.log.info('cleaned everything up...');
            callback();
        } catch (e) {
            callback();
        }
	});

	return adapter;
};


/*
 * COMPACT MODE
 * If started as allInOne/compact mode => return function to create instance
 *
 */
if (module && module.parent)
	module.exports = startAdapter;
else
	startAdapter(); // or start the instance directly
