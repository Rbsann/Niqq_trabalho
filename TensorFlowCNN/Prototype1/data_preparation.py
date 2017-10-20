# -*- coding: utf-8 -*-

from pymongo import MongoClient
from collections import Counter
from feature_extractor import getAllFeatures
from collections import Counter
import numpy as np
import zlib
import base64
import re

def get_html_from_64_string(compressed_code):
    if compressed_code is None or len(compressed_code) < 100:
        return None
    html = zlib.decompress(base64.b64decode(compressed_code))
    return unicode(html, "utf-8")

def connect_to_database():
    client = MongoClient("mongodb://thiago:123456@ds149059.mlab.com:49059/niqqdb")
    db = client.get_database("niqqdb")
    collection = db["pages"]
    return collection

def download_pages():
    query = {"classified" : True, "isForm": True, "html": {"$exists": True }}
    collection = connect_to_database()
    return collection.find(query, no_cursor_timeout=True)

def sort_dict(features):
    keys = sorted(features.keys())
    ordered = list()
    for key in keys:
        ordered.append(features[key])
    return ordered

def clean_html(html):
    # Remove comentários e código javascript
    patterns = [r"<!--(.|\s|\n)*?-->", r"<script>(.|\s|\n)*?<\/script>", r"style=\"(.|\s|\n)*?\""]
    for pattern in patterns:
        html = re.sub(pattern, "", html)
    return html

def main():
    """
    Obtém, trata e salva o dataset pronto para treinamento.
    """
    data = []
    labels = []

    for page in download_pages():
        html = get_html_from_64_string(page["html"])
        if(html is not None):
            html = clean_html(html.lower())
            data.append(html)
            labels.append(1 if page["isForm"] else 0)
    
    dataset_file = open("dataset", "w")
    for site in data:
        dataset_file.write(site.encode("utf-8").strip())
    dataset_file.close()

    label_file = open("labels", "w")
    for label in labels:
        label_file.write("{}\n".format(str(label)))
    label_file.close()

if __name__ == '__main__':
    main()