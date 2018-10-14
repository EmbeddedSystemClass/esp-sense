load('api_dataview.js');
load('api_timer.js');
load('api_uart.js');
load('api_sys.js');
load('api_gpio.js');
load("rs485.js");
load("modbus_slave.js");

let slave1 = Object.create(ModbusSlave);
slave1.deviceId = 1;

let config1 = {
  deviceId: 1,
  coils: {
    offset: 0,
    size: 100
  },
  discreteInputs: {
    offset: 0,
    size: 100,
    le: false
  },
  holdingRegisters: {
    offset: 0,
    size: 100,
    le: false
  },
  inputRegisters: {
    offset: 0,
    size: 100,
    le: false
  }
};

slave1.init(config1);

let config2 = {
  deviceId: 2,
  coils: {
    offset: 0,
    size: 100,
    le: false
  },
  discreteInputs: {
    offset: 0,
    size: 100,
    le: false
  },
  holdingRegisters: {
    offset: 0,
    size: 100,
    le: false
  },
  inputRegisters: {
    offset: 0,
    size: 100,
    le: false
  }
};

let slave2 = Object.create(ModbusSlave);
slave2.deviceId = 2;

slave2.init(config2);
  

let serialPortConfig = {
  uartNo: 2,
  controlPin: 23,
  config: {
        baudRate: 9600,
        esp32: {
          gpio: {
            rx: 16,
            tx: 17
          }
        }
      }
};

RS485.setFlowControl(23);

RS485.init(serialPortConfig);

RS485.addDevice(slave1);
RS485.addDevice(slave2);