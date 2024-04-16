import json
import pandas as pd
from scraper import sqlEngine
import pickle
import numpy as np
from time import time

def get_model_predict():
    def get_stationId():
        sqlCommand = f'SELECT stationId FROM stations;'
        stationId = json.loads(sqlEngine.ec2_to_rds(sqlCommand))
        stationId = [x[0] for x in stationId]
        return stationId

    def clean_data():
        sqlCommand = f'SELECT * FROM weatherForecast;'
        data = json.loads(sqlEngine.ec2_to_rds(sqlCommand))
        data = pd.DataFrame(data)
        data.columns = ['stationId', 'weather', 'description', 'icon', 'temperature', 'pressure', 'humidity', 'windSpeed', 'windDeg', 'visibility', 'fetchTime', 'forecastTime']
        data = pd.get_dummies(data, columns=['description'])
        X_train = data.drop(['stationId','fetchTime','icon'], axis=1)
        return X_train

    def load_model(stationId):
        try:
            with open(f'./ml_models/lasso_model_{stationId}.pkl', 'rb') as file:
                return pickle.load(file)
        except Exception as e:
            print(f"Error loading model for station {stationId}: {str(e)}")
            return None

    def predict(X_train,models):
        predictions = {}
        while True:
            try:
                forecastTime = [str(x) for x in pd.to_datetime(X_train['forecastTime'],unit='s')]
                X_train = X_train.drop(['forecastTime'],axis=1)
                X_train_columns = X_train.columns

                for station, model in models.items():
                    if model:
                        try:
                            required_columns = model.feature_names_in_
                            complete_x = pd.DataFrame(columns=required_columns)
                            for col in required_columns:
                                if col in X_train_columns:
                                    complete_x[col] = X_train[col]
                                else:
                                    complete_x[col] = False

                            x_array = np.array(complete_x)
                            results = model.predict(x_array)
                            predictions[f'station_{station}'] = {forecastTime[i]: results[i] for i in range(len(forecastTime))}

                        except Exception as e:
                            predictions[f'station_{station}'] = None
                    else:
                        predictions[f'station_{station}'] = None

                break
            except Exception as e:
                print(e)
                time.sleep(10)

        return predictions

    X_train = clean_data()
    stationId = get_stationId()
    models = {}
    for s in stationId:
        models[s] = load_model(s)

    predictions = predict(X_train,models)
    return predictions
#

