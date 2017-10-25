from tensorflow.python.lib.io import file_io
from tensorflow.contrib import learn
from sklearn.model_selection import KFold
from model import FormNet
import numpy as np
import tensorflow as tf
import util
import argparse
import os
import datetime
import sys

np.set_printoptions(threshold=sys.maxsize)

percentage_test_data = 0.1
embedding_size = 128
dropout_prob = 0.5
batch_size = 64
num_epochs = 200

def _write_assets(assets_directory, assets_filename, vocab):
    """Writes asset files to be used with SavedModel.
    Args:
        assets_directory: The directory to which the assets should be written.
        assets_filename: Name of the file to which the asset contents should be
            written.
    Returns:
        The path to which the assets file was written.
    """
    if not file_io.file_exists(assets_directory):
        file_io.recursive_create_dir(assets_directory)

        path = os.path.join(
            tf.compat.as_bytes(assets_directory), tf.compat.as_bytes(assets_filename))
    file_io.write_string_to_file(path, vocab)
    return path

def mean(values):
    return sum(values)/len(values)

def train_model(args):
    print("Loading dataset...")
    text, labels = util.load_features(args.dataset, args.labels)

    # Build vocabulary
    max_document_length = max([len(x.split(" ")) for x in text])
    vocab_processor = learn.preprocessing.VocabularyProcessor(max_document_length)
    x = np.array(list(vocab_processor.fit_transform(text)))
    labels = np.array(labels)

    iteracao = 0
    builder = tf.saved_model.builder.SavedModelBuilder(args.export_dir)
    # TODO: use cross-validation here
    kf = KFold(n_splits=10, shuffle=True)
    losses = list()
    accuracies = list()
        
    for train_index, test_index in kf.split(labels):
        iteracao += 1
        print("k = {}".format(iteracao))

        x_train, x_dev = x[train_index], x[test_index]
        y_train, y_dev = labels[train_index], labels[test_index]
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

                # Set up the assets collection.
                assets_filepath = tf.constant(os.path.join(args.export_dir, "vocabulary"))
                tf.add_to_collection(tf.GraphKeys.ASSET_FILEPATHS, assets_filepath)
                filename_tensor = tf.Variable(
                    os.path.join(args.export_dir, "vocabulary"),
                    name="filename_tensor",
                    trainable=False,
                    collections=[])
                assign_filename_op = filename_tensor.assign(os.path.join(args.export_dir, "vocabulary"))

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
                    feed_dict = {
                        formCnn.input_tensor: x_batch,
                        formCnn.output_tensor: y_batch,
                        formCnn.dropout: 1.0
                    }
                    step, loss, accuracy = sess.run([global_step, formCnn.loss, formCnn.accuracy],
                        feed_dict)
                    losses.append(loss)
                    accuracies.append(accuracy)
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
    print("Overall loss: {} Overall accuracy: {}".format(mean(losses), mean(accuracies)))
    builder.add_meta_graph_and_variables(
        sess, [tf.saved_model.tag_constants.SERVING],
        signature_def_map={
            "serving_default": tf.saved_model.signature_def_utils.predict_signature_def(
                inputs={"input_x": formCnn.input_tensor,
                        "dropout": formCnn.dropout},
                outputs={"predictions": formCnn.predictions}
            )
        },
        assets_collection=tf.get_collection(tf.GraphKeys.ASSET_FILEPATHS)
    )

    builder.save()

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