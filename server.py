from flask import Flask, request, make_response
from datetime import datetime
import os
import json
import serial

from plotter import Plotter

app = Flask(__name__)
current_dir = os.path.dirname(os.path.abspath(__file__))
save_dir = os.path.join(current_dir, 'saves')
plotter = None
# def generate_file_id():
#     return datetime.now().strftime('%Y-%m-%d-%H-%M-%S')

def id_from_data(data):
    return hex(hash(data))[2:]

    

@app.route('/save/', methods=['POST', 'GET'])
def save():
    data = request.form['data']

    fileid = id_from_data(data)
    filepath = os.path.join(save_dir, fileid + '.json')

    with open(filepath, 'w') as f:
        f.write(data)
    
    response = { 'fileid': fileid }
    res = make_response(json.dumps(response))
    res.headers['Access-Control-Allow-Origin'] = '*'

    return res
    

@app.route('/download/<fileid>', methods=['GET'])
def download(fileid):

    filename = fileid + '.json'
    filepath = os.path.join(save_dir, filename)

    with open(filepath, 'r') as f:
        data = f.read()

    res = make_response(data)
    res.headers['Content-Disposition'] =  'Attachment;filename=' + filename
    res.headers['Content-Type'] = 'application/json'

    return res
    
    
@app.route('/plot/', methods=['POST', 'GET'])
def plot():
    global plotter
    
    data = request.form['data']
    plotter.plot(data)

    res = make_response("done.")
    res.headers['Access-Control-Allow-Origin'] = '*'
    return res

if __name__ == '__main__':
    # try:
        # se = serial.Serial('/dev/cu.usbserial')
        # se.write("SP2;")
    plotter = Plotter()
    app.run(debug=True)

# finally:
    plotter.close()
    # del se
    print "closed serial, hopefully"
