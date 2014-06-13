'use strict';

document.getElementById('ag-cordova-loader').src = 'http://localhost/cordova.js';

var ratchet = document.getElementById('ratchet-theme');

if(ratchet && ratchet.length)
    ratchet.href = '/assets/ratchet/dist/css/ratchet-theme-ios.min.css';
