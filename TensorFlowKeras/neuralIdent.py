# imports
import os
import re
import math
import random
import collections
import time
import numpy as np
import matplotlib
import matplotlib.pyplot as plt
# %matplotlib inline
from sklearn import metrics
from sklearn.model_selection import train_test_split
from sklearn import preprocessing
from sklearn.metrics import classification_report
import keras
from keras.models import Sequential
from keras.layers import Dense
from keras.layers import Dropout
from keras.layers  import Flatten
from keras.utils.np_utils import to_categorical
import keras.optimizers
from keras.utils import plot_model
print("Keras backend : ", keras.backend.backend())

def train():
    data = np.load("chheatures.npz")
    # Xkeys = data['Xkeys']
    # sites = data['sites']
    Y = data['y'].astype(int)
    X = data['X']
    print(X[0])
    print(X[0][0])
    print(len(X[1]))
    print(len(X))
    print(len(Y))
    print(Y)
    input_size=len(X)
    # we need to preprocess data for DNN yet again - scale it
    # scling will ensure that our optimization algorithm (variation of gradient descent) will converge well
    # we need also ensure one-hot econding of target classes for softmax output layer
    # let's convert datatype before processing to float
    # dt = dt.astype(np.float64)
    # # X and Y split
    # X = dt[:,0:input_size]
    # Y = dt[:,input_size]
    # del dt
    # random index to check random sample
    random_index = random.randrange(0,X.shape[0])
    print("Example data before processing:")
    print("X : \n", X[random_index,])
    print("Y : \n", Y[random_index])
    time.sleep(10) # sleep time to allow release memory. This step is very memory consuming
    # X preprocessing
    # standar scaler will be useful laterm during DNN prediction
    standard_scaler = preprocessing.StandardScaler().fit(X)
    X = standard_scaler.transform(X)
    print ("X preprocessed shape :", X.shape)
    # Y one-hot encoding
    Y = keras.utils.to_categorical(Y)
    # See the sample data
    print("Example data after processing:")
    print("X : \n", X[random_index,])
    print("Y : \n", Y[random_index])
    # train/test split. Static seed to have comparable results for different runs
    seed = 42
    X_train, X_test, Y_train, Y_test = train_test_split(X, Y, test_size=0.20, random_state=seed)
    del X, Y
    print(len(X_train))
    print(X_train.shape)
    # wait for memory release again
    # time.sleep(120)
    # save train/test arrays to file
    # path_tt = os.path.join(train_test_directory,"train_test_data_"+str(input_size)+".npz")
    # np.savez_compressed(path_tt,X_train=X_train,Y_train=Y_train,X_test=X_test,Y_test=Y_test)
    # print(path_tt, "size : ",size_mb(os.path.getsize(path_tt)))
    # del X_train,Y_train,X_test,Y_test

    model = Sequential()
    model.add(Dense(30,input_dim=198,kernel_initializer="glorot_uniform",activation="sigmoid"))
    # model.add(Dropout(0.5))
    # model.add(TimeDistributed(Dense(1)))
    # model.add(AveragePooling1D())
    # model.add(Flatten())
    model.add(Dense(20,kernel_initializer="glorot_uniform",activation="sigmoid"))
    # model.add(Dropout(0.5))
    model.add(Dense(2,kernel_initializer="glorot_uniform",activation="softmax"))
    # model.add(Dropout(0.5))
    # model.add(Dense(2,kernel_initializer="glorot_uniform",activation="softmax"))
    model_optimizer = keras.optimizers.Adam(lr=0.001, beta_1=0.9, beta_2=0.999, epsilon=1e-08, decay=0.0)
    model.compile(loss='categorical_crossentropy',
                optimizer=model_optimizer,
                metrics=['accuracy'])


    history = model.fit(X_train,Y_train,
            epochs=100,
            validation_split=0.10,
            batch_size=204,
            verbose=2,

            shuffle=True)

    scores = model.evaluate(X_test, Y_test, verbose=1)
    print("%s: %.2f%%" % (model.metrics_names[1], scores[1]*100))

    Y_pred = model.predict_classes(X_test)
    Y_pred = keras.utils.to_categorical(Y_pred, num_classes=2)
    print(classification_report(Y_test, Y_pred))

train()