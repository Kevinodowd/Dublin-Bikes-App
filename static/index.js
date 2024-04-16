// Initialize and add the map
let map;
let currentMarkers = [];
let directionsRenderer;
let startMarker, endMarker;
let routeDistance;

const returnTimeInput = document.getElementById("returnTime");
const startTimeInput = document.getElementById("startTime");
const currentTime = new Date();
let selectedStart;
let selectedEnd;

const { Map, InfoWindow } = await google.maps.importLibrary("maps");
const { AdvancedMarkerElement, PinElement, AdvancedMarkerClickEvent } =
  await google.maps.importLibrary("marker");

let infoWindowArray = [];

const { Place } = await google.maps.importLibrary("places");

const stations_json = await fetchStations();

const bikeBtn = document.getElementById("availableBikes");
const spaceBtn = document.getElementById("availableSpaces");
const startLocationInput = document.getElementById("startLoc");
const endLocationInput = document.getElementById("endLoc");
const resetBtn = document.getElementById("resetBtn");
const submitBtn = document.getElementById("submitBtn");

const STATION_STRUCTURE = {
  ID: 0,
  NAME: 1,
  ADDRESS: 2,
  LATITUDE: 3,
  LONGITUDE: 4,
  BANKING: 5,
  BIKE_NUM: 6,
  BIKE_STANDS: 7,
  FETCH_TIME: 8,
  LAST_UPDATE: 9,
};

async function setDefaultDatetimeLocal(elementId, time) {
  const datetimeInput = document.getElementById(elementId);
  const now = new Date();

  const dateTimeLocalFormat =
    now.getFullYear() +
    "-" +
    ("0" + (now.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + now.getDate()).slice(-2) +
    "T" +
    ("0" + now.getHours()).slice(-2) +
    ":" +
    ("0" + now.getMinutes()).slice(-2);

  datetimeInput.value = dateTimeLocalFormat;
}

function clearMarkers() {
  currentMarkers.forEach((marker) => {
    marker.map = null; // remove marker from map
    marker = null;
  });
  currentMarkers = [];
}

bikeBtn.addEventListener("click", () => {
  changeIcon(stations_json);
  bikeBtn.disabled = true;
  bikeBtn.classList.add("disabled");
  spaceBtn.disabled = false;
  spaceBtn.classList.remove("disabled");
});
spaceBtn.addEventListener("click", () => {
  changeIcon(stations_json);
  spaceBtn.disabled = true;
  spaceBtn.classList.add("disabled");
  bikeBtn.disabled = false;
  bikeBtn.classList.remove("disabled");
});

async function initMap(stations_json) {
  try {
    //set the position to dublin
    const position = { lat: 53.3498, lng: -6.2603 };

    map = new Map(document.getElementById("map"), {
      zoom: 13.2,
      center: position,
      mapId: "ca9c8053cd850a9c",
    });
    console.log("generate a map.");
    const tileLoadedListener = map.addListener("tilesloaded", () => {
      // Add markers to current markers list. Async in order to add the marker, not the promise for each
      stations_json.forEach(async (station) => {
        const marker = await generateIcon(station, "bike");
        currentMarkers.push(marker);
      });
      submitBtn.disabled = false;
      submitBtn.classList.remove("disabled");
      resetBtn.disabled = false;
      resetBtn.classList.remove("disabled");
      spaceBtn.disabled = false;
      spaceBtn.classList.remove("disabled");
      tileLoadedListener.remove();
    });

    console.log("generate stations.");
    ///////////////////
    window.directionsService = new google.maps.DirectionsService();
    ///////////////////////
  } catch (error) {
    console.log(error);
  }
}

function calculateAndDisplayRoute(startStation, endStation) {
  directionsService
    .route({
      origin: {
        lat: startStation.station[STATION_STRUCTURE.LATITUDE],
        lng: startStation.station[STATION_STRUCTURE.LONGITUDE],
      },
      destination: {
        lat: endStation.station[STATION_STRUCTURE.LATITUDE],
        lng: endStation.station[STATION_STRUCTURE.LONGITUDE],
      },
      travelMode: google.maps.TravelMode.BICYCLING,
    })
    .then((response) => {
      directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        preserveViewport: true,
        polylineOptions: { strokeColor: "yellow" },
      });

      //unit:m
      routeDistance = response.routes[0].legs[0].distance.value;
      console.log(routeDistance);

      directionsRenderer.setMap(map);
      directionsRenderer.setDirections(response);
      setBoundsToStartEnd();
    })
    .catch((e) => console.log("Directions could not be displayed."));
}

