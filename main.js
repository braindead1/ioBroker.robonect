/* jshint -W097 */// jshint strict:false
/*jslint node: true */

"use strict";

// you have to require the utils module and call adapter function
var utils = require(__dirname + '/lib/utils'); // Get common adapter utils
var ping = require('ping');
var request = require('request');
var ip, username, password, poll, url;

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
    adapter.log.info('objectChange ' + id + ' ' + JSON.stringify(obj));
});

// is called if a subscribed state changes
adapter.on('stateChange', function (id, state) {
    // Warning, state can be null if it was deleted
    //adapter.log.info('stateChange ' + id + ' ' + JSON.stringify(state));

    if (state && !state.ack) {
        if (id === adapter.namespace + ".extension.gpio1.status") {
            setExtensionStatus('gpio1', state.val);
        } else if (id === adapter.namespace + ".extension.gpio2.status") {
            setExtensionStatus('gpio2', state.val);
        } else if (id === adapter.namespace + ".extension.out1.status") {
            setExtensionStatus('out1', state.val);
        } else if (id === adapter.namespace + ".extension.out2.status") {
            setExtensionStatus('out2', state.val);
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

function setExtensionStatus(ext, status) {
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

function checkStatus() {
    ping.sys.probe(ip, function (isAlive) {
        adapter.setState("last_sync", { val: new Date().toISOString(), ack: true});    
        adapter.setState("active", { val: isAlive, ack: true });

        if (isAlive) {
            // Get status
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

            // Get hour
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

            // Get ext
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

            // Get version
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

            // Get motor
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
    });
}

function main() {
    ip = adapter.config.ip;    
    username = adapter.config.username;
    password = adapter.config.password;
    poll = adapter.config.poll;

    adapter.log.info('Config IP: ' + ip);
    adapter.log.info('Config Username: ' + username);
    adapter.log.info('Config Password: ' + password);
    adapter.log.info('Config Poll: ' + poll);

    if(username != '' && password != '') {
        url = 'http://' + username + ':' + password + '@' + ip;
    } else {
        url = 'http://' + ip;
    }

    if (isNaN(poll) || poll < 1) {
        poll = 10;
    }

    adapter.subscribeStates("extension.gpio1.status");
    adapter.subscribeStates("extension.gpio2.status");
    adapter.subscribeStates("extension.out1.status");
    adapter.subscribeStates("extension.out2.status");

    checkStatus();

    setInterval(checkStatus, poll * 1000);
}