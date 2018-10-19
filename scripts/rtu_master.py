#!/usr/bin/env python
# -*- coding: utf_8 -*-
"""
 Modbus TestKit: Implementation of Modbus protocol in python

 (C)2009 - Luc Jean - luc.jean@gmail.com
 (C)2009 - Apidev - http://www.apidev.fr

 This is distributed under GNU LGPL license, see license.txt
"""

import serial

import modbus_tk
import modbus_tk.defines as cst
from modbus_tk import modbus_rtu
import argparse
import time


PORT = 1
#PORT = '/dev/ttyp5'
PORT = '/dev/tty.wchusbserial1420'


# parser = argparse.ArgumentParser(description='Modbus Slave')
# parser.add_argument('ports',   type=str,  
#                    help='port name', nargs=1)
# args = parser.parse_args()

# print "First argument: %s" % args.ports

# PORT = args.ports[0]


def main():
    """main"""
    logger = modbus_tk.utils.create_logger("console")

    try:
        #Connect to the slave
        master = modbus_rtu.RtuMaster(
            serial.Serial(port=PORT, baudrate=9600, bytesize=8, parity='N', stopbits=1, xonxoff=0)
        )
        master.set_timeout(0.5)
        master.set_verbose(True)
        logger.info("connected")
        time.sleep(2)


        #logger.info(master.execute(1, cst.READ_HOLDING_REGISTERS, 0, 10))
        
        ##logger.info(master.execute(1, cst.READ_HOLDING_REGISTERS, 5, 1))

        #logger.info(master.execute(2, cst.READ_COILS, 1, 1))
        #logger.info(master.execute(2, cst.READ_COILS, 2, 1))
        #logger.info(master.execute(2, cst.READ_COILS, 2, 1))

        #logger.info(master.execute(2, cst.READ_DISCRETE_INPUTS, 1, 1))
        #logger.info(master.execute(1, cst.READ_HOLDING_REGISTERS, 0, 4))
        #logger.info(master.execute(1, cst.READ_INPUT_REGISTERS, 1, 1))
        
        logger.info(master.execute(1, cst.WRITE_SINGLE_COIL, 1, output_value=1))
        #logger.info(master.execute(1, cst.WRITE_SINGLE_REGISTER, 1, output_value=2))
        #logger.info(master.execute(1, cst.WRITE_MULTIPLE_COILS, 0, output_value=[1, 1]))
        #logger.info(master.execute(1, cst.WRITE_MULTIPLE_COILS, 0, output_value=[1, 1]))
        # logger.info(master.execute(1, cst.WRITE_MULTIPLE_COILS, 0, output_value=[1, 1]))

        #logger.info(master.execute(1, cst.WRITE_MULTIPLE_REGISTERS, 0, output_value=[1,2]))


        #send some queries
        #logger.info(master.execute(1, cst.READ_COILS, 0, 10))
        #logger.info(master.execute(1, cst.READ_DISCRETE_INPUTS, 0, 8))
        #logger.info(master.execute(1, cst.READ_INPUT_REGISTERS, 100, 3))
        #logger.info(master.execute(1, cst.READ_HOLDING_REGISTERS, 100, 12))
        #logger.info(master.execute(1, cst.WRITE_SINGLE_COIL, 7, output_value=1))
        #logger.info(master.execute(1, cst.WRITE_SINGLE_REGISTER, 100, output_value=54))
        #logger.info(master.execute(1, cst.WRITE_MULTIPLE_COILS, 0, output_value=[1, 1, 0, 1, 1, 0, 1, 1]))
        #logger.info(master.execute(1, cst.WRITE_MULTIPLE_REGISTERS, 100, output_value=xrange(12)))

    except modbus_tk.modbus.ModbusError as exc:
        logger.error("%s- Code=%d", exc, exc.get_exception_code())

if __name__ == "__main__":
    main()