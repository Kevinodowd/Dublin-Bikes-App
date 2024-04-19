import pandas as pd
from sktime.forecasting.model_selection import temporal_train_test_split
from sktime.performance_metrics.forecasting import mean_absolute_percentage_error
import numpy as np
from sklearn.preprocessing import OneHotEncoder
from time import time
#from sktime.regression import *
from sktime.registry import all_estimators

from sktime.regression.compose import ComposableTimeSeriesForestRegressor
from sktime.regression.dummy import DummyRegressor
from sktime.regression.interval_based import TimeSeriesForestRegressor
from sktime.regression.distance_based import KNeighborsTimeSeriesRegressor
from sktime.regression.base import BaseRegressor
import pickle

def data_cleaning(df, stationId):
    # stationId = 1
    df = df[df['stationId'] == stationId]
    total_capacity = list(df['bikeStands'])[0] + list(df['bikeNum'])[0]

    df['fetchTime'] = pd.to_datetime(df['fetchTime'])
    df = df.sort_values('fetchTime')

    # Create a date range that covers all dates in your DataFrame, at 5 minute frequency
    date_range = pd.date_range(start=df['fetchTime'].min(), end=df['fetchTime'].max(), freq='5T')

    duplicates = df[df.duplicated('fetchTime', keep=False)]
    df = df.drop_duplicates('fetchTime', keep='first')

    df_complete = df.set_index('fetchTime').reindex(date_range, method='ffill').reset_index()

    object_columns = df_complete.select_dtypes(['object']).columns
    for col in object_columns:
        df_complete[col] = df_complete[col].astype('category')

    # Initialize the OneHotEncoder
    encoder = OneHotEncoder(sparse_output=False)
    category_encoded = encoder.fit_transform(df_complete[['weather', 'description']])
    encoded_df = pd.DataFrame(category_encoded, columns=encoder.get_feature_names_out(['weather', 'description']))

    # Concatenate the encoded_df back with the original DataFrame (if desired)
    df_complete = pd.concat([df_complete.reset_index(drop=True), encoded_df], axis=1)
    df_complete.set_index(['index'])
    df_complete = df_complete.drop(['weather', 'description', 'stationId', 'bikeStands'], axis=1)
    print(df_complete)

    train, test = temporal_train_test_split(df_complete, test_size=0.3)
    y_train, x_train = train['bikeNum'], train.drop(['bikeNum'], axis=1)
    y_test, x_test = test['bikeNum'], test.drop(['bikeNum'], axis=1)

    x_train, x_test = x_train.set_index('index'), x_test.set_index('index')
    y_train, y_test = pd.DataFrame(y_train).set_index(x_train.index), pd.DataFrame(y_test).set_index(x_test.index)
    return x_train, y_train, x_test, y_test, total_capacity
def regress(stationId,x_train, y_train, x_test, y_test, total_capacity):
    #estimators_df = all_estimators("regressor", as_dataframe=True)
    #models_list = list(estimators_df['object'])
    models_list = [ComposableTimeSeriesForestRegressor,KNeighborsTimeSeriesRegressor,DummyRegressor,TimeSeriesForestRegressor,BaseRegressor]
    #models_name = list(estimators_df['name'])
    l = len(models_list)
    model_situation = {}

    for i in range(l):
        model = models_list[i]
        model_name = model.__name__
        print(f'============{model_name}============')
        try:
            regressor = model()
            # Fit the model on the training data
            regressor.fit(x_train.values, y_train.values)

            time_start = time()
            y_pred = regressor.predict(x_test.values)
            time_end = time()

            mape = mean_absolute_percentage_error(y_test, y_pred)

            anamaly = len([x for x in y_pred if x > total_capacity or x < 0])

            pickle_file_name = f'{stationId}_{model_name}.pkl'
            to_pickle(pickle_file_name,regressor)

            model_situation[model] = {'mape': mape, 'anamaly': anamaly, 'time': (time_end - time_start),
                                           'model': pickle_file_name}

        except Exception as e:
            print(f'****************fail to train {model_name}:{e}********************')
    return model_situation

def to_pickle(pickle_file_name,model):
    #'model.pkl'
    with open(pickle_file_name, 'wb') as handle:
     pickle.dump(model, handle, pickle.HIGHEST_PROTOCOL)

df = pd.read_csv('C:/Users/31003/Desktop/UCD/comp30830/new_cleaned_toTrainData.csv')
all_stationId = list(set(df['stationId']))
for stationId in all_stationId[1:]:
    print(f'{stationId} begins:')
    x_train,y_train,x_test,y_test,total_capacity = data_cleaning(df,stationId)
    model_situation = regress(stationId,x_train,y_train,x_test,y_test,total_capacity)

    df_modelestimate = pd.DataFrame(model_situation)
    df_modelestimate.to_csv(f'C:/Users/31003/Desktop/UCD/comp30830/station{stationId}_sktime_training_situation.csv')
    print()
    print()
