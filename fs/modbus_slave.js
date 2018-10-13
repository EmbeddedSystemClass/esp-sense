let ModbusHelper = {
    calloc: ffi('void *calloc(int, int)'),
    crc16: ffi('int crc16(void *, int)')
};

let ModbusSlave = {
    
    deviceId: 0,
    read: function() {
        print("read ", this.deviceId);
    }, 
    write: function() {
        print("write ", this.deviceId);
    },

    readCoils: function(requestFrame) {

    },


    readDiscreateInputs: function(requestFrame) {

    },

    readHoldingInputs: function(requestFrame) {

    },


    readInputRegisters: function(requestFrame) {

    },


    writeSingleCoil: function(requestFrame) {

    },


    writeSingleRegister: function(requestFrame) {

    },

    writeMultipleCoils: function(requestFrame) {

    },


    writeMultipleRegisters: function(requestFrame) {

    },

    processRequest: function(requestFrame, serial) {
        print('Device Process Request', this.deviceId);
        let ptr = RS485.calloc(100, 1);
        let dw = DataView.create(ptr, 0, 100);
        dw.setUint8(0, requestFrame.id); //id
        dw.setUint8(1, requestFrame.func); //fc
        dw.setUint8(2, 1); // byte count
        dw.setUint8(3, 1); // data
        
        //dw.setUint16(4, 0xffff); //crc
        let c = RS485.crc16(ptr, 4);
        dw.setUint8(4, (c >> 8) & 0xff ); 
        dw.setUint8(5, (c  & 0xff ));
        
        print("C Is  ", c);
    
        let s = mkstr(ptr, 6);
        serial.write(s, 6);
    
        print("processing done");
    }
};

