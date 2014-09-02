'use strict';

var lib = {},
    key = 'topics',
    defaultKey = 'default_topics',
    loadedDefaults = [],
    topics = [];

function write() {
    window.mobibluStorage.setItem(key, topics);
}

function writeDefaults() {
    window.mobibluStorage.setItem(defaultKey, loadedDefaults);
}

function getById(id) {
    var topic;
    try {
        topic = _.find(topics, { id: id });
    } catch (e) {

    }
    return topic;
}

function findIndex(id) {
    var index = -1;
    try {
        index = _.findIndex(topics, { id: id });
    } catch (e) {

    }
    return index;
}

var defaultTopics = [
    {
        id: 'a12319b-5d4f-ad87-a90a-198e92833335',
        name: 'Flow Preset A',
        wait: false,
        payload: ''
    },
    {
        id: 'a112di9b-5dsf-ad82-a90a-198e928123335',
        name: 'Flow Preset B',
        wait: false,
        payload: ''
    }
];

lib.getLoadedDefaultTopics = function () {
    var obj = window.mobibluStorage.getItem(defaultKey) || [];

    return loadedDefaults = obj;
};

lib.saveDefaultTopic = function (topic) {

    if ((topic && topic.length)) return false;

    if (!topic.id) topic.id = utils.createID();

    delete topic.sent;

    var index = _.findIndex(loadedDefaults, { id: topic.id });

    if (!~index) {
        loadedDefaults.push(topic);
    } else {
        loadedDefaults[index] = topic;
    }

    writeDefaults();

    return topic;
};

lib.getAll = function () {

    if (!loadedDefaults.length) lib.getLoadedDefaultTopics();

    _.each(defaultTopics, function (topic) {
        var index = _.findIndex(loadedDefaults, { id: topic.id });
        if (!~index) {
            lib.saveDefaultTopic(topic);
            lib.save(topic);
        }
    });

    var obj = window.mobibluStorage.getItem(key) || [];

    topics = obj || [];

    if (topics && topics.length) {
        _.remove(topics, function (t) {
            return !t;
        });
        topics = _.sortBy(topics, 'name');
    }

    return topics;

};

lib.get = function (id) {

    if (!topics || !topics.length) lib.getAll();

    return getById(id);
};

lib.save = function (topic) {
    if ((topic && topic.length)) return false;

    if (!topic.id) topic.id = utils.createID();

    delete topic.sent;

    var index = findIndex(topic.id);

    if (!~index) {
        topics.push(topic);
    } else {
        topics[index] = topic;
    }

    write();

    return topic;
};

lib.delete = function (topic) {
    _.remove(topics, { id: topic.id });

    write();
};

lib.clear = function(){
    topics = [];
    write();
};

module.exports = lib;