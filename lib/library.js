const ping = require('ping');
const request = require('request');
const jsonLogic = require('./json_logic.js');

class Library {
    constructor(adapter) {
        this.adapter = adapter;

        this.robonectIp = adapter.config.robonectIp;
        this.username = adapter.config.username;
        this.password = adapter.config.password;

        this.statusInterval = adapter.config.statusInterval;
        this.infoInterval = adapter.config.infoInterval;

        this.restPeriod1Start = adapter.config.restPeriod1Start;
        this.restPeriod1End = adapter.config.restPeriod1End;
        this.restPeriod2Start = adapter.config.restPeriod2Start;
        this.restPeriod2End = adapter.config.restPeriod2End;

        this.batteryPollType = adapter.config.batteryPollType;
        this.errorsPollType = adapter.config.errorsPollType;
        this.extensionPollType = adapter.config.extensionPollType;
        this.gpsPollType = adapter.config.gpsPollType;
        this.hoursPollType = adapter.config.hoursPollType;
        this.motorPollType = adapter.config.motorPollType;
        this.portalPollType = adapter.config.portalPollType;
        this.pushPollType = adapter.config.pushPollType;
        this.timerPollType = adapter.config.timerPollType;
        this.versionPollType = adapter.config.versionPollType;
        this.weatherPollType = adapter.config.weatherPollType;
        this.wlanPollType = adapter.config.wlanPollType;

        if (this.username !== '' && this.password !== '') {
            this.url = 'http://' + this.username + ':' + this.password + '@' + this.robonectIp;
        } else {
            this.url = 'http://' + this.robonectIp;
        }

        if (isNaN(this.statusInterval) || this.statusInterval < 1) {
            this.statusInterval = 60;
            this.adapter.log.warn('No status interval set. Using default value (60 seconds).');
        }

        if (isNaN(this.infoInterval) || this.infoInterval < 1) {
            this.infoInterval = 900;
            this.adapter.log.warn('No info interval set. Using default value (900 seconds).');
        }

        if (this.restPeriod1Start === '' && this.restPeriod1End === '') {
            this.adapter.log.info('Rest period 1 not configured. Period will be ignored.');
        } else if (this.isValidTimeFormat(this.restPeriod1Start) === false || this.isValidTimeFormat(this.restPeriod1End) === false) {
            this.restPeriod1Start = '';
            this.restPeriod1End = '';
            this.adapter.log.error('Rest period 1 not configured correctly. Period will be ignored.');
        } else {
            this.adapter.log.warn('Rest period 1 configured (' + this.restPeriod1Start + ' - ' + this.restPeriod1End + '). Only API call /json?cmd=status will be done.');
        }

        if (this.restPeriod2Start === '' && this.restPeriod2End === '') {
            this.adapter.log.info('Rest period 2 not configured. Period will be ignored.');
        } else if (this.isValidTimeFormat(this.restPeriod2Start) === false || this.isValidTimeFormat(this.restPeriod2End) === false) {
            this.restPeriod2Start = '';
            this.restPeriod2End = '';
            this.adapter.log.error('Rest period 2 not configured correctly. Period will be ignored.');
        } else {
            this.adapter.log.warn('Rest period 2 configured (' + this.restPeriod2Start + ' - ' + this.restPeriod2End + '). Only API call /json?cmd=status will be done.');
        }

        this.currentStatus = null;

        this.request = request.defaults({ baseUrl: this.url, encoding: 'latin1' });
    }

