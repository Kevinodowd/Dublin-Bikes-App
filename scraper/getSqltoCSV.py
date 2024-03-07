from sqlalchemy import *
import pandas as pd
import time
from datetime import datetime
from sqlEngine import *

engineLocal = generate_mysqlEnginerds('dbikes')
# with engineLocal.connect() as conn:
# sql = "select * from stations limit 2;"
# Replace 'your_table_name' with the actual table name you want to read
table_name = 'stations'

# Use Pandas to read the table into a DataFrame
stations = pd.read_sql(table_name, con=engineLocal)
# Display the DataFrame
availability = pd.read_sql('availability',con=engineLocal)

currentWeather = pd.read_sql('currentWeather',con=engineLocal)

stations.to_csv('stations.csv', index=False)
availability.to_csv('availability.csv', index=False)
currentWeather.to_csv('currentWeather.csv', index=False)


