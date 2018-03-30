const ping = require('ping');
const request = require('request');

function Robonect(adapter) {
    this.adapter = adapter;

    this.ip = adapter.config.ip;    
    this.username = adapter.config.username;
    this.password = adapter.config.password;

    this.statusInterval = adapter.config.statusInterval;
    this.infoInterval = adapter.config.infoInterval;

    this.batteryPollType = adapter.config.batteryPollType;
    this.errorsPollType = adapter.config.errorsPollType;
    this.extensionPollType = adapter.config.extensionPollType;
    this.hoursPollType = adapter.config.hoursPollType;
    this.motorPollType = adapter.config.motorPollType;
    this.pushPollType = adapter.config.pushPollType;
    this.timerPollType = adapter.config.timerPollType;
    this.versionPollType = adapter.config.versionPollType;
    this.wlanPollType = adapter.config.wlanPollType;

    if(this.username != '' && this.password != '') {
        this.url = 'http://' + this.username + ':' + this.password + '@' + this.ip;
    } else {
        this.url = 'http://' + this.ip;
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
};

/** Initialize the adapter after start */
Robonect.prototype.initialize = function() {
    var self = this;

    self.adapter.setObjectNotExists("info", {
        type: "channel",
        common: {
            name: "Information"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("info.connection", {
        type: "state",
        common: {
            role: "indicator.connected",
            name: "Connected to lawn mower",
            type: "boolean",
            read: true,
            write: false,
            def: false
        },
        native: {}
    });
    self.adapter.setObjectNotExists("active", {
        type: "state",
        common: {
            name: "Mower active",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("id", {
        type: "state",
        common: {
            name: "ID",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("last_sync", {
        type: "state",
        common: {
            name: "Last synchronization",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("name", {
        type: "state",
        common: {
            name: "Mower name",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("battery.id", {
        type: "state",
        common: {
            name: "ID",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("battery.charge", {
        type: "state",
        common: {
            name: "Ladung",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            unit: "%"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("battery.voltage", {
        type: "state",
        common: {
            name: "Spannung",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            unit: "V"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("battery.current", {
        type: "state",
        common: {
            name: "Ladestrom",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            unit: "mA"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("battery.temperature", {
        type: "state",
        common: {
            name: "Temperatur",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            unit: "°C"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("battery.capacity.full",{
        type: "state",
        common: {
            name: "Gesamtkapazität",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            unit: "mAh"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("battery.capacity.remaining",{
        type: "state",
        common: {
            name: "Restkapazität",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            unit: "mAh"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("clock.date",{
        type: "state",
        common: {
            name: "Date",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("clock.time",{
        type: "state",
        common: {
            name: "Time",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("clock.unix_timestamp",{
        type: "state",
        common: {
            name: "Unix timestamp",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("error.0.code",{
        type: "state",
        common: {
            name: "Error code",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("error.0.message",{
        type: "state",
        common: {
            name: "Error message",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("error.0.date",{
        type: "state",
        common: {
            name: "Date",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("error.0.time",{
        type: "state",
        common: {
            name: "Time",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("error.0.unix_timestamp",{
        type: "state",
        common: {
            name: "Unix timestamp",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("error.1.code",{
        type: "state",
        common: {
            name: "Error code",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("error.1.message",{
        type: "state",
        common: {
            name: "Error message",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("error.1.date",{
        type: "state",
        common: {
            name: "Date",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("error.1.time",{
        type: "state",
        common: {
            name: "Time",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("error.1.unix_timestamp",{
        type: "state",
        common: {
            name: "Unix timestamp",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("error.2.code",{
        type: "state",
        common: {
            name: "Error code",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("error.2.message",{
        type: "state",
        common: {
            name: "Error message",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("error.2.date",{
        type: "state",
        common: {
            name: "Date",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("error.2.time",{
        type: "state",
        common: {
            name: "Time",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("error.2.unix_timestamp",{
        type: "state",
        common: {
            name: "Unix timestamp",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("error.3.code",{
        type: "state",
        common: {
            name: "Error code",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("error.3.message",{
        type: "state",
        common: {
            name: "Error message",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("error.3.date",{
        type: "state",
        common: {
            name: "Date",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("error.3.time",{
        type: "state",
        common: {
            name: "Time",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("error.3.unix_timestamp",{
        type: "state",
        common: {
            name: "Unix timestamp",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("error.4.code",{
        type: "state",
        common: {
            name: "Error code",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("error.4.message",{
        type: "state",
        common: {
            name: "Error message",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("error.4.date",{
        type: "state",
        common: {
            name: "Date",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("error.4.time",{
        type: "state",
        common: {
            name: "Time",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("error.4.unix_timestamp",{
        type: "state",
        common: {
            name: "Unix timestamp",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("extension.gpio1.inverted",{
        type: "state",
        common: {
            name: "Inverted",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("extension.gpio1.status",{
        type: "state",
        common: {
            name: "Status",
            type: "boolean",
            role: "",
            read: true,
            write: true,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("extension.gpio2.inverted",{
        type: "state",
        common: {
            name: "Inverted",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("extension.gpio2.status",{
        type: "state",
        common: {
            name: "Status",
            type: "boolean",
            role: "",
            read: true,
            write: true,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("extension.out1.inverted",{
        type: "state",
        common: {
            name: "Inverted",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("extension.out1.status",{
        type: "state",
        common: {
            name: "Status",
            type: "boolean",
            role: "",
            read: true,
            write: true,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("extension.out2.inverted",{
        type: "state",
        common: {
            name: "Inverted",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("extension.out2.status",{
        type: "state",
        common: {
            name: "Status",
            type: "boolean",
            role: "",
            read: true,
            write: true,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("hours.run",{
        type: "state",
        common: {
            name: "Run",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            unit: "hours"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("hours.mow",{
        type: "state",
        common: {
            name: "Mow",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            unit: "hours"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("hours.search",{
        type: "state",
        common: {
            name: "Search",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            unit: "hours"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("hours.charge",{
        type: "state",
        common: {
            name: "Charge",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            unit: "hours"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("hours.charges",{
        type: "state",
        common: {
            name: "Number of charges",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("hours.errors",{
        type: "state",
        common: {
            name: "Number of errors",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("hours.since",{
        type: "state",
        common: {
            name: "Since",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("info.bootloader.comment",{
        type: "state",
        common: {
            name: "Comment",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("info.bootloader.compiled",{
        type: "state",
        common: {
            name: "Compilation date",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("info.bootloader.version", {
        type: "state",
        common: {
            name: "Version",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("info.hardware.production", {
        type: "state",
        common: {
            name: "Production date",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("info.hardware.serial", {
        type: "state",
        common: {
            name: "Serial no.",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("info.msw.compiled", {
        type: "state",
        common: {
            name: "Compilation date",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("info.msw.title", {
        type: "state",
        common: {
            name: "Title",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("info.msw.version", {
        type: "state",
        common: {
            name: "Version",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("info.robonect.comment", {
        type: "state",
        common: {
            name: "Comment",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("info.robonect.compiled", {
        type: "state",
        common: {
            name: "Compilation date",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("info.robonect.serial", {
        type: "state",
        common: {
            name: "Serial no.",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("info.robonect.version", {
        type: "state",
        common: {
            name: "Version",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("info.sub.version", {
        type: "state",
        common: {
            name: "Version",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("info.wlan.at-version", {
        type: "state",
        common: {
            name: "AT-Version",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("info.wlan.sdk-version", {
        type: "state",
        common: {
            name: "SDK-Version",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("status.status", {
        type: "state",
        common: {
            name: "Current status",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            states: {
                0: "Unbekannt",
                1: "Parken",
                2: "Mähen",
                3: "Suchen der Ladestation",
                4: "Laden",
                5: "Umsetzen",
                7: "Fehler",
                8: "Schleifensignal verloren",
                16: "Abgeschaltet",
                17: "Schlafen"
            }
        },
        native: {}
    });
    self.adapter.setObjectNotExists("status.battery", {
        type: "state",
        common: {
            name: "Battery",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            unit: "%"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("status.duration", {
        type: "state",
        common: {
            name: "Status duration",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            unit: "seconds"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("status.mode", {
        type: "state",
        common: {
            name: "Current mode",
            type: "number",
            role: "",
            read: true,
            wite: true,
            desc: "",
            states: {
                0: "Auto",
                1: "Manuell",
                2: "Home",
                //3: "Demo",
                98: "End of day", // only for ioBroker
                99: "Job" // only for ioBroker
            }
        },
        native: {}
    });
    self.adapter.setObjectNotExists("status.hours", {
        type: "state",
        common: {
            name: "Operating hours",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            unit: "hours"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("health.humidity", {
        type: "state",
        common: {
            name: "Humidity",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            unit: "%"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("motor.blade.average", {
        type: "state",
        common: {
            name: "Average",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            unit: "RPM"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("motor.blade.current", {
        type: "state",
        common: {
            name: "Current",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            unit: "mA"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("motor.blade.speed", {
        type: "state",
        common: {
            name: "Speed",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            unit: "RPM"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("motor.drive.left.current", {
        type: "state",
        common: {
            name: "Current",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            unit: "mA"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("motor.drive.left.power", {
        type: "state",
        common: {
            name: "Power",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            unit: "%"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("motor.drive.left.speed", {
        type: "state",
        common: {
            name: "Speed",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            unit: "cm/s"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("motor.drive.right.current", {
        type: "state",
        common: {
            name: "Current",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            unit: "mA"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("motor.drive.right.power", {
        type: "state",
        common: {
            name: "Power",
            type: "number",
            role: "",
            read: true,
            wite: false,
            desc: "",
            unit: "%"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("motor.drive.right.speed", {
        type: "state",
        common: {
            name: "Speed",
            type: "number",
            role: "",
            read: true,
            wite: false,
            desc: "",
            unit: "cm/s"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("health.temperature", {
        type: "state",
        common: {
            name: "Temperature",
            type: "number",
            role: "",
            read: true,
            wite: false,
            desc: "",
            unit: "°C"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.next_date", {
        type: "state",
        common: {
            name: "Next timer date",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.next_time", {
        type: "state",
        common: {
            name: "Next timer time",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.status", {
        type: "state",
        common: {
            name: "Timer status",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            states: {
                0: "Deaktiviert",
                1: "Aktiv",
                2: "Standby"
            }
        },
        native: {}
    });
    self.adapter.setObjectNotExists("wlan.signal", {
        type: "state",
        common: {
            name: "Signal strenght",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            unit: "dB"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("wlan.ap.enable", {
        type: "state",
        common: {
            name: "AP aktiviert",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("wlan.ap.mac", {
        type: "state",
        common: {
            name: "MAC Adresse",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("wlan.ap.hidden", {
        type: "state",
        common: {
            name: "SSID verstecken",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("wlan.ap.ssid", {
        type: "state",
        common: {
            name: "SSID",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("wlan.ap.password", {
        type: "state",
        common: {
            name: "Passwort",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("wlan.ap.channel", {
        type: "state",
        common: {
            name: "Kanal",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("wlan.ap.encryption", {
        type: "state",
        common: {
            name: "Verschlüsselung",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("wlan.ap.maxconn", {
        type: "state",
        common: {
            name: "Max. Verbindungen",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("wlan.ap.ip", {
        type: "state",
        common: {
            name: "IP Adresse",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("wlan.ap.netmask", {
        type: "state",
        common: {
            name: "Netzwerkmaske",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("wlan.ap.gateway", {
        type: "state",
        common: {
            name: "Gateway",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("wlan.ap.dhcp.enable", {
        type: "state",
        common: {
            name: "DHCP aktiviert",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("wlan.ap.dhcp.start", {
        type: "state",
        common: {
            name: "DHCP Start",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("wlan.ap.dhcp.end", {
        type: "state",
        common: {
            name: "DHCP Ende",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("wlan.station.enable", {
        type: "state",
        common: {
            name: "Heimzetz aktiviert",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("wlan.station.mac", {
        type: "state",
        common: {
            name: "MAC Adresse",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("wlan.station.signal", {
        type: "state",
        common: {
            name: "Signalstärke",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            unit: "dB"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("wlan.station.ssid", {
        type: "state",
        common: {
            name: "SSID",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("wlan.station.password", {
        type: "state",
        common: {
            name: "Passwort",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("wlan.station.dhcp", {
        type: "state",
        common: {
            name: "DHCP aktiviert",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("wlan.station.ip", {
        type: "state",
        common: {
            name: "IP Adresse",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("wlan.station.netmask", {
        type: "state",
        common: {
            name: "Netzwerkmaske",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("wlan.station.gateway", {
        type: "state",
        common: {
            name: "Gateway",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.0.id", {
        type: "state",
        common: {
            name: "ID",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.0.enabled", {
        type: "state",
        common: {
            name: "Timer aktiviert",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.0.start_time", {
        type: "state",
        common: {
            name: "Startzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.0.end_time", {
        type: "state",
        common: {
            name: "Endzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.0.weekdays.monday", {
        type: "state",
        common: {
            name: "Montag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.0.weekdays.tuesday", {
        type: "state",
        common: {
            name: "Dienstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.0.weekdays.wednesday", {
        type: "state",
        common: {
            name: "Mittwoch",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.0.weekdays.thursday", {
        type: "state",
        common: {
            name: "Donnerstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.0.weekdays.friday", {
        type: "state",
        common: {
            name: "Freitag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.0.weekdays.saturday", {
        type: "state",
        common: {
            name: "Samstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.0.weekdays.sunday", {
        type: "state",
        common: {
            name: "Sonntag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.1.id", {
        type: "state",
        common: {
            name: "ID",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.1.enabled", {
        type: "state",
        common: {
            name: "Timer aktiviert",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.1.start_time", {
        type: "state",
        common: {
            name: "Startzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.1.end_time", {
        type: "state",
        common: {
            name: "Endzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.1.weekdays.monday", {
        type: "state",
        common: {
            name: "Montag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.1.weekdays.tuesday", {
        type: "state",
        common: {
            name: "Dienstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.1.weekdays.wednesday", {
        type: "state",
        common: {
            name: "Mittwoch",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.1.weekdays.thursday", {
        type: "state",
        common: {
            name: "Donnerstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.1.weekdays.friday", {
        type: "state",
        common: {
            name: "Freitag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.1.weekdays.saturday", {
        type: "state",
        common: {
            name: "Samstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.1.weekdays.sunday", {
        type: "state",
        common: {
            name: "Sonntag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.2.id", {
        type: "state",
        common: {
            name: "ID",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.2.enabled", {
        type: "state",
        common: {
            name: "Timer aktiviert",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.2.start_time", {
        type: "state",
        common: {
            name: "Startzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.2.end_time", {
        type: "state",
        common: {
            name: "Endzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.2.weekdays.monday", {
        type: "state",
        common: {
            name: "Montag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.2.weekdays.tuesday", {
        type: "state",
        common: {
            name: "Dienstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.2.weekdays.wednesday", {
        type: "state",
        common: {
            name: "Mittwoch",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.2.weekdays.thursday", {
        type: "state",
        common: {
            name: "Donnerstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.2.weekdays.friday", {
        type: "state",
        common: {
            name: "Freitag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.2.weekdays.saturday", {
        type: "state",
        common: {
            name: "Samstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.2.weekdays.sunday", {
        type: "state",
        common: {
            name: "Sonntag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.3.id", {
        type: "state",
        common: {
            name: "ID",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.3.enabled", {
        type: "state",
        common: {
            name: "Timer aktiviert",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.3.start_time", {
        type: "state",
        common: {
            name: "Startzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.3.end_time", {
        type: "state",
        common: {
            name: "Endzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.3.weekdays.monday", {
        type: "state",
        common: {
            name: "Montag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.3.weekdays.tuesday", {
        type: "state",
        common: {
            name: "Dienstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.3.weekdays.wednesday", {
        type: "state",
        common: {
            name: "Mittwoch",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.3.weekdays.thursday", {
        type: "state",
        common: {
            name: "Donnerstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.3.weekdays.friday", {
        type: "state",
        common: {
            name: "Freitag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.3.weekdays.saturday", {
        type: "state",
        common: {
            name: "Samstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.3.weekdays.sunday", {
        type: "state",
        common: {
            name: "Sonntag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.4.id", {
        type: "state",
        common: {
            name: "ID",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.4.enabled", {
        type: "state",
        common: {
            name: "Timer aktiviert",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.4.start_time", {
        type: "state",
        common: {
            name: "Startzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.4.end_time", {
        type: "state",
        common: {
            name: "Endzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.4.weekdays.monday", {
        type: "state",
        common: {
            name: "Montag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.4.weekdays.tuesday", {
        type: "state",
        common: {
            name: "Dienstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.4.weekdays.wednesday", {
        type: "state",
        common: {
            name: "Mittwoch",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.4.weekdays.thursday", {
        type: "state",
        common: {
            name: "Donnerstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.4.weekdays.friday", {
        type: "state",
        common: {
            name: "Freitag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.4.weekdays.saturday", {
        type: "state",
        common: {
            name: "Samstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.4.weekdays.sunday", {
        type: "state",
        common: {
            name: "Sonntag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.5.id", {
        type: "state",
        common: {
            name: "ID",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.5.enabled", {
        type: "state",
        common: {
            name: "Timer aktiviert",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.5.start_time", {
        type: "state",
        common: {
            name: "Startzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.5.end_time", {
        type: "state",
        common: {
            name: "Endzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.5.weekdays.monday", {
        type: "state",
        common: {
            name: "Montag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.5.weekdays.tuesday", {
        type: "state",
        common: {
            name: "Dienstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.5.weekdays.wednesday", {
        type: "state",
        common: {
            name: "Mittwoch",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.5.weekdays.thursday", {
        type: "state",
        common: {
            name: "Donnerstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.5.weekdays.friday", {
        type: "state",
        common: {
            name: "Freitag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.5.weekdays.saturday", {
        type: "state",
        common: {
            name: "Samstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.5.weekdays.sunday", {
        type: "state",
        common: {
            name: "Sonntag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.6.id", {
        type: "state",
        common: {
            name: "ID",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.6.enabled", {
        type: "state",
        common: {
            name: "Timer aktiviert",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.6.start_time", {
        type: "state",
        common: {
            name: "Startzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.6.end_time", {
        type: "state",
        common: {
            name: "Endzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.6.weekdays.monday", {
        type: "state",
        common: {
            name: "Montag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.6.weekdays.tuesday", {
        type: "state",
        common: {
            name: "Dienstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.6.weekdays.wednesday", {
        type: "state",
        common: {
            name: "Mittwoch",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.6.weekdays.thursday", {
        type: "state",
        common: {
            name: "Donnerstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.6.weekdays.friday", {
        type: "state",
        common: {
            name: "Freitag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.6.weekdays.saturday", {
        type: "state",
        common: {
            name: "Samstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.6.weekdays.sunday", {
        type: "state",
        common: {
            name: "Sonntag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.7.id", {
        type: "state",
        common: {
            name: "ID",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.7.enabled", {
        type: "state",
        common: {
            name: "Timer aktiviert",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.7.start_time", {
        type: "state",
        common: {
            name: "Startzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.7.end_time", {
        type: "state",
        common: {
            name: "Endzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.7.weekdays.monday", {
        type: "state",
        common: {
            name: "Montag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.7.weekdays.tuesday", {
        type: "state",
        common: {
            name: "Dienstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.7.weekdays.wednesday", {
        type: "state",
        common: {
            name: "Mittwoch",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.7.weekdays.thursday", {
        type: "state",
        common: {
            name: "Donnerstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.7.weekdays.friday", {
        type: "state",
        common: {
            name: "Freitag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.7.weekdays.saturday", {
        type: "state",
        common: {
            name: "Samstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.7.weekdays.sunday", {
        type: "state",
        common: {
            name: "Sonntag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.8.id", {
        type: "state",
        common: {
            name: "ID",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.8.enabled", {
        type: "state",
        common: {
            name: "Timer aktiviert",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.8.start_time", {
        type: "state",
        common: {
            name: "Startzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.8.end_time", {
        type: "state",
        common: {
            name: "Endzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.8.weekdays.monday", {
        type: "state",
        common: {
            name: "Montag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.8.weekdays.tuesday", {
        type: "state",
        common: {
            name: "Dienstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.8.weekdays.wednesday", {
        type: "state",
        common: {
            name: "Mittwoch",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.8.weekdays.thursday", {
        type: "state",
        common: {
            name: "Donnerstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.8.weekdays.friday", {
        type: "state",
        common: {
            name: "Freitag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.8.weekdays.saturday", {
        type: "state",
        common: {
            name: "Samstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.8.weekdays.sunday", {
        type: "state",
        common: {
            name: "Sonntag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.9.id", {
        type: "state",
        common: {
            name: "ID",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.9.enabled", {
        type: "state",
        common: {
            name: "Timer aktiviert",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.9.start_time", {
        type: "state",
        common: {
            name: "Startzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.9.end_time", {
        type: "state",
        common: {
            name: "Endzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.9.weekdays.monday", {
        type: "state",
        common: {
            name: "Montag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.9.weekdays.tuesday", {
        type: "state",
        common: {
            name: "Dienstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.9.weekdays.wednesday", {
        type: "state",
        common: {
            name: "Mittwoch",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.9.weekdays.thursday", {
        type: "state",
        common: {
            name: "Donnerstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.9.weekdays.friday", {
        type: "state",
        common: {
            name: "Freitag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.9.weekdays.saturday", {
        type: "state",
        common: {
            name: "Samstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.9.weekdays.sunday", {
        type: "state",
        common: {
            name: "Sonntag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.10.id", {
        type: "state",
        common: {
            name: "ID",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.10.enabled", {
        type: "state",
        common: {
            name: "Timer aktiviert",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.10.start_time", {
        type: "state",
        common: {
            name: "Startzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.10.end_time", {
        type: "state",
        common: {
            name: "Endzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.10.weekdays.monday", {
        type: "state",
        common: {
            name: "Montag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.10.weekdays.tuesday", {
        type: "state",
        common: {
            name: "Dienstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.10.weekdays.wednesday", {
        type: "state",
        common: {
            name: "Mittwoch",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.10.weekdays.thursday", {
        type: "state",
        common: {
            name: "Donnerstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.10.weekdays.friday", {
        type: "state",
        common: {
            name: "Freitag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.10.weekdays.saturday", {
        type: "state",
        common: {
            name: "Samstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.10.weekdays.sunday", {
        type: "state",
        common: {
            name: "Sonntag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.11.id", {
        type: "state",
        common: {
            name: "ID",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.11.enabled", {
        type: "state",
        common: {
            name: "Timer aktiviert",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.11.start_time", {
        type: "state",
        common: {
            name: "Startzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.11.end_time", {
        type: "state",
        common: {
            name: "Endzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.11.weekdays.monday", {
        type: "state",
        common: {
            name: "Montag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.11.weekdays.tuesday", {
        type: "state",
        common: {
            name: "Dienstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.11.weekdays.wednesday", {
        type: "state",
        common: {
            name: "Mittwoch",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.11.weekdays.thursday", {
        type: "state",
        common: {
            name: "Donnerstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.11.weekdays.friday", {
        type: "state",
        common: {
            name: "Freitag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.11.weekdays.saturday", {
        type: "state",
        common: {
            name: "Samstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.11.weekdays.sunday", {
        type: "state",
        common: {
            name: "Sonntag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.12.id", {
        type: "state",
        common: {
            name: "ID",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.12.enabled", {
        type: "state",
        common: {
            name: "Timer aktiviert",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.12.start_time", {
        type: "state",
        common: {
            name: "Startzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.12.end_time", {
        type: "state",
        common: {
            name: "Endzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.12.weekdays.monday", {
        type: "state",
        common: {
            name: "Montag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.12.weekdays.tuesday", {
        type: "state",
        common: {
            name: "Dienstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.12.weekdays.wednesday", {
        type: "state",
        common: {
            name: "Mittwoch",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.12.weekdays.thursday", {
        type: "state",
        common: {
            name: "Donnerstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.12.weekdays.friday", {
        type: "state",
        common: {
            name: "Freitag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.12.weekdays.saturday", {
        type: "state",
        common: {
            name: "Samstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.12.weekdays.sunday", {
        type: "state",
        common: {
            name: "Sonntag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.13.id", {
        type: "state",
        common: {
            name: "ID",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.13.enabled", {
        type: "state",
        common: {
            name: "Timer aktiviert",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.13.start_time", {
        type: "state",
        common: {
            name: "Startzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.13.end_time", {
        type: "state",
        common: {
            name: "Endzeit",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.13.weekdays.monday", {
        type: "state",
        common: {
            name: "Montag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.13.weekdays.tuesday", {
        type: "state",
        common: {
            name: "Dienstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.13.weekdays.wednesday", {
        type: "state",
        common: {
            name: "Mittwoch",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.13.weekdays.thursday", {
        type: "state",
        common: {
            name: "Donnerstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.13.weekdays.friday", {
        type: "state",
        common: {
            name: "Freitag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.13.weekdays.saturday", {
        type: "state",
        common: {
            name: "Samstag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("timer.13.weekdays.sunday", {
        type: "state",
        common: {
            name: "Sonntag",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.server_url", {
        type: "state",
        common: {
            name: "Server URL",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.interval", {
        type: "state",
        common: {
            name: "Interval",
            type: "number",
            role: "",
            read: true,
            write: false,
            desc: "",
            unit: "Sekunden"
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.0.name", {
        type: "state",
        common: {
            name: "Name",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.0.enter", {
        type: "state",
        common: {
            name: "Bein Betreten auslösen",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.0.leave", {
        type: "state",
        common: {
            name: "Bein Verlassen auslösen",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.1.name", {
        type: "state",
        common: {
            name: "Name",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.1.enter", {
        type: "state",
        common: {
            name: "Bein Betreten auslösen",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.1.leave", {
        type: "state",
        common: {
            name: "Bein Verlassen auslösen",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.2.name", {
        type: "state",
        common: {
            name: "Name",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.2.enter", {
        type: "state",
        common: {
            name: "Bein Betreten auslösen",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.2.leave", {
        type: "state",
        common: {
            name: "Bein Verlassen auslösen",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.3.name", {
        type: "state",
        common: {
            name: "Name",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.3.enter", {
        type: "state",
        common: {
            name: "Bein Betreten auslösen",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.3.leave", {
        type: "state",
        common: {
            name: "Bein Verlassen auslösen",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.4.name", {
        type: "state",
        common: {
            name: "Name",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.4.enter", {
        type: "state",
        common: {
            name: "Bein Betreten auslösen",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.4.leave", {
        type: "state",
        common: {
            name: "Bein Verlassen auslösen",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.5.name", {
        type: "state",
        common: {
            name: "Name",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.5.enter", {
        type: "state",
        common: {
            name: "Bein Betreten auslösen",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.5.leave", {
        type: "state",
        common: {
            name: "Bein Verlassen auslösen",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.6.name", {
        type: "state",
        common: {
            name: "Name",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.6.enter", {
        type: "state",
        common: {
            name: "Bein Betreten auslösen",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.6.leave", {
        type: "state",
        common: {
            name: "Bein Verlassen auslösen",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.7.name", {
        type: "state",
        common: {
            name: "Name",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.7.enter", {
        type: "state",
        common: {
            name: "Bein Betreten auslösen",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.7.leave", {
        type: "state",
        common: {
            name: "Bein Verlassen auslösen",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.8.name", {
        type: "state",
        common: {
            name: "Name",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.8.enter", {
        type: "state",
        common: {
            name: "Bein Betreten auslösen",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.8.leave", {
        type: "state",
        common: {
            name: "Bein Verlassen auslösen",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.9.name", {
        type: "state",
        common: {
            name: "Name",
            type: "string",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.9.enter", {
        type: "state",
        common: {
            name: "Bein Betreten auslösen",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
    self.adapter.setObjectNotExists("push.trigger.9.leave", {
        type: "state",
        common: {
            name: "Bein Verlassen auslösen",
            type: "boolean",
            role: "",
            read: true,
            write: false,
            desc: ""
        },
        native: {}
    });
};

/** Poll */
Robonect.prototype.poll = function(type) {
    var self = this;

    ping.sys.probe(self.ip, function (isAlive) {
        self.adapter.setState("last_sync", { val: new Date().toISOString(), ack: true});    
        self.adapter.setState("active", { val: isAlive, ack: true });
        self.adapter.setState('info.connection', {val: isAlive, ack: true});

        if(isAlive) {
            self.adapter.log.info('Start polling (' + type + ')');

            if(type === 'Initial') {
                self.pollStatus();
                self.pollBattery();
                self.pollErrors();
                self.pollExtension();
                self.pollHours();
                self.pollMotor();
                self.pollPush();
                self.pollTimer();
                self.pollVersion();
                self.pollWlan();
            } else {
                self.pollStatus();

                if(self.currentStatus != null && self.currentStatus != 17 /*schlafen*/) {
                    if(self.batteryPollType === type) self.pollBattery();
                    if(self.errorsPollType === type) self.pollErrors();
                    if(self.extensionPollType === type) self.pollExtension();
                    if(self.hoursPollType === type) self.pollHours();
                    if(self.motorPollType === type) self.pollMotor();
                    if(self.pushPollType === type) self.pollPush();
                    if(self.timerPollType === type) self.pollTimer();
                    if(self.versionPollType === type) self.pollVersion();
                    if(self.wlanPollType === type) self.pollWlan();
                }
            }

            self.adapter.log.info('Polling done (' + type + ')');
        } else {
            self.adapter.log.error('No connection to lawn mower. Check network connection.')
        }
    });
}

/** Poll battery */
Robonect.prototype.pollBattery = function() {
    var self = this;

    request.get({url: self.url + "/json?cmd=battery"}, function (err, response, body) {
        if (!err) {
            var data = JSON.parse(body);
            
            if(typeof data === 'object' && data.successful === true) {
                self.adapter.setState('battery.id', {val: data["battery"]["id"], ack: true});
                self.adapter.setState('battery.charge', {val: data["battery"]["charge"], ack: true});
                self.adapter.setState('battery.voltage', {val: data["battery"]["voltage"]/1000, ack: true});
                self.adapter.setState('battery.current', {val: data["battery"]["current"], ack: true});
                self.adapter.setState('battery.temperature', {val: data["battery"]["temperature"]/10, ack: true});
                self.adapter.setState('battery.capacity.full', {val: data["battery"]["capacity"]["full"], ack: true});
                self.adapter.setState('battery.capacity.remaining', {val: data["battery"]["capacity"]["remaining"], ack: true});
            }
        } else {
            self.adapter.log.error(err);
        }
    });
};

/** Poll errors */
Robonect.prototype.pollErrors = function() {
    var self = this;

    request.get({url: self.url + "/json?cmd=error"}, function (err, response, body) {
        if (!err) {
            var data = JSON.parse(body);
            
            if(typeof data === 'object' && data.successful === true) {
                for(var i=0; i<=4; i++) {
                    if(typeof data["errors"][i] === 'object') {
                        self.adapter.setState('error.' + i + '.code', {val: data["errors"][i]["error_code"], ack: true});
                        self.adapter.setState('error.' + i + '.message', {val: data["errors"][i]["error_message"], ack: true});
                        self.adapter.setState('error.' + i + '.date', {val: data["errors"][i]["date"], ack: true});
                        self.adapter.setState('error.' + i + '.time', {val: data["errors"][i]["time"], ack: true});
                        self.adapter.setState('error.' + i + '.unix_timestamp', {val: data["errors"][i]["unix"], ack: true});
                    } else {
                        self.adapter.setState('error.' + i + '.code', {val: "", ack: true});
                        self.adapter.setState('error.' + i + '.message', {val: "", ack: true});
                        self.adapter.setState('error.' + i + '.date', {val: "", ack: true});
                        self.adapter.setState('error.' + i + '.time', {val: "", ack: true});
                        self.adapter.setState('error.' + i + '.unix_timestamp', {val: "", ack: true});
                    }
                }
            }
        } else {
            self.adapter.log.error(err);
        }
    });
};

/** Poll extension */
Robonect.prototype.pollExtension = function() {
    var self = this;

    request.get({url: self.url + "/json?cmd=ext"}, function (err, response, body) {
        if (!err) {
            var data = JSON.parse(body);
            
            if(typeof data === 'object' && data.successful === true) {
                self.adapter.setState('extension.gpio1.inverted', {val: data["ext"]["gpio1"]["inverted"], ack: true});
                self.adapter.setState('extension.gpio1.status', {val: data["ext"]["gpio1"]["status"], ack: true});
                self.adapter.setState('extension.gpio2.inverted', {val: data["ext"]["gpio2"]["inverted"], ack: true});
                self.adapter.setState('extension.gpio2.status', {val: data["ext"]["gpio2"]["status"], ack: true});
                self.adapter.setState('extension.out1.inverted', {val: data["ext"]["out1"]["inverted"], ack: true});
                self.adapter.setState('extension.out1.status', {val: data["ext"]["out1"]["status"], ack: true});
                self.adapter.setState('extension.out2.inverted', {val: data["ext"]["out2"]["inverted"], ack: true});
                self.adapter.setState('extension.out2.status', {val: data["ext"]["out2"]["status"], ack: true});
            }
        } else {
            self.adapter.log.error(err);
        }
    });
};

/** Poll hours */
Robonect.prototype.pollHours = function() {
    var self = this;

    request.get({url: self.url + "/json?cmd=hour"}, function (err, response, body) {
        if (!err) {
            var data = JSON.parse(body);
            
            if(typeof data === 'object' && data.successful === true) {
                self.adapter.setState('hours.run', {val: data["general"]["run"], ack: true});
                self.adapter.setState('hours.mow', {val: data["general"]["mow"], ack: true});
                self.adapter.setState('hours.search', {val: data["general"]["search"], ack: true});
                self.adapter.setState('hours.charge', {val: data["general"]["charge"], ack: true});
                self.adapter.setState('hours.charges', {val: data["general"]["charges"], ack: true});
                self.adapter.setState('hours.errors', {val: data["general"]["errors"], ack: true});
                self.adapter.setState('hours.since', {val: data["general"]["since"], ack: true});
            }
        } else {
            self.adapter.log.error(err);
        }
    });
};

/** Poll motor */
Robonect.prototype.pollMotor = function() {
    var self = this;

    request.get({url: self.url + "/json?cmd=motor"}, function (err, response, body) {
        if (!err) {
            var data = JSON.parse(body);
            
            if(typeof data === 'object' && data.successful === true) {
                self.adapter.setState('motor.drive.left.current', {val: data["drive"]["left"]["current"], ack: true});
                self.adapter.setState('motor.drive.left.power', {val: data["drive"]["left"]["power"], ack: true});
                self.adapter.setState('motor.drive.left.speed', {val: data["drive"]["left"]["speed"], ack: true});
                
                self.adapter.setState('motor.drive.right.current', {val: data["drive"]["right"]["current"], ack: true});
                self.adapter.setState('motor.drive.right.power', {val: data["drive"]["right"]["power"], ack: true});
                self.adapter.setState('motor.drive.right.speed', {val: data["drive"]["right"]["speed"], ack: true});
                
                self.adapter.setState('motor.blade.current', {val: data["blade"]["current"], ack: true});
                self.adapter.setState('motor.blade.speed', {val: data["blade"]["speed"], ack: true});
                self.adapter.setState('motor.blade.average', {val: data["blade"]["average"], ack: true});
            }
        } else {
            self.adapter.log.error(err);
        }
    });
};

/** Poll push */
Robonect.prototype.pollPush = function() {
    var self = this;

    request.get({url: self.url + "/json?cmd=push"}, function (err, response, body) {
        if (!err) {
            var data = JSON.parse(body);
            
            if(typeof data === 'object' && data.successful === true) {
                self.adapter.setState('push.server_url', {val: data["push"]["server"]["url"], ack: true});
                self.adapter.setState('push.interval', {val: data["push"]["trigger"]["interval"]/1000, ack: true});

                for(var i=0; i<=9; i++) {
                    self.adapter.setState('push.trigger.' + i + '.name', {val: data["push"]["trigger"]["trigger" + i]["name"], ack: true});
                    self.adapter.setState('push.trigger.' + i + '.enter', {val: data["push"]["trigger"]["trigger" + i]["enter"], ack: true});
                    self.adapter.setState('push.trigger.' + i + '.leave', {val: data["push"]["trigger"]["trigger" + i]["leave"], ack: true});
                }
            }
        } else {
            self.adapter.log.error(err);
        }
    });
};

/** Poll status */
Robonect.prototype.pollStatus = function() {
    var self = this;

    request.get({url: self.url + "/json?cmd=status"}, function (err, response, body) {
        self.currentStatus = null;

        if (!err) {
            var data = JSON.parse(body);
            
            if(typeof data === 'object' && data.successful === true) {
                self.adapter.setState('name', {val: data["name"], ack: true});
                self.adapter.setState('id', {val: data["id"], ack: true});
                
                self.adapter.setState('status.status', {val: data["status"]["status"], ack: true});
                self.adapter.setState('status.duration', {val: data["status"]["duration"], ack: true});
                self.adapter.setState('status.mode', {val: data["status"]["mode"], ack: true});
                self.adapter.setState('status.battery', {val: data["status"]["battery"], ack: true});
                self.adapter.setState('status.hours', {val: data["status"]["hours"], ack: true});
                
                self.adapter.setState('timer.status', {val: data["timer"]["status"], ack: true});
                if(data["timer"]["next"] != undefined) {
                    self.adapter.setState('timer.next_date', {val: data["timer"]["next"]["date"], ack: true});
                    self.adapter.setState('timer.next_time', {val: data["timer"]["next"]["time"], ack: true});
                } else {
                    self.adapter.setState('timer.next_date', {val: '', ack: true});
                    self.adapter.setState('timer.next_time', {val: '', ack: true});
                }                    

                self.adapter.setState('wlan.signal', {val: data["wlan"]["signal"], ack: true});

                self.adapter.setState('health.temperature', {val: data["health"]["temperature"], ack: true});
                self.adapter.setState('health.humidity', {val: data["health"]["humidity"], ack: true});
                
                self.adapter.setState('clock.date', {val: data["clock"]["date"], ack: true});
                self.adapter.setState('clock.time', {val: data["clock"]["time"], ack: true});
                self.adapter.setState('clock.unix_timestamp', {val: data["clock"]["unix"], ack: true});

                self.currentStatus = data["status"]["status"];
            }
        } else {
            self.adapter.log.error(err);
        }
    });
};

/** Poll timer */
Robonect.prototype.pollTimer = function() {
    var self = this;

    request.get({url: self.url + "/json?cmd=timer"}, function (err, response, body) {
        if (!err) {
            var data = JSON.parse(body);
            
            if(typeof data === 'object' && data.successful === true) {
                for(var i=0; i<=13; i++) {
                    self.adapter.setState('timer.' + i + '.id', {val: data["timer"][i]["id"], ack: true});
                    self.adapter.setState('timer.' + i + '.enabled', {val: data["timer"][i]["enabled"], ack: true});
                    self.adapter.setState('timer.' + i + '.start_time', {val: data["timer"][i]["start"], ack: true});
                    self.adapter.setState('timer.' + i + '.end_time', {val: data["timer"][i]["end"], ack: true});
                    self.adapter.setState('timer.' + i + '.weekdays.monday', {val: data["timer"][i]["weekdays"]["mo"], ack: true});
                    self.adapter.setState('timer.' + i + '.weekdays.tuesday', {val: data["timer"][i]["weekdays"]["tu"], ack: true});
                    self.adapter.setState('timer.' + i + '.weekdays.wednesday', {val: data["timer"][i]["weekdays"]["we"], ack: true});
                    self.adapter.setState('timer.' + i + '.weekdays.thursday', {val: data["timer"][i]["weekdays"]["th"], ack: true});
                    self.adapter.setState('timer.' + i + '.weekdays.friday', {val: data["timer"][i]["weekdays"]["fr"], ack: true});
                    self.adapter.setState('timer.' + i + '.weekdays.saturday', {val: data["timer"][i]["weekdays"]["sa"], ack: true});
                    self.adapter.setState('timer.' + i + '.weekdays.sunday', {val: data["timer"][i]["weekdays"]["su"], ack: true});
                }
            }
        } else {
            self.adapter.log.error(err);
        }
    });
};

/** Poll version */
Robonect.prototype.pollVersion = function() {
    var self = this;

    request.get({url: self.url + "/json?cmd=version"}, function (err, response, body) {
        if (!err) {
            var data = JSON.parse(body);
            
            if(typeof data === 'object' && data.successful === true) {
                self.adapter.setState('info.hardware.production', {val: data["mower"]["hardware"]["production"], ack: true});
                self.adapter.setState('info.hardware.serial', {val: data["mower"]["hardware"]["serial"].toString(), ack: true});
                
                self.adapter.setState('info.msw.compiled', {val: data["mower"]["msw"]["compiled"], ack: true});
                self.adapter.setState('info.msw.title', {val: data["mower"]["msw"]["title"], ack: true});
                self.adapter.setState('info.msw.version', {val: data["mower"]["msw"]["version"], ack: true});
                
                self.adapter.setState('info.sub.version', {val: data["mower"]["sub"]["version"], ack: true});
                
                self.adapter.setState('info.robonect.serial', {val: data["serial"], ack: true});
                self.adapter.setState('info.robonect.comment', {val: data["application"]["comment"], ack: true});
                self.adapter.setState('info.robonect.compiled', {val: data["application"]["compiled"], ack: true});
                self.adapter.setState('info.robonect.version', {val: data["application"]["version"], ack: true});
                
                self.adapter.setState('info.bootloader.comment', {val: data["bootloader"]["comment"], ack: true});
                self.adapter.setState('info.bootloader.compiled', {val: data["bootloader"]["compiled"], ack: true});
                self.adapter.setState('info.bootloader.version', {val: data["bootloader"]["version"], ack: true});
                
                self.adapter.setState('info.wlan.at-version', {val: data["wlan"]["at-version"], ack: true});
                self.adapter.setState('info.wlan.sdk-version', {val: data["wlan"]["sdk-version"], ack: true});
            }
        } else {
            self.adapter.log.error(err);
        }
    });
};

/** Poll WLAN */
Robonect.prototype.pollWlan = function() {
    var self = this;

    request.get({url: self.url + "/json?cmd=wlan"}, function (err, response, body) {
        if (!err) {
            var data = JSON.parse(body);
            
            if(typeof data === 'object' && data.successful === true) {
                self.adapter.setState('wlan.ap.enable', {val: data["ap"]["enable"], ack: true});
                self.adapter.setState('wlan.ap.mac', {val: data["ap"]["mac"], ack: true});
                self.adapter.setState('wlan.ap.hidden', {val: data["ap"]["hidden"], ack: true});
                self.adapter.setState('wlan.ap.ssid', {val: data["ap"]["ssid"], ack: true});
                self.adapter.setState('wlan.ap.password', {val: data["ap"]["password"], ack: true});
                self.adapter.setState('wlan.ap.channel', {val: data["ap"]["channel"], ack: true});
                self.adapter.setState('wlan.ap.encryption', {val: data["ap"]["encryption"], ack: true});
                self.adapter.setState('wlan.ap.maxconn', {val: data["ap"]["maxconn"], ack: true});
                self.adapter.setState('wlan.ap.ip', {val: data["ap"]["ip"], ack: true});
                self.adapter.setState('wlan.ap.netmask', {val: data["ap"]["netmask"], ack: true});
                self.adapter.setState('wlan.ap.gateway', {val: data["ap"]["gateway"], ack: true});
                self.adapter.setState('wlan.ap.dhcp.enable', {val: data["ap"]["dhcp"]["enable"], ack: true});
                self.adapter.setState('wlan.ap.dhcp.start', {val: data["ap"]["dhcp"]["start"], ack: true});
                self.adapter.setState('wlan.ap.dhcp.end', {val: data["ap"]["dhcp"]["end"], ack: true});

                self.adapter.setState('wlan.station.enable', {val: data["station"]["enable"], ack: true});
                self.adapter.setState('wlan.station.mac', {val: data["station"]["mac"], ack: true});
                self.adapter.setState('wlan.station.signal', {val: data["station"]["signal"], ack: true});
                self.adapter.setState('wlan.station.ssid', {val: data["station"]["ssid"], ack: true});
                self.adapter.setState('wlan.station.password', {val: data["station"]["password"], ack: true});
                self.adapter.setState('wlan.station.dhcp', {val: data["station"]["dhcp"], ack: true});
                self.adapter.setState('wlan.station.ip', {val: data["station"]["ip"], ack: true});
                self.adapter.setState('wlan.station.netmask', {val: data["station"]["netmask"], ack: true});
                self.adapter.setState('wlan.station.gateway', {val: data["station"]["gateway"], ack: true});
            }
        } else {
            self.adapter.log.error(err);
        }
    });
};

/** Update extension status */
Robonect.prototype.updateExtensionStatus = function(ext, status) {
    var self = this;

    if(status === true) {
        status = 1;
    } else {
        status = 0;
    }

    request.get({url: self.url + "/json?cmd=ext&" + ext + "=" + status}, function (err, response, body) {
        if (!err) {
            var data = JSON.parse(body);
            
            if(typeof data === 'object' && data.successful === true) {
                self.adapter.setState('extension.gpio1.inverted', {val: data["ext"]["gpio1"]["inverted"], ack: true});
                self.adapter.setState('extension.gpio1.status', {val: data["ext"]["gpio1"]["status"], ack: true});
                self.adapter.setState('extension.gpio2.inverted', {val: data["ext"]["gpio2"]["inverted"], ack: true});
                self.adapter.setState('extension.gpio2.status', {val: data["ext"]["gpio2"]["status"], ack: true});
                self.adapter.setState('extension.out1.inverted', {val: data["ext"]["out1"]["inverted"], ack: true});
                self.adapter.setState('extension.out1.status', {val: data["ext"]["out1"]["status"], ack: true});
                self.adapter.setState('extension.out2.inverted', {val: data["ext"]["out2"]["inverted"], ack: true});
                self.adapter.setState('extension.out2.status', {val: data["ext"]["out2"]["status"], ack: true});
            }

            if(data["ext"][ext]["status"] == status) {
                self.adapter.log.info(ext + ' set to ' + status);
            } else {
                self.adapter.log.info(ext + ' could not be set to ' + status + '. Is the extension mode set to API?');
            }
        } else {
            self.adapter.log.error(err);
        }
    });
};

/** Update mode */
Robonect.prototype.updateMode = function(mode) {
    var self = this;
    var mode = mode;

    switch(mode) {
        case 0:
            paramMode = 'auto';
            break;
        case 1:
            paramMode = "man";
            break;
        case 2:
            paramMode = "home";
            break;
        case 98:
            paramMode = "eod";
            break;
        case 99:
            paramMode = "job";
            break;
        default:
            self.adapter.log.warn('Mode is invalid');
            return;
    }

    request.get({url: self.url + "/json?cmd=mode&mode=" + paramMode}, function (err, response, body) {
        if (!err) {
            var data = JSON.parse(body);
            
            if(typeof data === 'object' && data.successful === true) {
                self.adapter.setState('status.mode', {val: mode, ack: true});

                self.adapter.log.info('Mode set to ' + mode);
            } else {
                self.adapter.log.info('Mode could not be set to ' + mode);
            }
        } else {
            self.adapter.log.error(err);
        }
    });
};

module.exports = Robonect;