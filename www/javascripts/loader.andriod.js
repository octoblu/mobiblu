'use strict';

document.getElementById('ag-cordova-loader').src = 'http://localhost/zordova.js';

var ratchet = document.getElementById('ratchet-theme');

if(ratchet && ratchet.length)
    ratchet.href = '/stylesheets/ratchet-theme-andriod.min.css';
