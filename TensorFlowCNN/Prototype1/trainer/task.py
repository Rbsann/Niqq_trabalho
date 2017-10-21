from tensorflow.python.lib.io import file_io
from tensorflow.contrib import learn
from model import FormNet
import numpy as np
import tensorflow as tf
import util
import argparse
import os
import datetime

percentage_test_data = 0.1
embedding_size = 128
dropout_prob = 0.5
batch_size = 64
num_epochs = 200

def train_model(args):
    print("Loading dataset...")
    text, labels = util.load_features(args.dataset, args.labels)
    print(labels)
    print("Building vocabulary...")

    # Build vocabulary
    max_document_length = max([len(x.split(" ")) for x in text])
    print(max_document_length)
    vocab_processor = learn.preprocessing.VocabularyProcessor(max_document_length)
    x = np.array(list(vocab_processor.fit_transform(text)))

    # TODO: use cross-validation here
    dev_sample_index = -1 * int(percentage_test_data * float(len(labels)))
    x_train, x_dev = x[:dev_sample_index], x[dev_sample_index:]
    y_train, y_dev = labels[:dev_sample_index], labels[dev_sample_index:]
    print("Vocabulary Size: {:d}".format(len(vocab_processor.vocabulary_)))
    print("Train/Dev split: {:d}/{:d}".format(len(y_train), len(y_dev)))

    with tf.Graph().as_default():
        session_conf = tf.ConfigProto(allow_soft_placement=True)
        sess = tf.Session(config=session_conf)
        print("Starting training...")
        with sess.as_default():
            formCnn = FormNet(
                x_train.shape[1],
                len(vocab_processor.vocabulary_),
                embedding_size, 3)
            global_step = tf.Variable(0, name="global_step", trainable=False)
            optimizer = tf.train.AdamOptimizer(1e-3)
            grads_and_vars = optimizer.compute_gradients(formCnn.loss)
            #atualiza os parametros
            train_op = optimizer.apply_gradients(grads_and_vars, global_step=global_step)   
            vocab_processor.save(os.path.join(args.export_dir, "vocabulary"))
            sess.run(tf.global_variables_initializer())

            def train_step(x_batch, y_batch):
                feed_dict = {
                    formCnn.input_tensor: x_batch,
                    formCnn.output_tensor: y_batch,
                    formCnn.dropout: dropout_prob
                }
                _, step, loss, accuracy = sess.run(
                    [train_op, global_step, formCnn.loss, formCnn.accuracy],
                    feed_dict)
                print("Accuracy: {} \t Loss: {}".format(accuracy, loss))
            
            #Faz basicamente a mesma coisa da função de cima, mas sem dropout pois é para avaliação
            def dev_step(x_batch, y_batch, writer=None):
                """
                Evaluates model on a dev set
                """
                print(x_batch)
                print(y_batch)
                feed_dict = {
                    formCnn.input_tensor: x_batch,
                    formCnn.output_tensor: y_batch,
                    formCnn.dropout: 1.0
                }
                step, loss, accuracy = sess.run([global_step, formCnn.loss, formCnn.accuracy],
                    feed_dict)
                print("Accuracy: {}\t Loss {}".format(accuracy, loss))
            
            # Generate batches
            batches = util.batch_iter(list(zip(x_train, y_train)), batch_size, num_epochs)

            # Training loop. For each batch...
            for batch in batches:
                x_batch, y_batch = zip(*batch)
                train_step(x_batch, y_batch)
                current_step = tf.train.global_step(sess, global_step)
                if current_step % 100 == 0:
                    print("\nEvaluation:")
                    dev_step(x_dev, y_dev)
                    print("")
                # if current_step % FLAGS.checkpoint_every == 0:
                #     path = saver.save(sess, checkpoint_prefix, global_step=current_step)
                #     print("Saved model checkpoint to {}\n".format(path))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()

    # Input Arguments
    parser.add_argument(
      '--dataset',
      help = 'GCS or local paths to training data',
      required = True
    )
    parser.add_argument(
        '--labels',
        help = 'GCS path to labels data',
        required = True
    )
    parser.add_argument(
      '--export-dir',
      help = 'GCS location to write checkpoints and export models',
      required = True
    )

    args = parser.parse_args()
    train_model(args)