    /*
     * Poll
     */
    poll(pollType) {
        let self = this;

        ping.sys.probe(self.robonectIp, async function (isAlive) {
            if (isAlive) {
                let doRegularPoll = false;
                let isRestTime = self.isRestTime();

                self.adapter.setState('last_sync', { val: self.adapter.formatDate(new Date(), 'YYYY-MM-DD hh:mm:ss'), ack: true });
                self.adapter.setState('online', { val: isAlive, ack: true });
                self.adapter.setState('rest_time', { val: isRestTime, ack: true });
                self.adapter.setState('info.connection', { val: isAlive, ack: true });

                self.adapter.log.debug('Polling started');

                // Poll status
                const data = await self.pollApi('status');
                self.currentStatus = data['status']['status'];

                if (isRestTime === false) {
                    if (self.currentStatus != null && self.currentStatus != 16 /*abgeschaltet*/ && self.currentStatus != 17 /*schlafen*/) {
                        doRegularPoll = true;
                    }
                }

                self.adapter.log.debug('pollType: ' + pollType);
                self.adapter.log.debug('isRestTime: ' + isRestTime);
                self.adapter.log.debug('currentStatus: ' + self.currentStatus);
                self.adapter.log.debug('doRegularPoll: ' + doRegularPoll);

                if (self.batteryPollType !== 'NoPoll' && (pollType === 'Initial' || (self.batteryPollType === pollType && doRegularPoll)))
                    await self.pollApi('battery');
                if (self.errorsPollType !== 'NoPoll' && (pollType === 'Initial' || (self.errorsPollType === pollType && doRegularPoll)))
                    await self.pollApi('error');
                if (self.extensionPollType !== 'NoPoll' && (pollType === 'Initial' || (self.extensionPollType === pollType && doRegularPoll)))
                    await self.pollApi('ext');
                if (self.gpsPollType !== 'NoPoll' && (pollType === 'Initial' || (self.gpsPollType === pollType && doRegularPoll)))
                    await self.pollApi('gps');
                if (self.hoursPollType !== 'NoPoll' && (pollType === 'Initial' || (self.hoursPollType === pollType && doRegularPoll)))
                    await self.pollApi('hour');
                if (self.motorPollType !== 'NoPoll' && (pollType === 'Initial' || (self.motorPollType === pollType && doRegularPoll)))
                    await self.pollApi('motor');
                if (self.portalPollType !== 'NoPoll' && (pollType === 'Initial' || (self.portalPollType === pollType && doRegularPoll)))
                    await self.pollApi('portal');
                if (self.pushPollType !== 'NoPoll' && (pollType === 'Initial' || (self.pushPollType === pollType && doRegularPoll)))
                    await self.pollApi('push');
                if (self.timerPollType !== 'NoPoll' && (pollType === 'Initial' || (self.timerPollType === pollType && doRegularPoll)))
                    await self.pollApi('timer');
                if (self.versionPollType !== 'NoPoll' && (pollType === 'Initial' || (self.versionPollType === pollType && doRegularPoll)))
                    await self.pollApi('version');
                if (self.weatherPollType !== 'NoPoll' && (pollType === 'Initial' || (self.weatherPollType === pollType && doRegularPoll)))
                    await self.pollApi('weather');
                if (self.wlanPollType !== 'NoPoll' && (pollType === 'Initial' || (self.wlanPollType === pollType && doRegularPoll)))
                    await self.pollApi('wlan');

                self.adapter.log.info('Polling done');
            } else {
                self.adapter.log.error('No connection to lawn mower. Check network connection.');
            }
        });
    }

    async pollApi(cmd) {
        let self = this;

        let apiUrl = '/json?cmd=' + cmd;

        self.adapter.log.debug('API call ' + apiUrl + ' started');

        return new Promise((resolve, reject) => {
            this.request.get({ url: apiUrl }, function (err, response, body) {
                let data;

                try {
                    data = self.parseResponse(err, response, body);

                    if (data.successful === true) {
                        let objects = require('./objects_' + cmd + '.json');

                        self.updateObjects(objects, data);
                    } else {
                        if (data.error_message && data.error_message !== '') {
                            throw new Error(data.error_message);
                        } else {
                            throw new Error('Something went wrong');
                        }
                    }
                }
                catch (errorMessage) {
                    self.adapter.log.error(errorMessage);
                }

                self.adapter.log.debug('API call ' + apiUrl + ' done');

                resolve(data);
            });
        });
    }

