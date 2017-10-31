from HTMLParser import HTMLParser
from selenium import webdriver
import re
from bs4 import BeautifulSoup


def countFeatures(html):
    soup=BeautifulSoup(html,'html.parser')
    ids= ["email", "password", "nome",  "senha", "cpf" ,"username", 
    "name", "cep","cidade", "bairro", "login", "search","Email", "sobrenome", 
    "edit-search-block-form--2", "numero" ,"telefone" , "edit-submit" , "celular" ,
    "inputEmail", "endereco", "phone", "firstName", "confirm_password", "identifierId", 
    "lastName", "city", "email2", "gsc-i-id1","busca", "first_name",  
    "Password", "last_name", "rg", "userName", "mod-search-searchword",   
    "cnpj", "user_login", "FirstName", "login-pass", "search-field",   
    "login_password", "phoneNumber", "txtCep", "keywords", "field2", 
    "field3", "field1", "field4", "field5", "nascimento", "txtEmail",  
    "password2", "cfgen-element-2-29-2","estado", "complemento",
    "portal-searchbox-field","user_pass","qtcaminhao", "newsletter",
    "rua", "LastName", "inputPassword","send","pass"]

    classes=["form-control","input",  "ng-pristine", "required",  "text", 
    "ninja-forms-field","form-checkbox",  "form-text",
    "field","textbox", "btn","campo","hidden", "inputText", 
    "text-input",  "inputFormInscricao",   "input-block-level",   "lista", 
    "submit", "ea-triggers-bound", "libsyn-form-element",   "w2linput", 
    "text_input", "cfgen-form-value",   "campo_texto",   "button", 
    "search-input", "will-validate",   "search-field",   "input-text", 
    "naoValidado",   "checkbox",   "format_form",   "form-submit", 
    "whsOnd",   "campo2",   "txt",   "fmcmS-YPqjbf", 
    "tk3N6e-y4JFTd", "typeahead",   "nicdark_bg_grey2",
    "email", "placeholder-show",  "form-input",
    "ng-untouched", "capture_btn",   "inputLogin",   "text-field", 
    "mktoField",   "input-login",   "inputTxt",   "formul", 
    "botao",   "gform_hidden",   "searchField",   "textfield", 
    "formtable",   "check-trigger",   "password",   "c-form__text", 
    "assistive-text",   "fihidden",   "cfgen-type-text",   "inputbox", 
    "gp-login-input", "input01", "gsc-input" ]

    names= ["email","password","senha",
    "nome","cpf","sports","name","username","search",  
    "login","cidade","cep","telefone","bairro","Email",  
    "submit","cfgen-element-2-29","lastName","endereco","firstName",   
    "phone","sobrenome","searchword","numero","query","pass",  
    "interestedIn","celular","city","Package","user",  
    "search_block_form","gender","rg","product_id","nascimento",  
    "terms","complemento","first_name","Password","Submit",  
    "email2" ,"nf-field-241" ,"last_name" ,"confirm_password",
    "company","billingPackage","mgm_subscription","identifier",
    "cpfCnpj","ca","Nome","busca","language-controler",  
    "newsletter","hiddenPassword","Telefone","campaign",  
    "firstname","enviar","confirmarSenha","passwd",  
    "data_nascimento","state","estado" ,"op"]

    count_array=[]

    for id in ids:
        count_array.append(len(soup.find_all(id=id)))
    for classes in classes:
        count_array.append(len(soup.find_all(class_=classes))) 
    for name in names:
        count_array.append(len(soup.find_all(name=names)))
    
    return count_array
