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

        this.batteryPollType = adapter.config.batteryPollType;
        this.errorsPollType = adapter.config.errorsPollType;
        this.extensionPollType = adapter.config.extensionPollType;
        this.hoursPollType = adapter.config.hoursPollType;
        this.motorPollType = adapter.config.motorPollType;
        this.portalPollType = adapter.config.portalPollType;
        this.pushPollType = adapter.config.pushPollType;
        this.timerPollType = adapter.config.timerPollType;
        this.versionPollType = adapter.config.versionPollType;
        this.wlanPollType = adapter.config.wlanPollType;

        if (this.username != '' && this.password != '') {
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

        this.currentStatus = null;
    }

    /*
     * Poll
     */
    poll(type) {
        var self = this;

        ping.sys.probe(self.robonectIp, async function (isAlive) {
            self.adapter.setState('last_sync', { val: self.adapter.formatDate(new Date(), 'YYYY-MM-DD hh:mm:ss'), ack: true });
            self.adapter.setState('active', { val: isAlive, ack: true });
            self.adapter.setState('info.connection', { val: isAlive, ack: true });

            if (isAlive) {
                //self.adapter.log.info('Start polling (' + type + ')');

                if (type === 'Initial') {
                    await self.pollStatus();
                    await self.pollBattery();
                    await self.pollErrors();
                    await self.pollExtension();
                    await self.pollHours();
                    await self.pollMotor();
                    await self.pollPortal();
                    await self.pollPush();
                    await self.pollTimer();
                    await self.pollVersion();
                    await self.pollWlan();
                } else {
                    self.pollStatus();

                    if (self.currentStatus != null && self.currentStatus != 17 /*schlafen*/) {
                        if (self.batteryPollType === type) 
                            await self.pollBattery();
                        if (self.errorsPollType === type)
                            await self.pollErrors();
                        if (self.extensionPollType === type)
                            await self.pollExtension();
                        if (self.hoursPollType === type)
                            await self.pollHours();
                        if (self.motorPollType === type)
                            await self.pollMotor();
                        if (self.portalPollType === type)
                            await self.pollPortal();
                        if (self.pushPollType === type)
                            await self.pollPush();
                        if (self.timerPollType === type)
                            await self.pollTimer();
                        if (self.versionPollType === type)
                            await self.pollVersion();
                        if (self.wlanPollType === type)
                            await self.pollWlan();
                    }
                }

                self.adapter.log.info('Polling done (' + type + ')');
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

        return new Promise((resolve, reject) => {
            request.get({ url: self.url + '/json?cmd=battery' }, function (err, response, body) {
                if (!err) {
                    if (response && response.statusCode === 200) {
                        if (body !== '') {
                            var data = JSON.parse(body);

                            if (typeof data === 'object' && data.successful === true) {
                                self.adapter.setState('batteries.0.id', { val: data['batteries']['0']['id'], ack: true });
                                self.adapter.setState('batteries.0.charge', { val: data['batteries']['0']['charge'], ack: true });
                                self.adapter.setState('batteries.0.voltage', { val: data['batteries']['0']['voltage'] / 1000, ack: true });
                                self.adapter.setState('batteries.0.current', { val: data['batteries']['0']['current'], ack: true });
                                self.adapter.setState('batteries.0.temperature', { val: data['batteries']['0']['temperature'] / 10, ack: true });
                                self.adapter.setState('batteries.0.capacity.full', { val: data['batteries']['0']['capacity']['full'], ack: true });
                                self.adapter.setState('batteries.0.capacity.remaining', { val: data['batteries']['0']['capacity']['remaining'], ack: true });
                            } else {
                                self.adapter.log.error('JSON not valid');
                            }
                        } else {
                            self.adapter.log.error('Empty body');
                        }
                    } else {
                        self.adapter.log.error('Bad response: ' + JSON.stringify(response));
                    }
                } else {
                    self.adapter.log.error(err);
                }

                resolve(true);
            });
        });
    }

    /*
     * Poll errors
     */
    async pollErrors() {
        let self = this;

        return new Promise((resolve, reject) => {
            request.get({ url: self.url + '/json?cmd=error' }, function (err, response, body) {
                if (!err) {
                    if (response && response.statusCode === 200) {
                        if (body !== '') {
                            var data = JSON.parse(body);

                            if (typeof data === 'object' && data.successful === true) {
                                for (var i = 0; i <= 4; i++) {
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
                                self.adapter.log.error('JSON not valid');
                            }
                        } else {
                            self.adapter.log.error('Empty body');
                        }
                    } else {
                        self.adapter.log.error('Bad response: ' + JSON.stringify(response));
                    }
                } else {
                    self.adapter.log.error(err);
                }

                resolve(true);
            });
        });
    }

    /*
     * Poll extension
     */
    async pollExtension() {
        let self = this;

        return new Promise((resolve, reject) => {
            request.get({ url: self.url + '/json?cmd=ext' }, function (err, response, body) {
                if (!err) {
                    if (response && response.statusCode === 200) {
                        if (body !== '') {
                            var data = JSON.parse(body);

                            if (typeof data === 'object' && data.successful === true) {
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
                                self.adapter.log.error('JSON not valid');
                            }
                        } else {
                            self.adapter.log.error('Empty body');
                        }
                    } else {
                        self.adapter.log.error('Bad response: ' + JSON.stringify(response));
                    }
                } else {
                    self.adapter.log.error(err);
                }

                resolve(true);
            });
        });
    }

    /*
     * Poll hours
     */
    async pollHours() {
        let self = this;

        return new Promise((resolve, reject) => {
            request.get({ url: self.url + '/json?cmd=hour' }, function (err, response, body) {
                if (!err) {
                    if (response && response.statusCode === 200) {
                        if (body !== '') {
                            var data = JSON.parse(body);

                            if (typeof data === 'object' && data.successful === true) {
                                self.adapter.setState('hours.run', { val: data['general']['run'], ack: true });
                                self.adapter.setState('hours.mow', { val: data['general']['mow'], ack: true });
                                self.adapter.setState('hours.search', { val: data['general']['search'], ack: true });
                                self.adapter.setState('hours.charge', { val: data['general']['charge'], ack: true });
                                self.adapter.setState('hours.charges', { val: data['general']['charges'], ack: true });
                                self.adapter.setState('hours.errors', { val: data['general']['errors'], ack: true });
                                self.adapter.setState('hours.since', { val: data['general']['since'], ack: true });
                            } else {
                                self.adapter.log.error('JSON not valid');
                            }
                        } else {
                            self.adapter.log.error('Empty body');
                        }
                    } else {
                        self.adapter.log.error('Bad response: ' + JSON.stringify(response));
                    }
                } else {
                    self.adapter.log.error(err);
                }

                resolve(true);
            });
        });
    }

    /*
     * Poll motor
     */
    async pollMotor() {
        let self = this;

        return new Promise((resolve, reject) => {
            request.get({ url: self.url + '/json?cmd=motor' }, function (err, response, body) {
                if (!err) {
                    if (response && response.statusCode === 200) {
                        if (body !== '') {
                            var data = JSON.parse(body);

                            if (typeof data === 'object' && data.successful === true) {
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
                                self.adapter.log.error('JSON not valid');
                            }
                        } else {
                            self.adapter.log.error('Empty body');
                        }
                    } else {
                        self.adapter.log.error('Bad response: ' + JSON.stringify(response));
                    }
                } else {
                    self.adapter.log.error(err);
                }

                resolve(true);
            });
        });
    }

    /*
     * Poll portal
     */
    async pollPortal() {
        let self = this;

        return new Promise((resolve, reject) => {
            request.get({ url: self.url + '/json?cmd=portal' }, function (err, response, body) {
                if (!err) {
                    if (response && response.statusCode === 200) {
                        if (body !== '') {
                            var data = JSON.parse(body);

                            if (typeof data === 'object' && data.successful === true) {
                                self.adapter.setState('portal.enabled', { val: data['enabled'], ack: true });
                                self.adapter.setState('portal.connected', { val: data['connected'], ack: true });

                                self.adapter.setState('portal.address.domain', { val: data['address']['domain'], ack: true });
                                self.adapter.setState('portal.address.url', { val: data['address']['url'], ack: true });
                                self.adapter.setState('portal.address.host.default', { val: data['address']['host']['default'], ack: true });
                                self.adapter.setState('portal.address.host.friendly', { val: data['address']['host']['friendly'], ack: true });
                            } else {
                                self.adapter.log.error('JSON not valid');
                            }
                        } else {
                            self.adapter.log.error('Empty body');
                        }
                    } else {
                        self.adapter.log.error('Bad response: ' + JSON.stringify(response));
                    }
                } else {
                    self.adapter.log.error(err);
                }

                resolve(true);
            });
        });
    }

    /*
     * Poll push
     */
    async pollPush() {
        let self = this;

        return new Promise((resolve, reject) => {
            request.get({ url: self.url + '/json?cmd=push' }, function (err, response, body) {
                if (!err) {
                    if (response && response.statusCode === 200) {
                        if (body !== '') {
                            var data = JSON.parse(body);

                            if (typeof data === 'object' && data.successful === true) {
                                self.adapter.setState('push.server_url', { val: data['push']['server']['url'], ack: true });
                                self.adapter.setState('push.interval', { val: data['push']['trigger']['interval'] / 1000, ack: true });

                                for (var i = 0; i <= 9; i++) {
                                    self.adapter.setState('push.trigger.' + i + '.name', { val: data['push']['trigger']['trigger' + i]['name'], ack: true });
                                    self.adapter.setState('push.trigger.' + i + '.enter', { val: data['push']['trigger']['trigger' + i]['enter'], ack: true });
                                    self.adapter.setState('push.trigger.' + i + '.leave', { val: data['push']['trigger']['trigger' + i]['leave'], ack: true });
                                }
                            } else {
                                self.adapter.log.error('JSON not valid');
                            }
                        } else {
                            self.adapter.log.error('Empty body');
                        }
                    } else {
                        self.adapter.log.error('Bad response: ' + JSON.stringify(response));
                    }
                } else {
                    self.adapter.log.error(err);
                }

                resolve(true);
            });
        });
    }

    /*
     * Poll status
     */
    async pollStatus() {
        let self = this;

        return new Promise((resolve, reject) => {
            request.get({ url: self.url + '/json?cmd=status' }, function (err, response, body) {
                self.currentStatus = null;

                if (!err) {
                    if (response && response.statusCode === 200) {
                        if (body !== '') {
                            var data = JSON.parse(body);

                            if (typeof data === 'object' && data.successful === true) {
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
                                self.adapter.log.error('JSON not valid');
                            }
                        } else {
                            self.adapter.log.error('Empty body');
                        }
                    } else {
                        self.adapter.log.error('Bad response: ' + JSON.stringify(response));
                    }
                } else {
                    self.adapter.log.error(err);
                }

                resolve(true);
            });
        });
    }

    /*
     * Poll timer
     */
    async pollTimer() {
        let self = this;

        return new Promise((resolve, reject) => {
            request.get({ url: self.url + '/json?cmd=timer' }, function (err, response, body) {
                if (!err) {
                    if (response && response.statusCode === 200) {
                        if (body !== '') {
                            var data = JSON.parse(body);

                            if (typeof data === 'object' && data.successful === true) {
                                for (var i = 0; i <= 13; i++) {
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
                                self.adapter.log.error('JSON not valid');
                            }
                        } else {
                            self.adapter.log.error('Empty body');
                        }
                    } else {
                        self.adapter.log.error('Bad response: ' + JSON.stringify(response));
                    }
                } else {
                    self.adapter.log.error(err);
                }

                resolve(true);
            });
        });
    }

    /*
     * Poll version
     */
    async pollVersion() {
        let self = this;

        return new Promise((resolve, reject) => {
            request.get({ url: self.url + '/json?cmd=version' }, function (err, response, body) {
                if (!err) {
                    if (response && response.statusCode === 200) {
                        if (body !== '') {
                            var data = JSON.parse(body);

                            if (typeof data === 'object' && data.successful === true) {
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
                                self.adapter.log.error('JSON not valid');
                            }
                        } else {
                            self.adapter.log.error('Empty body');
                        }
                    } else {
                        self.adapter.log.error('Bad response: ' + JSON.stringify(response));
                    }
                } else {
                    self.adapter.log.error(err);
                }

                resolve(true);
            });
        });
    }

    /*
     * Poll WLAN
     */
    async pollWlan() {
        let self = this;

        return new Promise((resolve, reject) => {
            request.get({ url: self.url + '/json?cmd=wlan' }, function (err, response, body) {
                if (!err) {
                    if (response && response.statusCode === 200) {
                        if (body !== '') {
                            var data = JSON.parse(body);

                            if (typeof data === 'object' && data.successful === true) {
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
                                self.adapter.log.error('JSON not valid');
                            }
                        } else {
                            self.adapter.log.error('Empty body');
                        }
                    } else {
                        self.adapter.log.error('Bad response: ' + JSON.stringify(response));
                    }
                } else {
                    self.adapter.log.error(err);
                }

                resolve(true);
            });
        });
    }

    /*
     * Update extension status
     */
    updateExtensionStatus(ext, status) {
        var self = this;

        if (status === true) {
            status = 1;
        } else {
            status = 0;
        }

        request.get({ url: self.url + '/json?cmd=ext&' + ext + '=' + status }, function (err, response, body) {
            if (!err) {
                var data = JSON.parse(body);

                if (typeof data === 'object' && data.successful === true) {
                    self.adapter.setState('extension.gpio1.inverted', { val: data['ext']['gpio1']['inverted'], ack: true });
                    self.adapter.setState('extension.gpio1.status', { val: data['ext']['gpio1']['status'], ack: true });
                    self.adapter.setState('extension.gpio2.inverted', { val: data['ext']['gpio2']['inverted'], ack: true });
                    self.adapter.setState('extension.gpio2.status', { val: data['ext']['gpio2']['status'], ack: true });
                    self.adapter.setState('extension.out1.inverted', { val: data['ext']['out1']['inverted'], ack: true });
                    self.adapter.setState('extension.out1.status', { val: data['ext']['out1']['status'], ack: true });
                    self.adapter.setState('extension.out2.inverted', { val: data['ext']['out2']['inverted'], ack: true });
                    self.adapter.setState('extension.out2.status', { val: data['ext']['out2']['status'], ack: true });
                }

                if (data['ext'][ext]['status'] == status) {
                    self.adapter.log.info(ext + ' set to ' + status);
                } else {
                    self.adapter.log.info(ext + ' could not be set to ' + status + '. Is the extension mode set to API?');
                }
            } else {
                self.adapter.log.error(err);
            }
        });
    }

    /*
     * Update mode
     */
    updateMode(mode) {
        var self = this;
        var mode = mode;

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

        request.get({ url: self.url + '/json?cmd=mode&mode=' + paramMode }, function (err, response, body) {
            if (!err) {
                var data = JSON.parse(body);

                if (typeof data === 'object' && data.successful === true) {
                    self.adapter.setState('status.mode', { val: mode, ack: true });

                    self.adapter.log.info('Mode set to ' + mode);
                } else {
                    self.adapter.log.info('Mode could not be set to ' + mode);
                }
            } else {
                self.adapter.log.error(err);
            }
        });
    }
};

module.exports = Library;
