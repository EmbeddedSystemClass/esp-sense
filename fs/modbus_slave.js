let ModbusSlave = {
    deviceId: 0,

    init: function(deviceBuffers) {
        //this.deviceId = config.deviceId;

        this.responseBuffer = RS485.calloc(255, 1);
        this.responseView = DataView.create(this.responseBuffer, 0, 255);

        this.responseLength = 0;
        this.deviceBuffers = deviceBuffers;
        this.activeDeviceBuffer = null;
 
        // this.coils = Buffer.create(config.coils);
        // this.discreteInputs = Buffer.create(config.discreteInputs);
        // this.holdingRegisters = Buffer.create(config.holdingRegisters);
        // this.inputRegisters = Buffer.create(config.inputRegisters);
    },
    
    setHoldingRegister: function(address, value) {
        this.holdingRegisters.setUint16(address, value, false);
    },

    read: function() {
        print("read ", this.deviceId);
    }, 
    write: function() {
        print("write ", this.deviceId);
    },
 
    readCoils: function(requestFrame) {
        print("readCoils ");
       
        let n = Math.floor(requestFrame.quantity / 8); 

        if (requestFrame.quantity % 8 > 0) {
            n = n +  1;
        }

        print("Total bytes to respond", n);
        // TODO: dynamic length
        this.responseView.setUint8(2, n); // byte count
        this.responseLength += 1;
        
        let bitMerge = 0;
        let offset = 0;
        for (let i = 0; i < requestFrame.quantity; i++) {

            let value = this.activeDeviceBuffer.getCoil(requestFrame.address + i);

            bitMerge = bitMerge | (value & 0x01);
            bitMerge = bitMerge << 1;

            if (i !== 0 && i % 8 === 0) {
                this.responseView.setUint8(3 + offset, bitMerge);
                this.responseLength += 1;
                bitMerge = 0;
                offset = offset + 1;
            }
        }

        if ( (requestFrame.quantity > 0  && 
              requestFrame.quantity % 8 === 0) ||
              requestFrame.quantity % 8 > 0) {
            this.responseView.setUint8(3 + offset, bitMerge);
                this.responseLength += 1;
                bitMerge = 0;
                offset = offset + 1;
        }

    },
 
    readDiscreteInputs: function(requestFrame) {
        print("readDiscreteInputs ");
 
        let n = Math.floor(requestFrame.quantity / 8); 

        if (requestFrame.quantity % 8 > 0) {
            n = n +  1;
        }

        print("Total bytes to respond", n);
        // TODO: dynamic length
        this.responseView.setUint8(2, n); // byte count
        this.responseLength += 1;
        

        let bitMerge = 0;
        let offset = 0;
        for (let i = 0; i < requestFrame.quantity; i++) {
            let value = this.activeDeviceBuffer.getDiscrete(requestFrame.address + i);
            bitMerge = bitMerge | (value & 0x01);
            bitMerge = bitMerge << 1;

            if (i !== 0 && i % 8 === 0) {
                this.responseView.setUint8(3 + offset, bitMerge);
                this.responseLength += 1;
                bitMerge = 0;
                offset = offset + 1;
            }
        }

        if ((requestFrame.quantity > 0  && 
            requestFrame.quantity % 8 === 0) ||
            requestFrame.quantity % 8 > 0) {
            this.responseView.setUint8(3 + offset, bitMerge);
                this.responseLength += 1;
                bitMerge = 0;
                offset = offset + 1;
        }
         
    },

    readHoldingRegisters: function(requestFrame) {
        this.responseView.setUint8(2, requestFrame.quantity * 2); // byte count
        this.responseLength += 1;
 
  
        for (let i = 0; i < requestFrame.quantity; i++) {
            let address = requestFrame.address + (i * 2);
            //print("reading address  ", address);

            let value = this.activeDeviceBuffer.getHoldingRegisterUint16(address);

            print("addr & val", addr, value);
            
            this.responseView.setUint16(3 + (i * 2), value);
            this.responseLength += 2;
        }
        
    },


    readInputRegisters: function(requestFrame) {
        print("readInputRegisters ");

        this.responseView.setUint8(2, requestFrame.quantity * 2); // byte count
        this.responseLength += 1;
        
        //TODO: dynamic, based on requested quantity
 

        print("total quantity ", requestFrame.quantity);
         
        //TODO: dynamic, based on requested quantity
        for (let i = 0; i < requestFrame.quantity; i++) {
            print("reading input register i ", i);
            let value = this.activeDeviceBuffer.getInputRegisterUint16(requestFrame.address + (i * 2));
            this.responseView.setUint16(3 + (i * 2), value);
            this.responseLength += 2;
        }
 
    },


    writeSingleCoil: function(requestFrame) {
        print("writeSingleCoil ");

        
        this.responseView.setUint16(2, requestFrame.address); // output address
        this.responseLength += 2;

        // Write to memory setUint8
         let value = requestFrame.dataView.getUint16(0);
         print("Value received is ", value);
        if (value === 0) { // off
            this.inputRegisters.setUint8(requestFrame.address,0);
        } else {
            this.inputRegisters.setUint8(requestFrame.address,1);
        }
        
        this.responseView.setUint16(4, value); // output value
        this.responseLength += 2;
    },

    writeSingleRegister: function(requestFrame) {
        print("writeSingleRegister ");

        this.responseView.setUint16(2, requestFrame.address); // output address
        this.responseLength += 2;
        let value = requestFrame.dataView.getUint16(0);
         print("Value received is ", value);
        
         this.holdingRegisters.setUint16(requestFrame.address, value);
         
        this.responseView.setUint16(4, value); // register value
        this.responseLength += 2;
    },

    _setCoils: function(address, byteValue, quantity) {
        for (let j = 0; j < quantity; j++) {
            let bitValue = (byteValue & 0x01);
            print("_setCoils address ", address + j);
            print("_setCoils bitValue ", bitValue);
            print("_setCoils byteValue ", byteValue);
            byteValue = byteValue >> 1;

            print("_setCoils byteValue >> ", byteValue);
            // this.coils.setUint8(address + j, bitValue);
             
            this.coils.setUint8(address + j, bitValue);
        }
    },

    writeMultipleCoils: function(requestFrame) {
        print("writeMultipleCoils ");

        this.responseView.setUint16(2, requestFrame.address); // output address
        this.responseLength += 2;

        let address = requestFrame.address;
        
        for (let i = 0; i < requestFrame.byteCount; i++) {
            let value = requestFrame.dataView.getUint8(i);
            print("**Value received is ", value);

            let bitsCount = 8;

            // check if last byte, then may have less coils/bit
            if (i === requestFrame.byteCount - 1) {
                bitsCount = requestFrame.quantity % 8;
            }

            address =  address + i * 8;

            this._setCoils(address, value, bitsCount);
           }

        this.responseView.setUint16(4, requestFrame.quantity); // quantity
        this.responseLength += 2;
    },

    writeMultipleRegisters: function(requestFrame) {
        print("writeMultipleRegisters ");
        
        let address = requestFrame.address;
        
        for (let i = 0; i < requestFrame.quantity; i++) {
            let value = requestFrame.dataView.getUint16(i * 2);
            
            print("**Value received is ", value);

            print("**Address   is ", address);
            
            this.holdingRegisters.setUint16(address, value);
            address =  address + 2;
        }

        this.responseView.setUint16(2, requestFrame.address); // output address
        this.responseLength += 2;

        this.responseView.setUint16(4, requestFrame.quantity); // quantity
        this.responseLength += 2;
    },


    processRequest: function(requestFrame) {
        if (requestFrame.id < 1 || requestFrame.id > 247) {
            print('error, slave id out of bound');
            return;
        }

        this.activeDeviceBuffer =  this.deviceBuffers[requestFrame.id];

        if (!this.activeDeviceBuffer || this.activeDeviceBuffer === null) {
            print("Slave not found",  requestFrame.id);
            return;
        }
        
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
        //print("crc Is  ", crc);
        this.responseView.setUint8(this.responseLength, (crc >> 8) & 0xff ); 
        this.responseView.setUint8(this.responseLength + 1, (crc  & 0xff ));
        
        this.responseLength += 2;

     
        let s = mkstr(this.responseBuffer, this.responseLength);
        //print("response length ",  this.responseLength);
        print(">>", s);
        this.serial.write(s, this.responseLength);

        // TODO: respond with unsupported code
    
    }
};

