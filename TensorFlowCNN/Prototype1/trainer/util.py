# -*- coding: utf-8 -*-

from tensorflow.python.lib.io import file_io
import numpy as np

def load_features(dataset_path = "../dataset", labels_path = "../labels"):
    text = list(file_io.FileIO(dataset_path, "r").readlines())
    labels_file = list(file_io.FileIO(labels_path, "r").readlines())
    labels = list()

    for label in labels_file:
        labels.append([1] if label == "1\n" else [0])
    return text, labels

def batch_iter(data, batch_size, num_epochs, shuffle=True):
    data = np.array(data)
    data_size = len(data)
    num_batches_per_epoch = int((len(data)-1)/batch_size) + 1
    for epoch in range(num_epochs):
        # Shuffle the data at each epoch
        if shuffle:
            shuffle_indices = np.random.permutation(np.arange(data_size))
            shuffled_data = data[shuffle_indices]
        else:
            shuffled_data = data
        for batch_num in range(num_batches_per_epoch):
            start_index = batch_num * batch_size
            end_index = min((batch_num + 1) * batch_size, data_size)
            yield shuffled_data[start_index:end_index]