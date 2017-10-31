from pymongo import MongoClient

def insertMongo():
    client = MongoClient("mongodb://thiago:123456@ds149059.mlab.com:49059/niqqdb")
    db = client.get_database("niqqdb")
    # collection = db["Raw_url"]
    f=open("urlListaFinal","r")
    for line in f.read().splitlines():
        db.Raw_url.insert_one(
            {"url":line}
        )
        # print(line)
    f.close()
insertMongo()