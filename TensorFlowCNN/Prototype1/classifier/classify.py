# -*- coding: utf-8 -*-

import googleapiclient.discovery

# Exemplo de código para obter predições da ml-engine. Você precisará do keyfile na sua máquina.
# Basta definir a seguinte variável de ambiente:
# export GOOGLE_APPLICATION_CREDENTIALS=<path_to_service_account_file>

instance = open('instance', 'r')
html = instance.readlines()[0]
instance.close()

def predict_json(project="sophia-179715", model="formtest", instances=None, version=None):
    """Send json data to a deployed model for prediction.

    Args:
        project (str): project where the Cloud ML Engine Model is deployed.
        model (str): model name.
        instances ([Mapping[str: Any]]): Keys should be the names of Tensors
            your deployed model expects as inputs. Values should be datatypes
            convertible to Tensors, or (potentially nested) lists of datatypes
            convertible to tensors.
        version: str, version of the model to target.
    Returns:
        Mapping[str: any]: dictionary of prediction results defined by the
            model.
    """
    # Create the ML Engine service object.
    # To authenticate set the environment variable
    # GOOGLE_APPLICATION_CREDENTIALS=<path_to_service_account_file>
    service = googleapiclient.discovery.build('ml', 'v1')
    name = 'projects/{}/models/{}'.format(project, model)

    if version is not None:
        name += '/versions/{}'.format(version)

    response = service.projects().predict(
        name=name,
        body={'instances': instances}
    ).execute()
    if 'error' in response:
        raise RuntimeError(response['error'])

    return response['predictions']

body = {"input_x": html,"dropout": "0.5"}

print(predict_json(instances=body))