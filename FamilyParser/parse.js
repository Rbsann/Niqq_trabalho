/* jshint esversion: 6 */
var htmlparser = require("htmlparser2");
var fs = require("fs");


// depth first search of all descendants of an element
var findAllDescendants = function(element) {
    let descendants = [];
    if (element.children !== undefined) {
        element.children.forEach(element => {
            descendants.push(element);
            descendants = descendants.concat(findAllDescendants(element));
        });
    }
    return descendants;
};

// returns string with properties from element
var getElementInformationText = function(element) {
    var info = "";
    if (element.name === "input" && element.attribs !== undefined) {
        info += ["type", "name", "id", "title", "placeholder"].reduce((partial, property) => {
            if (element.attribs[property] !== undefined) {
                let attribute = element.attribs[property].trim();
                if (attribute !== "") {
                    partial += element.attribs[property].trim() + " ";
                }
            }
            return partial;
        }, "");
    }
    if (element.data) {
        var data = element.data.trim();
        if (data !== "") {
            info += element.data.trim() + " ";
        }
    }
    return info.replace(/(\r\n|\n|\r)/gm, ""); // remove line breaks and return
};

// returns text with information from all descendants
var getDescendantsStory = function(element) {
    let story = "";
    story += getElementInformationText(element);
    if (element.children !== undefined) {
        element.children.forEach(child => {
            story += getDescendantsStory(child);
        });
    }
    return story;
};

// returns array of DOM elements that return true when passed to the validator function
var findDOMElements = function(elements, validator) {
    let results = [];
    elements.forEach(element => {
        if (validator(element))
            results.push(element);
        if (element.children !== undefined)
            results = results.concat(findDOMElements(element.children, validator));
    });
    return results;
};


// returns first DOM element that returns true when passed to the validator function
var findOneDOMElement = function(elements, validator) {
    for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        if (validator(element)) {
            return element;
        }
        if (element.children !== undefined) {
            var child = findOneDOMElement(element.children, validator);
            if (child !== null) {
                return child;
            }
        }
    }
    return null;
};

// returns oldest ancestor that only has one descendant with tag input or select
var getElementAncestor = function(element) {
    let parent = element;

    var isElementRelated = function(el) {
        return (el !== element && el.type === "tag" && (el.name === "input" || el.name === "select"));
    };

    while (parent.parent !== null && findOneDOMElement(parent.parent.children, isElementRelated) === null) {
        parent = parent.parent;
    }

    return parent;
};

var handler = new htmlparser.DomHandler(function(error, dom) {
    if (error) {
        console.log(error);
    } else {
        findDOMElements(dom, element => {
            return element.type === "tag" && (element.name === "input" || element.name === "select") && element.attribs.type !== "hidden";
        }).forEach(element => {
            let lastAncestor = getElementAncestor(element);

            let fieldIdentification = {
                fieldTag: element.name,
                fieldType: element.attribs.type,
                name: element.attribs.name,
                id: element.attribs.id,
                placeholder: element.attribs.placeholder,
                story: getDescendantsStory(lastAncestor)
            
            };
            console.log(fieldIdentification);
        });

    }
});

var parser = new htmlparser.Parser(handler);
var htmlContents = fs.readFileSync("page_source.txt", "utf8");
parser.write(htmlContents);
parser.end();