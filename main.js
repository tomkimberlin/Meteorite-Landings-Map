// Initialize the map
var mymap = L.map("map", {
  worldCopyJump: true,
  attributionControl: false,
}).setView([0, 0], 2);

// Add a tile layer to the map (OpenStreetMap tile layer)
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mymap);

// Add OpenStreetMap attribution
L.control
  .attribution({
    prefix: false,
    position: "bottomright",
  })
  .addTo(mymap)
  .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>');

// Initialize the marker cluster group
var markers = L.markerClusterGroup();

// Fetch meteorite data from the server and add markers to the map
fetch("/Meteorite_Landings.csv")
  .then((response) => response.text())
  .then((csvData) => {
    Papa.parse(csvData, {
      header: true,
      complete: function (results) {
        // Split the data into chunks
        var chunkSize = 1000;
        var chunks = [];
        for (var i = 0; i < results.data.length; i += chunkSize) {
          chunks.push(results.data.slice(i, i + chunkSize));
        }

        // Process and add each chunk to the map after a delay
        var chunkIndex = 0;
        function processNextChunk() {
          if (chunkIndex < chunks.length) {
            chunks[chunkIndex].forEach((meteorite) => {
              if (isValidMeteorite(meteorite)) {
                var marker = L.marker([meteorite.reclat, meteorite.reclong]);
                var mass = parseFloat(meteorite["mass (g)"]).toLocaleString();
                var relictNote = "";
                var name = meteorite.name;
                if (meteorite.nametype === "Relict") {
                  relictNote = "<br><i>This meteorite is a relict, meaning it is heavily weathered and its original mineralogy has been significantly altered.</i>";
                  name = `<i>${meteorite.name}</i>`;
                }
                marker.bindPopup(`
                  <b>${name}</b><br>
                  ID: ${meteorite.id}<br>
                  Fall: ${meteorite.fall}<br>
                  Mass: ${mass}g<br>
                  Year: ${new Date(meteorite.year).getFullYear()}<br>
                  Class: ${meteorite.recclass}<br>
                  ${relictNote}
                `);
                markers.addLayer(marker);
              }
            });

            chunkIndex++;
            setTimeout(processNextChunk, 0);
          } else {
            // All chunks have been processed, add the markers to the map
            mymap.addLayer(markers);

            // Hide the loading screen
            document.getElementById("loading-screen").style.display = "none";
          }
        }

        // Start processing the first chunk
        processNextChunk();
      },
    });
  });

function isValidMeteorite(meteorite) {
  return meteorite.reclat && meteorite.reclong && meteorite.reclat !== "0.000000" && meteorite.reclong !== "0.000000" && meteorite.name && meteorite.id && meteorite.nametype && meteorite.fall && meteorite["mass (g)"] && meteorite.year && meteorite.recclass;
}
