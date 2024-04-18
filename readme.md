# Dublin Bikes

# Overview
- The aim of this website application is to allow users to find information on occupancy and weather information for Dublin Bikes.
- Using the Google Maps API, users can select the available stations around Dublin and find occupancy details on the selected station.
- Apart from occupancy and weather information, users are also given the route from the start and ending stations, along with displaying their intended actual departing and ending locations.
- Machine learning is implemented behind the scenes. Users can select a future time and date and results given are based on ML.

# Built with:
## *Front-end*:
- HTML, CSS, Javascript - language used to write the client-side code
- Plotly - library that provides methods to create interactive graph into html
- Google map api - api that loads the google map
- Maps Javascript API - used Directions Service object which contacts Google Maps direction service to request and return a path
- Places API- used for creating route
- Machine learning - 
## *Back-end*:
- Python - language used to write code in the flask app and sql engine 
- Flask - This was the python framework used to create server side endpoints which the data could be sent to. 
- APIs - Google maps, weather and JCDeceaux were used to scrape data which would be stored in the database and ultimately sent to server side endpoints using the flask app.
- Remote server - ec2
- Database - rds, mysqlworkbench
- SqlAlchemy - used for database management and executing queries that would return the relevant data which could be sent to the frontend.
- pymysql and paramiko - used for creating engine connection to rds from local machines.
- sshtunnel - used for creating ssh tunnels in python to connect to ec2 instances.
## *Machine Learning*:
- Pandas - This library was imported to manipulate the data frames to prepare the data for the models to be developed.
- Scikit learn - library used to facilitate the training of models and model evaluation.
- Sktime - library that provide time series training models

