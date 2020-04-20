'use strict';

/*
 * Created with @iobroker/create-adapter v1.23.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');

// Load your modules here, e.g.:
const ping = require('ping');
const request = require('request');
const jsonLogic = require('./lib/json_logic.js');

class Robonect extends utils.Adapter {

    /**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
    constructor(options) {
        super({
            ...options,
            name: 'robonect',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('objectChange', this.onObjectChange.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('unload', this.onUnload.bind(this));

        this.request;

        this.robonectIp;
        this.username;
        this.password;
        this.url;

        this.statusInterval;
        this.infoInterval;

        this.restPeriod1Start;
        this.restPeriod1End;
        this.restPeriod2Start;
        this.restPeriod2End;

        this.currentStatus;        

        this.batteryPollType;
        this.errorsPollType;
        this.extensionPollType;
        this.gpsPollType;
        this.hoursPollType;
        this.motorPollType;
        this.portalPollType;
        this.pushPollType;
        this.timerPollType;
        this.versionPollType;
        this.weatherPollType;
        this.wlanPollType;

        this.infoTimeout;
        this.statusTimeout;
    }

    /**
	 * Is called when databases are connected and adapter received configuration.
	 */
    async onReady() {
        if (this.config.robonectIp === undefined || this.config.robonectIp === '') {
            this.log.error('No IP address set. Adapter will not be executed.');
            this.setState('info.connection', false, true);

            return;
        }

        this.robonectIp = this.config.robonectIp;
        this.username = this.config.username;
        this.password = this.config.password;

        this.statusInterval = this.config.statusInterval;
        this.infoInterval = this.config.infoInterval;

        this.restPeriod1Start = this.config.restPeriod1Start;
        this.restPeriod1End = this.config.restPeriod1End;
        this.restPeriod2Start = this.config.restPeriod2Start;
        this.restPeriod2End = this.config.restPeriod2End;

        this.batteryPollType = this.config.batteryPollType;
        this.errorsPollType = this.config.errorsPollType;
        this.extensionPollType = this.config.extensionPollType;
        this.gpsPollType = this.config.gpsPollType;
        this.hoursPollType = this.config.hoursPollType;
        this.motorPollType = this.config.motorPollType;
        this.portalPollType = this.config.portalPollType;
        this.pushPollType = this.config.pushPollType;
        this.timerPollType = this.config.timerPollType;
        this.versionPollType = this.config.versionPollType;
        this.weatherPollType = this.config.weatherPollType;
        this.wlanPollType = this.config.wlanPollType;

        if (this.username !== '' && this.password !== '') {
            this.url = 'http://' + this.username + ':' + this.password + '@' + this.robonectIp;
        } else {
            this.url = 'http://' + this.robonectIp;
        }

        if (isNaN(this.statusInterval) || this.statusInterval < 1) {
            this.statusInterval = 60;
            this.log.warn('No status interval set. Using default value (60 seconds).');
        }

        if (isNaN(this.infoInterval) || this.infoInterval < 1) {
            this.infoInterval = 900;
            this.log.warn('No info interval set. Using default value (900 seconds).');
        }

        if (this.restPeriod1Start === '' && this.restPeriod1End === '') {
            this.log.info('Rest period 1 not configured. Period will be ignored.');
        } else if (this.isValidTimeFormat(this.restPeriod1Start) === false || this.isValidTimeFormat(this.restPeriod1End) === false) {
            this.restPeriod1Start = '';
            this.restPeriod1End = '';
            this.log.error('Rest period 1 not configured correctly. Period will be ignored.');
        } else {
            this.log.warn('Rest period 1 configured (' + this.restPeriod1Start + ' - ' + this.restPeriod1End + '). Only API call /json?cmd=status will be done.');
        }

        if (this.restPeriod2Start === '' && this.restPeriod2End === '') {
            this.log.info('Rest period 2 not configured. Period will be ignored.');
        } else if (this.isValidTimeFormat(this.restPeriod2Start) === false || this.isValidTimeFormat(this.restPeriod2End) === false) {
            this.restPeriod2Start = '';
            this.restPeriod2End = '';
            this.log.error('Rest period 2 not configured correctly. Period will be ignored.');
        } else {
            this.log.warn('Rest period 2 configured (' + this.restPeriod2Start + ' - ' + this.restPeriod2End + '). Only API call /json?cmd=status will be done.');
        }

        this.currentStatus = null;

        this.request = request.defaults({ baseUrl: this.url, encoding: 'latin1' });

        // Inititalize objects
        await this.initializeObjects();

        this.subscribeStates('*');

        // Do the initial polling
        this.updateRobonectData('Initial');

        // Start regular pollings
        const pollStatus = () => {
            this.updateRobonectData('Status');
        
            this.statusTimeout = setTimeout(pollStatus, this.statusInterval * 1000);
        };

        if (this.statusInterval > 0) {
            this.statusTimeout = setTimeout(pollStatus, this.statusInterval * 1000);
        }

        const pollInfo = () => {
            this.updateRobonectData('Info');
        
            this.infoTimeout = setTimeout(pollInfo, this.infoInterval * 1000);
        };        

        if (this.infoInterval > 0) {
            this.infoTimeout = setTimeout(pollInfo, this.infoInterval * 1000);
        }

        this.log.info('Done');

        return true;
    }

    /**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
    onUnload(callback) {
        try {
            clearTimeout(this.infoTimeout);
            clearTimeout(this.statusTimeout);

            this.log.info('cleaned everything up...');
            callback();
        } catch (e) {
            callback();
        }
    }

    /**
	 * Is called if a subscribed object changes
	 * @param {string} id
	 * @param {ioBroker.Object | null | undefined} obj
	 */
    onObjectChange(id, obj) {
        if (obj) {
            // The object was changed
            this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
        } else {
            // The object was deleted
            this.log.info(`object ${id} deleted`);
        }
    }

    /**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
    onStateChange(id, state) {
        if (typeof state == 'object' && !state.ack) {
            // The state was changed
            if (id === this.namespace + '.extension.gpio1.status') {
                this.updateExtensionStatus('gpio1', state.val);
            } else if (id === this.namespace + '.extension.gpio2.status') {
                this.updateExtensionStatus('gpio2', state.val);
            } else if (id === this.namespace + '.extension.out1.status') {
                this.updateExtensionStatus('out1', state.val);
            } else if (id === this.namespace + '.extension.out2.status') {
                this.updateExtensionStatus('out2', state.val);
            } else if (id === this.namespace + '.status.mode') {
                this.updateMode(state.val);
            }
        }
    }

    /**
     * Is called to initialize objects
     */
    async initializeObjects() {
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

        for (const id in objects) {
            if (objects[id].type && objects[id].common && objects[id].native) {
                const object = {};
                object.type = objects[id].type;
                object.common = objects[id].common;
                object.native = objects[id].native;

                await this.setObjectAsync(id, object);

                this.log.debug('Object \'' + id + '\' created');
            }
        }
    }

    /**
     * Is called to update data
     * @param {string} pollType
     */
    async updateRobonectData(pollType) {
        ping.sys.probe(this.robonectIp, async function (isAlive) {
            if (isAlive) {
                let doRegularPoll = false;
                const isRestTime = this.isRestTime();

                this.setState('last_sync', { val: this.formatDate(new Date(), 'YYYY-MM-DD hh:mm:ss'), ack: true });
                this.setState('online', { val: isAlive, ack: true });
                this.setState('rest_time', { val: isRestTime, ack: true });
                this.setState('info.connection', { val: isAlive, ack: true });

                this.log.debug('Polling started');

                // Poll status
                const data = await this.pollApi('status');
                this.currentStatus = data['status']['status'];

                if (isRestTime === false) {
                    if (this.currentStatus != null && this.currentStatus != 16 /*abgeschaltet*/ && this.currentStatus != 17 /*schlafen*/) {
                        doRegularPoll = true;
                    }
                }

                this.log.debug('pollType: ' + pollType);
                this.log.debug('isRestTime: ' + isRestTime);
                this.log.debug('currentStatus: ' + this.currentStatus);
                this.log.debug('doRegularPoll: ' + doRegularPoll);

                if (this.batteryPollType !== 'NoPoll' && (pollType === 'Initial' || (this.batteryPollType === pollType && doRegularPoll)))
                    await this.pollApi('battery');
                if (this.errorsPollType !== 'NoPoll' && (pollType === 'Initial' || (this.errorsPollType === pollType && doRegularPoll)))
                    await this.pollApi('error');
                if (this.extensionPollType !== 'NoPoll' && (pollType === 'Initial' || (this.extensionPollType === pollType && doRegularPoll)))
                    await this.pollApi('ext');
                if (this.gpsPollType !== 'NoPoll' && (pollType === 'Initial' || (this.gpsPollType === pollType && doRegularPoll)))
                    await this.pollApi('gps');
                if (this.hoursPollType !== 'NoPoll' && (pollType === 'Initial' || (this.hoursPollType === pollType && doRegularPoll)))
                    await this.pollApi('hour');
                if (this.motorPollType !== 'NoPoll' && (pollType === 'Initial' || (this.motorPollType === pollType && doRegularPoll)))
                    await this.pollApi('motor');
                if (this.portalPollType !== 'NoPoll' && (pollType === 'Initial' || (this.portalPollType === pollType && doRegularPoll)))
                    await this.pollApi('portal');
                if (this.pushPollType !== 'NoPoll' && (pollType === 'Initial' || (this.pushPollType === pollType && doRegularPoll)))
                    await this.pollApi('push');
                if (this.timerPollType !== 'NoPoll' && (pollType === 'Initial' || (this.timerPollType === pollType && doRegularPoll)))
                    await this.pollApi('timer');
                if (this.versionPollType !== 'NoPoll' && (pollType === 'Initial' || (this.versionPollType === pollType && doRegularPoll)))
                    await this.pollApi('version');
                if (this.weatherPollType !== 'NoPoll' && (pollType === 'Initial' || (this.weatherPollType === pollType && doRegularPoll)))
                    await this.pollApi('weather');
                if (this.wlanPollType !== 'NoPoll' && (pollType === 'Initial' || (this.wlanPollType === pollType && doRegularPoll)))
                    await this.pollApi('wlan');

                this.log.info('Polling done');
            } else {
                this.log.error('No connection to lawn mower. Check network connection.');
            }
        }.bind(this));
    }

    /**
     * Is called to poll the Robonect module
     * @param {string} cmd 
     */
    async pollApi(cmd) {
        const apiUrl = '/json?cmd=' + cmd;

        this.log.debug('API call ' + apiUrl + ' started');

        return new Promise((resolve, reject) => {
            this.request.get({ url: apiUrl }, function (err, response, body) {
                let data;

                try {
                    data = this.parseResponse(err, response, body);

                    if (data.successful === true) {
                        const objects = require('./lib/objects_' + cmd + '.json');

                        this.updateObjects(objects, data);
                    } else {
                        if (data.error_message && data.error_message !== '') {
                            throw new Error(data.error_message);
                        } else {
                            throw new Error('Something went wrong');
                        }
                    }
                }
                catch (errorMessage) {
                    this.log.error(errorMessage);
                }

                this.log.debug('API call ' + apiUrl + ' done');

                resolve(data);
            }.bind(this));
        });
    }

    /**
     * Update extension status
     * @param {string} ext 
     * @param {*} status 
     */
    updateExtensionStatus(ext, status) {
        let paramStatus;
        if (status === true) {
            paramStatus = 1;
        } else {
            paramStatus = 0;
        }

        const apiUrl = '/json?cmd=ext&' + ext + '=' + paramStatus;

        this.log.debug('API call ' + apiUrl + ' started');

        this.request.get({ url: apiUrl }, function (err, response, body) {
            try {
                const data = this.parseResponse(err, response, body);

                if (data.successful === true) {
                    this.setState('extension.gpio1.inverted', { val: data['ext']['gpio1']['inverted'], ack: true });
                    this.setState('extension.gpio1.status', { val: data['ext']['gpio1']['status'], ack: true });
                    this.setState('extension.gpio2.inverted', { val: data['ext']['gpio2']['inverted'], ack: true });
                    this.setState('extension.gpio2.status', { val: data['ext']['gpio2']['status'], ack: true });
                    this.setState('extension.out1.inverted', { val: data['ext']['out1']['inverted'], ack: true });
                    this.setState('extension.out1.status', { val: data['ext']['out1']['status'], ack: true });
                    this.setState('extension.out2.inverted', { val: data['ext']['out2']['inverted'], ack: true });
                    this.setState('extension.out2.status', { val: data['ext']['out2']['status'], ack: true });

                    if (data['ext'][ext]['status'] == paramStatus) {
                        this.log.info(ext + ' set to ' + status);
                    } else {
                        throw new Error(ext + ' could not be set to ' + status + '. Is the extension mode set to API?');
                    }
                } else {
                    if (data.error_message && data.error_message !== '') {
                        throw new Error(data.error_message);
                    } else {
                        throw new Error('Something went wrong');
                    }
                }
            }
            catch (errorMessage) {
                this.log.error(errorMessage);
            }

            this.log.debug('API call ' + apiUrl + ' done');
        }.bind(this));
    }

    /**
     * Update mode
     * @param {*} mode 
     */
    updateMode(mode) {
        let paramMode;
        switch (mode) {
            case 0:
                paramMode = 'auto';
                break;
            case 1:
                paramMode = 'man';
                break;
            case 2:
                paramMode = 'home';
                break;
            case 98:
                paramMode = 'eod';
                break;
            case 99:
                paramMode = 'job';
                break;
            default:
                this.log.warn('Mode is invalid');
                return;
        }

        const apiUrl = '/json?cmd=mode&mode=' + paramMode;

        this.log.debug('API call ' + apiUrl + ' started');

        this.request.get({ url: apiUrl }, function (err, response, body) {
            try {
                const data = this.parseResponse(err, response, body);

                if (data.successful === true) {
                    this.setState('status.mode', { val: mode, ack: true });

                    this.log.info('Mode set to ' + paramMode);
                } else {
                    if (data.error_message && data.error_message !== '') {
                        throw new Error(data.error_message);
                    } else {
                        throw new Error('Something went wrong');
                    }
                }
            }
            catch (errorMessage) {
                this.log.error(errorMessage);
            }

            this.log.debug('API call ' + apiUrl + ' done');
        }.bind(this));
    }

    /**
     * Parse response
     * @param {*} err 
     * @param {*} response 
     * @param {*} body 
     */
    parseResponse(err, response, body) {
        if (!err) {
            if (response && response.statusCode === 200) {
                if (body !== '') {
                    try {
                        const data = JSON.parse(body);

                        // Handle non-exception-throwing cases:
                        // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
                        // but... JSON.parse(null) returns null, and typeof null === 'object', 
                        // so we must check for that, too. Thankfully, null is falsey, so this suffices:
                        if (data && typeof data === 'object') {
                            return data;
                        }
                    }
                    catch (e) {
                        throw new Error('JSON not valid');
                    }
                } else {
                    throw new Error('Empty body');
                }
            } else {
                throw new Error('Bad response: ' + JSON.stringify(response));
            }
        } else {
            throw new Error(err);
        }
    }

    /**
     * Check if current time is in a rest period
     */
    isRestTime() {
        const now = this.formatDate(new Date(), 'hh:mm');

        if (this.restPeriod1Start !== '') {
            if (this.isBetweenTimes(now, this.restPeriod1Start, this.restPeriod1End) === true)
                return true;
        }

        if (this.restPeriod2Start !== '') {
            if (this.isBetweenTimes(now, this.restPeriod2Start, this.restPeriod2End) === true)
                return true;
        }

        return false;
    }

    /**
     * Check if time is between two others
     * @param {*} testTime 
     * @param {*} startTime 
     * @param {*} endTime 
     */
    isBetweenTimes(testTime, startTime, endTime) {
        const [testHour, testMinute] = testTime.split(':');
        const [startHour, startMinute] = startTime.split(':');
        const [endHour, endMinute] = endTime.split(':');

        const test = parseInt(testHour) * 60 + parseInt(testMinute);
        const start = parseInt(startHour) * 60 + parseInt(startMinute);
        const end = parseInt(endHour) * 60 + parseInt(endMinute);

        if (start <= end) {
            // Both times are at the same day
            if (start <= test && test <= end)
                return true;
        } else {
            // End time is (after) midnight
            if (end <= test && test >= start)
                return true;
        }

        return false;
    }

    /**
     * Check for valid time format
     * @param {*} time 
     */
    isValidTimeFormat(time) {
        const timeReg = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
        return timeReg.test(time);
    }

    /**
     * Update objects
     * @param {*} objects 
     * @param {*} data 
     */
    updateObjects(objects, data) {
        for (const item in objects) {
            const itemValue = objects[item].value;

            let rule = itemValue;
            if (typeof (itemValue) === 'string') {
                rule = { 'var': [itemValue] };
            }

            const val = jsonLogic.apply(
                rule,
                data
            );

            this.setState(item, { val: val, ack: true });
        }
    }
}

// @ts-ignore parent is a valid property on module
if (module.parent) {
    // Export the constructor in compact mode
    /**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
    module.exports = (options) => new Robonect(options);
} else {
    // otherwise start the instance directly
    new Robonect();
}
