let ModbusSlave = {
    deviceId: 0,
    dv_alloc: ffi('void *dv_alloc(int)'),
    getInt8: ffi('int dv_get_int8(void*, int)'),
    setInt8: ffi('int dv_set_int8(void*, int, int)'),
    getInt16: ffi('int dv_get_int16(void*, int)'),
    getInt32: ffi('int dv_get_int32(void*, int)'),
    setInt16: ffi('int dv_set_int16(void*, int, int)'),
    setInt32: ffi('int dv_set_int32(void*, int, int)'),
    getBuf: ffi('void* dv_getBuf(void*)'),
 

    init: function(deviceBuffers) {
        this.responseBuffer = RS485.calloc(255, 1);
        this.responseView = DataView.create(this.responseBuffer, 0, 255);
        this.dataBuffer = ModbusBuffer.dv_alloc(255);
        this.responseLength = 0;
        this.deviceBuffers = deviceBuffers;
        this.activeDeviceBuffer = null;
    },
    
    setHoldingRegister: function(address, value) {
        this.holdingRegisters.setUint16(address, value, false);
    },
 
 
    readCoils: function(requestFrame) {
        print("ReadCoils ");      
        let n = Math.floor(requestFrame.quantity / 8); 
        if (requestFrame.quantity % 8 > 0) {
            n = n +  1;
        }
        print("Total bytes to respond", n);
        ModbusSlave.setInt8(this.dataBuffer, 2, n);
        this.responseLength += 1;
        let bitMerge = 0;
        let offset = 0;
        for (let i = 0; i < requestFrame.quantity; i++) {
            let value = this.activeDeviceBuffer.getCoil(requestFrame.address + i);
            bitMerge = bitMerge << 1;
            bitMerge = bitMerge | (value & 0x01);
            if (i !== 0 && (i+1) % 8 === 0) {
                ModbusSlave.setInt8(this.dataBuffer, 3 + offset, bitMerge);
                this.responseLength += 1;
                bitMerge = 0;
                offset = offset + 1;
            }
        }

        if ( (requestFrame.quantity > 0  && 
              requestFrame.quantity % 8 === 0) ||
              requestFrame.quantity % 8 > 0) {
                  ModbusSlave.setInt8(this.dataBuffer, 3 + offset, bitMerge);

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
        ModbusSlave.setInt8(this.dataBuffer, 2, n);
        this.responseLength += 1;
        let bitMerge = 0;
        let offset = 0;
        for (let i = 0; i < requestFrame.quantity; i++) {
            let value = this.activeDeviceBuffer.getDiscrete(requestFrame.address + i);
            bitMerge = bitMerge | (value & 0x01);
            bitMerge = bitMerge << 1;
            if (i !== 0 && (i+1) % 8 === 0) {
                ModbusSlave.setInt8(this.dataBuffer, 3 + offset, bitMerge);
                this.responseLength += 1;
                bitMerge = 0;
                offset = offset + 1;
            }
        }
        if ((requestFrame.quantity > 0  && 
            requestFrame.quantity % 8 === 0) ||
            requestFrame.quantity % 8 > 0) {
            ModbusSlave.setInt8(this.dataBuffer, 3 + offset, bitMerge);
                this.responseLength += 1;
                bitMerge = 0;
                offset = offset + 1;
        }         
    },

    readHoldingRegisters: function(requestFrame) {
        ModbusSlave.setInt8(this.dataBuffer, 2, requestFrame.quantity * 2);
        this.responseLength += 1;
        print("loop start");
        for (let i = 0; i < requestFrame.quantity; i++) {
            let address = ((requestFrame.address + i) *2) -2;
            let value = this.activeDeviceBuffer.getHoldingRegisterUint16(address);
            print("addr & val",requestFrame.address + i, value);
            ModbusSlave.setInt16(this.dataBuffer, 3 + (i * 2), value);
            this.responseLength += 2;
        }
        print("loop end");
    },


    readInputRegisters: function(requestFrame) {
        print("readInputRegisters ");
        ModbusSlave.setInt8(this.dataBuffer, 2, requestFrame.quantity * 2);
        this.responseLength += 1;
        print("total quantity ", requestFrame.quantity);
        for (let i = 0; i < requestFrame.quantity; i++) {
            let address = ((requestFrame.address + i) *2) -2;
            let value = this.activeDeviceBuffer.getInputRegisterUint16(address);
            ModbusSlave.setInt16(this.dataBuffer, 3 + (i * 2), value);
            this.responseLength += 2;
        }
    },

    writeSingleRegister: function(requestFrame) {
        let register=[];
        let o={};
        print("writeSingleRegister ");
        ModbusSlave.setInt16(this.dataBuffer,2,requestFrame.address);
        this.responseLength += 2;
        let value = requestFrame.dataView.getUint16(0);
        print("Value received is ", value);   
        print("Write to ",requestFrame.address);
        this.activeDeviceBuffer.setHoldingRegisterUint16(requestFrame.address,value);
        ModbusSlave.setInt16(this.dataBuffer,4, value);
        this.responseLength += 2;
        o= {
            sid:requestFrame.id,
            lt: MODBUS_HOLDING_REGISTERS,
            v: value,
            a: requestFrame.address,

        };
        register.push(o);
        let res = MQTT.pub('/simulate/modbus', JSON.stringify(register));
        print('Published:', res ? 'yes' : 'no');

    },

    tempcoil:[],
    _setCoils: function(address, byteValue, quantity,requestFrame) {
        let o={};
        for (let j = 0; j < quantity; j++) {
            let bitValue = (byteValue & 0x01);
            print("_setCoils address ", address + j);
            print("_setCoils bitValue ", bitValue);
            print("_setCoils byteValue ", byteValue);
            byteValue = byteValue >> 1;
            this.activeDeviceBuffer.setCoil(address+j,bitValue);
            print("_setCoils byteValue >> ", byteValue);
            o={
                sid:requestFrame.id,
                lt: MODBUS_COILS,
                v: bitValue,
                a:address+j
            };
            this.tempcoil.push(o);

        }
    },

    
    writeSingleCoil: function(requestFrame) {
        let coil=[];
        let o={};
        print("writeSingleCoil ");
        ModbusSlave.setInt16(this.dataBuffer,2,requestFrame.address);
        this.responseLength+=2;
        let value = requestFrame.dataView.getUint16(0);
        print("Recieved coil",value);
        let v =(value && 0xffff0000) === 0xffff0000 ? 1 :0;
        o={
            sid:requestFrame.id,
            lt: MODBUS_COILS,
            v: v,
            a: requestFrame.address
        };
        this.activeDeviceBuffer.setCoil(requestFrame.address,v);
        ModbusSlave.setInt16(this.dataBuffer,4,value);
        this.responseLength+=2;
        coil.push(o);
        let res = MQTT.pub('/simulate/modbus', JSON.stringify(coil));
        print('Published:', res ? 'yes' : 'no');

    },

    writeMultipleCoils: function(requestFrame) {
        print("writeMultipleCoils ");
        ModbusSlave.setInt16(this.dataBuffer,2,requestFrame.address);
        this.responseLength += 2;
        ModbusSlave.setInt16(this.dataBuffer,4,requestFrame.quantity);
        this.responseLength += 2;
        let address=requestFrame.address;
        for (let i = 0; i < requestFrame.byteCount; i++) {
            let value = requestFrame.dataView.getUint8(i);
            print("**Value received is ", value);
            let bitsCount = 8;
            // check if last byte, then may have less coils/bit
            if (i === requestFrame.byteCount - 1) {
                bitsCount = requestFrame.quantity % 8;
            }
            address =  address + i * 8;
            this._setCoils(address, value, bitsCount,requestFrame);
        }

        let res = MQTT.pub('/simulate/modbus', JSON.stringify(this.tempcoil));
        print('Published:', res ? 'yes' : 'no');
        this.tempcoil=[];
    },
  

    writeMultipleRegisters: function(requestFrame) {
        print("writeMultipleRegisters ");
        ModbusSlave.setInt16(this.dataBuffer, 2, requestFrame.address);      
        this.responseLength += 2;
        print("loop start");
        let j=0;
        let registers=[];
        let o={};
        for (let i = 0; i < requestFrame.quantity; i++) {
            let address = requestFrame.address +i;
            let value = requestFrame.dataView.getUint16(j);
            this.activeDeviceBuffer.setHoldingRegisterUint16(address,value);
             o= {
                 sid:requestFrame.id,
                lt: MODBUS_HOLDING_REGISTERS,
                v: value,
                a: address
            }
            registers.push(o);
            j+=2;
        }
        
        let res = MQTT.pub('/simulate/modbus', JSON.stringify(registers));
        print('Published:', res ? 'yes' : 'no');
        ModbusSlave.setInt16(this.dataBuffer,4,requestFrame.quantity);
      
        this.responseLength+=2;
        print("loop end");
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
        ModbusSlave.setInt8(this.dataBuffer, 0, requestFrame.id);
        ModbusSlave.setInt8(this.dataBuffer, 1, requestFrame.func);
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
        print("res length", this.responseLength);
        let crc = RS485.crc16(ModbusSlave.getBuf(this.dataBuffer), this.responseLength);
        ModbusSlave.setInt8(this.dataBuffer, this.responseLength, (crc >> 8) & 0xff );        
        ModbusSlave.setInt8(this.dataBuffer, this.responseLength + 1, (crc  & 0xff));
        this.responseLength += 2;
        print("convert start");
        let s = mkstr(ModbusSlave.getBuf(this.dataBuffer), this.responseLength);
        print(">>", s);
        this.serial.write(s, this.responseLength);
    }
};

