load('api_dataview.js');
load('api_timer.js');
load('api_uart.js');
load('api_sys.js');
load('api_gpio.js');
load("rs485.js");
//load("modbus_rtu.js");
//load('hello.js');

let modbusRequestFrame = {
  id: -1,
  func: 0,
  address: 0,
  length: 0,
  data: '',
  crc: 0,
  receiveBuffer: ''
};
 
let receiveBuffer = {
  rxAcc: ''
};

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
RS485.init(modbusRequestFrame);

let SerialPort2 = {
  init: function(serialPortConfig, receiveBuffer) {
      this.receiveBuffer = receiveBuffer;
      this.serialPortConfig = serialPortConfig;
      RS485.setConfig(serialPortConfig.uartNo, serialPortConfig.config);
     GPIO.set_mode(serialPortConfig.controlPin, GPIO.MODE_OUTPUT);
     //let that = this;
     RS485.setDispatcher(serialPortConfig.uartNo, function(uartNo, that) {
        let ra = RS485.readAvail(uartNo);
        
        if (ra > 0) {
          print('available ', ra);
          // Received new data: print it immediately to the console, and also
          // accumulate in the "rxAcc" variable which will be echoed back to UART later
          let data = RS485.read(uartNo);
          //print('Received UART data:', data);
          //rxAcc += data;
          // that.receiveBuffer.rxAcc += data;
        }
      }, this);
      
        
    // Enable Rx
    RS485.setRxEnabled(serialPortConfig.uartNo, true);
  },
  
  write: function(data) {
    //GPIO.write(this.serialPortConfig.controlPin, 1);
  
    RS485.write(
      this.serialPortConfig.uartNo,
      data
    );
    //'Test ' + this.receiveBuffer.rxAcc
    
    //RS485.flush(this.serialPortConfig.uartNo);
    
    //GPIO.write(this.serialPortConfig.controlPin, 0);
    //rxAcc = '';
    this.receiveBuffer.rxAcc = '';
    }
};
 

SerialPort2.init(serialPortConfig, receiveBuffer);


// Send UART data every second
//Timer.set(2000 /* milliseconds */, Timer.REPEAT, function() {
 // SerialPort2.write(   'Hello UART 2! ');
//}, null);