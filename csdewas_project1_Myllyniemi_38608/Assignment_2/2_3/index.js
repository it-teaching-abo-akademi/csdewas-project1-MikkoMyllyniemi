var map;
var path;
var markers = [];
var show_buses = false;

var routess;
var trips;
var shapes;

var prevWarning = 0;
var refreshHistory = [];
var refreshWaitTime = 60000;

function initMap(){
    var pos = {lat: 60.45, lng: 22.2833};
    map = new google.maps.Map(document.getElementById('map'), {
        center: pos,
        zoom: 12
        });
}

function hideMarkers(){
    markers.forEach(function(marker){
        marker.setMap(null);
    });
}
function showMarkers(){
    markers.forEach(function(marker){
        marker.setMap(map);
    });
}
function removeMarkers(){
    markers.forEach(function(marker){
        marker.setMap(null);
    });
    markers = [];
}

function addMarkers(positions){
    positions.forEach(function(position){
        var marker = new google.maps.Marker({
            position: position,
            map: map
        });
        //keep track of the markers so we can hide/show them at will
        markers.push(marker);
    });
    if(!show_buses){
        hideMarkers();
    }
}

function refresh(){
    //keeping the refresh rate at a minimum of once a minute
    if(new Date().getTime() - refreshHistory[0] < refreshWaitTime){
        alert("Too many requests"+
        " wait " + parseInt((refreshWaitTime-(new Date().getTime() - refreshHistory[0]))/1000) + " seconds.");
    }else if(refreshHistory.length < 3){
        refreshHistory.push(new Date().getTime());
        getLiveBuses();
    }else{
        refreshHistory.shift();
        refreshHistory.push(new Date().getTime())
        getLiveBuses();
    }
    setHistory(refreshHistory);
}
function getLiveBuses(live_buses){
    
    xhttpRequest(getLiveBuses2, "https://data.foli.fi/siri/vm");
}
function getLiveBuses2(live_buses){
    var route_id = $("#busSelector").val();
    var route_name = getRouteName(route_id);

    buses = live_buses.result.vehicles;
    linename = "";

    var current_positions = [];
    $.each(buses, function(k, v) {
        
        linename = v.publishedlinename;

        if(linename === route_name){
            var latitude = v.latitude;
            var longitude = v.longitude;
            var position = {lat: latitude, lng: longitude};
            current_positions.push(position);
        }
    });
    removeMarkers();
    addMarkers(current_positions);

}

function error(code, file){
    if(code == 404 && new Date().getTime() - prevWarning > 1000){
        alert("Could not get: " + file);
        prevWarning = new Date().getTime();
    }
}

function xhttpRequest(callback, file){
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function (){
        if(this.readyState == 4 && this.status == 200){
            var jsonObj = JSON.parse(this.responseText);
            callback(jsonObj);
        }
        if(this.status == 404){
            error(404, file);
        }
    }
    rawFile.send();
}
function displayShape(route_id){
    var url = "https://data.foli.fi/gtfs/trips/route/" + route_id;
    xhttpRequest(displayShape2, url);
}
function displayShape2(shapes){
    var shape_id = shapes[0].shape_id;
    var url = "https://data.foli.fi/gtfs/shapes/" + shape_id;
    xhttpRequest(drawShape, url);
}
function drawShape(path_coordinates){
    if(path !== undefined) path.setMap(null);
    var path_length = Object.keys(path_coordinates).length;
    //making sure only one path is visible at any given time
    var coordinates = []
    for(i=0; i < path_length; i++){
        coordinates.push({lat: path_coordinates[i].lat, lng: path_coordinates[i].lon});
    }

    path = new google.maps.Polyline({
      path: coordinates,
      strokeColor: 'red',
      strokeOpacity: 1.0,
      strokeWeight: 2
    });
    path.setMap(map);
    //as per the polyline tutorial
}

function Comparator(a, b){
    if (a[1] < b[1]) return -1;
    if (a[1] > b[1]) return  1;
    return 0;
    //to be used in sorting
}

function getHistory(){
    return localStorage.getItem("refreshHistory");
}

function setHistory(history){
    localStorage.setItem("refreshHistory", JSON.stringify(history));
}

function getRouteName(route_id){
    for(i=0; i<routess.length; i++){
        if(route_id === routess[i].route_id){
            return routess[i].route_short_name;
        }
    }
}

function addRoutes(routes){
    var route_pairs = [];
    routess = routes;
    for(i=1; i<routes.length-1; i++){
        var route_pair = [routes[i].route_id, routes[i].route_short_name];
        route_pairs.push(route_pair);
    }
    route_pairs.sort(Comparator);
    for(i=0; i<route_pairs.length; i++){
        var route_id = route_pairs[i][0];
        var route_name = route_pairs[i][1];
        $("#busSelector").append(`<option value="`+route_id+`">` + route_name + `</option>`);
    }

}
$(document).ready(function () {
    if(storageAvailable("localStorage")){
        if(localStorage.getItem("refreshHistory") !== null){
            refreshHistory = (JSON.parse(localStorage.refreshHistory)) || [];
            console.log("Found existing list in local storage: ", history);
        }else{
            setHistory(refreshHistory);
            console.log("Putting empty list in local storage");
        }
        //this should look somewhat familiar
    }else{
    }
    (function getRoutes(routess){
        xhttpRequest(addRoutes, "https://data.foli.fi/gtfs/routes");
    })();

    $("#refreshButton").click(function(){
        refresh();
    });

    $("#showBusButton").click(function(){
        show_buses = !show_buses;
        if(show_buses){
            $(this).html("Hide buses");
            refresh();
            showMarkers();
        }else{
            $(this).html("Show buses");
            hideMarkers();
        }
    });

    $("#showRouteButton").click(function(){
        var route_id = $("#busSelector").val();
        displayShape(route_id);
    });

    function storageAvailable(type) {
        try {
            var storage = window[type],
                x = '__storage_test__';
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        }
        catch(e) {
            return e instanceof DOMException && (
                e.code === 22 ||
                e.code === 1014 ||
                e.name === 'QuotaExceededError' ||
                e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
                storage.length !== 0;
        }
    }
});
