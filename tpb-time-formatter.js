// ==UserScript==
// @name        The Pirate Bay Upload Time Fromatter
// @namespace	http://github.com/yeriomin/tpb-time-formatter
// @version     1.0
// @date        2014-11-21
// @description Script to make tpb show date/time in a more comprehensible format and using client computer's timezone
// @updateURL	https://raw.githubusercontent.com/yeriomin/tpb-time-formatter/master/tpb-time-formatter.js
// @downloadURL	https://raw.githubusercontent.com/yeriomin/tpb-time-formatter/master/tpb-time-formatter.js
// @author      yeriomin
// @grant       none
// @match       http://*.thepiratebay.org/*
// @match       https://*.thepiratebay.org/*
// @match       http://*.thepiratebay.se/*
// @match       https://*.thepiratebay.se/*
// @include     http://*thepiratebay.org/*
// @include     https://*thepiratebay.org/*
// @include     http://*thepiratebay.se/*
// @include     https://*thepiratebay.se/*
// @require     http://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js
// @require     http://raw.githubusercontent.com/phstc/jquery-dateFormat/master/dist/jquery-dateFormat.min.js
// ==/UserScript==

var dateFormat = "dd.MM.yy";
var timeFormat = "HH:mm";

var page = "", pathparts = location.pathname.split("/");
while (page == "") {
    page = pathparts.shift();
}
switch (page) {
    case "torrent":
        // This is the torrent page
        replaceDateInDescription();
        break;
    case "search":
    case "browse":
    case "recent":
        // This is some list page
        replaceDatesInList();
        break;
    default:
        // This is some other page - doing nothing
        console.log("No dates are going to be reformatted on this page");
}

/**
 * Replace a date in torrent's description on the page dedicated to one torrent
 *
 */
function replaceDateInDescription() {
    var dateElement = document.getElementsByClassName("col2").item(0).getElementsByTagName("dd").item(0);
    dateElement.innerHTML = $.format.toBrowserTimeZone(new Date(dateElement.innerHTML), timeFormat + ' ' + dateFormat);
}

/**
 * Replace dates in a torrent list
 *
 */
function replaceDatesInList() {
    var tableElement = document.getElementById('searchResult');
    var trElements = tableElement.getElementsByTagName('tr');
    for (var trNum = 0; trNum < trElements.length; trNum++) {
        var dateElement = trElements[trNum].getElementsByTagName('td').item(2);
        if (dateElement == null) {
            continue;
        }
        var date = getDate(dateElement.innerHTML);
        // Printing time only if we have info about time, because a row of 00:00 looks silly
        var format = dateFormat + (date.hasTime ? ' ' + timeFormat : '');
        dateElement.innerHTML = $.format.toBrowserTimeZone(date, format);
    }
}

function getDate(rawDateString) {
    // This helps us distinguish torrents which were uploaded at 00:00 and torrents which have no info about upload time
    var hasTime = true;
    var treatedDateString = rawDateString.replace('&nbsp;', ' ');
    if (treatedDateString.search("ago") != -1) {
        // "x mins ago" type
        var minutesAgo = treatedDateString.slice(" ").shift();
        var stringToReplace = minutesAgo + (minutesAgo == 1 ? "min" : "mins") + " ago";
        treatedDateString = treatedDateString.replace(stringToReplace, $.format.date(new Date().getTime() - minutesAgo*60*1000, "yyyy-MM-dd HH:mm"));
    } else if (treatedDateString.match(/\d\d-\d\d \d\d\d\d/g) != null) {
        // "01-30 2009" type
        hasTime = false;
        var treatedDateStringParts = treatedDateString.split(" ");
        var year = treatedDateStringParts.pop();
        var dateParts = treatedDateStringParts.pop().split("-");
        var month = dateParts.shift();
        var day = dateParts.shift();
        treatedDateString = year + "-" + month + "-" + day + " 00:00";
    } else if (treatedDateString.match(/\d\d-\d\d \d\d:\d\d/g) != null) {
        // "01-30 13:45" type
        var treatedDateStringParts = treatedDateString.split(" ");
        var time = treatedDateStringParts.pop();
        var dateParts = treatedDateStringParts.pop().split("-");
        var month = dateParts.shift();
        var day = dateParts.shift();
        treatedDateString = new Date().getYear() + "-" + month + "-" + day + " " + time;
    } else {
        // "Today 13:45" type
        treatedDateString = treatedDateString
            .replace("Today", $.format.date(new Date().getTime(), "yyyy-MM-dd"))
            .replace("Y-day", $.format.date(new Date().getTime() - 24*60*60*1000, "yyyy-MM-dd"))
        ;
    }
    // TPB dates are in GMT+0 time zone
    treatedDateString = treatedDateString + " GMT";
    var date = new Date(Date.parse(treatedDateString));
    date.hasTime = hasTime;
    return date;
}
