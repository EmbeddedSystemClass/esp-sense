// UART API. Source C API is defined at:
// [mgos_uart.h](https://github.com/cesanta/mongoose-os/blob/master/fw/src/mgos_uart.h)

let MODBUS_STATE_READ_DEVICE_ID=0;
let MODBUS_STATE_READ_FUNC=1;
let MODBUS_STATE_READ_ADDRESS=2;
let MODBUS_STATE_READ_LENGTH=3;
let MODBUS_STATE_READ_BYTE_COUNT=4;
let MODBUS_STATE_READ_DATA=5;
let MODBUS_STATE_READ_CRC=6;

let MODBUS_FUNC_READ_COILS = 0x01;
let MODBUS_FUNC_READ_DISCRETE_INPUTS = 0x02;
let MODBUS_FUNC_READ_HOLDING_REGISTERS = 0x03;
let MODBUS_FUNC_READ_INPUT_REGISTERS = 0x04;
let MODBUS_FUNC_WRITE_SINGLE_COIL = 0x05;
let MODBUS_FUNC_WRITE_SINGLE_REGISTER = 0x06;
let MODBUS_FUNC_WRITE_MULTIPLE_COILS = 0x0f;
let MODBUS_FUNC_WRITE_MULTIPLE_REGISTERS = 0x10;


let MODBUS_COILS = 1;
let MODBUS_INPUT_COILS = 2;
let MODBUS_INPUT_REGISTERS = 3;
let MODBUS_HOLDING_REGISTERS = 4;

let READ = 1;
let WRITE = 2;
let READWRITE = 3;


let BOOLEAN = 0;
let BYTE = 1;
let INT16 = 2;
let INT32 = 3;
let FLOAT = 4;
let DOUBLE = 5;
let STRING = 6;

