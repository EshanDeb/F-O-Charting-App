import sys
import pandas as pd
import numpy as np
import csv
import os.path
import requests, zipfile, os, io, pandas as pd
from datetime import datetime
from dateutil.relativedelta import relativedelta
import webbrowser
import urllib.request
import sys
from zipfile import ZipFile
import time
import json
 
file_name=sys.argv[1];
prefix_path=sys.argv[2];
file_name=(prefix_path+file_name)

time.sleep(5)

with ZipFile(file_name, 'r') as zip: 
        zip.extractall() 

time.sleep(5)

sys.stdout.write(file_name,"\n")  

file_name.replace("csv.zip","csv")

sys.stdout.write(file_name,"\n")  

reader=pd.read_csv(file_name)

future_index=reader[np.logical_or(reader.INSTRUMENT=='FUTIDX', reader.INSTRUMENT=='FUTSTK')]
data=[]
symbols_repeat=set()
counter=-1
for symbol in future_index.SYMBOL:
    counter+=1
    if((symbol in symbols_repeat)):
        data[-1]['COI']+=future_index['OPEN_INT'][counter]
    else:
        symbols_repeat.add(symbol)
        index=list(future_index.SYMBOL).index(symbol)
        data.append({'TIMESTAMP':future_index['TIMESTAMP'][index],
                     'INSTRUMENT':future_index['INSTRUMENT'][index],
                     'SYMBOL':future_index['SYMBOL'][index],
                     'OPEN':future_index['OPEN'][index],
                     'HIGH':future_index['HIGH'][index],
                     'LOW':future_index['LOW'][index],
                     'CLOSE':future_index['CLOSE'][index],
                     'COI':future_index['OPEN_INT'][index],
                     'PCR':0.00})
                
output_file=pd.DataFrame(data)

sys.stdout.write(output_file,"\n")  

for symbol in output_file['SYMBOL']:
    index=list(output_file['SYMBOL']).index(symbol)
    if(output_file['INSTRUMENT'][index]=='FUTIDX'):
        target='OPTIDX'
    else:
        target='OPTSTK'
    sub_reader=reader[np.logical_and(reader.INSTRUMENT==target,reader.SYMBOL==symbol)]
    if(sub_reader.empty):
        continue
    else:
        CE_reader=sub_reader[reader['OPTION_TYP']=='CE']
        PE_reader=sub_reader[reader['OPTION_TYP']=='PE']
        CE_sum=1+sum(list(CE_reader['OPEN_INT']))
        PE_sum=sum(list(PE_reader['OPEN_INT']))
        output_file['PCR'][index]=PE_sum/CE_sum

filename=sys.argv[3]

filename=(prefix_path+filename)

sys.stdout.write(filename,"\n")  

with open(filename, 'a',  newline='') as f:
    output_file.to_csv(f, header=False,index = True)

print(output_file.to_json(orient="values"))

#print(output_file.to_string(index=False,header=False));