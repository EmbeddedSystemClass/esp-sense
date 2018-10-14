load('api_dataview.js');
load('api_timer.js');
load('api_uart.js');
load('api_sys.js');
load('api_gpio.js');
load("rs485.js");
load("modbus_slave.js");
//load('hello.js');


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

RS485.init();

RS485.addDevice(slave1);
RS485.addDevice(slave2);
 
let SerialPort2 = {
  init: function(serialPortConfig) {
      
      this.serialPortConfig = serialPortConfig;
      RS485.setConfig(serialPortConfig.uartNo, serialPortConfig.config);
     GPIO.set_mode(serialPortConfig.controlPin, GPIO.MODE_OUTPUT);
     //let that = this;
     RS485.setDispatcher(serialPortConfig.uartNo, function(uartNo, that) {
        let ra = RS485.readAvail(uartNo);
        
        if (ra > 0) {
          print('available ', ra);
          let data = RS485.read(uartNo);
         
        }
      }, this);
      
    // Enable Rx
    RS485.setRxEnabled(serialPortConfig.uartNo, true);
  },
  
};
 
SerialPort2.init(serialPortConfig);

