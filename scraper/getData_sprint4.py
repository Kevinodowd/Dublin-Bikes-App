import requests
import time
from datetime import datetime
import sqlalchemy as sqla
from sqlEngine import *

def get_BikeData():
    api_key = '77498ad73a059313187a3b3aee1216992bd5d382'
    contract_name = 'Dublin'
    stations_url = f'https://api.jcdecaux.com/vls/v1/stations?contract={contract_name}&apiKey={api_key}'
    stations = requests.get(stations_url)

    if stations.status_code == 200:
        json_data = stations.json()
        return json_data
    else:
        print(f'Error:{stations.status_code}')
        return None

def get_currentWeather():
    API_key = "562ab37b2d3e97861c08f878d678780f"
    openWeather_API =f"https://api.openweathermap.org/data/2.5/weather?id=2964574&appid={API_key}"
    weather = requests.get(openWeather_API)

    if weather.status_code == 200:
        weather_json = weather.json()
        return weather_json
    else:
        print(f'Error:{weather.status_code}')
        return None

def create_db():
    engine = generate_mysqlEnginerds()
    with engine.connect() as conn:
        create_db = "CREATE DATABASE IF NOT EXISTS dbikes;"
        conn.execute(sqla.text(create_db))
        conn.commit()

def get_weatherForecast():
    API_key = "562ab37b2d3e97861c08f878d678780f"
    openWeather_API =f"https://api.openweathermap.org/data/2.5/forecast?lat=53.3498&lon=-6.2603&appid={API_key}"
    weather = requests.get(openWeather_API)

    if weather.status_code == 200:
        weather_json = weather.json()
        return weather_json
    else:
        print(f'Error:{weather.status_code}')
        return None

def create_stations_tb(conn):
    create_tb_stations = """
                CREATE TABLE IF NOT EXISTS stations(
                stationId INTEGER,
                name VARCHAR(256),
                address VARCHAR(256),
                latitude FLOAT NOT NULL,
                longtitude FLOAT NOT NULL,
                banking BOOLEAN,
                PRIMARY KEY(stationId)
                );
                """
    conn.execute(sqla.text(create_tb_stations))
    conn.commit()

def create_availability_tb(conn):
    create_tb_availability = """
                CREATE TABLE IF NOT EXISTS availability(
                stationId INTEGER,
                status VARCHAR(256),
                lastUpdate INT,
                bikeStands INTEGER NOT NULL DEFAULT 0,
                bikeNum INTEGER NOT NULL DEFAULT 0 ,
                fetchTime INT,
                PRIMARY KEY(stationId, fetchTime)
                );
                """
    conn.execute(sqla.text(create_tb_availability))
    conn.commit()

def create_currentWeather_tb(conn):
    create_tb_currentWeather = """
                CREATE TABLE IF NOT EXISTS currentWeather(
                stationId INTEGER,
                weather VARCHAR(256) NOT NULL,
                description VARCHAR(256),
                icon VARCHAR(256),
                temperature DOUBLE NOT NULL,
                pressure DOUBLE,
                humidity FLOAT,
                windSpeed FLOAT DEFAULT 0,
                windDeg DOUBLE DEFAULT 0,
                visibility DOUBLE DEFAULT 0,
                fetchTime INT,
                lastUpdate INT,
                PRIMARY KEY(stationId,fetchTime)
                );
                """
    conn.execute(sqla.text(create_tb_currentWeather))
    conn.commit()

def create_weatherForecast_tb(conn):
    create_tb_weatherForecast = """
                CREATE TABLE IF NOT EXISTS weatherForecast(
                stationId INTEGER,
                weather VARCHAR(256) NOT NULL,
                description VARCHAR(256),
                icon VARCHAR(256),
                temperature DOUBLE NOT NULL,
                pressure DOUBLE,
                humidity FLOAT,
                windSpeed FLOAT DEFAULT 0,
                windDeg DOUBLE DEFAULT 0,
                visibility DOUBLE DEFAULT 0,
                fetchTime INT,
                forecastTime INT,
                PRIMARY KEY(stationId,forecastTime)
                );
                """
    conn.execute(sqla.text(create_tb_weatherForecast))
    conn.commit()

def station_to_db(station,connection):
    stmt = f"""INSERT INTO stations(stationId,name,address,latitude,longtitude,banking) 
    VALUES({station['number']},"{station['name']}","{station['address']}",
    {station['position']['lat']},{station['position']['lng']},
    {int(station['banking'])})"""
    connection.execute(sqla.text(stmt))
    #connection.commit()