    /*
     * Update extension status
     */
    updateExtensionStatus(ext, status) {
        let self = this;

        let paramStatus;
        if (status === true) {
            paramStatus = 1;
        } else {
            paramStatus = 0;
        }

        let apiUrl = '/json?cmd=ext&' + ext + '=' + paramStatus;

        self.adapter.log.debug('API call ' + apiUrl + ' started');

        this.request.get({ url: apiUrl }, function (err, response, body) {
            try {
                let data = self.parseResponse(err, response, body);

                if (data.successful === true) {
                    self.adapter.setState('extension.gpio1.inverted', { val: data['ext']['gpio1']['inverted'], ack: true });
                    self.adapter.setState('extension.gpio1.status', { val: data['ext']['gpio1']['status'], ack: true });
                    self.adapter.setState('extension.gpio2.inverted', { val: data['ext']['gpio2']['inverted'], ack: true });
                    self.adapter.setState('extension.gpio2.status', { val: data['ext']['gpio2']['status'], ack: true });
                    self.adapter.setState('extension.out1.inverted', { val: data['ext']['out1']['inverted'], ack: true });
                    self.adapter.setState('extension.out1.status', { val: data['ext']['out1']['status'], ack: true });
                    self.adapter.setState('extension.out2.inverted', { val: data['ext']['out2']['inverted'], ack: true });
                    self.adapter.setState('extension.out2.status', { val: data['ext']['out2']['status'], ack: true });

                    if (data['ext'][ext]['status'] == paramStatus) {
                        self.adapter.log.info(ext + ' set to ' + status);
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
                self.adapter.log.error(errorMessage);
            }

            self.adapter.log.debug('API call ' + apiUrl + ' done');
        });
    }

    /*
     * Update mode
     */
    updateMode(mode) {
        let self = this;

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
                self.adapter.log.warn('Mode is invalid');
                return;
        }

        let apiUrl = '/json?cmd=mode&mode=' + paramMode;

        self.adapter.log.debug('API call ' + apiUrl + ' started');

        this.request.get({ url: apiUrl }, function (err, response, body) {
            try {
                let data = self.parseResponse(err, response, body);

                if (data.successful === true) {
                    self.adapter.setState('status.mode', { val: mode, ack: true });

                    self.adapter.log.info('Mode set to ' + paramMode);
                } else {
                    if (data.error_message && data.error_message !== '') {
                        throw new Error(data.error_message);
                    } else {
                        throw new Error('Something went wrong');
                    }
                }
            }
            catch (errorMessage) {
                self.adapter.log.error(errorMessage);
            }

            self.adapter.log.debug('API call ' + apiUrl + ' done');
        });
    }

    /*
     * Parse response
     */
    parseResponse(err, response, body) {
        if (!err) {
            if (response && response.statusCode === 200) {
                if (body !== '') {
                    try {
                        let data = JSON.parse(body);

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

    /*
    * Check if current time is in a rest period
    */
    isRestTime() {
        let self = this;

        let now = self.adapter.formatDate(new Date(), 'hh:mm');

        if (self.restPeriod1Start !== '') {
            if (self.isBetweenTimes(now, self.restPeriod1Start, self.restPeriod1End) === true)
                return true;
        }

        if (self.restPeriod2Start !== '') {
            if (self.isBetweenTimes(now, self.restPeriod2Start, self.restPeriod2End) === true)
                return true;
        }

        return false;
    }

    /*
    * Check if time is between to others
    */
    isBetweenTimes(testTime, startTime, endTime) {
        let [testHour, testMinute] = testTime.split(':');
        let [startHour, startMinute] = startTime.split(':');
        let [endHour, endMinute] = endTime.split(':');

        let test = parseInt(testHour) * 60 + parseInt(testMinute);
        let start = parseInt(startHour) * 60 + parseInt(startMinute);
        let end = parseInt(endHour) * 60 + parseInt(endMinute);

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

    /*
    * Check for valid time format
    */
    isValidTimeFormat(time) {
        const timeReg = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/
        return timeReg.test(time)
    }

    updateObjects(objects, data) {
        let self = this;

        for (let item in objects) {
            let itemValue = objects[item].value;

            let rule = itemValue;
            if (typeof (itemValue) === 'string') {
                rule = { 'var': [itemValue] };
            }

            let val = jsonLogic.apply(
                rule,
                data
            );

            self.adapter.setState(item, { val: val, ack: true });
        };
    }
};

module.exports = Library;
