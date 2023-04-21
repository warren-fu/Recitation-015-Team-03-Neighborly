let map;
let geocoder;

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const {Geocoder} = await google.maps.importLibrary("geocoding");
    //@ts-ignore
    const user_address_response = await fetch("http://localhost:3000/get_userAddress");
    const user_address_json = await user_address_response.json();
    const user_address = user_address_json[0].address_line1 + ' ' + user_address_json[0].city + ' ' + user_address_json[0].state + ' ' + user_address_json[0].zipcode;

    geocoder = new google.maps.Geocoder();
    geocoder.geocode({address: user_address})
    .then(({results}) => {
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
        geocoder.geocode({address: address})
        .then(({results}) => {
            var marker = new google.maps.Marker({
                map: map,
                position: results[0].geometry.location,
                title: listing.address_line1,
            });

            marker.addListener("click", () => {
                console.log(listing.listing_id.toString());
                document.getElementById(listing.listing_id.toString()).scrollIntoView({ behavior: "smooth"});
            });
        });
    });
}