import numpy as np
from feature_extractor2 import countFeatures
from selenium import webdriver
from pymongo import MongoClient
import base64
from StringIO import StringIO
import zlib

client = MongoClient("mongodb://thiago:123456@ds149059.mlab.com:49059/niqqdb")
db = client.get_database("niqqdb")
collection = db["pages"]
# print(collection)

def getSourceFrom64String(str):
    if(str is None or len(str) < 100):
        return None
    else:
        html = zlib.decompress(base64.b64decode(str))
        return html

## O que vamos salvar ##
X = list()  # Features
y = list()  # isForm boolean
# Xkeys = None  # nome das features, em ordem
sites = list()  # nome dos sites, em ordem
i=0

for pages in collection.find({  "html": {"$exists": True},"classified":True}, no_cursor_timeout=True):
    try:
        source_code = getSourceFrom64String(pages["html"])
        if(source_code is not None):
            X.append(countFeatures(source_code))
            print(i)
            # print(X)
            # Xdict = Xdict_temp
            sites.append(pages['url'])
            y.append(int(pages['isForm']))
            #Impoe uma ordem, dado que dicionarios n tem ordem deterministica
            # Xkeys = sorted(Xdict.keys())
            # Xatual = list()
            # for key in Xkeys:
            #     Xatual.append(Xdict[key])
            # X.append(Xatual)
            i=i+1
    except Exception as e:
        print e
        continue

#Escreve resultados
X = np.array(X)
# Xkeys = np.array(Xkeys)
y = np.array(y)
np.savez("chheatures", X=X, y=y,sites=sites)
