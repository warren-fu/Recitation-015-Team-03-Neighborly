let map;
let geocoder;

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { Geocoder } = await google.maps.importLibrary("geocoding");
    //@ts-ignore
    const user_address_response = await fetch("http://localhost:3000/get_userAddress");
    const user_address_json = await user_address_response.json();
    const user_address = user_address_json[0].address_line1 + ' ' + user_address_json[0].city + ' ' + user_address_json[0].state + ' ' + user_address_json[0].zipcode;

    geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: user_address })
        .then(({ results }) => {
            map = new Map(document.getElementById("map"), {
                disableDefaultUI: true,
                center: results[0].geometry.location,
                zoom: 12,
            });
        });

    const response = await fetch("http://localhost:3000/get_listings");
    const listings = await response.json();

    listings.forEach(async (listing) => {
        let address = listing.address_line1 + ' ' + listing.city + ' ' + listing.state + ' ' + listing.zipcode;
        geocoder.geocode({ address: address })
            .then(({ results }) => {
                var marker = new google.maps.Marker({
                    map: map,
                    position: results[0].geometry.location,
                    title: listing.address_line1,
                });

                marker.addListener("click", () => {
                    console.log(listing.listing_id.toString());
                    document.getElementById(listing.listing_id.toString()).scrollIntoView({ behavior: "smooth" });
                });
            });
    });
}

async function loadReplies(str) {
    var x = document.getElementById(str);
    if (x.style.display === "none") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
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