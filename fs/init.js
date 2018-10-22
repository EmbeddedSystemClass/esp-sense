load('api_dataview.js');
load('api_timer.js');
load('api_uart.js');
load('api_sys.js');
load('api_gpio.js');
load('api_config.js');
load('api_file.js');
load('buffer.js');
load("rs485.js");
load("modbus_slave.js");

print("welcome ESP32");

Cfg.set({debug: {level: 3}});

let rs485Config = {
  baudRate: 9600,
  parity: 0,
  numStopBits: 1
};

File.write(JSON.stringify(rs485Config), "rs485.json");

 
let rs485Text = File.read("rs485.json");

let rs485 = JSON.parse(rs485Text);

print("Baud is ", rs485.baudRate);

print("parity is ", rs485.parity);

print("numStopBits is ", rs485.numStopBits);

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


let config3 = {
  deviceId: 3,
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


let slave3 = Object.create(ModbusSlave);
slave3.init(config3);




let config4 = {
  deviceId: 4,
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


let slave4 = Object.create(ModbusSlave);
slave4.init(config4);
  

let serialPortConfig = {
  uartNo: 2,
  controlPin: 23,
  config: {
        baudRate: rs485.baudRate,
        parity: rs485.parity,
        numStopBits: rs485.numStopBits,
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
RS485.addDevice(slave3);
RS485.addDevice(slave4);


let energyMeterModbusProfile = [
  {
    name: "FWVersion",
    location: MODBUS_HOLDING_REGISTERS,
    mode: READ,
    dataType: INT16,
    address: 1,
    value: 11
  },
  {
    name: "HWVersion",
    location: MODBUS_HOLDING_REGISTERS,
    mode: READ,
    dataType: INT16,
    address: 15,
    value: 33
  },

  {
    name: "SerialNumber", 
    location: MODBUS_HOLDING_REGISTERS,
    mode: READ,
    dataType: INT32,
    address: 16,
    value: 500
  },

  {
    name: "WT1", 
    location: MODBUS_HOLDING_REGISTERS,
    mode: READ,
    dataType: INT32,
    address: 28,
    value: 1020
  },

  {
    name: "WT1_PARTIAL", 
    location: MODBUS_HOLDING_REGISTERS,
    mode: READWRITE,
    dataType: INT32,
    address: 30,
    value: 2000
  }
  
];

slave1.setProfile(energyMeterModbusProfile);
slave1.initDefaultValues();

slave2.setProfile(energyMeterModbusProfile);
slave2.initDefaultValues();

slave3.setProfile(energyMeterModbusProfile);
slave3.initDefaultValues();


Timer.set(5000 /* milliseconds */, Timer.REPEAT, function() {
   print(' RAM: ' + JSON.stringify(Sys.free_ram()));
}, null);