function timestampToDatetime(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = ("0" + (date.getMonth() + 1)).slice(-2);
  const day = ("0" + date.getDate()).slice(-2);
  const hour = ("0" + date.getHours()).slice(-2);
  const minute = ("0" + date.getMinutes()).slice(-2);

  // Create a string in the desired format
  const formattedDate =
    year + "-" + month + "-" + day + " " + hour + ":" + minute;

  return formattedDate;
}

async function getOverlayDate() {
  function formatNumberToString(numberToFormat) {
    // 1 ->  01  ->   01
    // 12 -> 012 ->   12
    return ("0" + numberToFormat).slice(-2);
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = now.toLocaleString("en-US", { month: "long" });
  const day = formatNumberToString(now.getDate());
  const hour = formatNumberToString(now.getHours());
  const minute = formatNumberToString(now.getMinutes());

  const currentDate = `${day} ${month} ${year}`;
  const currentTime = `${hour}:${minute}`;
  const overlayDate = `<p style="margin-block: 0em;">Today is ${currentDate} &nbsp &nbsp &nbsp &nbsp Current time: ${currentTime} &nbsp &nbsp &nbsp &nbsp;</p>`;

  const overlayInfo = document.getElementById("overlayInfo");
  overlayInfo.innerHTML = overlayDate;
}

async function initWeather(weather) {
  const weather_json = await fetchWeather();
  if (weather_json) {
    const weather_info = weather_json[0];

    const weatherDescription = weather_info[2];
    const iconImg = document.createElement("img");
    iconImg.setAttribute(
      "src",
      "https://openweathermap.org/img/wn/" + weather_info[3] + ".png"
    );
    iconImg.setAttribute("style", "height: 2em");
    const temperature = Math.floor(weather_info[4] - 273.15);
    const overlayDubWeather = `<p style="display: inline; margin-block: 0em;">Today's Dublin Weather: ${temperature} °C with ${weatherDescription} </p>`;
    document.getElementById("overlayInfo").innerHTML += overlayDubWeather;
    document.getElementById("overlayInfo").appendChild(iconImg);
  }
}

//show all the bike stations on map
async function fetchStations() {
  try {
    const response = await fetch("/stations");
    if (!response.ok) {
      throw new Error("Failed to fetch data.");
    }
    return await response.json();
  } catch (error) {
    console.log("error:", error);
    throw error;
  }
}

async function fetchWeather() {
  try {
    const response = await fetch("/weather");
    if (!response.ok) {
      throw new Error("Failed to fetch latest weather.");
    }
    return await response.json();
  } catch {
    console.log("error in fetchWeather(): ", error);
    throw error;
  }
}

function IconColor(station, type = "bike") {
  if (type == "space") {
    const spaceLeft = station[STATION_STRUCTURE.BIKE_STANDS];
    if (spaceLeft * 1 === 0) {
      return new PinElement({
        glyphColor: "white",
        background: "#F80303",
        borderColor: "#F80303",
      });
    } else {
      return new PinElement({
        glyphColor: "white",
        background: "#00B2FF",
        borderColor: "#125FE6",
      });
    }
  } else if (type === "start") {
    return new PinElement({
      glyphColor: "white",
      background: "red",
      borderColor: "red",
    });
  } else if (type === "end") {
    return new PinElement({
      glyphColor: "white",
      background: "purple",
      borderColor: "purple",
    });
  } else if (type === "nearToStart") {
    return new PinElement({
      glyphColor: "white",
      background: "blue",
      borderColor: "blue",
    });
  } else if (type === "nearToEnd") {
    return new PinElement({
      glyphColor: "white",
      background: "yellow",
      borderColor: "yellow",
    });
  } else {
    const bikeLeft = station[STATION_STRUCTURE.BIKE_NUM];
    if (bikeLeft * 1 === 0) {
      return new PinElement({
        glyphColor: "white",
        background: "#F80303",
        borderColor: "#F80303",
      });
    } else {
      return new PinElement({
        // plygh: bikeLeft,
        glyphColor: "white",
        background: "#1DC83F",
        borderColor: "#1DC83F",
      });
    }
  }
}

function changeIcon(stations_json) {
  clearMarkers();
  let target;

  if (
    !bikeBtn.classList.contains("disabled") &&
    spaceBtn.classList.contains("disabled")
  ) {
    target = "bike";
  } else if (
    !spaceBtn.classList.contains("disabled") &&
    bikeBtn.classList.contains("disabled")
  ) {
    target = "space";
  }

  stations_json.forEach(async (station) => {
    const marker = await generateIcon(station, target);
    currentMarkers.push(marker);
  });
}

async function generateIcon(station, type) {
  const position = {
    lat: station[STATION_STRUCTURE.LATITUDE],
    lng: station[STATION_STRUCTURE.LONGITUDE],
  };

  const pinBackground = IconColor(station, type);

  const marker = new AdvancedMarkerElement({
    map: map,
    gmpClickable: true,
    position: position,
    title: station[STATION_STRUCTURE.ADDRESS],
    content: pinBackground.element,
  });

  // Marker event listener for mouseover
  if (type != "start" && type != "end") {
    marker.addListener("gmp-click", () => {
      //infoWindow.close()
      if (infoWindowArray.length != 0) {
        infoWindowArray[0].close();
        infoWindowArray = [];
      }
      const infoWindow = new InfoWindow();
      infoWindowArray.push(infoWindow);
      map.setZoom(17);

      map.setCenter(marker.position);
      let cardAccepted = "";
      if (station[STATION_STRUCTURE.BANKING] == 1) {
        cardAccepted = "Yes";
      } else {
        cardAccepted = "No";
      }

      const infoWindowContent = `
  <div class="infoWindowContainer" id="station-${
    station[STATION_STRUCTURE.ID]
  }">
      <h3>No.${station[STATION_STRUCTURE.ID]} ${marker.title}</h3>
      <p>credit card accepted: ${cardAccepted}</p>
      <p>available bikes: ${station[STATION_STRUCTURE.BIKE_NUM]}</p>
      <p>available spaces: ${station[STATION_STRUCTURE.BIKE_STANDS]}</p>
  <p>last update at: ${timestampToDatetime(
    station[STATION_STRUCTURE.LAST_UPDATE] * 1000
  )}</p>
      <button id="selectBtnStart" data-role="start">SELECT AS START</button>
      <button id="selectBtnDestination" data-role="destination">SELECT AS DESTINATION</button>
      </div>
      `;

      infoWindow.setContent(infoWindowContent);
      infoWindow.open(marker.map, marker);

      infoWindow.addListener("domready", () => {
        // Ensure the content is rendered
        const selectBtnStart = document.getElementById("selectBtnStart");
        const selectBtnDestination = document.getElementById(
          "selectBtnDestination"
        );

        const selectBtns = [selectBtnStart, selectBtnDestination];

        selectBtns.forEach((button) => {
          // console.log(
          //   station[STATION_STRUCTURE.ADDRESS],
          //   station[STATION_STRUCTURE.BIKE_NUM]
          // );
          if (
            station[STATION_STRUCTURE.BIKE_NUM] === 0 &&
            button.getAttribute("data-role") === "start"
          ) {
            button.disabled = true;
          } else if (
            station[STATION_STRUCTURE.BIKE_STANDS] === 0 &&
            button.getAttribute("data-role") === "destination"
          ) {
            button.disabled = true;
          }
          button.addEventListener("click", function () {
            const role = this.getAttribute("data-role");
            selectStation(station, role, marker, type);
            clearStartOrEnd(role);
            button.classList.add(role);
          });
        });

        //selectBtns = [];
      });

      function clearStartOrEnd(status) {
        let btns = document.querySelectorAll(`.${status}`);
        console.log(btns, `.${status}`);
        btns.forEach((button) => {
          button.classList.remove(status);
        });
      }

      generateOccupancy(
        station[STATION_STRUCTURE.ID],
        station[STATION_STRUCTURE.ADDRESS]
      );
    });
  }

  return marker;
}

window.selectStation = (station, role, marker, type) => {
  const stationAddress = station[STATION_STRUCTURE.ADDRESS];
  const pinBackground = IconColor(station, type);
  pinBackground.scale = 1.5;
  marker.content = pinBackground.element;
  if (role === "start") {
    startLocationInput.value = stationAddress;
    document.getElementById("selectBtnDestination").disabled = true;
    selectedStart = station;
  } else {
    endLocationInput.value = stationAddress;
    document.getElementById("selectBtnStart").disabled = true;
    selectedEnd = station;
  }
};

window.connect;

window.generateOccupancy = async (station_id, station_address) => {
  try {
    document.getElementById(
      "occupancyTip"
    ).innerText = `Loading the occupancy charts for station No.${station_id}: ${station_address}...`;
    const response = await fetch(`/stations/${station_id}/availability`);
    if (!response.ok) {
      throw new Error("Failed to fetch data.");
    }
    const availability = await response.json();

    const todayAvailablity = await getTodayAvailabiliy(availability);
    const dailyAvg = await calculateDailyBikeNumbers(availability);
    const occupancyBtns = document.getElementsByClassName("occupancyBtn");

    for (let i = 0; i < occupancyBtns.length; i++) {
      // Change the display style of each element
      //console.log(occupancyBtns[i]);
      occupancyBtns[i].style.display = "inline-block"; // This will hide the elements
    }

    const occupancyTip = document.getElementById("occupancyTip");
    occupancyTip.innerText = `You are checking the occupancy of station No.${station_id}: ${station_address}.`;

    generateTodayBarChart(todayAvailablity, "todayChart");
    generateAvgBarChart(dailyAvg, "dailyAvgChart");
  } catch (error) {
    console.log("error:", error);
    throw error;
  }
};

function generateTodayBarChart(data_input, barchartSection) {
  if (data_input.length > 0) {
    let trace1 = {
      x: [],
      y: [],
      name: "bike",
      type: "bar",
      marker: { color: "rgb(29, 200, 63)" },
    };

    var trace2 = {
      x: [],
      y: [],
      name: "space",
      type: "bar",
      marker: { color: "rgb(18, 95, 230)" },
    };

    data_input.forEach((row) => {
      trace1["x"].push(timestampToDatetime(row[5] * 1000));
      trace1["y"].push(row[4]);
      trace2["y"].push(row[3]);
    });

    trace2["x"] = trace1["x"];
    const data = [trace1, trace2];

    const layout = {
      title: "today's occupancy",
      font: { size: 12.5 },
      barmode: "stack",
      autosize: true,

      xanchor: "free",
      xref: "container",
      xaxis: { automargin: true },
    };

    Plotly.react(barchartSection, data, layout);
  } else {
    document.getElementById(
      barchartSection
    ).innerHTML = `<p>Do not have today's data...</p>`;
  }
}

function generateAvgBarChart(dailyAvgData, barchartSection) {
  let trace1 = {
    x: [],
    y: [],
    name: "bike",
    type: "bar",
    marker: { color: "rgb(29, 200, 63)" },
  };

  var trace2 = {
    x: [],
    y: [],
    name: "space",
    type: "bar",
    marker: { color: "rgb(18, 95, 230)" },
  };

  Object.keys(dailyAvgData).forEach((date) => {
    //console.log(date);
    trace1["x"].push(date);
    trace1["y"].push(dailyAvgData[date]["avgBike"]);
    trace2["y"].push(dailyAvgData[date]["avgSpace"]);
  });

  trace2["x"] = trace1["x"];
  const data = [trace1, trace2];

  const layout = {
    title: "average occupancy",
    font: { size: 15 },
    barmode: "stack",
  };

  Plotly.react(barchartSection, data, layout);
}

async function getTodayAvailabiliy(data) {
  const ct = Date.now();
  const today = new Date();

  // Set the time to 5:00 AM
  today.setHours(5);
  today.setMinutes(0);
  today.setSeconds(0);
  today.setMilliseconds(0);

  // Get the timestamp
  const tdTimestamp = today.getTime();

  let td = [];
  for (const element of data) {
    if (element[2] * 1000 > tdTimestamp && element[2] < ct) {
      td.push(element);
    }
  }

  //console.log(td);
  return td;
}

async function calculateDailyBikeNumbers(data) {
  const dailyCounts = [];

  data.forEach((item) => {
    // Convert timestamp to a date string (YYYY-MM-DD)
    const date = new Date(item[5] * 1000).toISOString().split("T")[0];

    // If the date isn't in the object, initialize it with 0
    if (!dailyCounts[date]) {
      dailyCounts[date] = { bikeNumber: 0, spaceNumber: 0, count: 0 };
    }

    // Add the bike number to the total for the day
    dailyCounts[date]["count"] += 1;
    dailyCounts[date]["bikeNumber"] += item[4];
    dailyCounts[date]["spaceNumber"] += item[3];
    dailyCounts[date]["avgBike"] = Math.floor(
      dailyCounts[date]["bikeNumber"] / dailyCounts[date]["count"]
    );
    dailyCounts[date]["avgSpace"] = Math.floor(
      dailyCounts[date]["spaceNumber"] / dailyCounts[date]["count"]
    );
  });

  return dailyCounts;
}

function showChart(state) {
  console.log("function showChart is triggered...");

  //adjust the charts' state
  const occupancyCharts = document.getElementsByClassName("barchart");
  Array.from(occupancyCharts).forEach((chart) => {
    const chartId = chart.id.toLowerCase(); // Convert chart ID to lowercase for comparison

    if (chartId.includes(state.toLowerCase())) {
      chart.style.display = "inline-block";
    } else {
      chart.style.display = "none";
    }
  });
}

const todayChartBtn = document.getElementById("todayChartBtn");
const dailyAvgChartBtn = document.getElementById("dailyAvgChartBtn");
todayChartBtn.addEventListener("click", () => {
  showChart("today");
});
dailyAvgChartBtn.addEventListener("click", () => {
  showChart("dailyAvg");
});

/**
 * Reset the location input fields
 */
window.resetLocationInputs = async function () {
  startLocationInput.value = "";
  endLocationInput.value = "";
  selectedStart = null;
  selectedEnd = null;
  clearMarkers();
  stations_json.forEach(async (station) => {
    const marker = await generateIcon(station, "bike");
    currentMarkers.push(marker);
  });
  if (directionsRenderer) {
    directionsRenderer.setMap(null);
  }
  document.getElementById("selectedStationInfo").innerText = "";
  await setDefaultDatetimeLocal("startTime", currentTime);
  returnTimeInput.value = "";
};

/**
 * Find nearest locations and filter map
 *
 * @param {string} startLocString start location search string
 * @param {string} endLocString end location search string
 */

window.goToLocation = async function (startLocString, endLocString) {
  // 1. Get start location either from the one set by button or the search string
  let startLocation = null;
  let endLocation = null;
  let nearestStartLocationWithBike = null;
  let nearestEndLocationWithSpace = null;

  const now = new Date();
  const startTime = new Date(startTimeInput.value);
  const returnTime = new Date(returnTimeInput.value);
  let arrivalTime;
  let submitOrNot = true;

  if (returnTime == "") {
    //the user doesn't input the return time, then by default we take the shortest route and get the possible time

    const timeToArrive = (routeDistance / 19) * 1000 * 60;
    arrivalTime = new Date(now.getTime() + timeToArrive * 60000);
    await setDefaultDatetimeLocal("returnTime", arrivalTime);
  } else if (returnTime > lastTime) {
    submitOrNot = false;
    alert(
      `Sorry, we cannot predict ${returnTime}'s data. Your return time should be no later than ${lastTime}.`
    );
  } else if (returnTime < startTime) {
    submitOrNot = false;
    //console.log("startTime: ", startTime, " returnTime: ", returnTime);
    alert("Your return Time is earlier than start time!");
  } else {
    arrivalTime = returnTime;
  }
  if (startTime > lastTime) {
    alert(`You start time should be between ${currentTime} and ${lastTime}`);
    submitOrNot = false;
  }

  if (submitOrNot) {
    if (selectedStart) {
      // We have selected the start location from a station's info popup
      startLocation = {
        name: selectedStart[STATION_STRUCTURE.ADDRESS],
        geometry: {
          location: {
            lat: selectedStart[STATION_STRUCTURE.LATITUDE],
            lng: selectedStart[STATION_STRUCTURE.LONGITUDE],
          },
        },
      };
      nearestStartLocationWithBike = { station: selectedStart };
    }

    if (
      startLocString?.length > 0 &&
      (!selectedStart || startLocation.name !== startLocString)
    ) {
      const possibleStartLocations = await fetchLocation(startLocString);
      if (possibleStartLocations?.candidates?.length > 0) {
        startLocation = possibleStartLocations.candidates[0];
        // Get sorted list of places with distances from the given location
        const locationsNearStartLocation = getDistancesToLocation(
          startLocation.geometry.location.lat,
          startLocation.geometry.location.lng,
          arrivalTime
        );

        console.log(locationsNearStartLocation);

        for (let i = 0; i < locationsNearStartLocation.length; i++) {
          const station = locationsNearStartLocation[i];
          if (station.hasBike !== 0) {
            nearestStartLocationWithBike = station;
            break;
          }
        }

        console.log(
          "locations near start locations:",
          locationsNearStartLocation
        );
      } else {
        alert("Enter values before submit");
      }
    }

    if (selectedEnd) {
      // We have selected the end location from a station's info popup
      endLocation = {
        name: selectedEnd[STATION_STRUCTURE.ADDRESS],
        geometry: {
          location: {
            lat: selectedEnd[STATION_STRUCTURE.LATITUDE],
            lng: selectedEnd[STATION_STRUCTURE.LONGITUDE],
          },
        },
      };
      nearestEndLocationWithSpace = { station: selectedEnd };
    }

    if (
      endLocString?.length > 0 &&
      (!selectedEnd || endLocation.name !== endLocString)
    ) {
      const possibleEndLocations = await fetchLocation(endLocString);
      if (possibleEndLocations?.candidates?.length > 0) {
        endLocation = possibleEndLocations.candidates[0];
        // Get sorted list of places with distances from the given location
        const locationsNearEndLocation = getDistancesToLocation(
          endLocation.geometry.location.lat,
          endLocation.geometry.location.lng,
          arrivalTime
        );
        for (let i = 0; i < locationsNearEndLocation.length; i++) {
          const station = locationsNearEndLocation[i];
          if (
            station.hasSpace !== 0 &&
            station != nearestStartLocationWithBike
          ) {
            nearestEndLocationWithSpace = station;
            break;
          }
        }
        console.log("nearest start location: ", nearestStartLocationWithBike);
        console.log("nearest end location: ", nearestEndLocationWithSpace);
      } else {
        alert("Enter values before submit");
      }
    }

    if (nearestStartLocationWithBike && nearestEndLocationWithSpace) {
      // Replace inputs with the real location names from api
      startLocationInput.value = startLocation.name;
      endLocationInput.value = endLocation.name;
      returnTimeInput.value = arrivalTime;

      document.getElementById(
        "selectedStationInfo"
      ).innerHTML = `<p><span style="font-weight: bold;">No.${
        nearestStartLocationWithBike["station"][STATION_STRUCTURE.ID] +
        " " +
        nearestStartLocationWithBike["station"][STATION_STRUCTURE.ADDRESS]
      } </span>
    ---> <span style="font-weight: bold;">No.${
      nearestEndLocationWithSpace["station"][STATION_STRUCTURE.ID] +
      " " +
      nearestEndLocationWithSpace["station"][STATION_STRUCTURE.ADDRESS]
    }.</span></p>`;

      clearMarkers();
      if (!!directionsRenderer) {
        directionsRenderer.setMap(null);
      }

      await addStartAndEndMarkers(startLocation, endLocation);
      await addStartAndEndStationMarkers(
        nearestStartLocationWithBike,
        nearestEndLocationWithSpace
      );

      calculateAndDisplayRoute(
        nearestStartLocationWithBike,
        nearestEndLocationWithSpace
      );
    } else {
      alert("Enter values before submit");
    }
  }
};

async function addStartAndEndMarkers(startLocation, endLocation) {
  const startContent = document.createElement("div");
  startContent.className = "endContent";
  startContent.textContent = "Start";

  startMarker = new AdvancedMarkerElement({
    map,
    position: {
      lat: startLocation.geometry.location.lat,
      lng: startLocation.geometry.location.lng,
    },
    content: startContent,
  });

  currentMarkers.push(startMarker);

  const endContent = document.createElement("div");
  endContent.className = "endContent";
  endContent.textContent = "Finish";

  endMarker = new AdvancedMarkerElement({
    map,
    position: {
      lat: endLocation.geometry.location.lat,
      lng: endLocation.geometry.location.lng,
    },
    content: endContent,
  });

  currentMarkers.push(endMarker);
}

async function addStartAndEndStationMarkers(start, end) {
  const startStationMarker = await generateIcon(start.station, "bike");
  currentMarkers.push(startStationMarker);

  const endStationMarker = await generateIcon(end.station, "space");
  currentMarkers.push(endStationMarker);
}

function setBoundsToStartEnd() {
  const bounds = new google.maps.LatLngBounds();
  const startPosition = startMarker.position;
  const endPosition = endMarker.position;

  bounds.extend(startPosition);
  bounds.extend(endPosition);
  currentMarkers.forEach(function (marker) {
    bounds.extend(marker.position);
  });
  map.fitBounds(bounds);
}

/**
 * Convert from degrees to radians
 *
 * @param {number} degrees the degrees
 * @returns {number} the radians
 */
function deg2rad(degrees) {
  // SOURCE https://stackoverflow.com/a/27943
  return degrees * (Math.PI / 180);
}

/**
 * Get distance between two locations, given latitude and longitude values
 *
 * @param {number} lat1 latitude of the first location
 * @param {number} lon1 longitude of the first location
 * @param {number} lat2 latitude of the second location
 * @param {number} lon2 longitude of the second location
 * @returns {number} the distance between the two locations
 */
function getDistance(lat1, lon1, lat2, lon2) {
  // SOURCE https://stackoverflow.com/a/27943
  const earthRadius = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = earthRadius * c; // Distance in km
  return d;
}

/**
 * Get a list of stations, each with a distance from the lat/long given
 *
 * @param {number} lat the latitude of the location to compare station to
 * @param {number} long the longitude of the location to compare station to
 * @returns a list of stations
 */
function getDistancesToLocation(lat, long, arrivalTime) {
  const distances = stations_json.map((station) => {
    let hasBike = true;
    let hasSpace = true;
    const totalCapacity =
      station[STATION_STRUCTURE.BIKE_NUM] +
      station[STATION_STRUCTURE.BIKE_STANDS];

    const stationPrediction =
      predictions[`station_${station[STATION_STRUCTURE.ID]}`];

    if (stationPrediction) {
      //get the time string in the prediction json to date format in js
      let times = Object.keys(stationPrediction).map((time) => new Date(time));

      times.unshift(currentTime);
      // Function to find the closest time
      const getClosestTime = (desiredTime, times) => {
        return times.reduce((prev, curr) =>
          desiredTime < prev && desiredTime > curr ? curr : prev
        );
      };
      const closestTimeForReturn = getClosestTime(arrivalTime, times);
      const closestTimeForStart = getClosestTime(startTime, times);
      let startBikeNum =
        closestTimeForStart == currentTime
          ? station[STATION_STRUCTURE.BIKE_NUM]
          : stationPrediction[closestTimeForStart];
      if (startBikeNum == 0) {
        hasBike = false;
      }

      let returnBikeNum = stationPrediction[closestTimeForReturn];

      if (returnBikeNum < 0) {
        returnBikeNum == 0;
      } else if (returnBikeNum > totalCapacity) {
        returnBikeNum = totalCapacity;
      }

      const returnBikeSpace = totalCapacity - returnBikeNum;

      if (Math.floor(returnBikeSpace) === 0) {
        hasSpace = false;
      }
    }

    return {
      station: station,
      distance: getDistance(
        lat,
        long,
        station[STATION_STRUCTURE.LATITUDE],
        station[STATION_STRUCTURE.LONGITUDE]
      ),
      hasBike,
      hasSpace,
    };
  });
  // Smallest to largest
  return distances.sort((a, b) => a.distance - b.distance);
}

async function fetchLocation(loc) {
  try {
    const response = await fetch("/searchLocation/" + loc);
    if (!response.ok) {
      throw new Error("Failed to fetch data.");
    }
    return await response.json();
  } catch (error) {
    console.log("error:", error);
    throw error;
  }
}

async function getPrediction() {
  try {
    const response = await fetch("/predict");
    if (!response.ok) {
      throw new Error("Failed to get the predictions.");
    }
    return await response.json();
  } catch (error) {
    console.log("error:", error);
    throw error;
  }
}

await getOverlayDate();
await initWeather();
await setDefaultDatetimeLocal("startTime", currentTime);
await initMap(stations_json);
const predictions = await getPrediction();

const firstKey = Object.keys(predictions)[0];
const predictTimeRange = Object.keys(predictions[firstKey]);
const lastTime = new Date(predictTimeRange[predictTimeRange.length - 1]);
