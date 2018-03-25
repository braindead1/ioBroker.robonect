/* jshint -W097 */// jshint strict:false
/*jslint node: true */

"use strict";

// you have to require the utils module and call adapter function
var utils = require(__dirname + '/lib/utils'); // Get common adapter utils
var ping = require('ping');
var request = require('request');
var ip, 
    username, 
    password, 
    statusInterval, 
    infoInterval,
    batteryPollType,
    errorsPollType,
    extensionPollType,
    hoursPollType,
    motorPollType,
    pushPollType,
    statusPollType,
    timerPollType,
    versionPollType,
    wlanPollType,
    url;

// you have to call the adapter function and pass a options object
// name has to be set and has to be equal to adapters folder name and main file name excluding extension
// adapter will be restarted automatically every time as the configuration changed, e.g system.adapter.robonect.0

var adapter = utils.adapter('robonect');

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
            updateExtensionStatus('gpio1', state.val);
        } else if (id === adapter.namespace + ".extension.gpio2.status") {
            updateExtensionStatus('gpio2', state.val);
        } else if (id === adapter.namespace + ".extension.out1.status") {
            updateExtensionStatus('out1', state.val);
        } else if (id === adapter.namespace + ".extension.out2.status") {
            updateExtensionStatus('out2', state.val);
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

function pollBattery() {
    request.get({url: url + "/json?cmd=battery"}, function (err, response, body) {
        if (!err) {
            var data = JSON.parse(body);
            
            if(typeof data === 'object' && data.successful === true) {
                adapter.setState('battery.id', {val: data["battery"]["id"], ack: true});
                adapter.setState('battery.charge', {val: data["battery"]["charge"], ack: true});
                adapter.setState('battery.voltage', {val: data["battery"]["voltage"]/1000, ack: true});
                adapter.setState('battery.current', {val: data["battery"]["current"], ack: true});
                adapter.setState('battery.temperature', {val: data["battery"]["temperature"]/10, ack: true});
                adapter.setState('battery.capacity.full', {val: data["battery"]["capacity"]["full"], ack: true});
                adapter.setState('battery.capacity.remaining', {val: data["battery"]["capacity"]["remaining"], ack: true});
            }
        } else {
            adapter.log.error(err);
        }
    });
}

function pollErrors() {
    request.get({url: url + "/json?cmd=error"}, function (err, response, body) {
        if (!err) {
            var data = JSON.parse(body);
            
            if(typeof data === 'object' && data.successful === true) {
                for(var i=0; i<=4; i++) {
                    if(typeof data["errors"][i] === 'object') {
                        adapter.setState('error.' + i + '.code', {val: data["errors"][i]["error_code"], ack: true});
                        adapter.setState('error.' + i + '.message', {val: data["errors"][i]["error_message"], ack: true});
                        adapter.setState('error.' + i + '.date', {val: data["errors"][i]["date"], ack: true});
                        adapter.setState('error.' + i + '.time', {val: data["errors"][i]["time"], ack: true});
                        adapter.setState('error.' + i + '.unix_timestamp', {val: data["errors"][i]["unix"], ack: true});
                    } else {
                        adapter.setState('error.' + i + '.code', {val: "", ack: true});
                        adapter.setState('error.' + i + '.message', {val: "", ack: true});
                        adapter.setState('error.' + i + '.date', {val: "", ack: true});
                        adapter.setState('error.' + i + '.time', {val: "", ack: true});
                        adapter.setState('error.' + i + '.unix_timestamp', {val: "", ack: true});
                    }
                }
            }
        } else {
            adapter.log.error(err);
        }
    });
}

function pollExtension() {
    request.get({url: url + "/json?cmd=ext"}, function (err, response, body) {
        if (!err) {
            var data = JSON.parse(body);
            
            if(typeof data === 'object' && data.successful === true) {
                adapter.setState('extension.gpio1.inverted', {val: data["ext"]["gpio1"]["inverted"], ack: true});
                adapter.setState('extension.gpio1.status', {val: data["ext"]["gpio1"]["status"], ack: true});
                adapter.setState('extension.gpio2.inverted', {val: data["ext"]["gpio2"]["inverted"], ack: true});
                adapter.setState('extension.gpio2.status', {val: data["ext"]["gpio2"]["status"], ack: true});
                adapter.setState('extension.out1.inverted', {val: data["ext"]["out1"]["inverted"], ack: true});
                adapter.setState('extension.out1.status', {val: data["ext"]["out1"]["status"], ack: true});
                adapter.setState('extension.out2.inverted', {val: data["ext"]["out2"]["inverted"], ack: true});
                adapter.setState('extension.out2.status', {val: data["ext"]["out2"]["status"], ack: true});
            }
        } else {
            adapter.log.error(err);
        }
    });
}

function pollHours() {
    request.get({url: url + "/json?cmd=hour"}, function (err, response, body) {
        if (!err) {
            var data = JSON.parse(body);
            
            if(typeof data === 'object' && data.successful === true) {
                adapter.setState('hours.run', {val: data["general"]["run"], ack: true});
                adapter.setState('hours.mow', {val: data["general"]["mow"], ack: true});
                adapter.setState('hours.search', {val: data["general"]["search"], ack: true});
                adapter.setState('hours.charge', {val: data["general"]["charge"], ack: true});
                adapter.setState('hours.charges', {val: data["general"]["charges"], ack: true});
                adapter.setState('hours.errors', {val: data["general"]["errors"], ack: true});
                adapter.setState('hours.since', {val: data["general"]["since"], ack: true});
            }
        } else {
            adapter.log.error(err);
        }
    });
}

function pollMotor() {
    request.get({url: url + "/json?cmd=motor"}, function (err, response, body) {
        if (!err) {
            var data = JSON.parse(body);
            
            if(typeof data === 'object' && data.successful === true) {
                adapter.setState('motor.drive.left.current', {val: data["drive"]["left"]["current"], ack: true});
                adapter.setState('motor.drive.left.power', {val: data["drive"]["left"]["power"], ack: true});
                adapter.setState('motor.drive.left.speed', {val: data["drive"]["left"]["speed"], ack: true});
                
                adapter.setState('motor.drive.right.current', {val: data["drive"]["right"]["current"], ack: true});
                adapter.setState('motor.drive.right.power', {val: data["drive"]["right"]["power"], ack: true});
                adapter.setState('motor.drive.right.speed', {val: data["drive"]["right"]["speed"], ack: true});
                
                adapter.setState('motor.blade.current', {val: data["blade"]["current"], ack: true});
                adapter.setState('motor.blade.speed', {val: data["blade"]["speed"], ack: true});
                adapter.setState('motor.blade.average', {val: data["blade"]["average"], ack: true});
            }
        } else {
            adapter.log.error(err);
        }
    });
}

function pollPush() {
    request.get({url: url + "/json?cmd=push"}, function (err, response, body) {
        if (!err) {
            var data = JSON.parse(body);
            
            if(typeof data === 'object' && data.successful === true) {
                adapter.setState('push.server_url', {val: data["push"]["server"]["url"], ack: true});
                adapter.setState('push.interval', {val: data["push"]["trigger"]["interval"]/1000, ack: true});

                for(var i=0; i<=9; i++) {
                    adapter.setState('push.trigger.' + i + '.name', {val: data["push"]["trigger"]["trigger" + i]["name"], ack: true});
                    adapter.setState('push.trigger.' + i + '.enter', {val: data["push"]["trigger"]["trigger" + i]["enter"], ack: true});
                    adapter.setState('push.trigger.' + i + '.leave', {val: data["push"]["trigger"]["trigger" + i]["leave"], ack: true});
                }
            }
        } else {
            adapter.log.error(err);
        }
    });
}

function pollStatus() {
    request.get({url: url + "/json?cmd=status"}, function (err, response, body) {
        if (!err) {
            var data = JSON.parse(body);
            
            if(typeof data === 'object' && data.successful === true) {
                adapter.setState('name', {val: data["name"], ack: true});
                adapter.setState('id', {val: data["id"], ack: true});
                
                adapter.setState('status.status', {val: data["status"]["status"], ack: true});
                adapter.setState('status.duration', {val: data["status"]["duration"], ack: true});
                adapter.setState('status.mode', {val: data["status"]["mode"], ack: true});
                adapter.setState('status.battery', {val: data["status"]["battery"], ack: true});
                adapter.setState('status.hours', {val: data["status"]["hours"], ack: true});
                
                adapter.setState('timer.status', {val: data["timer"]["status"], ack: true});
                if(data["timer"]["next"] != undefined) {
                    adapter.setState('timer.next_date', {val: data["timer"]["next"]["date"], ack: true});
                    adapter.setState('timer.next_time', {val: data["timer"]["next"]["time"], ack: true});
                } else {
                    adapter.setState('timer.next_date', {val: '', ack: true});
                    adapter.setState('timer.next_time', {val: '', ack: true});
                }                    

                adapter.setState('wlan.signal', {val: data["wlan"]["signal"], ack: true});

                adapter.setState('health.temperature', {val: data["health"]["temperature"], ack: true});
                adapter.setState('health.humidity', {val: data["health"]["humidity"], ack: true});
                
                adapter.setState('clock.date', {val: data["clock"]["date"], ack: true});
                adapter.setState('clock.time', {val: data["clock"]["time"], ack: true});
                adapter.setState('clock.unix_timestamp', {val: data["clock"]["unix"], ack: true});                  
            }
        } else {
            adapter.log.error(err);
        }
    });
}

function pollTimer() {
    request.get({url: url + "/json?cmd=timer"}, function (err, response, body) {
        if (!err) {
            var data = JSON.parse(body);
            
            if(typeof data === 'object' && data.successful === true) {
                for(var i=0; i<=13; i++) {
                    adapter.setState('timer.' + i + '.id', {val: data["timer"][i]["id"], ack: true});
                    adapter.setState('timer.' + i + '.enabled', {val: data["timer"][i]["enabled"], ack: true});
                    adapter.setState('timer.' + i + '.start_time', {val: data["timer"][i]["start"], ack: true});
                    adapter.setState('timer.' + i + '.end_time', {val: data["timer"][i]["end"], ack: true});
                    adapter.setState('timer.' + i + '.weekdays.monday', {val: data["timer"][i]["weekdays"]["mo"], ack: true});
                    adapter.setState('timer.' + i + '.weekdays.tuesday', {val: data["timer"][i]["weekdays"]["tu"], ack: true});
                    adapter.setState('timer.' + i + '.weekdays.wednesday', {val: data["timer"][i]["weekdays"]["we"], ack: true});
                    adapter.setState('timer.' + i + '.weekdays.thursday', {val: data["timer"][i]["weekdays"]["th"], ack: true});
                    adapter.setState('timer.' + i + '.weekdays.friday', {val: data["timer"][i]["weekdays"]["fr"], ack: true});
                    adapter.setState('timer.' + i + '.weekdays.saturday', {val: data["timer"][i]["weekdays"]["sa"], ack: true});
                    adapter.setState('timer.' + i + '.weekdays.sunday', {val: data["timer"][i]["weekdays"]["su"], ack: true});
                }
            }
        } else {
            adapter.log.error(err);
        }
    });
}

function pollVersion() {
    request.get({url: url + "/json?cmd=version"}, function (err, response, body) {
        if (!err) {
            var data = JSON.parse(body);
            
            if(typeof data === 'object' && data.successful === true) {
                adapter.setState('info.hardware.production', {val: data["mower"]["hardware"]["production"], ack: true});
                adapter.setState('info.hardware.serial', {val: data["mower"]["hardware"]["serial"].toString(), ack: true});
                
                adapter.setState('info.msw.compiled', {val: data["mower"]["msw"]["compiled"], ack: true});
                adapter.setState('info.msw.title', {val: data["mower"]["msw"]["title"], ack: true});
                adapter.setState('info.msw.version', {val: data["mower"]["msw"]["version"], ack: true});
                
                adapter.setState('info.sub.version', {val: data["mower"]["sub"]["version"], ack: true});
                
                adapter.setState('info.robonect.serial', {val: data["serial"], ack: true});
                adapter.setState('info.robonect.comment', {val: data["application"]["comment"], ack: true});
                adapter.setState('info.robonect.compiled', {val: data["application"]["compiled"], ack: true});
                adapter.setState('info.robonect.version', {val: data["application"]["version"], ack: true});
                
                adapter.setState('info.bootloader.comment', {val: data["bootloader"]["comment"], ack: true});
                adapter.setState('info.bootloader.compiled', {val: data["bootloader"]["compiled"], ack: true});
                adapter.setState('info.bootloader.version', {val: data["bootloader"]["version"], ack: true});
                
                adapter.setState('info.wlan.at-version', {val: data["wlan"]["at-version"], ack: true});
                adapter.setState('info.wlan.sdk-version', {val: data["wlan"]["sdk-version"], ack: true});
            }
        } else {
            adapter.log.error(err);
        }
    });
}

function pollWlan() {
    request.get({url: url + "/json?cmd=wlan"}, function (err, response, body) {
        if (!err) {
            var data = JSON.parse(body);
            
            if(typeof data === 'object' && data.successful === true) {
                adapter.setState('wlan.ap.enable', {val: data["ap"]["enable"], ack: true});
                adapter.setState('wlan.ap.mac', {val: data["ap"]["mac"], ack: true});
                adapter.setState('wlan.ap.hidden', {val: data["ap"]["hidden"], ack: true});
                adapter.setState('wlan.ap.ssid', {val: data["ap"]["ssid"], ack: true});
                adapter.setState('wlan.ap.password', {val: data["ap"]["password"], ack: true});
                adapter.setState('wlan.ap.channel', {val: data["ap"]["channel"], ack: true});
                adapter.setState('wlan.ap.encryption', {val: data["ap"]["encryption"], ack: true});
                adapter.setState('wlan.ap.maxconn', {val: data["ap"]["maxconn"], ack: true});
                adapter.setState('wlan.ap.ip', {val: data["ap"]["ip"], ack: true});
                adapter.setState('wlan.ap.netmask', {val: data["ap"]["netmask"], ack: true});
                adapter.setState('wlan.ap.gateway', {val: data["ap"]["gateway"], ack: true});
                adapter.setState('wlan.ap.dhcp.enable', {val: data["ap"]["dhcp"]["enable"], ack: true});
                adapter.setState('wlan.ap.dhcp.start', {val: data["ap"]["dhcp"]["start"], ack: true});
                adapter.setState('wlan.ap.dhcp.end', {val: data["ap"]["dhcp"]["end"], ack: true});

                adapter.setState('wlan.station.enable', {val: data["station"]["enable"], ack: true});
                adapter.setState('wlan.station.mac', {val: data["station"]["mac"], ack: true});
                adapter.setState('wlan.station.signal', {val: data["station"]["signal"], ack: true});
                adapter.setState('wlan.station.ssid', {val: data["station"]["ssid"], ack: true});
                adapter.setState('wlan.station.password', {val: data["station"]["password"], ack: true});
                adapter.setState('wlan.station.dhcp', {val: data["station"]["dhcp"], ack: true});
                adapter.setState('wlan.station.ip', {val: data["station"]["ip"], ack: true});
                adapter.setState('wlan.station.netmask', {val: data["station"]["netmask"], ack: true});
                adapter.setState('wlan.station.gateway', {val: data["station"]["gateway"], ack: true});
            }
        } else {
            adapter.log.error(err);
        }
    });
}

function updateExtensionStatus(ext, status) {
    if(status === true) {
        status = 1;
    } else {
        status = 0;
    }

    request.get({url: url + "/json?cmd=ext&" + ext + "=" + status}, function (err, response, body) {
        if (!err) {
            var data = JSON.parse(body);
            
            if(typeof data === 'object' && data.successful === true) {
                adapter.setState('extension.gpio1.inverted', {val: data["ext"]["gpio1"]["inverted"], ack: true});
                adapter.setState('extension.gpio1.status', {val: data["ext"]["gpio1"]["status"], ack: true});
                adapter.setState('extension.gpio2.inverted', {val: data["ext"]["gpio2"]["inverted"], ack: true});
                adapter.setState('extension.gpio2.status', {val: data["ext"]["gpio2"]["status"], ack: true});
                adapter.setState('extension.out1.inverted', {val: data["ext"]["out1"]["inverted"], ack: true});
                adapter.setState('extension.out1.status', {val: data["ext"]["out1"]["status"], ack: true});
                adapter.setState('extension.out2.inverted', {val: data["ext"]["out2"]["inverted"], ack: true});
                adapter.setState('extension.out2.status', {val: data["ext"]["out2"]["status"], ack: true});
            }

            if(data["ext"][ext]["status"] == status) {
                adapter.log.info(ext + ' set to ' + status);
            } else {
                adapter.log.info(ext + ' could not be set to ' + status + '. Is the extension mode set to API?');
            }
        } else {
            adapter.log.error(err);
        }
    });
}

function pollRobonect(type) {
    ping.sys.probe(ip, function (isAlive) {
        adapter.log.info('Poll type: ' + type);

        adapter.setState("last_sync", { val: new Date().toISOString(), ack: true});    
        adapter.setState("active", { val: isAlive, ack: true });

        if(isAlive) {
            adapter.setState('info.connection', {val: true, ack: true});

            if(type === 'Initial') {
                pollBattery();
                pollErrors();
                pollExtension();
                pollHours();
                pollMotor();
                pollPush();
                pollStatus();
                pollTimer();
                pollVersion();
                pollWlan();
            } else {
                if(batteryPollType === type) pollBattery();
                if(errorsPollType === type) pollErrors();
                if(extensionPollType === type) pollExtension();
                if(hoursPollType === type) pollHours();
                if(motorPollType === type) pollMotor();
                if(pushPollType === type) pollPush();
                if(statusPollType === type) pollStatus();
                if(timerPollType === type) pollTimer();
                if(versionPollType === type) pollVersion();
                if(wlanPollType === type) pollWlan();
            }
        } else {
            adapter.setState('info.connection', {val: false, ack: true});
        }        
    });
}

function main() {
    ip = adapter.config.ip;    
    username = adapter.config.username;
    password = adapter.config.password;

    statusInterval = adapter.config.statusInterval;
    infoInterval = adapter.config.infoInterval;

    batteryPollType = adapter.config.batteryPollType;
    errorsPollType = adapter.config.errorsPollType;
    extensionPollType = adapter.config.extensionPollType;
    hoursPollType = adapter.config.hoursPollType;
    motorPollType = adapter.config.motorPollType;
    pushPollType = adapter.config.pushPollType;
    statusPollType = adapter.config.statusPollType;
    timerPollType = adapter.config.timerPollType;
    versionPollType = adapter.config.versionPollType;
    wlanPollType = adapter.config.wlanPollType;

    adapter.log.info('Config IP: ' + ip);
    adapter.log.info('Config Username: ' + username);
    adapter.log.info('Config Password: ' + password);
    adapter.log.info('Config Status Interval: ' + statusInterval);
    adapter.log.info('Config Info Interval: ' + infoInterval);

    if(ip === undefined || ip === '') {
        adapter.log.error('No IP address set. Adapter will not be executed.');
    } else {
        if(username != '' && password != '') {
            url = 'http://' + username + ':' + password + '@' + ip;
        } else {
            url = 'http://' + ip;
        }

        if (isNaN(statusInterval) || statusInterval < 1) {
            adapter.log.warn('No status interval set. Using default value (60 seconds).');
            statusInterval = 60;
        }

        if (isNaN(infoInterval) || infoInterval < 1) {
            adapter.log.warn('No info interval set. Using default value (900 seconds).');
            infoInterval = 900;
        }

        adapter.subscribeStates("extension.gpio1.status");
        adapter.subscribeStates("extension.gpio2.status");
        adapter.subscribeStates("extension.out1.status");
        adapter.subscribeStates("extension.out2.status");

        pollRobonect('Initial');

        setInterval(function() { pollRobonect('Info') }, infoInterval * 1000);
        setInterval(function() { pollRobonect('Status') }, statusInterval * 1000);
    }
}