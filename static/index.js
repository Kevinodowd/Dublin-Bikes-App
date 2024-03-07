// Initialize and add the map
let map;

//
const { Map, InfoWindow } = await google.maps.importLibrary("maps");
//AdvancedMarkerElement
const { AdvancedMarkerElement, PinElement, AdvancedMarkerClickEvent } =
  await google.maps.importLibrary("marker");

let currentMarkers = [];

const infoWindow = new InfoWindow();

const stations_json = await fetchStations();

const bikeBtn = document.getElementById("availableBikes");
const spaceBtn = document.getElementById("availableSpaces");

function clearMarkers() {
  currentMarkers.forEach((marker) => {
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
    // const stations_json =
    console.log(stations_json);

    //set the position to dublin
    const position = { lat: 53.3498, lng: -6.2603 };

    map = new Map(document.getElementById("map"), {
      zoom: 13.5,
      center: position,
      mapId: "Dublin",
    });

    console.log("generate a map.");

    stations_json.forEach((station) => {
      const marker = generateIcon(station);
      console.log(marker.gmpClickable);
      currentMarkers.push(marker);
    });

    console.log("generate stations.");
  } catch (error) {
    console.log(error);
  }
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

//initialise the current time
// async function initCurrentTime() {
//   const ct = Date.now();
//   console.log(ct);
//   const ctSpan = document.getElementById("currentTime");
//   ctSpan.innerText += " " + timestampToDatetime(ct);
// }

async function getOverlayDate() {
  function formatNumberToString(numberToFormat) {
    // 1 ->  01  ->   01
    // 12 -> 012 ->   12
    return ("0" + numberToFormat).slice(-2);
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = now.toLocaleString("en-US", { month: "long" });
  const day = formatNumberToString(now.getDay());
  const hour = formatNumberToString(now.getHours());
  const minute = formatNumberToString(now.getMinutes());

  const currentDate = `${day} ${month} ${year}`;
  const currentTime = `${hour}:${minute}`;
  const overlayDate = `<p style="margin-block: 0em;">Today is ${currentDate}</p>
      <p style="margin-block: 0em;">Current time: ${currentTime}</p>`;
  document.getElementById("overlayInfo").innerHTML += overlayDate;
}

//document.getElementById("overlayInfo").innerHTML = getOverlayDate();

async function initWeather(weather) {
  // Default weather details for homepage
  //const defaultLocation = "Dublin";
  // const url =
  //   "http://api.openweathermap.org/geo/1.0/direct?q=" +
  //   defaultLocation +
  //   "&appid=17b4a592cf658d24febca963b75f7adc";

  const weather_json = await fetchWeather();
  console.log(weather_json);
  //stationId weather description icon temperature pressure
  //humidity windSpeed windDeg visibility fetchTime lastUpdate
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
    const overlayDubWeather = `<p style="display: inline; margin-block: 0em;">Today's Dublin Weather: ${temperature} °C with ${weatherDescription}</p>`;
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

function IconColor(station, bikeOrSpace) {
  if (bikeOrSpace == "space") {
    const spaceLeft = station[7];
    if (spaceLeft * 1 === 0) {
      return new PinElement({
        glyphColor: "white",
        background: "#9A9898",
        borderColor: "#9A9898",
      });
    } else {
      return new PinElement({
        glyphColor: "white",
        background: "#00B2FF",
        borderColor: "#125FE6",
      });
    }
  } else {
    const bikeLeft = station[6];
    if (bikeLeft * 1 === 0) {
      return new PinElement({
        glyphColor: "white",
        background: "#9A9898",
        borderColor: "#9A9898",
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
  console.log("change icon function triggered.");
  clearMarkers();
  //console.log(currentMarkers);
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

  stations_json.forEach((station) => {
    //console.log("Enetering the loop");
    const marker = generateIcon(station, target);
    currentMarkers.push(marker);
  });
}

async function generateIcon(station, bikeOrSpace) {
  const position = { lat: station[3], lng: station[4] };

  const pinBackground = IconColor(station, bikeOrSpace);

  const marker = new AdvancedMarkerElement({
    map: map,
    gmpClickable: true,
    position: position,
    title: station[2],
    content: pinBackground.element,
  });

  // Marker event listener for mouseover
  marker.addListener("gmp-click", () => {
    // document.getElementById("temperature").innerText = ` ${Math.floor(
    //   station[11] - 273.15
    // )} °C`;
    // document.getElementById(
    //   "icon"
    // ).innerHTML = `<img class="weathericon" src=https://openweathermap.org/img/wn/${station[10]}@2x.png>`;
    // document.getElementById("weather").innerText = `${station[8]}: `;
    // document.getElementById("description").innerText = station[9];
    //infoWindow.close();

    map.setZoom(17);

    map.setCenter(marker.position);
    let cardAccepted = "";
    if (station[5] == 1) {
      cardAccepted = "Yes";
    } else {
      cardAccepted = "No";
    }
    const infoWindowContent = `
    <div class="infoWindowContainer" id=${station[0]}>
    <h3>No.${station[0]} ${marker.title}</h3>
    <p>credit card accepted: ${cardAccepted}</p>
    <p>available bikes: ${station[6]}</p>
    <p>available spaces: ${station[7]}</p>
    <p>last update at: ${timestampToDatetime(station[9] * 1000)}</p>
    <button class="occupancy" onclick ="generateOccupancy(${
      station[0]
    })">More details...</button>
    </div>
    `;

    infoWindow.setContent(infoWindowContent);
    infoWindow.open(marker.map, marker);
  });

  async function showLeftBar() {
    mapClass = document.getElementById("map").classList;
    if ("showLeft" in mapClass) {
    }
  }
}

window.generateOccupancy = async (station_id) => {
  try {
    const response = await fetch(`/stations/${station_id}/availability`);
    if (!response.ok) {
      throw new Error("Failed to fetch data.");
    }
    const availability = await response.json();

    //availablity: stationid,status,lastupdate,stands, bikes, fetchtime
    //console.log(availability);

    const todayAvailablity = await getTodayAvailabiliy(availability);
    const dailyAvg = await calculateDailyBikeNumbers(availability);

    generateTodayBarChart(todayAvailablity, "todayChart");
    generateAvgBarChart(dailyAvg, "dailyAvgChart");
  } catch (error) {
    console.log("error:", error);
    throw error;
  }
};

function generateTodayBarChart(data_input, barchartSection) {
  let trace1 = {
    x: [],
    y: [],
    name: "bike",
    type: "bar",
  };

  var trace2 = {
    x: [],
    y: [],
    name: "space",
    type: "bar",
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
    font: { size: 15 },
    barmode: "stack",
  };

  Plotly.newPlot(barchartSection, data, layout);
}

function generateAvgBarChart(dailyAvgData, barchartSection) {
  let trace1 = {
    x: [],
    y: [],
    name: "bike",
    type: "bar",
  };

  var trace2 = {
    x: [],
    y: [],
    name: "space",
    type: "bar",
  };

  Object.keys(dailyAvgData).forEach((date) => {
    console.log(date);
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

  Plotly.newPlot(barchartSection, data, layout);
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

  console.log(td);
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

await getOverlayDate();
await initWeather();
await initMap(stations_json);
