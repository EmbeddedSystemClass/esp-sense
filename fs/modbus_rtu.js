// UART API. Source C API is defined at:
// [mgos_uart.h](https://github.com/cesanta/mongoose-os/blob/master/fw/src/mgos_uart.h)

let MODBUS_STATE_READ_DEVICE_ID=0;
let MODBUS_STATE_READ_FUNC=1;
let MODBUS_STATE_READ_ADDRESS=2;
let MODBUS_STATE_READ_LENGTH=3;
let MODBUS_STATE_READ_BYTE_COUNT=4;
let MODBUS_STATE_READ_READ_DATA=5;
let MODBUS_STATE_READ_READ_CRC=6;

let MODBUS_FUNC_READ_COILS = 0x01;
let MODBUS_FUNC_READ_DISCRETE_INPUTS = 0x02;
let MODBUS_FUNC_READ_HOLDING_REGISTERS = 0x03;
let MODBUS_FUNC_READ_INPUT_REGISTERS = 0x04;
let MODBUS_FUNC_WRITE_SINGLE_COIL = 0x05;
let MODBUS_FUNC_WRITE_SINGLE_REGISTER = 0x06;
let MODBUS_FUNC_WRITE_MULTIPLE_COILS = 0x0f;
let MODBUS_FUNC_WRITE_MULTIPLE_REGISTERS = 0x10;

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

    return res;
  },

  setFlowControl: function(pin) {
    this.controlPin = pin;
    GPIO.set_mode(this.controlPin, GPIO.MODE_OUTPUT);
  },
 
  init: function(serialPortConfig) {
    this.readState = MODBUS_STATE_READ_DEVICE_ID;
    this.modbusRequestFrame  = {
              id: -1,
              func: 0,
              address: 0,
              length: 0,
              data: '',
              byteCount: 0,
              crc: 0,
              receiveBuffer: ''
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
    let n = 0; let res = ''; let buf = 'xxxxxxxxxx'; // Should be > 5
    n = this._rd(this.uartNo, buf, bytes);
    if (n > 0) {
      res += buf.slice(0, n);
    }
    print("Read  ", res);
    return res;
  },

  readID: function() {
    this.modbusRequestFrame.id = this.readInt8();;
    print("ID is ", this.modbusRequestFrame.id);
    this.readState = MODBUS_STATE_READ_FUNC;
  },
   
  readFunc: function() {
    this.modbusRequestFrame.func = this.readInt8();
    print("Func is ", this.modbusRequestFrame.func);
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
    this.modbusRequestFrame.address = this.readInt16();
    print("Address is ", this.modbusRequestFrame.address);

    if (this.modbusRequestFrame.func === MODBUS_FUNC_READ_COILS ||
      this.modbusRequestFrame.func === MODBUS_FUNC_READ_DISCRETE_INPUTS ||
      this.modbusRequestFrame.func === MODBUS_FUNC_READ_HOLDING_REGISTERS ||
      this.modbusRequestFrame.func === MODBUS_FUNC_READ_INPUT_REGISTERS || 
      this.modbusRequestFrame.func === MODBUS_FUNC_WRITE_MULTIPLE_COILS || 
      this.modbusRequestFrame.func === MODBUS_FUNC_WRITE_MULTIPLE_REGISTERS) {
        this.readState = MODBUS_STATE_READ_LENGTH;
      }

    if (this.modbusRequestFrame.func === MODBUS_FUNC_WRITE_SINGLE_COIL ||
        this.modbusRequestFrame.func === MODBUS_FUNC_WRITE_SINGLE_REGISTER ) {
      this.readState = MODBUS_STATE_READ_READ_DATA;
    }
  }, 
 

  readByteCount: function() {
    this.modbusRequestFrame.byteCount = this.readInt8();
    print("bytecount is is ", this.modbusRequestFrame.byteCount);
    this.readState = MODBUS_STATE_READ_READ_DATA;
  },

  readLength: function() {
    this.modbusRequestFrame.length = this.readInt16();
    print("len is ", this.modbusRequestFrame.length);
    this.readState = MODBUS_STATE_READ_READ_CRC;
  },

  readData: function() {
    let length = 0;

    if (this.modbusRequestFrame.func === MODBUS_FUNC_WRITE_MULTIPLE_COILS) {
      length = this.modbusRequestFrame.byteCount;
    }

    if (this.modbusRequestFrame.func === MODBUS_FUNC_WRITE_MULTIPLE_REGISTERS) {
      length = this.modbusRequestFrame.byteCount;
    }

    if (this.modbusRequestFrame.func === MODBUS_FUNC_WRITE_SINGLE_COIL ||
        this.modbusRequestFrame.func === MODBUS_FUNC_WRITE_SINGLE_REGISTER ) {
          length = 2;
        }

    this.modbusRequestFrame.data = this.readBytes(length);

    this.readState = MODBUS_STATE_READ_READ_CRC;

  },

  readCrc: function () {
    this.modbusRequestFrame.crc = this.readInt16();
    print("crc is ", this.modbusRequestFrame.crc);
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
      if (device.deviceId === this.modbusRequestFrame.id) {
        device.processRequest(this.modbusRequestFrame);
      }
    }
     

    print("processing done");


  },

  write: function(data, length) {
    GPIO.write(this.controlPin, 1);

    this._wr(this.uartNo, data, length);

    print("total size to write ", length);
    print("total size written ", l);
    print("this uart no ", this.uartNo);

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

    if (this.readState === MODBUS_STATE_READ_READ_DATA) {
      return this.readData(uartNo);
    } 

    if (this.readState === MODBUS_STATE_READ_READ_CRC) {
      return this.readCrc(uartNo);
    }
   
  }

};

