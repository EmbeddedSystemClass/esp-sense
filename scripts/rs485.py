import serial

COM_PORT = '/dev/cu.wchusbserial1420'

s = serial.Serial(COM_PORT)
while True:
    s.write("welcome".encode())
    res = s.readline()
    print(res)