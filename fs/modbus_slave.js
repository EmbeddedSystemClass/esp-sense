let ModbusHelper = {
    calloc: ffi('void *calloc(int, int)'),
    crc16: ffi('int crc16(void *, int)')
};

let ModbusSlave = {
    deviceId: 0,

    init: function(deviceId) {
        this.deviceId = deviceId;
        //this.ptr = RS485.calloc(255, 1);
        //this.dw = DataView.create(this.ptr, 0, 255);
    },

    setSerial: function(serial) {
        this.serial = serial;
    },

    read: function() {
        print("read ", this.deviceId);
    }, 
    write: function() {
        print("write ", this.deviceId);
    },

    readCoils: function(requestFrame) {
        print("readCoils ");

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
        this.serial.write(s, 6);
    },


    readDiscreteInputs: function(requestFrame) {
        print("readDiscreteInputs ");

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
        this.serial.write(s, 6);
    },

    readHoldingRegisters: function(requestFrame) {
        print("readHoldingRegisters ");

        let ptr = RS485.calloc(100, 1);
        let dw = DataView.create(ptr, 0, 100);
        dw.setUint8(0, requestFrame.id); //id
        dw.setUint8(1, requestFrame.func); //fc
        dw.setUint8(2, 2); // byte count

        dw.setUint8(3, 1); // data

        dw.setUint8(4, 0); // data
        
        //dw.setUint16(4, 0xffff); //crc
        let c = RS485.crc16(ptr, 5);
        dw.setUint8(5, (c >> 8) & 0xff ); 
        dw.setUint8(6, (c  & 0xff ));
        
        print("C Is  ", c);
    
        let s = mkstr(ptr, 7);
        this.serial.write(s, 7);
    },


    readInputRegisters: function(requestFrame) {
        print("readInputRegisters ");

        let ptr = RS485.calloc(100, 1);
        let dw = DataView.create(ptr, 0, 100);
        dw.setUint8(0, requestFrame.id); //id
        dw.setUint8(1, requestFrame.func); //fc
        dw.setUint8(2, 2); // byte count

        dw.setUint8(3, 1); // data

        dw.setUint8(4, 0); // data
        
        //dw.setUint16(4, 0xffff); //crc
        let c = RS485.crc16(ptr, 5);
        dw.setUint8(5, (c >> 8) & 0xff ); 
        dw.setUint8(6, (c  & 0xff ));
        
        print("C Is  ", c);
    
        let s = mkstr(ptr, 7);
        this.serial.write(s, 7);
    },


    writeSingleCoil: function(requestFrame) {
        print("writeSingleCoil ");


        let ptr = RS485.calloc(100, 1);
        let dw = DataView.create(ptr, 0, 100);
        dw.setUint8(0, requestFrame.id); //id
        dw.setUint8(1, requestFrame.func); //fc

        dw.setUint16(2, requestFrame.address); // output address

        dw.setUint16(4, 0xffff); // output value
        
        let c = RS485.crc16(ptr, 6);
        dw.setUint8(6, (c >> 8) & 0xff ); 
        dw.setUint8(7, (c  & 0xff ));
        
        print("C Is  ", c);
    
        let s = mkstr(ptr, 8);
        this.serial.write(s, 8);

    },


    writeSingleRegister: function(requestFrame) {
        print("writeSingleRegister ");


        let ptr = RS485.calloc(100, 1);
        let dw = DataView.create(ptr, 0, 100);
        dw.setUint8(0, requestFrame.id); //id
        dw.setUint8(1, requestFrame.func); //fc

        dw.setUint16(2, requestFrame.address); // output address

        dw.setUint16(4, 0x0002); // register value
        
        let c = RS485.crc16(ptr, 6);
        dw.setUint8(6, (c >> 8) & 0xff ); 
        dw.setUint8(7, (c  & 0xff ));
        
        print("C Is  ", c);
    
        let s = mkstr(ptr, 8);
        this.serial.write(s, 8);
    },

    writeMultipleCoils: function(requestFrame) {
        print("writeMultipleCoils ");

        let ptr = RS485.calloc(100, 1);
        let dw = DataView.create(ptr, 0, 100);
        dw.setUint8(0, requestFrame.id); //id
        dw.setUint8(1, requestFrame.func); //fc

        dw.setUint16(2, requestFrame.address); // output address

        dw.setUint16(4, requestFrame.length); // quantity
        
        let c = RS485.crc16(ptr, 6);
        dw.setUint8(6, (c >> 8) & 0xff ); 
        dw.setUint8(7, (c  & 0xff ));
        
        print("C Is  ", c);
    
        let s = mkstr(ptr, 8);
        this.serial.write(s, 8);
    },


    writeMultipleRegisters: function(requestFrame) {
        print("writeMultipleRegisters ");

        let ptr = RS485.calloc(100, 1);
        let dw = DataView.create(ptr, 0, 100);
        dw.setUint8(0, requestFrame.id); //id
        dw.setUint8(1, requestFrame.func); //fc

        dw.setUint16(2, requestFrame.address); // output address

        dw.setUint16(4, requestFrame.length); // quantity
        
        let c = RS485.crc16(ptr, 6);
        dw.setUint8(6, (c >> 8) & 0xff ); 
        dw.setUint8(7, (c  & 0xff ));
        
        print("C Is  ", c);
    
        let s = mkstr(ptr, 8);
        this.serial.write(s, 8);
    },


    processRequest: function(requestFrame) {
        print('Device Process Request', this.deviceId);

        if (requestFrame.func === MODBUS_FUNC_READ_COILS) {
            return this.readCoils(requestFrame);
        }

        if (requestFrame.func === MODBUS_FUNC_READ_DISCRETE_INPUTS) {
            return this.readDiscreteInputs(requestFrame);   
        }

        if (requestFrame.func === MODBUS_FUNC_READ_HOLDING_REGISTERS) {
            return this.readHoldingRegisters(requestFrame)
        }

        if (requestFrame.func === MODBUS_FUNC_READ_INPUT_REGISTERS) {
            return this.readInputRegisters(requestFrame);
        }

        if (requestFrame.func === MODBUS_FUNC_WRITE_SINGLE_COIL) {
            return this.writeSingleCoil(requestFrame);
        }

        if (requestFrame.func === MODBUS_FUNC_WRITE_SINGLE_REGISTER) {
            return this.writeSingleRegister(requestFrame);
        }

        if (requestFrame.func === MODBUS_FUNC_WRITE_MULTIPLE_COILS) {
            return this.writeMultipleCoils(requestFrame);
        }

        if (requestFrame.func === MODBUS_FUNC_WRITE_MULTIPLE_REGISTERS) {
            return this.writeMultipleRegisters(requestFrame);
        }

        // TODO: respond with unsupported code
    
        print("processing done");
    },

    processRequest2: function(requestFrame) {
        print('Device Process Request', this.deviceId);

        if (requestFrame.func === MODBUS_FUNC_READ_COILS) {

        }

        if (requestFrame.func === MODBUS_FUNC_READ_DISCRETE_INPUTS) {
            
        }

        if (requestFrame.func === MODBUS_FUNC_READ_HOLDING_REGISTERS) {
            
        }

        if (requestFrame.func === MODBUS_FUNC_READ_INPUT_REGISTERS) {
            
        }

        if (requestFrame.func === MODBUS_FUNC_WRITE_SINGLE_COIL) {
            
        }


        if (requestFrame.func === MODBUS_FUNC_WRITE_SINGLE_REGISTER) {
            
        }



        if (requestFrame.func === MODBUS_FUNC_WRITE_MULTIPLE_COILS) {
            
        }


        if (requestFrame.func === MODBUS_FUNC_WRITE_MULTIPLE_REGISTERS) {
            
        }


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
        this.serial.write(s, 6);
    
        print("processing done");
    }
};

