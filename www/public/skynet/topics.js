'use strict';

var lib = {},
    key = 'topics',
    topics = [];

function write(){
    window.localStorage.setItem(key, JSON.stringify(topics));
}

function getById(id){
    var topic;
    try{
        topic = _.find(topics, { id : id });
    }catch(e){

    }
    return topic;
}

function findIndex(id){
    var index = -1;
    try{
        index = _.findIndex(topics, { id : id });
    }catch(e){

    }
    return index;
}

lib.getAll = function(){

    var str = window.localStorage.getItem(key), json = [];

    try{
        json = JSON.parse(str);
    }catch(e){
        console.log('Error parsing topics', e);
    }

    topics = json;

    return json;

};

lib.get = function(id){

    if(!topics || !topics.length) lib.getAll();

    //console.log('Topics', JSON.stringify(topics), JSON.stringify(id));

    return getById(id);

};

lib.save = function(topic){
    if(!topic && !topic.length) return false;

    if(!topic.id) topic.id = createID();

    delete topic.sent;

    var index = findIndex(topic.id);

    if(!~index){
        topics.push(topic);
    }else{
        topics[index] = topic;
    }

    write();

    return topic;

};

lib.delete = function(topic){
    var index = findIndex(topic.id);

    delete topics[index];

    write();
};

module.exports = lib;