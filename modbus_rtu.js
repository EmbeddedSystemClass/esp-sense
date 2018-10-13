let ModbusRTU = {

  calloc:  ffi('void *calloc(int, int)'), 
  
  init: function() {
      let ptr = this.calloc(256, 1);
      this.writeBuffer = DataView.create(ptr, 0, 256);
  },
}