def availability_to_db(station,connection,ft):
    stmt = f"""INSERT INTO availability(stationId,status,lastUpdate,bikeStands,bikenum,fetchTime) 
    VALUES({station['number']},"{station['status']}","{station['last_update']//1000}",
    {station['available_bike_stands']},{station['available_bikes']},{ft})"""
    connection.execute(sqla.text(stmt))
    #connection.commit()

def currentWeather_to_db(weather,connection,ft):
    icon = weather.get("weather",[{}])[0].get("icon",'')
    visibility = weather.get("visibility", -1)
    wind_deg = weather.get("wind", {}).get("deg", None)
    wind_speed = weather.get("wind",{}).get("speed",None)
    humidity = weather.get("main",{}).get("humidity",None)
    pressure = weather.get("main",{}).get("pressure",None)
    temp = weather.get("main",{}).get("temp",None)

    stmt = f"""INSERT INTO currentWeather(stationId,weather,description,icon,temperature,pressure,humidity,visibility,windSpeed,
    windDeg,fetchTime,lastUpdate) 
    VALUES(1,"{weather['weather'][0]['main']}",
    "{weather["weather"][0]["description"]}","{icon}",{temp},{pressure},
    {humidity},{visibility},{wind_speed},{wind_deg},{ft},{weather['dt']})"""
    connection.execute(sqla.text(stmt))
    #connection.commit()

def weatherForecast_to_db(weather,connection,ft):

    icon = weather.get("weather",[{}])[0].get("icon",'')
    visibility = weather.get("visibility", -1)
    wind_deg = weather.get("wind", {}).get("deg", None)
    wind_speed = weather.get("wind",{}).get("speed",None)
    humidity = weather.get("main",{}).get("humidity",None)
    pressure = weather.get("main",{}).get("pressure",None)
    temp = weather.get("main",{}).get("temp",None)

    stmt = f"""INSERT INTO weatherForecast(stationId,weather,description,icon,temperature,pressure,humidity,visibility,windSpeed,
    windDeg,fetchTime,forecastTime)
    VALUES(1,"{weather['weather'][0]['main']}",
    "{weather["weather"][0]["description"]}","{icon}",{temp},{pressure},
    {humidity},{visibility},{wind_speed},{wind_deg},{ft},{weather['dt']})"""

    print('================================')
    print(stmt)
    print()
    print()
    connection.execute(sqla.text(stmt))

if __name__ == '__main__':
    #create_db()
    engine = generate_mysqlEnginerds('dbikes')

    with engine.connect() as conn:
        try:
            create_stations_tb(conn)
            create_availability_tb(conn)
            create_currentWeather_tb(conn)
            create_weatherForecast_tb(conn)

            #clear the old weatherforecast and stations table
            conn.execute(sqla.text("DELETE FROM stations;"))
            conn.execute(sqla.text("DELETE FROM weatherForecast;"))
            stations = get_BikeData()

            #scrape other data
            if stations:

                currentFetchTime = datetime.timestamp(datetime.now())

                try:
                    weather = get_currentWeather()
                    if weather:
                        currentWeather_to_db(weather,conn,currentFetchTime)
                except Exception as e:
                    print(e)
                    time.sleep(60)

                try:
                    weatherForecast = get_weatherForecast()
                    if weatherForecast:
                        weather_forecast= weatherForecast['list']
                        for weather in weather_forecast:
                            #print(weather)
                            weatherForecast_to_db(weather,conn,currentFetchTime)
                except Exception as e:
                    #print(e)
                    time.sleep(30)


                for i in range(len(stations)):
                    station = stations[i]
                    station_to_db(station,conn)
                    #reach the limit of openWeather api: 60 data per minutes
                    if (i+1) % 60 == 0:
                        print('Hit the openWeather limit~~')
                        time.sleep(60)

                    try:
                        availability_to_db(station,conn,currentFetchTime)
                    except Exception as e:
                        print(e)

                    # try:
                    #     currentWeather = get_currentWeather(station)
                    #     if currentWeather:
                    #         currentWeather_to_db(currentWeather,station,conn,currentFetchTime)
                    #
                    # except Exception as e:
                    #     print(f'Fail to fetch current weather for station {station["number"]}...')
                    #     time.sleep(60)

        except Exception as e:
            print(e)
        conn.commit()
    print("Success in updating~~")
