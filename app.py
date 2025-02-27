from flask import Flask, render_template, jsonify
from scraper import sqlEngine
import sqlalchemy as sqla
import pandas as pd
import requests
from config import *
from jinja2 import TemplateNotFound
from model_training import get_model_predict
from config import *


app = Flask(__name__, static_url_path='')
app.config.from_object('config')

@app.route('/')
def root():
    try:
        MAPS_APIKEY = app.config['MAPS_APIKEY']
        return render_template("default.html",MAPS_APIKEY=MAPS_APIKEY)
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

        stations_json = sqlEngine.ec2_to_rds(sqlCommand);
        if not stations_json:
            return jsonify({"error": "No stations found"}), 404
        return stations_json
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/stations/<int:station_id>/availability')
def station_availability(station_id):
    try:
        sqlCommand = f'SELECT * FROM availability WHERE stationId = {station_id}'
        availability_data = sqlEngine.ec2_to_rds(sqlCommand)
        return availability_data
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/weather')
def dublinWeather():
    try:
        sqlCommand = "SELECT * FROM currentWeather ORDER BY fetchTime DESC LIMIT 1;"
        currentWeather_json = sqlEngine.ec2_to_rds(sqlCommand)
        if not currentWeather_json:
            return jsonify({"error": "No current weather data found"}), 404
        return currentWeather_json
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/searchLocation/<loc>')
def searchLocation(loc):
    r = requests.get("https://maps.googleapis.com/maps/api/place/findplacefromtext/json",
                     params={
                         "fields": "formatted_address,name,geometry",
                         "input": loc,
                         "inputtype": "textquery",
                         "locationbias": "circle:100000@53.34982,-6.2603",  
                         "key": "AIzaSyBqVFiTmghTjDgdJQG11k3VXyLWdpZT4VA"
                     })
    return r.json()


@app.route('/predict')
def get_predict():
    try:
        prediction = get_model_predict()      
        if not prediction:
                return jsonify({"error": "No predictions."}), 404
        
        return jsonify(prediction)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
