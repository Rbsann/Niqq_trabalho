from pymongo import MongoClient
from collections import Counter
from feature_extractor import getAllFeatures
import numpy as np
import zlib
import base64

def get_html_from_64_string(compressed_code):
    if compressed_code is None or len(compressed_code) < 100:
        return None
    html = zlib.decompress(base64.b64decode(compressed_code))
    return html

def connect_to_database():
    client = MongoClient("mongodb://thiago:123456@ds149059.mlab.com:49059/niqqdb")
    db = client.get_database("niqqdb")
    collection = db["pages"]
    return collection

def download_pages():
    query = {"classified" : True, "isForm": True, "html": {"$exists": True }}
    collection = connect_to_database()
    return collection.find(query, no_cursor_timeout=True).limit(10)

def sort_dict(features):
    keys = sorted(features.keys())
    ordered = list()
    for key in keys:
        ordered.append(features[key])
    return ordered

def main():
    """
    Obtém, trata e salva o dataset pronto para treinamento.
    """
    features = list()
    labels = list()
    feature_names = None

    for page in download_pages():
        html = get_html_from_64_string(page["html"])
        if(html is not None):
            page_features, page_input_number = getAllFeatures(page["url"], html)
            labels.append(1 if page["isForm"] else 0)
            features.append(sort_dict(page_features))
    
    X = np.array(features)
    y = np.array(labels)
    np.savez("pheatures", X=X, y=y)

if __name__ == '__main__':
    main()