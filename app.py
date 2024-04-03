from flask import Flask,render_template,jsonify
from scraper import sqlEngine
import pandas as pd
import requests
from config import *
from jinja2 import TemplateNotFound


app = Flask(__name__,static_url_path = '')
app.config.from_object('config')

# @app.route('/')
# def root():
#     engine = generate_mysqlEnginelocal('dbikes')
#     #return app.send_static_file('script.js')
#     stations_json = get_stations(engine)
#     #,MAPS_APIKEY=app.config['MAPS_APIKEY']
#     return render_template('default.html',stations = json.dumps(stations_json))


@app.route('/')
def root():
    try:
        return render_template("default.html")
    except TemplateNotFound:
        return "Default template not found", 404
    except Exception as e:
        return f"An error occurred: {str(e)}", 500

@app.route('/stations')
def stations():
    try:
        sqlCommand = """
            SELECT s.stationId, s.name, s.address, s.latitude, s.longtitude, s.banking,
            a.bikeNum, a.bikeStands, a.fetchTime, a.lastUpdate
            FROM stations s, availability a
            WHERE s.stationId = a.stationId
            ORDER BY a.fetchTime DESC, a.stationId
            LIMIT 114;
        """
        stations_json = sqlEngine.connect_to_rds(sqlCommand)
        if not stations_json:
            return jsonify({"error": "No stations found"}), 404
        return stations_json
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/stations/<int:station_id>/availability') #The current availibility of bikes at a given station
def station_availability(station_id):
    # Connect to the database
    try:
        sqlCommand = f'SELECT * FROM availability WHERE stationId = {station_id}'
        availability_data = sqlEngine.connect_to_rds(sqlCommand)
        # Assuming you have a way to convert the row data to a dictionary or you fetch it as such
        # If your data is not already a dict, you will need to convert it
        #availability_dict = [dict(row) for row in availability_data]
        return availability_data
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/weather')
def dublinWeather():
    try:
        sqlCommand = "SELECT * FROM currentWeather ORDER BY fetchTime DESC LIMIT 1;"
        currentWeather_json = sqlEngine.connect_to_rds(sqlCommand)
        if not currentWeather_json:
            return jsonify({"error": "No current weather data found"}), 404
        return currentWeather_json
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# def get_CurrentWeather(engine):
#     #engine = generate_mysqlEnginelocal('dbikes')
#     cw_df = pd.read_sql("SELECT * FROM currentWeather",con=engine)
#     cw_df.to_json('/static/currentWeather.json',orient='records',lines=True)

@app.route('/searchLocation/<loc>')
def searchLocation(loc):
    r = requests.get("https://maps.googleapis.com/maps/api/place/findplacefromtext/json",
        params={
            "fields": "formatted_address,name,geometry",
            "input": loc,
            "inputtype": "textquery",
            "locationbias": "circle:100000@53.34982,-6.2603", #100km from dublin
            "key": "AIzaSyBqVFiTmghTjDgdJQG11k3VXyLWdpZT4VA"
        })
    return r.json()

if __name__ == '__main__':
    app.run(debug=True)


    

