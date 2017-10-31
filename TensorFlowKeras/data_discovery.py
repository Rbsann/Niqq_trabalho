from pymongo import MongoClient
import base64
import zlib
import re

def get_pages_from_db():
    client = MongoClient("mongodb://thiago:123456@ds149059.mlab.com:49059/niqqdb")
    db = client.get_database("niqqdb")
    collection = db["pages"]
    pages = []
    for page in collection.find({ "classified":True, "html": {"$exists": True}}, no_cursor_timeout=True):
        html = getSourceFrom64String(page["html"])
        if(html is None):
            continue
        else:
            page["html"] = html
            pages.append(page)
    
    return pages

def getSourceFrom64String(str):
    if(str is None or len(str) < 100):
        return None

    html = zlib.decompress(base64.b64decode(str))
    return html

# def input_number_equal_to(input_number):
#     collection = get_pages_from_db()
#     pages_with_inputs = []
#     total_pages = []

#     for page in collection.find({ "classified":True, "html": {"$exists": True}}, no_cursor_timeout=True):
#         html = getSourceFrom64String(page["html"])
#         if(html is None):
#             continue
#         num_inputs = len(re.findall("<input", html, re.IGNORECASE))
#         if(num_inputs >= input_number):
#             pages_with_inputs.append(num_inputs)
#         total_pages.append(num_inputs)
#     return total_pages, pages_with_inputs

# def standart_deviation(mean, pages):
#     differences = [x - mean for x in pages]
#     sq_differences = [d ** 2 for d in differences]
#     return sum(sq_differences)

# def get_info_from_dataset():
#     pages, pages_with_input = input_number_equal_to(3)
#     mean_pages_with_input = float(sum(pages_with_input)) / float(sum(pages))
#     std = standart_deviation(mean_pages_with_input, pages)
#     print "Media do numero de inputs ", mean_pages_with_input 
#     print "Variancia do numero de inputs", std

def count_pages_input(num, pages):
    count = 0
    for page in pages:
        inputs = len(re.findall("<input", page['html'], re.IGNORECASE))
        if(inputs >= num):
            count += 1
    return count

def count_inputs(num, pages):
    count = 0
    for page in pages:
        inputs = len(re.findall("<input", page['html'], re.IGNORECASE))
        if(inputs >= num):
            count += inputs
    return count

def count_forms(num, pages):
    count = 0
    for page in pages:
        inputs = len(re.findall("<input", page['html'], re.IGNORECASE))
        if(inputs >= num and page["isForm"] == True):
            count+=1
    return count

def data_about_data(num):
    pages = get_pages_from_db()
    total_valid_pages = len(pages)
    pages_with_inputs = count_pages_input(num, pages)
    print "Number of pages with valid html code:", total_valid_pages
    print "Number of pages with more than ", num, " inputs ",
    print pages_with_inputs, "/", total_valid_pages
    print "Within the group of pages with ", num, "or more inputs:"
    print "\t - the average amount of inputs is: ", count_inputs(num, pages) / pages_with_inputs
    print "\t - the number of pages that are classified as form: ", count_forms(num, pages)

data_about_data(40)