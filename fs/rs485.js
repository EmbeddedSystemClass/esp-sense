// UART API. Source C API is defined at:
// [mgos_uart.h](https://github.com/cesanta/mongoose-os/blob/master/fw/src/mgos_uart.h)

let MODBUS_STATE_READ_DEVICE_ID=0;
let MODBUS_STATE_READ_FUNC=1;
let MODBUS_STATE_READ_ADDRESS=2;
let MODBUS_STATE_READ_LENGTH=3;
let MODBUS_STATE_READ_READ_DATA=4;
let MODBUS_STATE_READ_READ_CRC=5;

let RS485 = {
  _free: ffi('void free(void *)'),
  _cdef: ffi('void *mgos_uart_config_get_default(int)'),
  _cbp: ffi('void mgos_uart_config_set_basic_params(void *, int, int, int, int)'),
  _crx: ffi('void mgos_uart_config_set_rx_params(void *, int, int, int)'),
  _ctx: ffi('void mgos_uart_config_set_tx_params(void *, int, int)'),
  _cfg: ffi('int mgos_uart_configure(int, void *)'),
  _wr: ffi('int mgos_uart_write(int, char *, int)'),
  _rd: ffi('int mgos_uart_read(int, void *, int)'),
  calloc: ffi('void *calloc(int, int)'),
 
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

    return res;
  },

  // ## **`UART.setDispatcher(uartNo, callback, userdata)`**
  // Set UART dispatcher
  // callback which gets invoked when there is a new data in the input buffer
  // or when the space becomes available on the output buffer.
  //
  // Callback receives the following arguments: `(uartNo, userdata)`.
  setDispatcher: ffi('void mgos_uart_set_dispatcher(int, void(*)(int, userdata), userdata)'),


  setFlowControl: function(pin) {
    this.controlPin = pin;
    GPIO.set_mode(this.controlPin, GPIO.MODE_OUTPUT);
  },

  init: function(modbusRequestFrame) {
    this.readState = MODBUS_STATE_READ_DEVICE_ID;
    this.modbusRequestFrame = modbusRequestFrame;
  },

  readBytes: function(uartNo, bytes) {
    let n = 0; let res = ''; let buf = 'xxxxxxxxxx'; // Should be > 5
    n = this._rd(uartNo, buf, bytes);
    if (n > 0) {
      res += buf.slice(0, n);
    }
    print("Read  ", res);
    return res;
  },

  readID: function(uartNo) {
    let id = this.readBytes(uartNo, 1);
    this.modbusRequestFrame.id = id;
    print("ID is ", id);
    this.readState = MODBUS_STATE_READ_FUNC;
  },
 
  readFunc: function(uartNo) {
    this.modbusRequestFrame.func = this.readInt8(uartNo);
    print("Func is ", this.modbusRequestFrame.func);
    this.readState = MODBUS_STATE_READ_ADDRESS;
  },
 
  readInt8: function(uartNo) {
    let valBuf = this.readBytes(uartNo, 1);
    
    let value = valBuf.at(0);
    print("value is ", value);
    return value;
  }, 

  readInt16: function(uartNo) {
    let valBuf = this.readBytes(uartNo, 2);
    
    let value = valBuf.at(0) << 8 | valBuf.at(1);
    print("value is ", value);
    return value;
  }, 

  readAddress: function(uartNo) {
    this.modbusRequestFrame.address = this.readInt16(uartNo);
    print("Address is ", this.modbusRequestFrame.address);
    this.readState = MODBUS_STATE_READ_LENGTH;
  }, 
 

  readLength: function(uartNo) {
    this.modbusRequestFrame.length = this.readInt16(uartNo);
    print("len is ", this.modbusRequestFrame.length);
    this.readState = MODBUS_STATE_READ_READ_CRC;
  },

  readData: function(uartNo) {

  },

  readCrc: function (uartNo) {
    this.modbusRequestFrame.crc = this.readInt16(uartNo);
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
    

  },


  // ## **`UART.write(uartNo, data)`**
  // Write data to the buffer. Returns number of bytes written.
  //
  // Example usage: `UART.write(1, "foobar")`, in this case, 6 bytes will be written.
  write: function(uartNo, data) {
    GPIO.write(this.controlPin, 1);

    this._wr(uartNo, data, data.length);

    this.flush(uartNo);
    GPIO.write(this.controlPin, 0);
  },

  // ## **`UART.writeAvail(uartNo)`**
  // Return amount of space available in the output buffer.
  writeAvail: ffi('int mgos_uart_write_avail(int)'),

  // ## **`UART.read(uartNo)`**
  // It never blocks, and returns a string containing
  // read data (which will be empty if there's no data available).
  read2: function(uartNo) {
    let n = 0; let res = ''; let buf = 'xxxxxxxxxx'; // Should be > 5
    while ((n = this._rd(uartNo, buf, buf.length)) > 0) {
      res += buf.slice(0, n);
    }
    return res;
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
   
  },

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
};

// Load arch-specific API
//load('api_arch_uart.js');
