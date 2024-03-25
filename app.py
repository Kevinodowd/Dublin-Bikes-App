from flask import Flask,render_template,jsonify
from scraper import sqlEngine
import pandas as pd
import mysql.connector
import requests

app = Flask(__name__,static_url_path = '')
app.config.from_object('config')

# @app.route('/')
# def root():
#     engine = generate_mysqlEnginelocal('dbikes')
#     #return app.send_static_file('script.js')
#     stations_json = get_stations(engine)
#     #,MAPS_APIKEY=app.config['MAPS_APIKEY']
#     return render_template('default.html',stations = json.dumps(stations_json))

mysql_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '15040748',
    'database': 'dbikes'
}

@app.route('/')
def root():
    return render_template("default.html")

@app.route('/stations')
def stations():

    connection = mysql.connector.connect(**mysql_config)
    cursor = connection.cursor()
    sqlCommand = """
   select s.stationId,s.name,s.address,s.latitude,s.longtitude,s.banking,a.bikeNum,
    a.bikeStands,a.fetchTime,a.lastUpdate
    from stations s, availability a
    where s.stationId =a.stationId
	order by a.fetchTime desc,a.stationId
    limit 114;
        """
    cursor.execute(sqlCommand)
    stations_json = cursor.fetchall()

    return stations_json

@app.route('/stations/<int:station_id>/availability') #The current availibility of bikes at a given station
def station_availability(station_id):
    # Connect to the database
    try:
        connection = mysql.connector.connect(**mysql_config)
        cursor = connection.cursor()
        cursor.execute(f'SELECT * FROM availability WHERE stationId = {station_id}')
        availability_data = cursor.fetchall()
        # Assuming you have a way to convert the row data to a dictionary or you fetch it as such
        # If your data is not already a dict, you will need to convert it
        #availability_dict = [dict(row) for row in availability_data]
        return jsonify(availability_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        connection.close()


@app.route('/weather')
def dublinWeather():
    connection = mysql.connector.connect(**mysql_config)
    cursor = connection.cursor()
    sqlCommand = """
        select * from currentWeather order by fetchTime desc limit 1;
        """
    cursor.execute(sqlCommand)
    currentWeather_json = cursor.fetchall()

    return currentWeather_json

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

# def get_CurrentWeather(engine):
#     #engine = generate_mysqlEnginelocal('dbikes')
#     cw_df = pd.read_sql("SELECT * FROM currentWeather",con=engine)
#     cw_df.to_json('/static/currentWeather.json',orient='records',lines=True)



if __name__ == '__main__':
    app.run(debug=True)
    # engine = generate_mysqlEnginelocal('dbikes');
    # with engine.connect():
    #     # get_CurrentWeather(engine)
    #     get_stations(engine)


# @app.route('/available')
# def get_stations(engine):
#     #engine = generate_mysqlEnginelocal('dbikes')

#     stations_df = pd.read_sql("SELECT * FROM stations",con=engine)
#     stations_json = stations_df.to_dict(orient='records')
#     return stations_json
