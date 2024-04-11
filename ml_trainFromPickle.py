import pandas as pd
import numpy as np

from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.metrics import mean_absolute_percentage_error
import pickle
from scraper import sqlEngine
import json

#read weatherForecast

stationId = 1
weatherForecast = sqlEngine.connect_to_rds(f"SELECT * from weatherForecast where stationId={stationId};")
data_dict = json.loads(weatherForecast)
wf_df = pd.DataFrame(data_dict)
wf_df.columns = ['stationId','weather','description','icon','temperature','pressure','humidity','windSpeed','windDeg','visibility','fetchTime','forecastTime']

#get the maximum predict time
max_predictTime = max(wf_df['forecastTime'])




df['stationId'] = df['stationId'].astype('int64')
df_sorted = df.sort_values(by='forecastTime', ascending=True)
grouped = df_sorted.groupby('stationId')


df = pd.get_dummies(df, columns=['weather', 'description'])


df_sorted = df.sort_values(by='fetchTime', ascending=True)

# We need to group by stationId to train by each stationId

df_sorted = df.sort_values(by='fetchTime', ascending=True)

# Group by 'stationId'
grouped = df_sorted.groupby('stationId')

def data_cleaning(grouped):

    split_index = int(len(group) * 0.7)
    train_df = group[:split_index]
    test_df = group[split_index:]

    # splitting up into training and testing data
    X_train = train_df.drop(['bikeNum', 'fetchTime', 'bikeStands'], axis=1)
    y_train = train_df['bikeNum']
    X_test = test_df.drop(['bikeNum', 'fetchTime', 'bikeStands'], axis=1)
    y_test = test_df['bikeNum']

for stationId, group in grouped:
    # testing only on 70% of data

    # Linear Regression model
    linear_model = LinearRegression()
    linear_model.fit(X_train, y_train)

    # Ridge model
    ridge_model = Ridge(alpha=10)
    ridge_model.fit(X_train, y_train)

    # Lasso model
    lasso_model = Lasso(alpha=0.01)
    lasso_model.fit(X_train, y_train)


    for model in [linear_model, ridge_model, lasso_model]:
        y_pred = model.predict(X_test)
        mape = mean_absolute_percentage_error(y_test, y_pred)
        print(f"Station {stationId}, Model {type(model).__name__}, MAPE: {mape}")

    with open(f'linear_model_{stationId}.pkl', 'wb') as file:
        pickle.dump(linear_model, file)
    with open(f'ridge_model_{stationId}.pkl', 'wb') as file:
        pickle.dump(ridge_model, file)
    with open(f'lasso_model_{stationId}.pkl', 'wb') as file:
        pickle.dump(lasso_model, file)
