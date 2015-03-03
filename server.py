from flask import Flask, request, make_response
from datetime import datetime
import os
import json
import serial
from subprocess import Popen, PIPE, STDOUT

from plotter import Plotter

app = Flask(__name__)
current_dir = os.path.dirname(os.path.abspath(__file__))
save_dir = os.path.join(current_dir, 'saves')
plotter = None
# def generate_file_id():
#     return datetime.now().strftime('%Y-%m-%d-%H-%M-%S')

def id_from_data(data):
    return hex(hash(data))[2:]


def ACAOResponse(text):
    res = make_response(text)
    res.headers['Access-Control-Allow-Origin'] = '*'
    return res

@app.route('/save/', methods=['POST', 'GET'])
def save():
    data = request.form['data']

    fileid = id_from_data(data)
    filepath = os.path.join(save_dir, fileid + '.json')

    with open(filepath, 'w') as f:
        f.write(data)
    
    response = json.dumps({ 'fileid': fileid })
    # res = make_response(json.dumps(response))
    # res.headers['Access-Control-Allow-Origin'] = '*'
    return ACAOResponse(response)
    # return res
    

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

    # res = make_response("done.")
    # res.headers['Access-Control-Allow-Origin'] = '*'
    # return res
    return ACAOResponse("done.")


@app.route('/offsets/', methods=['POST', 'GET'])
def offsets():
    
    process = Popen(['./offsets/offsets'], stdin=PIPE, stdout=PIPE, stderr=STDOUT)
    out, er = process.communicate(input=request.form['data'])

    ret = { "success": process.returncode == 0 }
    
    try:
        ret["offsets"] = json.loads(out)
    except ValueError:
        ret["success"] = False

    # res = make_response(json.dumps(ret))
    # res.headers['Access-Control-Allow-Origin'] = '*'
    # return res
    res = json.dumps(ret)
    return ACAOResponse(res)

    # print p.stdout
    # print p.returncode

@app.route('/test/')
def test():
    res = json.dumps({'plotter': plotter is not None })
    return ACAOResponse(res)

if __name__ == '__main__':
    # try:
        # se = serial.Serial('/dev/cu.usbserial')
        # se.write("SP2;")
    try:
        plotter = Plotter()
    except OSError:
        print("No plotter found, going without.")

    app.run(debug=True)

    if plotter:
        plotter.close()
        print "closed serial, hopefully"
