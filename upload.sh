set -x
mos put fs/buffer.js
mos put fs/rs485.js
mos put fs/modbus_slave.js

mos put fs/energy_meter.js

mos put fs/temperature_meter.js
mos put fs/init.js

mos call Sys.Reboot