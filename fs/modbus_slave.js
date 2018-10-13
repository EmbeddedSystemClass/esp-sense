let ModbusHelper = {
    calloc: ffi('void *calloc(int, int)'),
    crc16: ffi('int crc16(void *, int)'),
 
    _dataBuffer: {
        getInt8: function(address) {
            return this.dataView.getInt8(address - this.offset);
        },

        getInt16: function(address) {
            return this.dataView.getInt16(address - this.offset, this.le);
        }
    },

    createBuffer: function(config) {
        let memory =  Object.create(ModbusHelper._dataBuffer);
        memory.buffer = RS485.calloc(config.size, 1);
        memory.dataView = DataView.create(memory.buffer, 0, config.size);
        memory.size = config.size;
        memory.offset = config.offset;
        memory.le = config.le;
        return memory;
    }
};

let ModbusSlave = {
    deviceId: 0,

    init: function(config) {
        this.deviceId = config.deviceId;
        this.ptr = RS485.calloc(255, 1);
        this.dw = DataView.create(this.ptr, 0, 255);

        this.coilsBuffer = ModbusHelper.createBuffer(config.coils);

        this.discreteInputsBuffer = ModbusHelper.createBuffer(config.discreteInputs);

        this.holdingRegisters = ModbusHelper.createBuffer(config.holdingRegisters);

        this.inputRegisters = ModbusHelper.createBuffer(config.inputRegisters);
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
        let ptr = RS485.calloc(255, 1);
        let dw = DataView.create(ptr, 0, 255);
 
        dw.setUint8(0, requestFrame.id); //id
        dw.setUint8(1, requestFrame.func); //fc
        dw.setUint8(2, 1); // byte count

        // dw.setUint8(3, 1); // data

        dw.setUint8(3, this.coilsBuffer.getInt8(requestFrame.address));
        
        //dw.setUint16(4, 0xffff); //crc
        let c = RS485.crc16(ptr, 4);
        dw.setUint8(4, (c >> 8) & 0xff ); 
        dw.setUint8(5, (c  & 0xff ));
        
        print("C Is  ", c);
    
        let s = mkstr(ptr, 6);
        this.serial.write(s, 6);
    },

    respond: function() {

    },


    readDiscreteInputs: function(requestFrame) {
        print("readDiscreteInputs ");

        let ptr = RS485.calloc(100, 1);
        let dw = DataView.create(ptr, 0, 100);
        dw.setUint8(0, requestFrame.id); //id
        dw.setUint8(1, requestFrame.func); //fc
        dw.setUint8(2, 1); // byte count

        //dw.setUint8(3, 1); // data

        dw.setUint8(3, this.discreteInputsBuffer.getInt8(requestFrame.address));

        
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

        //dw.setUint8(3, 1); // data
        //dw.setUint8(4, 0); // data
        dw.setUint16(3, this.holdingRegisters.getInt16(requestFrame.address));
        
        
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

        // dw.setUint8(3, 1); // data
        // dw.setUint8(4, 0); // data
        
        dw.setUint16(3, this.inputRegisters.getInt16(requestFrame.address));


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
    }
};

