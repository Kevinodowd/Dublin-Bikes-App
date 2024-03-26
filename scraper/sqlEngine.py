from sqlalchemy import create_engine
import pymysql
import paramiko
from sshtunnel import SSHTunnelForwarder
import json

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

def connect_to_rds(query):
    mypkey = paramiko.RSAKey.from_private_key_file('/Users/caitlin/Desktop/comp30830.pem')
    # if you want to use ssh password use - ssh_password='your ssh password', bellow

    sql_hostname = 'database-1.cd28yc6ma768.eu-west-1.rds.amazonaws.com'
    sql_username = 'admin'
    sql_password = 'yuliinrds'
    sql_main_database = 'dbikes'
    sql_port = 3306
    ssh_host = 'ec2-34-248-206-41.eu-west-1.compute.amazonaws.com'
    ssh_user = 'ubuntu'
    ssh_port = 22
    sql_ip = '1.1.1.1.1'
    with SSHTunnelForwarder(
        (ssh_host, ssh_port),
        ssh_username=ssh_user,
        ssh_pkey=mypkey,
        remote_bind_address=(sql_hostname, sql_port)) as tunnel:
        conn = pymysql.connect(host='127.0.0.1', user=sql_username,
                passwd=sql_password, db=sql_main_database,
                port=tunnel.local_bind_port)
        cursor = conn.cursor()
        sqlCommand = query
        cursor.execute(sqlCommand)
        data_json = cursor.fetchall()
        print('Successful')
        conn.close()
        # query = '''SELECT * FROM availability;'''
        # data = pd.read_sql_query(query, conn)
        return json.dumps(data_json)
