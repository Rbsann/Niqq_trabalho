# -*- coding: utf-8 -*-

from tensorflow.python.lib.io import file_io
import numpy as np

def load_features(dataset_path = "../dataset", labels_path = "../labels"):
    text = list(file_io.FileIO(dataset_path, "r").readlines())
    text = [s.strip() for s in text]
    labels = list()

    labels_file = list(file_io.FileIO(labels_path, "r").readlines())
    for label in labels_file:
        labels.append([1] if label == "1\n" else [0])
    
    print(labels)

load_features()