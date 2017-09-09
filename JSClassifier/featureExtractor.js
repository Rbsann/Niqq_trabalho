const htmlParser =  require('htmlparser2');

class FeatureExtractor{
    constructor(url, html){
        this.features = {};
        this.html = html;
        this.url = url;
        this.parser = this.getParser();
        
        this.urlRegex = ['regist', 'cadast', 'client', 'sign.?up', ];
        this.inputTypes = ["password", "email"];
        this.inputRegex = ["n[ao]me", "e?.?mail", "password", "senha", "date",
                             "phone", "number", "user", "address", "cep"];
        this.hrefRegex = ["privac"];
        this.hrefAuthRegex = ["facebook"];
        this.attributesSearched = ["name", "placeholder", "id", "class"];

        this.prepare();
    }

    prepare(){
        this.initializeFeatureObject("url", this.urlRegex);
        this.initializeFeatureObject("inputs_type_", this.inputTypes);
        this.initializeFeatureObject("inputs_reg_", this.inputRegex);
        this.initializeFeatureObject("href_reg_", this.hrefRegex);
        this.initializeFeatureObject("href_auth_regex_", this.hrefAuthRegex);
    }
    
    initializeFeatureObject(prefix, regexList){
        regexList.forEach(function(regex){
            let key = prefix + regex;
            this.features[key] = 0;
        }, this);
    }

    getParser(){
        let self = this;
        return new htmlParser.Parser({
            onopentag: function(name, attrs){
                if(name === "input")
                    self.parseInput(attrs);
                if(name === "a")
                    self.processLink(attrs);
            }
        }, { decodeEntities: true });
    }
    
    // 'g' -> match as much as possible
    // 'i' -> ignore case
    matchCount(pattern, str){
        if(!str)
            return 0;
        let matches = str.match(new RegExp(pattern, 'gi')) || [];
        return matches.length;
    }
    
    extractUrlFeaturesFrom(url){
        this.urlRegex.forEach(function(feature) {
            this.features['url' + feature] = this.matchCount(feature, url);
        }, this);
    }
    
    parseInputType(type){
        let key = "inputs_type_" + type;
    
        if(this.inputTypes.indexOf(type) > -1){
            this.features[key] += 1;
        }
    }
    
    processInputAttr(infoText){
        this.inputRegex.forEach(function(regex){
            let key = "inputs_reg_" + regex;
            this.features[key] += this.matchCount(regex, infoText);
        }, this);
    }
    
    parseInput(attrs){
        let infoText = "";
        if(attrs.type)
            this.parseInputType(attrs.type);
        
        Object.keys(attrs).forEach(function(key){
            if(this.attributesSearched.indexOf(key) > -1){
                infoText += attrs[key];
            }
        }, this);
    
        if(infoText !== "")
            this.processInputAttr(infoText);
    }
    
    processAuth(attrs){
        if(attrs.href.match("auth")){
            this.hrefAuthRegex.forEach(function(regex){
                let key = "href_auth_regex_" + regex;
                this.features[key] += this.matchCount(regex, attrs.href);
            }, this);
        }
    }
    
    processLink(attrs){
        if(attrs.href){
            this.hrefRegex.forEach(function(regex){
                let key = "href_reg_" + regex;
                this.features[key] += this.matchCount(regex, attrs.href);
    
                this.processAuth(attrs);
            }, this);
        }
    }
    
    /*
        Retorna todas as features do site passado no construtor.
    */
    getFeatures(){
        let self = this;
        return new Promise((resolve, reject) => {
            self.parser.write(self.html);
            self.extractUrlFeaturesFrom(self.url);
            let binFeatures = {};
            Object.keys(self.features).forEach(function(key){
                console.log(key);
                binFeatures[key] = self.features[key] > 0 ? 1 : 0;
            }, this);
            resolve(binFeatures);
        });
    }
}

module.exports.featureExtractor = FeatureExtractor;