let Buffer = {
    calloc: ffi('void *calloc(int, int)'),

    _dataBuffer: {
        init: function(config) {
            this.buffer = Buffer.calloc(config.size, 1);
            this.dataView = DataView.create(this.buffer, 0, config.size);
            this.size = config.size;
            this.offset = config.offset;
            this.le = config.le;
        },

        getInt8: function(address) {
            return this.dataView.getInt8(address - this.offset);
        },

        getInt16: function(address) {
            return this.dataView.getInt16(address - this.offset, this.le);
        },

        getUint16: function(address) {
            return this.dataView.getUInt16(address - this.offset, this.le);
        },
        
        setUint8: function(address, value) {
            return this.dataView.setUint8(address - this.offset, value);
        },
        setUint16: function(address, value, le) {
            return this.dataView.setUint16(address - this.offset, value, le);
        }
    },

    create: function(config) {
        let buffer =  Object.create(Buffer._dataBuffer); 
        buffer.init(config);
        return buffer;
    }
};