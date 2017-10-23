# -*- coding: utf-8 -*-

import googleapiclient.discovery

# Exemplo de código para obter predições da ml-engine. Você precisará do keyfile na sua máquina.
# Basta definir a seguinte variável de ambiente:
# export GOOGLE_APPLICATION_CREDENTIALS=<path_to_service_account_file>


html = 'div><body><table border=0 cellpadding=1 cellspacing=0 width=100% height=100%><tbody><tr><td height=160><noscript>&lt;object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=7,0,19,0" width="771" height="160" id="map"&gt; &lt;param name="movie" value="http://www.riocard.com//swf/riocard.swf"&gt; &lt;param name="quality" value="high"&gt; &lt;param name="menu" value="false"&gt; &lt;embed src="http://www.riocard.com//swf/riocard.swf" name="map" quality="high" pluginspage="http://www.macromedia.com/go/getflashplayer" type="application/x-shockwave-flash" width="771" height="160" autostart="true"&gt;&lt;/embed&gt; &lt;/object&gt; </noscript></td></tr><tr><td valign=top height=100%><table border=0 width=772 height=100%><tbody><tr><td align=center height=40% width=30% valign=top><img src=http://www.riocard.com/images/cartao_senior.jpg border=0></td><td rowspan=2 valign=top><div id=divcadastro><h1>senior - cadastro de usuÃ¡rio</h1><p>qual a sua data de nascimento?</p><table width=550px border=0 cellpadding=0 cellspacing=0><tbody><tr><td width=20%><label><b>nascimento: </b></label></td><td width=80%> <span>formato: dd/mm/aaaa</span></td></tr><tr><td> </td><td><span>clique aqui para prosseguir</span></td></tr><tr><td colspan=2> </td></tr><tr><td colspan=2><div id=divdemaisdados1><fieldset><legend>dados do usuÃ¡rio:</legend><table width=100%><tbody><tr><td><label>nome completo:</label></td><td> <span><b>nÃ£o abreviar</b></span></td></tr><tr><td><label>nome da mÃ£e:</label></td><td> <span><b>nÃ£o abreviar</b></span></td></tr><tr><td><label>nome do pai:</label></td><td> <span><b>nÃ£o abreviar</b></span></td></tr><tr><td><label>sexo:</label></td><td><label>feminino</label><label>masculino</label></td></tr><tr><td colspan=2> atenÃ§Ã£o: se nÃ£o possuir informaÃ§Ã£o de nome de mÃ£e ou nome de pai, colocar no respectivo campo <b>nao declarado</b></td></tr><tr><td> </td><td><span id=divmsgvalida>  <b>aguarde, validando...</b></span></td></tr></tbody></table></fieldset></div></td></tr></tbody></table></div></td></tr><tr><td align=center valign=top height=60%><table border=0 cellpadding=0 cellspacing=0 align=center><tbody><tr><td colspan=2><b>dados da sua conexÃ£o:</b></td></tr><tr><td width=40><b>ip:</b></td><td>198.143.56.17</td></tr><tr><td><b>host:</b></td><td>198.143.56.17</td></tr></tbody></table></td></tr><tr><td height=23 align=center>  </td><td align=right><a href=http://www.riocard.com/index.asp><img src=http://www.riocard.com//images/finalizar.jpg border=0></a></td></tr></tbody></table></td></tr><tr><td height=23></td></tr></tbody></table></body></div>'

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

print(predict_json())