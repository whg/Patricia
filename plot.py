#! /usr/bin/env python
from __future__ import print_function

import sys
import serial
import json
    

# if len(sys.argv) < 2:
#     print("no file to print")


    
def digital2real(p):
    """
    Takes a point from paper.js's system, which looks like:
    ['Segment', 415.69219, 330]

    returns a point that has been converted to Roland's system
    """

    mult = 10
    x = p[1] * mult
    y = 10320 - (p[2] * mult)
    return x, y

# class Plotter(object):
#     def __init__(self):
#         self.se = serial.Serial('/dev/cu.usbserial')
    
def plot(se, data):
    # with open(sys.argv[1], 'r') as f:
        
        # se = serial.Serial('/dev/cu.usbserial')

    paths = json.loads(data)

    for path in paths:
        se.write("PU%d,%d;" % digital2real(path[0]))
        for p in path:
            # se.write("PD%d,%d;" % (p[1]*10, p[2]*10))
            se.write("PD%d,%d;" % digital2real(p))

    se.write("PU;")

    

# if __name__ == '__main__':
#     try:
#         plotfile(sys.argv[1])
#     except IndexError:
#         print("no file to print")
