#! /usr/bin/env python
from __future__ import print_function

import sys
import serial
import json
from chiplotle.tools.plottertools import instantiate_plotters
from chiplotle.plotters.drawingplotter import _DrawingPlotter
from scipy.spatial import KDTree

class DXY980(_DrawingPlotter):
    def __init__(self, ser, **kwargs):
        self.allowedHPGLCommands = tuple(['\x1b.', 'AA','AR','CA','CI','CP',
         'CS','DC','DF','DI','DP','DR','DT','EA','ER','EW','FT','IM','IN',
         'IP','IW','LB','LT','OA','OC','OD','OE','OF','OH','OI','OO','OP',
         'OS','OW','PA','PU','PD','PR','PS','PT','RA','RO','RR','SA','SC',
         'SI','SL','SM','SP','SR','SS','TL','UC','VS','WG','XT','YT'])
        _DrawingPlotter.__init__(self, ser, **kwargs)
        self.type = "DXY-980"

    
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


def orderpaths(paths):

    ret = []
    # strip the first element (see above)
    pathpoints = [map(lambda p: p[1:], path) for path in paths]

    starts = [path[0] for path in pathpoints]
    ends = [path[-1] for path in pathpoints]

    import kdtree

    tree = kdtree.create(starts + ends)

    lpi = 0
    ret = [paths[lpi]]
    # laststart = starts.pop(lpi)

    tree.remove(starts[lpi])
    tree.remove(ends[lpi])
    wasstart = True
    for i in range(len(paths)-1):
        v = tree.search_nn(ends[lpi] if wasstart else starts[lpi])
        if not v:
            continue
        try:
            lpi = starts.index(v.data)
            wasstart = True
        except ValueError:
            lpi = ends.index(v.data)
            wasstart = False

        tree = tree.remove(starts[lpi])
        tree = tree.remove(ends[lpi])

        # i have a feeling that the order of the path should be reversed
        # if wasstart is False...
        ret.append(paths[lpi])

    return ret
    
def paper2hpgl(paperjson):
    data = json.loads(paperjson)
    comms = []
    for pen, paths in data.items():
        comms.append("SP%s;" % pen)
        
        paths = orderpaths(paths)
        
        for path in paths:
            comms.append("PU%d,%d;" % digital2real(path[0]))

            for p in path:
                comms.append("PD%d,%d;" % digital2real(p))

            comms.append("PU;")

    comms.append("SP0;")
    return str("".join(comms))

class Plotter(object):
    def __init__(self):
        # print("constucting...")
        # self.se = serial.Serial('/dev/cu.usbserial')
        # self.device = DXY980(self.se)
        plotters = instantiate_plotters()
        if len(plotters) > 0:
            self.device = plotters[0]
        else:
            raise Exception("No plotters found!")

    def close(self):
        # self.se.close()
        pass
    
    def plot(self, data):
        hpgl = paper2hpgl(data)
        self.device.write(hpgl)
        # call flush() to wait till all data is written before exiting...
        self.device._serial_port.flush()
        
    

# if __name__ == '__main__':
#     try:
#         plotfile(sys.argv[1])
#     except IndexError:
#         print("no file to print")
