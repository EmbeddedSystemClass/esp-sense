load('api_timer.js');
load('api_uart.js');
load('api_sys.js');
load('api_gpio.js');
load('hello.js');

 
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

let SerialPort2 = {
  init: function(serialPortConfig, receiveBuffer) {
      this.receiveBuffer = receiveBuffer;
      this.serialPortConfig = serialPortConfig;
      UART.setConfig(serialPortConfig.uartNo, serialPortConfig.config);
     GPIO.set_mode(serialPortConfig.controlPin, GPIO.MODE_OUTPUT);
     //let that = this;
     UART.setDispatcher(serialPortConfig.uartNo, function(uartNo, that) {
        let ra = UART.readAvail(uartNo);
        if (ra > 0) {
          // Received new data: print it immediately to the console, and also
          // accumulate in the "rxAcc" variable which will be echoed back to UART later
          let data = UART.read(uartNo);
          //print('Received UART data:', data);
          //rxAcc += data;
          that.receiveBuffer.rxAcc += data;
        }
      }, this);
      
        
    // Enable Rx
    UART.setRxEnabled(serialPortConfig.uartNo, true);
  },
  
  write: function(data) {
    GPIO.write(this.serialPortConfig.controlPin, 1);
  
    UART.write(
      this.serialPortConfig.uartNo,
      data
    );
    //'Test ' + this.receiveBuffer.rxAcc
    
    UART.flush(this.serialPortConfig.uartNo);
    
    GPIO.write(this.serialPortConfig.controlPin, 0);
    //rxAcc = '';
    this.receiveBuffer.rxAcc = '';
    }
};
 

SerialPort2.init(serialPortConfig, receiveBuffer);


// Send UART data every second
Timer.set(2000 /* milliseconds */, Timer.REPEAT, function() {
   
  
  SerialPort2.write(   'Hello UART 2! '
      + (receiveBuffer.rxAcc.length > 0 ? (' Rx: ' + receiveBuffer.rxAcc) : '')
      + ' uptime: ' + JSON.stringify(Sys.uptime())
      + ' RAM: ' + JSON.stringify(Sys.free_ram())
      + '\n');
        
  // + (receiveBuffer.rxAcc.length > 0 ? (' Rx: ' + receiveBuffer.rxAcc) : '')
     
  
}, null);