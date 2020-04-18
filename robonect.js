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
let infoTimeout;
let statusTimeout;


/*
 * ADAPTER
 */
function startAdapter(options) {
    options = options || {};
    adapter = new utils.Adapter({ ...options, name: adapterName });

	/*
	 * ADAPTER READY
	 */
    adapter.on('ready', async function () {
        library = new Library(adapter);

        if (adapter.config.robonectIp === undefined || adapter.config.robonectIp === '') {
            adapter.log.error('No IP address set. Adapter will not be executed.');
            adapter.setState('info.connection', false, true);

            return;
        }

        // Create objects
        await createObjects();

        // Do the initial polling
        library.poll('Initial');

        adapter.subscribeStates('*');

        // Start regular pollings
        if (library.infoInterval > 0) {
            infoTimeout = setTimeout(function pollInfo() {
                library.poll('Info');
    
                infoTimeout = setTimeout(pollInfo, library.infoInterval * 1000);
            }, library.infoInterval * 1000);
        }

        if (library.statusInterval > 0) {
            statusTimeout = setTimeout(function pollStatus() {
                library.poll('Status');
                
                statusTimeout = setTimeout(pollStatus, library.statusInterval * 1000);
            }, library.statusInterval * 1000);
        }

        adapter.log.info('Done');

        return true;
    });

    /*
     * OBJECT CHANGE
     */
    adapter.on('objectChange', function (id, obj) {
        // Warning, obj can be null if it was deleted
        if (typeof obj == 'object') {
            adapter.log.info('objectChange ' + id + ' ' + JSON.stringify(obj));
        }
    });

	/*
	 * STATE CHANGE
	 */
    adapter.on('stateChange', function (id, state) {
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
    adapter.on('unload', function (callback) {
        try {
            clearTimeout(infoTimeout);
            clearTimeout(statusTimeout);

            adapter.log.info('cleaned everything up...');
            callback();
        } catch (e) {
            callback();
        }
    });

    async function createObjects() {
        const objects_battery = require('./lib/objects_battery.json');
        const objects_error = require('./lib/objects_error.json');
        const objects_ext = require('./lib/objects_ext.json');
        const objects_gps = require('./lib/objects_gps.json');
        const objects_hour = require('./lib/objects_hour.json');
        const objects_motor = require('./lib/objects_motor.json');
        const objects_portal = require('./lib/objects_portal.json');
        const objects_push = require('./lib/objects_push.json');
        const objects_status = require('./lib/objects_status.json');
        const objects_timer = require('./lib/objects_timer.json');
        const objects_version = require('./lib/objects_version.json');
        const objects_weather = require('./lib/objects_weather.json');
        const objects_wlan = require('./lib/objects_wlan.json');

        const objects = {
            ...objects_battery,
            ...objects_error,
            ...objects_ext,
            ...objects_gps,
            ...objects_hour,
            ...objects_motor,
            ...objects_portal,
            ...objects_push,
            ...objects_status,
            ...objects_timer,
            ...objects_version,
            ...objects_weather,
            ...objects_wlan
        };

        for (let id in objects) {
            if (objects[id].type && objects[id].common && objects[id].native) {
                const object = {};
                object.type = objects[id].type;
                object.common = objects[id].common;
                object.native = objects[id].native;

                await adapter.setObjectAsync(id, object);

                adapter.log.debug('Object \'' + id + '\' created');
            }
        }; 
    }

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
