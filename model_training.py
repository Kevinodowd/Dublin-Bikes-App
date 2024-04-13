import json
import pandas as pd
from scraper import sqlEngine
import pickle
import numpy as np
def get_model_predict():
    def get_stationId():
        sqlCommand = f'SELECT stationId FROM stations;'
        stationId = json.loads(sqlEngine.connect_to_rds(sqlCommand))
        #complete_columns = list(pd.read_csv('cleaned_data_sample.csv').iloc[:,0])

        stationId = [x[0] for x in stationId]

        return stationId

    #Cleamimg the forecast data making predictions and providing a route for it
    def clean_data():
        sqlCommand = f'SELECT * FROM weatherForecast LIMIT 3;'
        data = json.loads(sqlEngine.connect_to_rds(sqlCommand))
        #complete_columns = list(pd.read_csv('cleaned_data_sample.csv').iloc[:,0])

        data = pd.DataFrame(data)
        data.columns = ['stationId', 'weather', 'description', 'icon', 'temperature', 'pressure', 'humidity', 'windSpeed', 'windDeg', 'visibility', 'fetchTime', 'forecastTime']
        data = pd.get_dummies(data, columns=['description'])

        X_train = data.drop(['stationId','fetchTime','icon'], axis=1)

        return X_train

    def load_model(stationId):
        try:
            with open(f'ml_models/lasso_model_{stationId}.pkl', 'rb') as file:
                return pickle.load(file)
        except Exception as e:
            print(f"Error loading model for station {stationId}: {str(e)}")
            return None

    def predict(X_train,models):
        #test whether if the predictWeather table is shut down, will it block other features working?
        # if X_train is None:
        #     return jsonify({"error": "X_train data not loaded"}), 500
        predictions = {}
        try:
            forecastTime = X_train['forecastTime']
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
                        # print(model.coef_)
                        results = model.predict(x_array)


                        predictions[station] = {forecastTime[0]:results[0],forecastTime[1]:results[1],forecastTime[2]:results[2]}

                    except Exception as e:
                        predictions[station] = None
                else:
                    predictions[station] = None

            # return jsonify(predictions)
        except Exception as e:
            print(e)

        return predictions

    X_train = clean_data()
    models = {}
    stationId = get_stationId()
    for s in stationId:
        models[s] = load_model(s)

    predictions = predict(X_train,models)

    return predictions

