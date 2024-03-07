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
    # lat = station['position']['lat']
    # lon = station['position']['lng']
    openWeather_API =f"https://api.openweathermap.org/data/2.5/weather?id=2964574&appid={API_key}"
    weather = requests.get(openWeather_API)
    weather_json = weather.json()
    return weather_json


def create_sqlTables():
    while True:
        try:
            engine = generate_mysqlEnginelocal(db='dbikes')
            with engine.connect() as conn:

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
                create_tb_availability = """
                CREATE TABLE IF NOT EXISTS availability(
                stationId INTEGER,
                status VARCHAR(256),
                lastUpdate INT,
                bikeStands INTEGER NOT NULL DEFAULT 0,
                bikeNum INTEGER NOT NULL DEFAULT 0 ,
                fetchTime INT,
                PRIMARY KEY(stationId, fetchTime),
                FOREIGN KEY(stationId) REFERENCES stations(stationId)
                );
            """

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
                PRIMARY KEY(stationId,fetchTime),
                FOREIGN KEY(stationId,fetchTime) REFERENCES availability(stationId,fetchTime)
                );
            """
                

                conn.execute(sqla.text(create_tb_stations))
                conn.execute(sqla.text(create_tb_availability))
                conn.execute(sqla.text(create_tb_currentWeather))
                conn.commit()
            break
        except Exception as e:
            print(e)
            engine = generate_mysqlEnginelocal()
            create_db = "CREATE DATABASE IF NOT EXISTS dbikes;"
            with engine.connect() as conn:
                conn.execute(sqla.text(create_db))


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
    windDeg,fetchTime) 
    VALUES(1,"{weather['weather'][0]['main']}",
    "{weather["weather"][0]["description"]}","{icon}",{temp},{pressure},
    {humidity},{visibility},{wind_speed},{wind_deg},{ft})"""
    connection.execute(sqla.text(stmt))
    #connection.commit()

if __name__ == '__main__':
    create_sqlTables()
    while True:
        try:
            stations = get_BikeData()
            if stations:
                currentFetchTime = datetime.timestamp(datetime.now())

                try:
                    engine = generate_mysqlEnginelocal('dbikes')
                    with engine.connect() as conn:
                         try:
                            weather = get_currentWeather()
                            if weather:
                                currentWeather_to_db(weather,conn,currentFetchTime)
                         except Exception as e:
                             print(e)
                             time.sleep(60)

                         for i in range(len(stations)):
                            station = stations[i]

                            if (i+1) % 60 == 0:
                                # reach the limit of openweather per minute
                                time.sleep(60)

                            try:
                                station_to_db(station,conn)
                            except:
                                pass # supppse that all of the stations are inside the table
                            # except Exception as e:
                            #     print(e)
                            try:
                                availability_to_db(station,conn,currentFetchTime)
                            except:
                                pass


                         conn.commit()
                         time.sleep(5*60)
                except Exception as e:
                    print(f'Fail to process the data:{e}')
                    time.sleep(60) # sleep for 60s
                  
        except Exception as e:
            print(e)
            time.sleep(60)
