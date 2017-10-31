import numpy as np
from feature_extractor import getAllFeatures
# from selenium import webdriver
from pymongo import MongoClient
import base64
from StringIO import StringIO
import zlib
# from HTMLParser import HTMLParser
import re
from bs4 import BeautifulSoup
import requests
from collections import Counter
import json
from pymongo import MongoClient
import base64
from StringIO import StringIO
import zlib

def getSourceFrom64String(str):
    if(str is None or len(str) < 100):
        return None
    else:
        html = zlib.decompress(base64.b64decode(str))
        return html


def getAllData():
    client = MongoClient("mongodb://thiago:123456@ds149059.mlab.com:49059/niqqdb")
    db = client.get_database("niqqdb")
    collection = db["pages"]
    allText=[]
    allInputsClass=[]
    allInputsNames=[]
    allInputsIds=[]
    allInputsType=[]
    # i=0

    for pages in collection.find({  "html": {"$exists": True}}, no_cursor_timeout=True):
        try:
            source_code = getSourceFrom64String(pages["html"])
            if(source_code is not None):
                # print(source_code)
                # r=source_code
                # data=r.text
                soup=BeautifulSoup(source_code)
                print(soup)
                for inputs in soup.find_all('input'):
                    allInputsClass.append(inputs.get('class')[0])
                    allInputsIds.append(inputs.get('id'))
                    allInputsNames.append(inputs.get('name'))

    # for url in collection.find({  "url": {"$exists": True}}, no_cursor_timeout=True):
    #     try:
    #         url=url['url']
    #         print(url)
    #         r  = requests.get(url,timeout=10)
    #         data=r.text
    #         soup=BeautifulSoup(data)
    #         # print(i)
    #         for inputs in soup.find_all('input'):
    #             allInputsClass.append(inputs.get('class')[0])
    #             allInputsIds.append(inputs.get('id'))
    #             allInputsNames.append(inputs.get('name'))
    #             # allInputsType.append(inputs.get('type'))
    #             # print(allInputsClass)
    #             # print(labi)
        except Exception as e:
            print e
            continue

    print('saiu')
    classCount=Counter(allInputsClass).most_common(70)
    idinputCount=Counter(allInputsIds).most_common(70)
    nameCount=Counter(allInputsNames).most_common(70)

    with open('classCountMostcommon.txt','w') as file1:
        file1.write(json.dumps(classCount))
    file1.close()

    with open('idCountMostcommon.txt','w') as file2:
        file2.write(json.dumps(idinputCount))
    file2.close()

    with open('nameCountMostcommon.txt','w') as file3:
        file3.write(json.dumps(nameCount))
    file3.close()



getAllData()


