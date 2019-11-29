var map;
var marker;

function initMap(latitude, longitude){
    createMap(60.45, 22.2833);
}

function moveMap(latitude, longitude){
    createMap(latitude, longitude);
}

function createMap(latitude, longitude){
    var pos = {lat: latitude, lng: longitude};
    console.log("Pos: " + pos.lat + " , " + pos.lng);
    map = new google.maps.Map(document.getElementById('map'), {
        center: pos,
        zoom: 8,
        mapTypeControl: true,
        mapTypeControlOptions: {
         style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
         position: google.maps.ControlPosition.TOP_CENTER
        },
        zoomControl: true,
        zoomControlOptions: {
         position: google.maps.ControlPosition.LEFT_CENTER
        },
        scaleControl: true,
        streetViewControl: true,
        streetViewControlOptions: {
         position: google.maps.ControlPosition.LEFT_TOP
        },
        fullscreenControl: true
        });
    var marker = new google.maps.Marker({
          position: pos,
          map: map,
        });
    console.log(map);
    //mostly from the Google Maps API tutorial
}
$(document).ready(function () {
    var history = [];
    if(storageAvailable("localStorage")){
        if(localStorage.getItem("history") !== null){
            history = JSON.parse(localStorage.history);
            for(i=0; i<history.length; i++){
                $("#inputHistory").append(history[i]);
                //here we check whether or not there are previous searches in the local storage, and add them 
                //to the list if there are
            }
        }else{
            localStorage.history = JSON.stringify(history);
            //if there are no previous searches, we have an empty list instead
        }
    }else{
        //in the odd case that the browser you are using doesn't have local storage, we end up here
    }
    $("#inputBox").on('click', '#button', function () {
        var zip_code = $("#zipCodeField").val();
        var country = $("#countrySelector").val();
        history = JSON.parse(localStorage.history);

        if(history.length < 10){
            $("#inputHistory").append("<li>" + country + " - " + zip_code + "</li>");
            var item = "<li>" + country + " - " + zip_code + "</li>";
            history.push(item);
        }
        else{
            $("#inputHistory").append("<li>" + country + " - " + zip_code + "</li>");
            $("#inputHistory li:first").remove();
            var item = "<li>" + country + " - " + zip_code + "</li>";
            history.push(item);
            history.shift();
        }
        localStorage.history = JSON.stringify(history);
        //we add any searches into the history tab, and if the number of searches exceeds 15 we remove the oldest search
        //to save som space (any more than 10 will strech the history box)

        
        var client = new XMLHttpRequest();
        var url = "https://api.zippopotam.us/"+getCountryCode(country)+"/"+zip_code;
        client.open("GET", url, true);
        client.onreadystatechange = function() {
            // sending a request to zippopotamus and waiting for the response
        	if(client.readyState == 4) {
                $("#outputBoxTable").empty();
                var json_response = client.responseText;
                var response = JSON.parse(json_response);
                result = response;

                if(response.places !== null && response.places !== undefined){
                    var latitude = parseFloat(response.places[0].latitude);
                    var longitude = parseFloat(response.places[0].longitude);
                    createMap(latitude, longitude);
                    $.each(response, function(x, y) {
                        if(x === "places"){
                            var positions = [];
                            y.forEach(function(place){
                                latitude = parseFloat(place.latitude);
                                longitude = parseFloat(place.longitude);
                                var position = {lat: latitude, lng: longitude};
                                //we get a row entry for the most recent search, showing the country, lat and long
                                $("#outputBoxTable").append(`
                                <div id="output_table_row">
                                    <p class="col-3">`+country+`</p>
                                    <p class="col-3">`+latitude+`</p>
                                    <p class="col-3">`+longitude+`</p>
                                </div>`);
                                var marker = new google.maps.Marker({
                                    position: position,
                                    map: map
                                });
                            });
                        }
                    });

                }

        	};
        };
        client.send();
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
                //a couple of necessary error checks to ensure that the program works well
                storage.length !== 0;
        }
    } 


    function getCountryCode (country) {
        if (isoCountries.hasOwnProperty(country)) {
            return isoCountries[country];
        } else {
            return country;
        }
    }

    var isoCountries = {
      'Finland': 'FI',
      'Sweden': 'SE',
      'France': 'FR',
      'Germany': 'DE'
       }; 
       //i began wondering how i could potentially implement every single country into the program
       //but at this point i must admit i am streched for time and the fatigue is getting the better of me
});
