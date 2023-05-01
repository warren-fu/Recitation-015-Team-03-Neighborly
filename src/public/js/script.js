mapboxgl.accessToken = 'pk.eyJ1Ijoid2lqbzkzODUiLCJhIjoiY2xoMmJ2ZTF5MWJnNTNsczJ5Njg2aXZiciJ9.3vvR40LBc68X6YmLAimb2w';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/wijo9385/clh2oc2b5007t01r68c730bcu',
    center: [-105.270347, 40.015793],
    zoom: 12
});

map.on('load', async () => {
    var response = await fetch('http://localhost:3000/get_listings');
    var result = await response.json();

    const mapboxClient = mapboxSdk({ accessToken: mapboxgl.accessToken });

    result.forEach(listing => {
        mapboxClient.geocoding
            .forwardGeocode({
                query: listing.address,
                autocomplete: false,
                limit: 1
            })
            .send()
            .then((response) => {
                if (
                    !response ||
                    !response.body ||
                    !response.body.features ||
                    !response.body.features.length
                ) {
                    console.error('Invalid response:');
                    console.error(response);
                    return;
                }
                const feature = response.body.features[0];

                // Create a marker and add it to the map.
                var marker = new mapboxgl.Marker().setLngLat(feature.center).addTo(map);

                marker.getElement().addEventListener('click', () => {
                    document.getElementById('' + listing.listing_id).scrollIntoView({behavior: 'smooth'});
                });
            });
    });
});