
// if not iterable do only to single objetc; if iterable to every item
function assertArray(obj){
    if (!obj){
        return Error('ofject is nullish')
    }
    if (obj instanceof Array){
        return obj;
    }
    return [obj]
}

function parseLangText(type, xml, target){
    if (typeof xml[type] == "undefined"){return Error("no such property")}
    for (const instance of assertArray(xml[type])) {
        target[type+instance.$["xml:lang"].toUpperCase()] = instance._
    }
}

function isEmpty(obj) {  
    return Object.keys(obj).length === 0;
}

function getKey(key, obj) {
    return key.split('.').reduce(function(a,b){
      return a && a[b];
    }, obj);
}

module.exports = {assertArray, parseLangText, isEmpty, getKey}