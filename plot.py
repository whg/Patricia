#! /usr/bin/env python
from __future__ import print_function

import sys


# if len(sys.argv) < 2:
#     print("no file to print")


    
def digital2Real(p):
    """
    Takes a point from paper.js's system, which looks like:
    ['Segment', 415.69219, 330]

    returns a point that has been converted to Roland's system
    """

    mult = 10
    x = p[1] * mult
    y = 10320 - (p[2] * mult)
    return x, y


try:
    with open(sys.argv[1], 'r') as f:
        import serial
        import json
        
        se = serial.Serial('/dev/cu.usbserial')

        paths = json.loads(f.read())

        for path in paths:
            se.write("PU%d,%d;" % digital2Real(path[0]))
            for p in path:
                # se.write("PD%d,%d;" % (p[1]*10, p[2]*10))
                se.write("PD%d,%d;" % digital2Real(p))

        se.write("PU")
except IndexError:
    print("no file to print")
