1. Complete Function codes [Write is not yet]
2. Configurable baudrate, parity and stop bits
3. Python client works

Device
    Temp device

    Tag - Name
    Device ID-
    temp
    humidity
    unit (cel/farenheit)
    ...



1. Baud Rate to be configurable
2. Parity to be configurable
3. Stopbits to be configurable
4. Config file: 


Cfg.get('device.id');        // returns a string
Cfg.get('debug.level');      // returns an integer
Cfg.get('wifi.sta.enable');  // returns a booleanJavaScript

Cfg.set#
Cfg.set(obj, opt_save)JavaScript
Set the configuration. obj must be a subset of the whole configuation tree. save is boolean flag that indicating whether the change should be saved - it could be omitted, in which case it defaults to true. Examples:

load('api_config.js');
Cfg.set({wifi: {ap: {enable: false}}});  // Disable WiFi AP mode
Cfg.set({debug: {level: 3}});            // Set debug level to 3

Cfg.set({rs485: { baudrate: 19200}})
Cfg.set({rs485: { parity: odd | even | none}})
Cfg.set({rs485: { stopbits: | }})



use this to set the baudrate : Cfg.get('rs485.baudrate');      // returns an integer
 