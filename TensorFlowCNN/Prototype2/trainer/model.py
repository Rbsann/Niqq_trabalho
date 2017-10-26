import tensorflow as tf
import numpy as np

# versão sem dropout
class FormNet():
    def __init__(self, input_size, vocab_size, embedding_size, filter_size, l2_reg_lambda=0.0):
        self.num_classes = 1
        self.num_filters = 2

        self.input_tensor = tf.placeholder(tf.int32, [None, input_size], name="input_x")
        self.output_tensor = tf.placeholder(tf.float32, [None, self.num_classes], name="output")

        l2_loss = tf.constant(0.0)
        #embedding para transformar o texto em matrizes
        with tf.device('/cpu:0'), tf.name_scope("embedding"):
            W = tf.Variable(tf.random_uniform([vocab_size, embedding_size], -1.0, 1.0), name="W")
            self.embedded_chars = tf.nn.embedding_lookup(W, self.input_tensor)
            self.embedded_chars_expanded = tf.expand_dims(self.embedded_chars, -1)
        
        pooled_outputs = []
        with tf.name_scope("conv-maxpool"):
            # Convolution Layer
            filter_shape = [filter_size, embedding_size, 1, self.num_filters]
            W = tf.Variable(tf.truncated_normal(filter_shape, stddev=0.1), name="W")
            b = tf.Variable(tf.constant(0.1, shape=[self.num_filters]), name="b")
            conv = tf.nn.conv2d(
                self.embedded_chars_expanded,
                W,
                strides=[1, 1, 1, 1],
                padding="VALID",
                name="conv")
            # Apply nonlinearity
            h = tf.nn.relu(tf.nn.bias_add(conv, b), name="relu")
            # Maxpooling over the outputs
            pooled = tf.nn.max_pool(
                h,
                ksize=[1, input_size - filter_size + 1, 1, 1],
                strides=[1, 1, 1, 1],
                padding='VALID',
                name="pool")
            pooled_outputs.append(pooled)

        self.h_pool = tf.concat(pooled_outputs, 3)
        self.h_pool_flat = tf.reshape(self.h_pool, [-1, self.num_filters])
        
        with tf.name_scope("output"):
            W = tf.get_variable(
                "W",
                shape=[self.num_filters, self.num_classes],
                initializer=tf.contrib.layers.xavier_initializer())
            
            b = tf.Variable(tf.constant(0.1, shape=[self.num_classes]), name="b")
            l2_loss += tf.nn.l2_loss(W)
            l2_loss += tf.nn.l2_loss(b)
            self.scores = tf.nn.xw_plus_b(self.h_pool_flat, W, b, name="scores")
            self.predictions = tf.argmax(self.scores, 1, name="predictions")
            # calcula loss com crossentropy
            with tf.name_scope("loss"):
                losses = tf.nn.softmax_cross_entropy_with_logits(logits=self.scores, labels=self.output_tensor)
                self.loss = tf.reduce_mean(losses) + l2_reg_lambda * l2_loss
            # Gera a acurácia do modelo
            with tf.name_scope("accuracy"):
                correct_predictions = tf.equal(self.predictions, tf.argmax(self.output_tensor, 1))
                self.accuracy = tf.reduce_mean(tf.cast(correct_predictions, "float"), name="accuracy")