import pymodbus
import serial
import time
from pymodbus.pdu import ModbusRequest
from pymodbus.client.sync import ModbusSerialClient as ModbusClient #initialize a serial RTU client instance
from pymodbus.transaction import ModbusRtuFramer

import logging
logging.basicConfig()
log = logging.getLogger()
log.setLevel(logging.DEBUG)

#count= the number of registers to read
#unit= the slave unit this request is targeting
#address= the starting address to read from

PORT= "COM8"

client= ModbusClient(method = "rtu", port=PORT, 
                                     stopbits = 1, 
                                     bytesize = 8, 
                                     parity = 'N',
                                     baudrate=19200,
                                     timeout = 10)

#Connect to the serial modbus server
connection = client.connect()
print( connection)

#Starting add, num of reg to read, slave unit.
# result= client.read_holding_registers(0x00, 5 ,unit= 0x01)
# print(result)

#Starting add, num of reg to read, slave unit.
#result= client.read_holding_registers(18,11,unit= 1)
#print(result)
# print(result)
#result = client.read_discrete_inputs(1,5, unit=1)
#print(rr)

# client.write_coil(0x00, True, unit= 0x01)

# client.write_coils(0x00, [True, False, True, True, False], unit= 0x01)

#result= client.read_coils(1,1,unit= 0x01)
#result = client.read_discrete_inputs(2,1, unit=1)
#result= client.read_holding_registers(11,1 ,unit=1)
#result=client.read_input_registers(2,1,unit=1)
#result=client.write_coil(1,0,unit=1)
#result=client.write_register(1,1111,unit=2)
#result=client.write_coils(1,[0,0,0,0,0],unit=3)
result=client.write_registers(15,[12,23,34,45,56],unit=5)
print(result)

# client.write_registers(0x00, [1,2,3,4,5,6], unit= 0x01)

# for x in range(0, 30):
#     print ("We're on time %d" % (x))
#     client.write_registers(0x00, [1,2,3,4,5,6], unit= 0x01)
#     time.sleep(1)


#Closes the underlying socket connection
client.close()
