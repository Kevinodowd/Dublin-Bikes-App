from sqlalchemy import create_engine
import sqlalchemy as sqla

def generate_mysqlEnginelocal(db=None):
    URI = "127.0.0.1"
    PORT="3306"
    USER="root"
    DB=db
    PASSWORD = '15040748'
    #mysql://admin:yuliinrds@database-1.cd28yc6ma768.eu-west-1.rds.amazonaws.com:3306/
    #f"mysql+mysqlconnector://{USER}:{PASSWORD}@{URI}:{PORT}",echo=True
    if not db:
        engine = create_engine(f"mysql+mysqlconnector://{USER}:{PASSWORD}@{URI}:{PORT}",echo=True)
    else:
        engine = create_engine(f"mysql+mysqlconnector://{USER}:{PASSWORD}@{URI}:{PORT}/{DB}",echo=True)
    return engine

def generate_mysqlEnginerds(db=None):
    URI = "database-1.cd28yc6ma768.eu-west-1.rds.amazonaws.com"
    PORT="3306"
    USER="admin"
    DB=db
    PASSWORD = 'yuliinrds'
    #mysql://admin:yuliinrds@database-1.cd28yc6ma768.eu-west-1.rds.amazonaws.com:3306/
    if not db:
        engine = create_engine(f"mysql://{USER}:{PASSWORD}@{URI}:{PORT}",echo=True)
    else:
        engine = create_engine(f"mysql://{USER}:{PASSWORD}@{URI}:{PORT}/{DB}",echo=True)
    return engine
