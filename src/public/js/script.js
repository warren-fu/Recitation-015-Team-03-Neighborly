var searchManager;
var locName;
var map;

function getMap() {

    if (!navigator.geolocation) {
        console.error("Geolocation not supported");
        return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
        console.log("position: ", position);
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;

        map = new Microsoft.Maps.Map('#myMap', {
            credentials: 'AljStGYPC2c0wdx-bBLB6DEKMphxfnbKeD98nf5NMJT7g_EFDUBTjzBxVN4-kqvX',
            center: new Microsoft.Maps.Location(latitude, longitude),
            zoom: 11
        });

        var center = map.getCenter();

        reverseGeocode();
        console.log("locName: ", locName);
    }, (err) => {
        console.error(err.message);
    });

}

function reverseGeocode() {
    //If search manager is not defined, load the search module.
    if (!searchManager) {
        //Create an instance of the search manager and call the reverseGeocode function again.
        Microsoft.Maps.loadModule('Microsoft.Maps.Search', function () {
            searchManager = new Microsoft.Maps.Search.SearchManager(map);
            reverseGeocode();
        });
    } else {
        let center = map.getCenter();
        var searchRequest = {
            location: center,
            callback: function (r) {
                locName = r.name;
                var pin = new Microsoft.Maps.Pushpin(center, {
                    title: locName,
                    color: 'red'
                });

                map.entities.push(pin);
            },
            errorCallback: function (e) {
                //If there is an error, alert the user about it.
                alert("Unable to reverse geocode location.");
            }
        };
        //Make the reverse geocode request.
        searchManager.reverseGeocode(searchRequest);
        console.log("locName: ", locName);
    }
}

document.onreadystatechange = function () {
    var state = document.readyState
    if (state == 'interactive') {
        document.getElementById('contents').style.visibility = "hidden";
    } else if (state == 'complete') {
        setTimeout(function () {
            document.getElementById('interactive');
            document.getElementById('load').style.visibility = "hidden";
            document.getElementById('contents').style.visibility = "visible";
        }, 2700);
    }
}

function searchListings() {
    const searchInput = document.getElementById('search-input');
    const searchQuery = searchInput.value;

    fetch(`/listings?city=${searchQuery}`)
        .then(response => response.json())
        .then(listings => {
            const listingsContainer = document.querySelector('.listings-container');
            listingsContainer.innerHTML = '';
            listings.forEach(listing => {
                const listingHTML = `
            <div id="${listing.listing_id}" class="card p-2 mb-3" style="width: 100%;">
              <img class="card-img-top" src="https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png" alt="Card image cap">
              <div class="card-body">
                <div class="row">
                  <div class="col-9">
                    <h5 class="card-title">${listing.address_line1}</h5>
                  </div>
                  <div class="col-3">
                    <h5 class="card-title text-right">$${listing.price}</h5>
                  </div>
                </div>
                <p class="card-text">${listing.description}</p>
                <a href="/listing/${listing.listing_id}" class="btn btn-primary">Apply</a>
              </div>
            </div>
          `;
                listingsContainer.insertAdjacentHTML('beforeend', listingHTML);
            });
        })
        .catch(error => console.error(error));
}

function reloadReplies(pid) {
    $('.modal-content').load('/feed/p/' + pid);
}
