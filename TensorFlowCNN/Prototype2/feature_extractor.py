from HTMLParser import HTMLParser
from selenium import webdriver
import re

def urlFeatures(url):
    result = dict()
    url_regex = ["regist", "cadast", "client", "sign.?up"]
    for reg in url_regex:
        result['url' + reg] = len(re.findall(reg, url, re.IGNORECASE))
    return result


class HTMLFeatExtract(HTMLParser):
    inputs_type = ["password", "email"]
    inputs_regex = ["first", "last", "n[ao]me", "e?.?mail", "password", "senha", "date", "phone", "number", "user", "address",
                        "cep", "cpf","uf","complemento","numero","endereco"]
    href_regex = ["term", "privac"]
    href_auth_regex = ["facebook", "google"]
    attributes_searched = ["name", "placeholder", "id", "class"]
    action_url_regex = ["create", "new","nov[oa]", "cadast", "edit", "salvar", "save"]
    
    def __init__(self):
        HTMLParser.__init__(self)

        self.feats = dict()
        self.number_of_inputs = 0
        for kind in self.inputs_type:
            self.feats["inputs_type_" + kind] = 0
        for reg in self.inputs_regex:
            self.feats["inputs_reg_" + reg] = 0
        for href in self.href_regex:
            self.feats['href_reg_' + href] = 0
        for href_auth in self.href_auth_regex:
            self.feats['href_auth_regex_' + href_auth] = 0
        for pattern in self.action_url_regex:
            self.feats['form_action_' + pattern] = 0

    def getFeatures(self):
        return self.feats

    def handle_starttag(self, tag, attrs):
        if tag == "form":
            self.process_form(attrs)
        if tag == "input":
            self.number_of_inputs += 1
            self.process_input(attrs)
        if tag == "a":
            self.process_link(attrs)

    def handle_endtag(self, tag):
        pass
    
    def handle_data(self, data):
        pass

    def process_form(self, attrs):
        for att in attrs:
            if(att[0] == "action"):
                for reg in self.action_url_regex:
                    self.feats['form_action_' + reg] += len(re.findall(reg, att[1], re.IGNORECASE))

    def process_link(self, attrs):
        for att in attrs:
            if att[0] == "href":
                for reg in self.href_regex:
                    self.feats['href_reg_' + reg] += len(re.findall(reg, att[1], re.IGNORECASE))
                if (re.findall("auth", att[1], re.IGNORECASE)):
                    for reg in self.href_auth_regex:
                        self.feats['href_auth_regex_' + reg] += len(re.findall(reg, att[1], re.IGNORECASE))

    def process_input(self, attrs):
        info_text = ""
        for att in attrs:
            if att[0] == "type":
                self.process_input_type(att[1])
            if att[0] in self.attributes_searched:
                info_text += att[1]
        self.process_input_attr(info_text)

    def process_input_type(self, intype):
        for kind in self.inputs_type:
            if intype == kind:
                self.feats["inputs_type_" + kind] += 1

    def process_input_attr(self, inname):
        for reg in self.inputs_regex:
            self.feats["inputs_reg_" + reg] += len(re.findall(reg, inname, re.IGNORECASE)) 


def getAllFeatures(url, data):
    extract = HTMLFeatExtract()
    
    feat = urlFeatures(url)
    extract.feed(data)
    feat.update(extract.getFeatures())

    return feat, extract.number_of_inputs