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

        this.responseBuffer = RS485.calloc(255, 1);
        this.responseView = DataView.create(this.responseBuffer, 0, 255);
        this.responseLength = 0;


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
       
        let n = Math.floor(requestFrame.length / 8); 

        if (requestFrame.length % 8 > 0) {
            n = n +  1;
        }

        print("Total bytes to respond", n);
        // TODO: dynamic length
        this.responseView.setUint8(2, n); // byte count
        this.responseLength += 1;
       
        //this.responseView.setUint8(3, this.coilsBuffer.getInt8(requestFrame.address));
        // this.responseLength += 1;

        let bitMerge = 0;
        let offset = 0;
        for (let i = 0; i < requestFrame.length; i++) {
            let value = this.coilsBuffer.getInt8(requestFrame.address + i);
            bitMerge = bitMerge | (value & 0x01);
            bitMerge = bitMerge << 1;

            if (i !== 0 && i % 8 === 0) {
                this.responseView.setUint8(3 + offset, bitMerge);
                this.responseLength += 1;
                bitMerge = 0;
                offset = offset + 1;
            }
        }

        if ( (requestFrame.length > 0  && 
              requestFrame.length % 8 === 0) ||
              requestFrame.length % 8 > 0) {
            this.responseView.setUint8(3 + offset, bitMerge);
                this.responseLength += 1;
                bitMerge = 0;
                offset = offset + 1;
        }

    },

    respond: function() {

    },


    readDiscreteInputs: function(requestFrame) {
        print("readDiscreteInputs ");
 
        let n = Math.floor(requestFrame.length / 8); 

        if (requestFrame.length % 8 > 0) {
            n = n +  1;
        }

        print("Total bytes to respond", n);
        // TODO: dynamic length
        this.responseView.setUint8(2, n); // byte count
        this.responseLength += 1;
       
        //this.responseView.setUint8(3, this.coilsBuffer.getInt8(requestFrame.address));
        // this.responseLength += 1;

        let bitMerge = 0;
        let offset = 0;
        for (let i = 0; i < requestFrame.length; i++) {
            let value = this.discreteInputsBuffer.getInt8(requestFrame.address + i);
            bitMerge = bitMerge | (value & 0x01);
            bitMerge = bitMerge << 1;

            if (i !== 0 && i % 8 === 0) {
                this.responseView.setUint8(3 + offset, bitMerge);
                this.responseLength += 1;
                bitMerge = 0;
                offset = offset + 1;
            }
        }

        if ((requestFrame.length > 0  && 
            requestFrame.length % 8 === 0) ||
            requestFrame.length % 8 > 0) {
            this.responseView.setUint8(3 + offset, bitMerge);
                this.responseLength += 1;
                bitMerge = 0;
                offset = offset + 1;
        }
         
    },

    readHoldingRegisters: function(requestFrame) {
        print("readHoldingRegisters ");

        this.responseView.setUint8(2, requestFrame.length * 2); // byte count
        this.responseLength += 1;
 

        print("total quantity ", requestFrame.length);
          
        for (let i = 0; i < requestFrame.length; i++) {
            print("reading register i ", i);
            this.responseView.setUint16(3 + (i * 2), this.holdingRegisters.getInt16(requestFrame.address + (i * 2)));
            this.responseLength += 2;
        }
        
    },


    readInputRegisters: function(requestFrame) {
        print("readInputRegisters ");

        this.responseView.setUint8(2, requestFrame.length * 2); // byte count
        this.responseLength += 1;
        
        //TODO: dynamic, based on requested quantity

        // this.responseView.setUint16(3, this.inputRegisters.getInt16(requestFrame.address));
        // this.responseLength += 2;

        print("total quantity ", requestFrame.length);
         
        //TODO: dynamic, based on requested quantity
        for (let i = 0; i < requestFrame.length; i++) {
            print("reading input register i ", i);
            this.responseView.setUint16(3 + (i * 2), this.inputRegisters.getInt16(requestFrame.address + (i * 2)));
            this.responseLength += 2;
        }
 
    },


    writeSingleCoil: function(requestFrame) {
        print("writeSingleCoil ");

        this.responseView.setUint16(2, requestFrame.address); // output address
        this.responseLength += 2;

        // Write to memory setUint8
         let value = requestFrame.dataView.getUint8();
         print("Value is ", value);
        // if (value === 0) { // off
        //     this.inputRegisters.dataView.setUint8(requestFrame.address,0);
        // } else {
        //     this.inputRegisters.dataView.setUint8(requestFrame.address,1);
        // }
        
        this.responseView.setUint16(4, 0xffff); // output value
        this.responseLength += 2;
    },

    writeSingleRegister: function(requestFrame) {
        print("writeSingleRegister ");

        this.responseView.setUint16(2, requestFrame.address); // output address
        this.responseLength += 2;
        this.responseView.setUint16(4, 0x0002); // register value
        this.responseLength += 2;
    },

    writeMultipleCoils: function(requestFrame) {
        print("writeMultipleCoils ");

        this.responseView.setUint16(2, requestFrame.address); // output address
        this.responseLength += 2;

        this.responseView.setUint16(4, requestFrame.length); // quantity
        this.responseLength += 2;
    },

    writeMultipleRegisters: function(requestFrame) {
        print("writeMultipleRegisters ");
        
        this.responseView.setUint16(2, requestFrame.address); // output address
        this.responseLength += 2;

        this.responseView.setUint16(4, requestFrame.length); // quantity
        this.responseLength += 2;
    },


    processRequest: function(requestFrame) {
        print('Device Process Request', this.deviceId);
        
        this.responseView.setUint8(0, requestFrame.id); //id
        this.responseView.setUint8(1, requestFrame.func); //fc

        this.responseLength = 2;


        if (requestFrame.func === MODBUS_FUNC_READ_COILS) {
            this.readCoils(requestFrame);
        }

        if (requestFrame.func === MODBUS_FUNC_READ_DISCRETE_INPUTS) {
            this.readDiscreteInputs(requestFrame);   
        }

        if (requestFrame.func === MODBUS_FUNC_READ_HOLDING_REGISTERS) {
            this.readHoldingRegisters(requestFrame)
        }

        if (requestFrame.func === MODBUS_FUNC_READ_INPUT_REGISTERS) {
            this.readInputRegisters(requestFrame);
        }

        if (requestFrame.func === MODBUS_FUNC_WRITE_SINGLE_COIL) {
            this.writeSingleCoil(requestFrame);
        }

        if (requestFrame.func === MODBUS_FUNC_WRITE_SINGLE_REGISTER) {
            this.writeSingleRegister(requestFrame);
        }

        if (requestFrame.func === MODBUS_FUNC_WRITE_MULTIPLE_COILS) {
            this.writeMultipleCoils(requestFrame);
        }

        if (requestFrame.func === MODBUS_FUNC_WRITE_MULTIPLE_REGISTERS) {
            this.writeMultipleRegisters(requestFrame);
        }

        let crc = RS485.crc16(this.responseBuffer, this.responseLength);
        print("crc Is  ", crc);
        this.responseView.setUint8(this.responseLength, (crc >> 8) & 0xff ); 
        this.responseView.setUint8(this.responseLength + 1, (crc  & 0xff ));
        
        this.responseLength += 2;

     
        let s = mkstr(this.responseBuffer, this.responseLength);
        print("response length ",  this.responseLength);
        print("output frame ", s);
        this.serial.write(s, this.responseLength);

        // TODO: respond with unsupported code
    
        print("processing done");
    }
};

