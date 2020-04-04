const ping = require('ping');
const request = require('request');

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

                await self.pollStatus();

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
                    await self.pollBattery();
                if (self.errorsPollType !== 'NoPoll' && (pollType === 'Initial' || (self.errorsPollType === pollType && doRegularPoll)))
                    await self.pollErrors();
                if (self.extensionPollType !== 'NoPoll' && (pollType === 'Initial' || (self.extensionPollType === pollType && doRegularPoll)))
                    await self.pollExtension();
                if (self.gpsPollType !== 'NoPoll' && (pollType === 'Initial' || (self.gpsPollType === pollType && doRegularPoll)))
                    await self.pollGPs();
                if (self.hoursPollType !== 'NoPoll' && (pollType === 'Initial' || (self.hoursPollType === pollType && doRegularPoll)))
                    await self.pollHours();
                if (self.motorPollType !== 'NoPoll' && (pollType === 'Initial' || (self.motorPollType === pollType && doRegularPoll)))
                    await self.pollMotor();
                if (self.portalPollType !== 'NoPoll' && (pollType === 'Initial' || (self.portalPollType === pollType && doRegularPoll)))
                    await self.pollPortal();
                if (self.pushPollType !== 'NoPoll' && (pollType === 'Initial' || (self.pushPollType === pollType && doRegularPoll)))
                    await self.pollPush();
                if (self.timerPollType !== 'NoPoll' && (pollType === 'Initial' || (self.timerPollType === pollType && doRegularPoll)))
                    await self.pollTimer();
                if (self.versionPollType !== 'NoPoll' && (pollType === 'Initial' || (self.versionPollType === pollType && doRegularPoll)))
                    await self.pollVersion();
                if (self.weatherPollType !== 'NoPoll' && (pollType === 'Initial' || (self.weatherPollType === pollType && doRegularPoll)))
                    await self.pollWeather();
                if (self.wlanPollType !== 'NoPoll' && (pollType === 'Initial' || (self.wlanPollType === pollType && doRegularPoll)))
                    await self.pollWlan();

                self.adapter.log.info('Polling done');
            } else {
                self.adapter.log.error('No connection to lawn mower. Check network connection.');
            }
        });
    }

    /*
     * Poll battery
     */
    async pollBattery() {
        let self = this;

        let apiUrl = '/json?cmd=battery';

        self.adapter.log.debug('API call ' + apiUrl + ' started');

        return new Promise((resolve, reject) => {
            this.request.get({ url: apiUrl }, function (err, response, body) {
                try {
                    let data = self.parseResponse(err, response, body);

                    if (data.successful === true) {
                        self.adapter.setState('batteries.0.id', { val: data['batteries']['0']['id'], ack: true });
                        self.adapter.setState('batteries.0.charge', { val: data['batteries']['0']['charge'], ack: true });
                        self.adapter.setState('batteries.0.voltage', { val: data['batteries']['0']['voltage'] / 1000, ack: true });
                        self.adapter.setState('batteries.0.current', { val: data['batteries']['0']['current'], ack: true });
                        self.adapter.setState('batteries.0.temperature', { val: data['batteries']['0']['temperature'] / 10, ack: true });
                        self.adapter.setState('batteries.0.capacity.full', { val: data['batteries']['0']['capacity']['full'], ack: true });
                        self.adapter.setState('batteries.0.capacity.remaining', { val: data['batteries']['0']['capacity']['remaining'], ack: true });
                    } else {
                        if (data.error_message && data.error_message !== '') {
                            throw new Error(data.error_message);
                        } else {
                            throw new Error('Something went wrong');
                        }                       
                    }
                }
                catch(errorMessage) {
                    self.adapter.log.error(errorMessage);
                }

                self.adapter.log.debug('API call ' + apiUrl + ' done');

                resolve(true);
            });
        });
    }

    /*
     * Poll errors
     */
    async pollErrors() {
        let self = this;

        let apiUrl = '/json?cmd=error';

        self.adapter.log.debug('API call ' + apiUrl + ' started');

        return new Promise((resolve, reject) => {
            this.request.get({ url: apiUrl }, function (err, response, body) {
                try {
                    let data = self.parseResponse(err, response, body);

                    if (data.successful === true) {
                        for (let i = 0; i <= 4; i++) {
                            if (typeof data['errors'][i] === 'object') {
                                self.adapter.setState('error.' + i + '.code', { val: data['errors'][i]['error_code'], ack: true });
                                self.adapter.setState('error.' + i + '.message', { val: data['errors'][i]['error_message'], ack: true });
                                self.adapter.setState('error.' + i + '.date', { val: data['errors'][i]['date'], ack: true });
                                self.adapter.setState('error.' + i + '.time', { val: data['errors'][i]['time'], ack: true });
                                self.adapter.setState('error.' + i + '.unix_timestamp', { val: data['errors'][i]['unix'], ack: true });
                            } else {
                                self.adapter.setState('error.' + i + '.code', { val: '', ack: true });
                                self.adapter.setState('error.' + i + '.message', { val: '', ack: true });
                                self.adapter.setState('error.' + i + '.date', { val: '', ack: true });
                                self.adapter.setState('error.' + i + '.time', { val: '', ack: true });
                                self.adapter.setState('error.' + i + '.unix_timestamp', { val: '', ack: true });
                            }
                        }
                    } else {
                        if (data.error_message && data.error_message !== '') {
                            throw new Error(data.error_message);
                        } else {
                            throw new Error('Something went wrong');
                        }
                    }
                }
                catch(errorMessage) {
                    self.adapter.log.error(errorMessage);
                }

                self.adapter.log.debug('API call ' + apiUrl + ' done');

                resolve(true);
            });
        });
    }

    /*
     * Poll extension
     */
    async pollExtension() {
        let self = this;

        let apiUrl = '/json?cmd=ext';

        self.adapter.log.debug('API call ' + apiUrl + ' started');

        return new Promise((resolve, reject) => {
            this.request.get({ url: apiUrl }, function (err, response, body) {
                try {
                    let data = self.parseResponse(err, response, body);

                    if (data.successful === true) {
                        self.adapter.setState('extension.gpio1.flashonerror', { val: data['ext']['gpio1']['flashonerror'], ack: true });
                        self.adapter.setState('extension.gpio1.inverted', { val: data['ext']['gpio1']['inverted'], ack: true });
                        self.adapter.setState('extension.gpio1.status', { val: data['ext']['gpio1']['status'], ack: true });
                        self.adapter.setState('extension.gpio2.flashonerror', { val: data['ext']['gpio2']['flashonerror'], ack: true });
                        self.adapter.setState('extension.gpio2.inverted', { val: data['ext']['gpio2']['inverted'], ack: true });
                        self.adapter.setState('extension.gpio2.status', { val: data['ext']['gpio2']['status'], ack: true });
                        self.adapter.setState('extension.out1.flashonerror', { val: data['ext']['out1']['flashonerror'], ack: true });
                        self.adapter.setState('extension.out1.inverted', { val: data['ext']['out1']['inverted'], ack: true });
                        self.adapter.setState('extension.out1.status', { val: data['ext']['out1']['status'], ack: true });
                        self.adapter.setState('extension.out2.flashonerror', { val: data['ext']['out2']['flashonerror'], ack: true });
                        self.adapter.setState('extension.out2.inverted', { val: data['ext']['out2']['inverted'], ack: true });
                        self.adapter.setState('extension.out2.status', { val: data['ext']['out2']['status'], ack: true });
                    } else {
                        if (data.error_message && data.error_message !== '') {
                            throw new Error(data.error_message);
                        } else {
                            throw new Error('Something went wrong');
                        }
                    }
                }
                catch(errorMessage) {
                    self.adapter.log.error(errorMessage);
                }

                self.adapter.log.debug('API call ' + apiUrl + ' done');

                resolve(true);
            });
        });
    }

    /*
     * Poll GPS
     */
    async pollGps() {
        let self = this;

        let apiUrl = '/json?cmd=gps';

        self.adapter.log.debug('API call ' + apiUrl + ' started');

        return new Promise((resolve, reject) => {
            this.request.get({ url: apiUrl }, function (err, response, body) {
                try {
                    let data = self.parseResponse(err, response, body);

                    if (data.successful === true) {
                        self.adapter.setState('gps.latitude', { val: self.convertDmsToDd(data['gps']['latitude']), ack: true });
                        self.adapter.setState('gps.longitude', { val: self.convertDmsToDd(data['gps']['longitude']), ack: true });
                        self.adapter.setState('hours.satellites', { val: data['gps']['satellites'], ack: true });
                    } else {
                        if (data.error_message && data.error_message !== '') {
                            throw new Error(data.error_message);
                        } else {
                            throw new Error('Something went wrong');
                        }
                    }
                }
                catch(errorMessage) {
                    self.adapter.log.error(errorMessage);
                }

                self.adapter.log.debug('API call ' + apiUrl + ' done');

                resolve(true);
            });
        });
    }

    /*
     * Poll hours
     */
    async pollHours() {
        let self = this;

        let apiUrl = '/json?cmd=hour';

        self.adapter.log.debug('API call ' + apiUrl + ' started');

        return new Promise((resolve, reject) => {
            this.request.get({ url: apiUrl }, function (err, response, body) {
                try {
                    let data = self.parseResponse(err, response, body);

                    if (data.successful === true) {
                        self.adapter.setState('hours.run', { val: data['general']['run'], ack: true });
                        self.adapter.setState('hours.mow', { val: data['general']['mow'], ack: true });
                        self.adapter.setState('hours.search', { val: data['general']['search'], ack: true });
                        self.adapter.setState('hours.charge', { val: data['general']['charge'], ack: true });
                        self.adapter.setState('hours.charges', { val: data['general']['charges'], ack: true });
                        self.adapter.setState('hours.errors', { val: data['general']['errors'], ack: true });
                        self.adapter.setState('hours.since', { val: data['general']['since'], ack: true });
                    } else {
                        if (data.error_message && data.error_message !== '') {
                            throw new Error(data.error_message);
                        } else {
                            throw new Error('Something went wrong');
                        }
                    }
                }
                catch(errorMessage) {
                    self.adapter.log.error(errorMessage);
                }

                self.adapter.log.debug('API call ' + apiUrl + ' done');

                resolve(true);
            });
        });
    }

    /*
     * Poll motor
     */
    async pollMotor() {
        let self = this;

        let apiUrl = '/json?cmd=motor';

        self.adapter.log.debug('API call ' + apiUrl + ' started');

        return new Promise((resolve, reject) => {
            this.request.get({ url: apiUrl }, function (err, response, body) {
                try {
                    let data = self.parseResponse(err, response, body);

                    if (data.successful === true) {
                        self.adapter.setState('motor.drive.left.current', { val: data['drive']['left']['current'], ack: true });
                        self.adapter.setState('motor.drive.left.power', { val: data['drive']['left']['power'], ack: true });
                        self.adapter.setState('motor.drive.left.speed', { val: data['drive']['left']['speed'], ack: true });

                        self.adapter.setState('motor.drive.right.current', { val: data['drive']['right']['current'], ack: true });
                        self.adapter.setState('motor.drive.right.power', { val: data['drive']['right']['power'], ack: true });
                        self.adapter.setState('motor.drive.right.speed', { val: data['drive']['right']['speed'], ack: true });

                        self.adapter.setState('motor.blade.current', { val: data['blade']['current'], ack: true });
                        self.adapter.setState('motor.blade.speed', { val: data['blade']['speed'], ack: true });
                        self.adapter.setState('motor.blade.average', { val: data['blade']['average'], ack: true });
                    } else {
                        if (data.error_message && data.error_message !== '') {
                            throw new Error(data.error_message);
                        } else {
                            throw new Error('Something went wrong');
                        }
                    }
                }
                catch(errorMessage) {
                    self.adapter.log.error(errorMessage);
                }

                self.adapter.log.debug('API call ' + apiUrl + ' done');

                resolve(true);
            });
        });
    }

    /*
     * Poll portal
     */
    async pollPortal() {
        let self = this;

        let apiUrl = '/json?cmd=portal';

        self.adapter.log.debug('API call ' + apiUrl + ' started');

        return new Promise((resolve, reject) => {
            this.request.get({ url: apiUrl }, function (err, response, body) {
                try {
                    let data = self.parseResponse(err, response, body);

                    if (data.successful === true) {
                        self.adapter.setState('portal.enabled', { val: data['enabled'], ack: true });
                        self.adapter.setState('portal.connected', { val: data['connected'], ack: true });

                        self.adapter.setState('portal.address.domain', { val: data['address']['domain'], ack: true });
                        self.adapter.setState('portal.address.url', { val: data['address']['url'], ack: true });
                        self.adapter.setState('portal.address.host.default', { val: data['address']['host']['default'], ack: true });
                        self.adapter.setState('portal.address.host.friendly', { val: data['address']['host']['friendly'], ack: true });
                    } else {
                        if (data.error_message && data.error_message !== '') {
                            throw new Error(data.error_message);
                        } else {
                            throw new Error('Something went wrong');
                        }
                    }
                }
                catch(errorMessage) {
                    self.adapter.log.error(errorMessage);
                }

                self.adapter.log.debug('API call ' + apiUrl + ' done');

                resolve(true);
            });
        });
    }

    /*
     * Poll push
     */
    async pollPush() {
        let self = this;

        let apiUrl = '/json?cmd=push';

        self.adapter.log.debug('API call ' + apiUrl + ' started');

        return new Promise((resolve, reject) => {
            this.request.get({ url: apiUrl }, function (err, response, body) {
                try {
                    let data = self.parseResponse(err, response, body);

                    if (data.successful === true) {
                        self.adapter.setState('push.server_url', { val: data['push']['server']['url'], ack: true });
                        self.adapter.setState('push.interval', { val: data['push']['trigger']['interval'] / 1000, ack: true });

                        for (let i = 0; i <= 9; i++) {
                            self.adapter.setState('push.trigger.' + i + '.name', { val: data['push']['trigger']['trigger' + i]['name'], ack: true });
                            self.adapter.setState('push.trigger.' + i + '.enter', { val: data['push']['trigger']['trigger' + i]['enter'], ack: true });
                            self.adapter.setState('push.trigger.' + i + '.leave', { val: data['push']['trigger']['trigger' + i]['leave'], ack: true });
                        }
                    } else {
                        if (data.error_message && data.error_message !== '') {
                            throw new Error(data.error_message);
                        } else {
                            throw new Error('Something went wrong');
                        }
                    }
                }
                catch(errorMessage) {
                    self.adapter.log.error(errorMessage);
                }

                self.adapter.log.debug('API call ' + apiUrl + ' done');

                resolve(true);
            });
        });
    }

    /*
     * Poll status
     */
    async pollStatus() {
        let self = this;

        let apiUrl = '/json?cmd=status';

        self.adapter.log.debug('API call ' + apiUrl + ' started');

        return new Promise((resolve, reject) => {
            this.request.get({ url: apiUrl }, function (err, response, body) {
                self.currentStatus = null;

                try {
                    let data = self.parseResponse(err, response, body);

                    if (data.successful === true) {
                        self.adapter.setState('name', { val: data['name'], ack: true });
                        self.adapter.setState('id', { val: data['id'], ack: true });

                        self.adapter.setState('status.status', { val: data['status']['status'], ack: true });
                        self.adapter.setState('status.distance', { val: data['status']['distance'], ack: true });
                        self.adapter.setState('status.stopped', { val: data['status']['stopped'], ack: true });
                        self.adapter.setState('status.duration', { val: data['status']['duration'], ack: true });
                        self.adapter.setState('status.mode', { val: data['status']['mode'], ack: true });
                        self.adapter.setState('status.battery', { val: data['status']['battery'], ack: true });
                        self.adapter.setState('status.hours', { val: data['status']['hours'], ack: true });

                        self.adapter.setState('timer.status', { val: data['timer']['status'], ack: true });
                        if (data['timer']['next'] != undefined) {
                            self.adapter.setState('timer.next_date', { val: data['timer']['next']['date'], ack: true });
                            self.adapter.setState('timer.next_time', { val: data['timer']['next']['time'], ack: true });
                            self.adapter.setState('timer.next_unix', { val: data['timer']['next']['unix'], ack: true });
                        } else {
                            self.adapter.setState('timer.next_date', { val: '', ack: true });
                            self.adapter.setState('timer.next_time', { val: '', ack: true });
                            self.adapter.setState('timer.next_unix', { val: '', ack: true });
                        }

                        if (data['blades'] != undefined) {
                            self.adapter.setState('blades.quality', { val: data['blades']['quality'], ack: true });
                            self.adapter.setState('blades.hours', { val: data['blades']['hours'], ack: true });
                            self.adapter.setState('blades.days', { val: data['blades']['days'], ack: true });
                        } else {
                            self.adapter.setState('blades.quality', { val: '', ack: true });
                            self.adapter.setState('blades.hours', { val: '', ack: true });
                            self.adapter.setState('blades.days', { val: '', ack: true });
                        }

                        self.adapter.setState('wlan.signal', { val: data['wlan']['signal'], ack: true });

                        if (data['health'] != undefined) {
                            self.adapter.setState('health.temperature', { val: data['health']['temperature'], ack: true });
                            self.adapter.setState('health.humidity', { val: data['health']['humidity'], ack: true });
                        } else {
                            self.adapter.setState('health.temperature', { val: '', ack: true });
                            self.adapter.setState('health.humidity', { val: '', ack: true });
                        }

                        self.adapter.setState('clock.date', { val: data['clock']['date'], ack: true });
                        self.adapter.setState('clock.time', { val: data['clock']['time'], ack: true });
                        self.adapter.setState('clock.unix_timestamp', { val: data['clock']['unix'], ack: true });

                        self.currentStatus = data['status']['status'];
                    } else {
                        if (data.error_message && data.error_message !== '') {
                            throw new Error(data.error_message);
                        } else {
                            throw new Error('Something went wrong');
                        }
                    }
                }
                catch(errorMessage) {
                    self.adapter.log.error(errorMessage);
                }

                self.adapter.log.debug('API call ' + apiUrl + ' done');

                resolve(true);
            });
        });
    }

    /*
     * Poll timer
     */
    async pollTimer() {
        let self = this;

        let apiUrl = '/json?cmd=timer';

        self.adapter.log.debug('API call ' + apiUrl + ' started');

        return new Promise((resolve, reject) => {
            this.request.get({ url: apiUrl }, function (err, response, body) {
                try {
                    let data = self.parseResponse(err, response, body);

                    if (data.successful === true) {
                        for (let i = 0; i <= 13; i++) {
                            self.adapter.setState('timer.' + i + '.id', { val: data['timer'][i]['id'], ack: true });
                            self.adapter.setState('timer.' + i + '.enabled', { val: data['timer'][i]['enabled'], ack: true });
                            self.adapter.setState('timer.' + i + '.start_time', { val: data['timer'][i]['start'], ack: true });
                            self.adapter.setState('timer.' + i + '.end_time', { val: data['timer'][i]['end'], ack: true });
                            self.adapter.setState('timer.' + i + '.weekdays.monday', { val: data['timer'][i]['weekdays']['mo'], ack: true });
                            self.adapter.setState('timer.' + i + '.weekdays.tuesday', { val: data['timer'][i]['weekdays']['tu'], ack: true });
                            self.adapter.setState('timer.' + i + '.weekdays.wednesday', { val: data['timer'][i]['weekdays']['we'], ack: true });
                            self.adapter.setState('timer.' + i + '.weekdays.thursday', { val: data['timer'][i]['weekdays']['th'], ack: true });
                            self.adapter.setState('timer.' + i + '.weekdays.friday', { val: data['timer'][i]['weekdays']['fr'], ack: true });
                            self.adapter.setState('timer.' + i + '.weekdays.saturday', { val: data['timer'][i]['weekdays']['sa'], ack: true });
                            self.adapter.setState('timer.' + i + '.weekdays.sunday', { val: data['timer'][i]['weekdays']['su'], ack: true });
                        }
                    } else {
                        if (data.error_message && data.error_message !== '') {
                            throw new Error(data.error_message);
                        } else {
                            throw new Error('Something went wrong');
                        }
                    }
                }
                catch(errorMessage) {
                    self.adapter.log.error(errorMessage);
                }

                self.adapter.log.debug('API call ' + apiUrl + ' done');

                resolve(true);
            });
        });
    }

    /*
     * Poll version
     */
    async pollVersion() {
        let self = this;

        let apiUrl = '/json?cmd=version';

        self.adapter.log.debug('API call ' + apiUrl + ' started');

        return new Promise((resolve, reject) => {
            this.request.get({ url: apiUrl }, function (err, response, body) {
                try {
                    let data = self.parseResponse(err, response, body);

                    if (data.successful === true) {
                        self.adapter.setState('info.hardware.production', { val: data['mower']['hardware']['production'], ack: true });
                        self.adapter.setState('info.hardware.serial', { val: data['mower']['hardware']['serial'].toString(), ack: true });

                        self.adapter.setState('info.msw.compiled', { val: data['mower']['msw']['compiled'], ack: true });
                        self.adapter.setState('info.msw.title', { val: data['mower']['msw']['title'], ack: true });
                        self.adapter.setState('info.msw.version', { val: data['mower']['msw']['version'], ack: true });

                        self.adapter.setState('info.sub.version', { val: data['mower']['sub']['version'], ack: true });

                        self.adapter.setState('info.robonect.serial', { val: data['serial'], ack: true });
                        self.adapter.setState('info.robonect.comment', { val: data['application']['comment'], ack: true });
                        self.adapter.setState('info.robonect.compiled', { val: data['application']['compiled'], ack: true });
                        self.adapter.setState('info.robonect.version', { val: data['application']['version'], ack: true });

                        self.adapter.setState('info.bootloader.comment', { val: data['bootloader']['comment'], ack: true });
                        self.adapter.setState('info.bootloader.compiled', { val: data['bootloader']['compiled'], ack: true });
                        self.adapter.setState('info.bootloader.version', { val: data['bootloader']['version'], ack: true });

                        self.adapter.setState('info.wlan.at-version', { val: data['wlan']['at-version'], ack: true });
                        self.adapter.setState('info.wlan.sdk-version', { val: data['wlan']['sdk-version'], ack: true });
                    } else {
                        throw new Error('Something went wrong');
                    }
                }
                catch(errorMessage) {
                    if (data.error_message && data.error_message !== '') {
                        throw new Error(data.error_message);
                    } else {
                        throw new Error('Something went wrong');
                    }
                }

                self.adapter.log.debug('API call ' + apiUrl + ' done');

                resolve(true);
            });
        });
    }

    /*
     * Poll Weather
     */
    async pollWeather() {
        let self = this;

        let apiUrl = '/json?cmd=weather';

        self.adapter.log.debug('API call ' + apiUrl + ' started');

        return new Promise((resolve, reject) => {
            this.request.get({ url: apiUrl }, function (err, response, body) {
                try {
                    let data = self.parseResponse(err, response, body);

                    if (data.successful === true) {
                        self.adapter.setState('weather.service.enable', { val: data['service']['enable'], ack: true });

                        if (data['service']['enable'] === true) {
                            self.adapter.setState('weather.service.config.dontmowduringday', { val: data['service']['config']['dontmowduringday'], ack: true });
                            self.adapter.setState('weather.service.config.dontmowduringnight', { val: data['service']['config']['dontmowduringnight'], ack: true });
                            self.adapter.setState('weather.service.config.maxhumidity', { val: data['service']['config']['maxhumidity'], ack: true });
                            self.adapter.setState('weather.service.config.maxrain', { val: data['service']['config']['maxrain'], ack: true });
                            self.adapter.setState('weather.service.config.maxtemp', { val: data['service']['config']['maxtemp'], ack: true });
                            self.adapter.setState('weather.service.config.minhumidity', { val: data['service']['config']['minhumidity'], ack: true });
                            self.adapter.setState('weather.service.config.mintemp', { val: data['service']['config']['mintemp'], ack: true });
                            self.adapter.setState('weather.service.location.cityid', { val: data['service']['location']['cityid'], ack: true });
                            self.adapter.setState('weather.service.location.country', { val: data['service']['location']['country'], ack: true });
                            self.adapter.setState('weather.service.location.zip', { val: data['service']['location']['zip'], ack: true });
                            self.adapter.setState('weather.condition.day', { val: data['weather']['condition']['day'], ack: true });
                            self.adapter.setState('weather.condition.night', { val: data['weather']['condition']['night'], ack: true });
                            self.adapter.setState('weather.condition.toocold', { val: data['weather']['condition']['toocold'], ack: true });
                            self.adapter.setState('weather.condition.toodry', { val: data['weather']['condition']['toodry'], ack: true });
                            self.adapter.setState('weather.condition.toorainy', { val: data['weather']['condition']['toorainy'], ack: true });
                            self.adapter.setState('weather.condition.toowarm', { val: data['weather']['condition']['toowarm'], ack: true });
                            self.adapter.setState('weather.condition.toowet', { val: data['weather']['condition']['toowet'], ack: true });
                            self.adapter.setState('weather.timestamp.date', { val: data['weather']['timestamp']['date'], ack: true });
                            self.adapter.setState('weather.timestamp.time', { val: data['weather']['timestamp']['time'], ack: true });
                            self.adapter.setState('weather.timestamp.unix_timestamp', { val: data['weather']['timestamp']['unix_timestamp'], ack: true });
                            self.adapter.setState('weather.break', { val: data['weather']['break'], ack: true });
                            self.adapter.setState('weather.city', { val: data['weather']['city'], ack: true });
                            self.adapter.setState('weather.day', { val: data['weather']['day'], ack: true });
                            self.adapter.setState('weather.humidity', { val: data['weather']['humidity'], ack: true });
                            self.adapter.setState('weather.rain', { val: data['weather']['rain'], ack: true });
                            self.adapter.setState('weather.sunrise', { val: data['weather']['sunrise'], ack: true });
                            self.adapter.setState('weather.sunset', { val: data['weather']['sunset'], ack: true });
                            self.adapter.setState('weather.temperature', { val: data['weather']['temperature'], ack: true });
                        } else {
                            self.adapter.setState('weather.service.config.dontmowduringday', { val: '', ack: true });
                            self.adapter.setState('weather.service.config.dontmowduringnight', { val: '', ack: true });
                            self.adapter.setState('weather.service.config.maxhumidity', { val: '', ack: true });
                            self.adapter.setState('weather.service.config.maxrain', { val: '', ack: true });
                            self.adapter.setState('weather.service.config.maxtemp', { val: '', ack: true });
                            self.adapter.setState('weather.service.config.minhumidity', { val: '', ack: true });
                            self.adapter.setState('weather.service.config.mintemp', { val: '', ack: true });
                            self.adapter.setState('weather.service.location.cityid', { val: '', ack: true });
                            self.adapter.setState('weather.service.location.country', { val: '', ack: true });
                            self.adapter.setState('weather.service.location.zip', { val: '', ack: true });
                            self.adapter.setState('weather.condition.day', { val: '', ack: true });
                            self.adapter.setState('weather.condition.night', { val: '', ack: true });
                            self.adapter.setState('weather.condition.toocold', { val: '', ack: true });
                            self.adapter.setState('weather.condition.toodry', { val: '', ack: true });
                            self.adapter.setState('weather.condition.toorainy', { val: '', ack: true });
                            self.adapter.setState('weather.condition.toowarm', { val: '', ack: true });
                            self.adapter.setState('weather.condition.toowet', { val: '', ack: true });
                            self.adapter.setState('weather.timestamp.date', { val: '', ack: true });
                            self.adapter.setState('weather.timestamp.time', { val: '', ack: true });
                            self.adapter.setState('weather.timestamp.unix_timestamp', { val: '', ack: true });
                            self.adapter.setState('weather.break', { val: '', ack: true });
                            self.adapter.setState('weather.city', { val: '', ack: true });
                            self.adapter.setState('weather.day', { val: '', ack: true });
                            self.adapter.setState('weather.humidity', { val: '', ack: true });
                            self.adapter.setState('weather.rain', { val: '', ack: true });
                            self.adapter.setState('weather.sunrise', { val: '', ack: true });
                            self.adapter.setState('weather.sunset', { val: '', ack: true });
                            self.adapter.setState('weather.temperature', { val: '', ack: true });
                        }
                    } else {
                        if (data.error_message && data.error_message !== '') {
                            throw new Error(data.error_message);
                        } else {
                            throw new Error('Something went wrong');
                        }
                    }
                }
                catch(errorMessage) {
                    self.adapter.log.error(errorMessage);
                }

                self.adapter.log.debug('API call ' + apiUrl + ' done');

                resolve(true);
            });
        });
    }

    /*
     * Poll WLAN
     */
    async pollWlan() {
        let self = this;

        let apiUrl = '/json?cmd=wlan';

        self.adapter.log.debug('API call ' + apiUrl + ' started');

        return new Promise((resolve, reject) => {
            this.request.get({ url: apiUrl }, function (err, response, body) {
                try {
                    let data = self.parseResponse(err, response, body);

                    if (data.successful === true) {
                        self.adapter.setState('wlan.ap.enable', { val: data['ap']['enable'], ack: true });
                        self.adapter.setState('wlan.ap.mac', { val: data['ap']['mac'], ack: true });

                        if (data['ap']['enable'] === true) {
                            self.adapter.setState('wlan.ap.hidden', { val: data['ap']['hidden'], ack: true });
                            self.adapter.setState('wlan.ap.ssid', { val: data['ap']['ssid'], ack: true });
                            self.adapter.setState('wlan.ap.password', { val: data['ap']['password'], ack: true });
                            self.adapter.setState('wlan.ap.channel', { val: data['ap']['channel'], ack: true });
                            self.adapter.setState('wlan.ap.encryption', { val: data['ap']['encryption'], ack: true });
                            self.adapter.setState('wlan.ap.maxconn', { val: data['ap']['maxconn'], ack: true });
                            self.adapter.setState('wlan.ap.ip', { val: data['ap']['ip'], ack: true });
                            self.adapter.setState('wlan.ap.netmask', { val: data['ap']['netmask'], ack: true });
                            self.adapter.setState('wlan.ap.gateway', { val: data['ap']['gateway'], ack: true });
                            self.adapter.setState('wlan.ap.dhcp.enable', { val: data['ap']['dhcp']['enable'], ack: true });
                            self.adapter.setState('wlan.ap.dhcp.start', { val: data['ap']['dhcp']['start'], ack: true });
                            self.adapter.setState('wlan.ap.dhcp.end', { val: data['ap']['dhcp']['end'], ack: true });
                        } else {
                            self.adapter.setState('wlan.ap.hidden', { val: '', ack: true });
                            self.adapter.setState('wlan.ap.ssid', { val: '', ack: true });
                            self.adapter.setState('wlan.ap.password', { val: '', ack: true });
                            self.adapter.setState('wlan.ap.channel', { val: '', ack: true });
                            self.adapter.setState('wlan.ap.encryption', { val: '', ack: true });
                            self.adapter.setState('wlan.ap.maxconn', { val: '', ack: true });
                            self.adapter.setState('wlan.ap.ip', { val: '', ack: true });
                            self.adapter.setState('wlan.ap.netmask', { val: '', ack: true });
                            self.adapter.setState('wlan.ap.gateway', { val: '', ack: true });
                            self.adapter.setState('wlan.ap.dhcp.enable', { val: '', ack: true });
                            self.adapter.setState('wlan.ap.dhcp.start', { val: '', ack: true });
                            self.adapter.setState('wlan.ap.dhcp.end', { val: '', ack: true });
                        }

                        self.adapter.setState('wlan.station.enable', { val: data['station']['enable'], ack: true });
                        self.adapter.setState('wlan.station.mac', { val: data['station']['mac'], ack: true });
                        self.adapter.setState('wlan.station.signal', { val: data['station']['signal'], ack: true });
                        self.adapter.setState('wlan.station.ssid', { val: data['station']['ssid'], ack: true });
                        self.adapter.setState('wlan.station.password', { val: data['station']['password'], ack: true });
                        self.adapter.setState('wlan.station.dhcp', { val: data['station']['dhcp'], ack: true });
                        self.adapter.setState('wlan.station.ping', { val: data['station']['ping'], ack: true });
                        self.adapter.setState('wlan.station.ip', { val: data['station']['ip'], ack: true });
                        self.adapter.setState('wlan.station.netmask', { val: data['station']['netmask'], ack: true });
                        self.adapter.setState('wlan.station.gateway', { val: data['station']['gateway'], ack: true });
                    } else {
                        if (data.error_message && data.error_message !== '') {
                            throw new Error(data.error_message);
                        } else {
                            throw new Error('Something went wrong');
                        }
                    }
                }
                catch(errorMessage) {
                    self.adapter.log.error(errorMessage);
                }

                self.adapter.log.debug('API call ' + apiUrl + ' done');

                resolve(true);
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
            catch(errorMessage) {
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
            catch(errorMessage) {
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
    * Convert a geo-ccordinate in DMS (degrees, minutes, seconds) format into decimal degrees
    */
    convertDmsToDd(dmsString) {
        let [degrees, minutes, seconds, direction] = dmsString.split(/[^\d\w]+/);

        let dd = degrees + minutes/60 + seconds/(60*60);

        if (direction == 'S' || direction == 'W') {
            dd = dd * -1;
        } // Don't do anything for N or E

        return dd;
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
        let end =  parseInt(endHour) * 60 + parseInt(endMinute);

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
};

module.exports = Library;