let RS485 = {
  _free: ffi('void free(void *)'),
  _cdef: ffi('void *mgos_uart_config_get_default(int)'),
  _cbp: ffi('void mgos_uart_config_set_basic_params(void *, int, int, int, int)'),
  _crx: ffi('void mgos_uart_config_set_rx_params(void *, int, int, int)'),
  _ctx: ffi('void mgos_uart_config_set_tx_params(void *, int, int)'),
  _cfg: ffi('int mgos_uart_configure(int, void *)'),
  _wr: ffi('int mgos_uart_write(int, char *, int)'),
  _rd: ffi('int mgos_uart_read(int, void *, int)'),

  // ## **`UART.writeAvail(uartNo)`**
  // Return amount of space available in the output buffer.
  writeAvail: ffi('int mgos_uart_write_avail(int)'),

  // ## **`UART.setDispatcher(uartNo, callback, userdata)`**
  // Set UART dispatcher
  // callback which gets invoked when there is a new data in the input buffer
  // or when the space becomes available on the output buffer.
  //
  // Callback receives the following arguments: `(uartNo, userdata)`.
  setDispatcher: ffi('void mgos_uart_set_dispatcher(int, void(*)(int, userdata), userdata)'),

  // ## **`UART.readAvail(uartNo)`**
  // Return amount of data available in the input buffer.
  readAvail: ffi('int mgos_uart_read_avail(int)'),

  // ## **`UART.setRxEnabled(uartNo)`**
  // Set whether Rx is enabled.
  setRxEnabled: ffi('void mgos_uart_set_rx_enabled(int, int)'),
  // ## **`UART.isRxEnabled(uartNo)`**
  // Returns whether Rx is enabled.
  isRxEnabled: ffi('int mgos_uart_is_rx_enabled(int)'),

  // ## **`UART.flush(uartNo)`**
  // Flush the UART output buffer, wait for the data to be sent.
  flush: ffi('void mgos_uart_flush(int)'),

 
  calloc: ffi('void *calloc(int, int)'),
  crc16: ffi('int crc16(void *, int)'),

 
  setConfig: function(uartNo, param) {
    let cfg = this._cdef(uartNo);

    this._cbp(cfg, param.baudRate || 115200,
                   param.numDataBits || 8,
                   param.parity || 0,
                   param.numStopBits || 1);

    this._crx(
      cfg,
      param.rxBufSize || 256,
      param.rxFlowControl || false,
      param.rxLingerMicros || 15
    );

    this._ctx(
      cfg,
      param.txBufSize || 256,
      param.txFlowControl || false
    );

    // Apply arch-specific config
    if (this._arch !== undefined) {
      this._arch.scfg(uartNo, cfg, param);
    }

    let res = this._cfg(uartNo, cfg);

    this._free(cfg);
    cfg = null;

    this.uartNo = uartNo;

    //FIXME: Can we allocate memory without using hardcode string?
    this.buf = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; // Should be > 5

    return res;
  },

  setFlowControl: function(pin) {
    this.controlPin = pin;
    GPIO.set_mode(this.controlPin, GPIO.MODE_OUTPUT);
  },
 
  init: function(serialPortConfig) {
    this.readState = MODBUS_STATE_READ_DEVICE_ID;

    let buffer = RS485.calloc(255, 1);

    let dataView = DataView.create(buffer, 0, 255);

    this.requestFrame  = {
              id: -1,
              func: 0,
              address: 0,
              length: 0,
              data: '',
              byteCount: 0,
              crc: 0,
              receiveBuffer: '',
              buffer: buffer,
              dataView: dataView
            };

    this.devices = [];
    
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
 
 
  addDevice: function(device) {
    device.setSerial(this);
    this.devices.push(device);
  },

  readBytes: function(bytes) {
    let n = 0; let res = ''; 
    //let buf = 'xxxxxxxxxxxxxxxxxxxx'; // Should be > 5
    n = this._rd(this.uartNo, this.buf, bytes);
    if (n > 0) {
      res += this.buf.slice(0, n);
    }
    print("Read  ", res);
    return res;
  },

  readID: function() {
    this.requestFrame.id = this.readInt8();;
    print("*ID=", this.requestFrame.id);
    this.readState = MODBUS_STATE_READ_FUNC;
  },
   
  readFunc: function() {
    this.requestFrame.func = this.readInt8();
    print("*Func=", this.requestFrame.func);
    this.readState = MODBUS_STATE_READ_ADDRESS;
  },
 
  readInt8: function() {
    let valBuf = this.readBytes(1);
    
    let value = valBuf.at(0);
    print("value is ", value);
    return value;
  }, 

  readInt16: function() {
    let valBuf = this.readBytes(2);
    
    let value = valBuf.at(0) << 8 | valBuf.at(1);
    print("value is ", value);
    return value;
  }, 

  readAddress: function() {
    this.requestFrame.address = this.readInt16();
    print("*Address=", this.requestFrame.address);

    if (this.requestFrame.func === MODBUS_FUNC_READ_COILS ||
      this.requestFrame.func === MODBUS_FUNC_READ_DISCRETE_INPUTS ||
      this.requestFrame.func === MODBUS_FUNC_READ_HOLDING_REGISTERS ||
      this.requestFrame.func === MODBUS_FUNC_READ_INPUT_REGISTERS || 
      this.requestFrame.func === MODBUS_FUNC_WRITE_MULTIPLE_COILS || 
      this.requestFrame.func === MODBUS_FUNC_WRITE_MULTIPLE_REGISTERS) {
        this.readState = MODBUS_STATE_READ_LENGTH;
      }

    if (this.requestFrame.func === MODBUS_FUNC_WRITE_SINGLE_COIL ||
        this.requestFrame.func === MODBUS_FUNC_WRITE_SINGLE_REGISTER ) {
      this.readState = MODBUS_STATE_READ_DATA;
    }
  }, 
 

  readByteCount: function() {
    this.requestFrame.byteCount = this.readInt8();
    print("*Bytecount=", this.requestFrame.byteCount);
    this.readState = MODBUS_STATE_READ_DATA;
  },

  readLength: function() {
    this.requestFrame.quantity = this.readInt16();
    print("*Quantity=", this.requestFrame.quantity);

    if (this.requestFrame.func === MODBUS_FUNC_WRITE_MULTIPLE_COILS || 
        this.requestFrame.func === MODBUS_FUNC_WRITE_MULTIPLE_REGISTERS) {
        this.readState = MODBUS_STATE_READ_BYTE_COUNT;
    } else {
      this.readState = MODBUS_STATE_READ_CRC;
    }
  },

  readData: function() {
    let length = 0;

    if (this.requestFrame.func === MODBUS_FUNC_WRITE_MULTIPLE_COILS) {
      length = this.requestFrame.byteCount;
    }

    if (this.requestFrame.func === MODBUS_FUNC_WRITE_MULTIPLE_REGISTERS) {
      length = this.requestFrame.byteCount;
    }

    if (this.requestFrame.func === MODBUS_FUNC_WRITE_SINGLE_COIL ||
        this.requestFrame.func === MODBUS_FUNC_WRITE_SINGLE_REGISTER ) {
          length = 2;
        }

    this.requestFrame.data = this.readBytes(length);

    print("*Data=",     this.requestFrame.data);

    for(let i = 0; i < length; i++) {
     let value = this.requestFrame.data.at(i);
     print('coping value ', value);
     this.requestFrame.dataView.setUint8(i, value);
    }
 

    this.readState = MODBUS_STATE_READ_CRC;

  },

  readCrc: function () {
    this.requestFrame.crc = this.readInt16();
    print("*CRC=", this.requestFrame.crc);
    this.readState = MODBUS_STATE_READ_DEVICE_ID;
    this.checkCrc();
  },

  checkCrc: function () {
    print("checking crc ..");
    this.processRequest();
  },

  processRequest: function() {
    print("processing request");

    for (let i in this.devices) {
      let device = this.devices[i];
      if (device.deviceId === this.requestFrame.id) {
        device.processRequest(this.requestFrame);
      }
    }
     

    print("processing done");


  },

  write: function(data, length) {
    GPIO.write(this.controlPin, 1);


    print("total size to available ", this.writeAvail(200));

    let l = this._wr(this.uartNo, data, length);

    print("total size to write ", length);
    print("total size written ", l);
    print("this uart no ", this.uartNo);

    print("total size to available now", this.writeAvail(200));


    this.flush(this.uartNo);
    GPIO.write(this.controlPin, 0);
  },

  read: function(uartNo) {
    print('Read called ', uartNo);
    print('read state ', this.readState);
    
    if (this.readState === MODBUS_STATE_READ_DEVICE_ID) {
      return this.readID(uartNo);
    }

    if (this.readState === MODBUS_STATE_READ_FUNC) {
      return this.readFunc(uartNo);
    }

    if (this.readState === MODBUS_STATE_READ_ADDRESS) {
      return this.readAddress(uartNo);
    }

    if (this.readState === MODBUS_STATE_READ_LENGTH) {
      return this.readLength(uartNo);
    }

    if (this.readState === MODBUS_STATE_READ_BYTE_COUNT) {
      return this.readByteCount(uartNo);
    }

    if (this.readState === MODBUS_STATE_READ_DATA) {
      return this.readData(uartNo);
    } 

    if (this.readState === MODBUS_STATE_READ_CRC) {
      return this.readCrc(uartNo);
    }
   
  }

};
 