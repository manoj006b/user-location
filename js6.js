// ===============================
// NAVIGATION FUNCTIONS
// ===============================

// FILTER FUNCTION
function filterItems(inputId, listId) {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  const items = Array.from(list.getElementsByTagName("li"));
  const filter = input.value.toLowerCase();

  items.forEach(item => item.style.display = "none");

  if (!filter) {
    items.forEach(item => item.style.display = "");
    return;
  }

  // Show items that start with the filter text
  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    if (text.startsWith(filter)) item.style.display = "";
  });

  // Then show items that contain the filter text (but don't start with it)
  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    if (!text.startsWith(filter) && text.includes(filter)) item.style.display = "";
  });
}

// ===============================
// SHOW DROPDOWN
// ===============================
function showList(listId) {
  document.querySelectorAll(".dropdown").forEach(list => list.style.display = "none");
  const list = document.getElementById(listId);
  list.style.display = "block";
}

// ===============================
// SWAP BOXES
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const swapIcon = document.querySelector(".swapbox");
  if (swapIcon) {
    swapIcon.addEventListener("click", () => {
      const fromBox = document.getElementById("fromBox");
      const toBox = document.getElementById("toBox");
      [fromBox.value, toBox.value] = [toBox.value, fromBox.value];
      swapIcon.classList.add("rotate-once");
      swapIcon.addEventListener("animationend", () => {
        swapIcon.classList.remove("rotate-once");
      }, { once: true });
    });
  }
});

// ===============================
// CLEAR ROUTE FUNCTION
// ===============================
function clearRoute() {
  document.getElementById("fromBox").value = "";
  document.getElementById("toBox").value = "";
  document.querySelectorAll(".dropdown").forEach(list => list.style.display = "none");

  // Clear route from map if exists
  if (fullscreenMap) {
    if (primaryRoutePolyline) {
      fullscreenMap.removeLayer(primaryRoutePolyline);
      primaryRoutePolyline = null;
    }
    if (alternateRoutePolyline) {
      fullscreenMap.removeLayer(alternateRoutePolyline);
      alternateRoutePolyline = null;
    }
    if (startMarker) {
      fullscreenMap.removeLayer(startMarker);
      startMarker = null;
    }
    if (destinationMarker) {
      fullscreenMap.removeLayer(destinationMarker);
      destinationMarker = null;
    }
  }

  // Stop geolocation tracking
  if (routeWatchId) {
    navigator.geolocation.clearWatch(routeWatchId);
    routeWatchId = null;
  }

  isTrackingRoute = false;
}

// ===============================
// SIDEBAR FUNCTIONS
// ===============================

// Function to open sidebar
function openSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');

  if (sidebar && overlay) {
    sidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

// Function to close sidebar
function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');

  if (sidebar && overlay) {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

// ===============================
// EVENT LISTENERS
// ===============================

document.addEventListener("DOMContentLoaded", function () {
  // Get DOM elements for sidebar
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const closeBtn = document.getElementById('close-sidebar');

  // Event listener for E Block click
  const mapArea = document.querySelector('area[title="E Block"]') ||
    document.querySelector('area[data-block="E"]') ||
    document.querySelector('area[alt="E Block"]');

  if (mapArea) {
    mapArea.addEventListener('click', function (e) {
      e.preventDefault();
      openSidebar();
    });
  }

  // Event listener for close button
  if (closeBtn) {
    closeBtn.addEventListener('click', closeSidebar);
  }

  // Event listener for overlay click
  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }

  // Close sidebar with Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sidebar && sidebar.classList.contains('active')) {
      closeSidebar();
    }
  });
});

// ===============================
// SINGLE CLICK EVENT HANDLER FOR ALL CLICKS
// ===============================
document.addEventListener("click", function (e) {
  // Handle dropdown list item clicks
  if (e.target.tagName === "LI" && e.target.closest(".dropdown")) {
    const input = e.target.closest(".input-wrapper").querySelector("input");
    if (input) {
      input.value = e.target.textContent;
      e.target.closest(".dropdown").style.display = "none";
    }
    return;
  }

  // Handle sidebar close when clicking outside
  const sidebar = document.getElementById('sidebar');
  if (sidebar && sidebar.classList.contains('active')) {
    const mapArea = document.querySelector('area[title="E Block"]') ||
      document.querySelector('area[data-block="E"]');
    const isSidebarClick = sidebar.contains(e.target);
    const isCloseBtnClick = e.target.closest('#close-sidebar');
    const isMapAreaClick = mapArea && (e.target === mapArea);

    if (!isSidebarClick && !isCloseBtnClick && !isMapAreaClick) {
      closeSidebar();
    }
  }

  // Close dropdowns when clicking outside input areas
  const isInsideInput = [...document.querySelectorAll(".input-wrapper")].some(wrapper => wrapper.contains(e.target));
  if (!isInsideInput) {
    setTimeout(() => {
      document.querySelectorAll(".dropdown").forEach(list => {
        list.style.display = "none";
      });
    }, 100);
  }
});

// ===============================
// RESPONSIVE IMAGE MAP (jQuery)
// ===============================
$(document).ready(function () {
  $('img[usemap]').rwdImageMaps();

  // Recalculate on resize
  let resizeTimer;
  $(window).on('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      $('img[usemap]').rwdImageMaps();
    }, 200);
  });
});

// ===============================
// MAP CLICK HANDLER (jQuery)
// ===============================
$(document).on('click', 'area.block', function (e) {
  e.preventDefault();
  const block = $(this).data('block');
  if (block === 'E') {
    openSidebar();
  }
});

// ===============================
// CLOSE EVENTS (jQuery)
// ===============================
$('#overlay, #close-sidebar').on('click', closeSidebar);

$(document).on('keydown', function (e) {
  if (e.key === 'Escape') {
    closeSidebar();
  }
});

// ===============================
// LEAFLET MAP & ROUTING
// ===============================

// Global variables
var fullscreenMap;
var userLocationMarker;
var accuracyCircle;
var userWatchId = null;
var userLatLng = null;

// Route-specific variables
var primaryRoutePolyline = null;
var alternateRoutePolyline = null;
var startMarker = null;
var destinationMarker = null;
var routeWatchId = null;
var isTrackingRoute = false;

// Campus locations
const campusLocations = {
  'Current Location': null,
  'Front Gate': [11.034820, 77.033845],
  'Admission Office': [11.032593, 77.033885],
  'Library': [11.033664, 77.033435],
  'Principal Office': [11.033269, 77.033861],
  'S F Office': [11.033111, 77.033410],
  'Aided Office': [11.033277, 77.034183],
  'Hostel Office': [11.032656, 77.035449],
  'Canteen 1': [11.033695, 77.034336],
  'Canteen 2': [11.032013, 77.032709],
  'GRD Auditorium': [11.032415, 77.033340],
  'A Block': [11.033230, 77.032509],
  'B Block': [11.033238, 77.033060],
  'C Block': [11.032593, 77.033885],
  'D Block': [11.033280, 77.034520],
  'E Block': [11.032854, 77.034351],
  'F Block': [11.032585, 77.033888],
  'G Block': [11.032609, 77.034594],
  'Q Block': [11.034020, 77.034499],
  'Back Gate': [11.031834, 77.036534]
};

// Road network nodes
const roadNodes = [
  [11.034749, 77.033842], [11.034685, 77.033845], [11.034625, 77.033845], [11.034565, 77.033845],
  [11.034515, 77.033848], [11.034455, 77.033848], [11.034395, 77.033850], [11.034335, 77.033852],
  [11.034280, 77.033850], [11.034285, 77.033920], [11.034293, 77.033979], [11.034293, 77.034040],
  [11.034299, 77.034102], [11.034307, 77.034160], [11.034309, 77.034220], [11.034316, 77.034280],
  [11.034317, 77.034335], [11.034319, 77.034369], [11.034325, 77.034399], [11.034325, 77.034455],
  [11.034329, 77.034515], [11.034329, 77.034570], [11.034339, 77.034700], [11.034339, 77.034820],
  [11.034349, 77.034940], [11.034359, 77.035060], [11.034359, 77.035180], [11.034369, 77.035290],
  [11.034369, 77.035415], [11.034379, 77.035525], [11.034280, 77.035545], [11.034160, 77.035545],
  [11.034040, 77.035545], [11.033970, 77.035545], [11.033910, 77.035545], [11.033800, 77.035555],
  [11.033720, 77.035550], [11.033700, 77.035530], [11.033700, 77.035500], [11.033710, 77.035410],
  [11.033710, 77.035290], [11.033710, 77.035170], [11.033700, 77.035080], [11.033700, 77.035000],
  [11.033700, 77.034940], [11.033700, 77.034820], [11.033700, 77.034700], [11.033690, 77.034570],
  [11.033690, 77.034510], [11.033720, 77.034510], [11.033799, 77.034500], [11.033910, 77.034500],
  [11.033999, 77.034500], [11.034100, 77.034499], [11.034180, 77.034429], [11.034210, 77.034380],
  [11.034280, 77.034370], [11.034230, 77.033854], [11.034130, 77.033854], [11.034000, 77.033854],
  [11.033920, 77.033854], [11.033800, 77.033854], [11.033700, 77.033854], [11.033660, 77.033854],
  [11.033600, 77.033854], [11.033500, 77.033859], [11.033400, 77.033859], [11.033350, 77.033900],
  [11.033300, 77.033930], [11.033270, 77.033950], [11.033270, 77.034050], [11.033270, 77.034150],
  [11.033270, 77.034250], [11.033270, 77.034340], [11.033300, 77.034340], [11.033400, 77.034330],
  [11.033500, 77.034330], [11.033600, 77.034330], [11.033640, 77.034320], [11.033690, 77.034320],
  [11.033690, 77.034220], [11.033690, 77.034120], [11.033680, 77.034020], [11.033670, 77.033900],
  [11.033670, 77.033800], [11.033670, 77.033700], [11.033670, 77.033600], [11.033660, 77.033500],
  [11.033660, 77.033400], [11.033560, 77.033400], [11.033460, 77.033400], [11.033360, 77.033400],
  [11.033290, 77.033410], [11.033240, 77.032510], [11.033240, 77.032610], [11.033240, 77.032710],
  [11.033240, 77.032810], [11.033240, 77.032910], [11.033250, 77.033010], [11.033250, 77.033110],
  [11.033250, 77.033210], [11.033250, 77.033310], [11.033250, 77.033410], [11.033250, 77.033490],
  [11.033250, 77.033590], [11.033250, 77.033690], [11.033270, 77.033760], [11.033218, 77.033408],
  [11.033118, 77.033408], [11.033018, 77.033408], [11.032918, 77.033415], [11.032818, 77.033415],
  [11.032718, 77.033420], [11.032618, 77.033425], [11.033228, 77.034342], [11.033120, 77.034342],
  [11.033020, 77.034342], [11.032920, 77.034342], [11.032720, 77.034342], [11.032640, 77.034342],
  [11.033664, 77.035077], [11.033564, 77.035077], [11.033464, 77.035082], [11.033364, 77.035082],
  [11.033264, 77.035085], [11.033134, 77.035090], [11.033034, 77.035099], [11.032934, 77.035099],
  [11.032834, 77.035109], [11.032734, 77.035109], [11.032664, 77.035109], [11.033685, 77.035527],
  [11.033585, 77.035527], [11.033485, 77.035527], [11.033385, 77.035527], [11.033285, 77.035537],
  [11.033185, 77.035537], [11.033085, 77.035537], [11.032985, 77.035537], [11.032885, 77.035537],
  [11.032785, 77.035547], [11.032675, 77.035547], [11.033118, 77.034390], [11.033118, 77.034490],
  [11.033118, 77.034590], [11.033118, 77.034690], [11.033118, 77.034790], [11.033125, 77.034890],
  [11.033125, 77.034990], [11.033125, 77.035049], [11.032535, 77.032683], [11.032545, 77.032783],
  [11.032545, 77.032883], [11.032545, 77.032983], [11.032545, 77.033083], [11.032550, 77.033183],
  [11.032560, 77.032283], [11.032570, 77.033383], [11.032570, 77.033483], [11.032570, 77.033583],
  [11.032570, 77.033683], [11.032570, 77.033783], [11.032570, 77.033883], [11.032580, 77.033983],
  [11.032590, 77.034083], [11.032590, 77.034183], [11.032599, 77.034283], [11.032599, 77.034353],
  [11.032599, 77.034453], [11.032599, 77.034553], [11.032599, 77.034653], [11.032609, 77.034753],
  [11.032620, 77.034853], [11.032620, 77.034953], [11.032620, 77.035053], [11.032630, 77.035103],
  [11.032630, 77.035203], [11.032630, 77.035303], [11.032630, 77.035403], [11.032630, 77.035503],
  [11.032650, 77.035553], [11.032650, 77.035683], [11.032650, 77.035783], [11.032650, 77.035883],
  [11.032650, 77.035983], [11.032660, 77.036083], [11.032660, 77.036183], [11.032660, 77.036283],
  [11.032670, 77.036383], [11.032670, 77.036457], [11.032570, 77.036475], [11.032470, 77.036475],
  [11.032350, 77.036495], [11.032250, 77.036495], [11.032150, 77.036509], [11.032050, 77.036519],
  [11.033960, 77.035597], [11.033980, 77.035697], [11.033999, 77.035797], [11.033999, 77.035997],
  [11.033999, 77.036097], [11.033899, 77.036267], [11.033799, 77.036357], [11.033599, 77.036387],
  [11.033499, 77.036407], [11.033199, 77.036427], [11.032999, 77.036437], [11.032899, 77.036447],
  [11.032699, 77.036467], [11.032497, 77.032688], [11.032397, 77.032688], [11.032297, 77.032698],
  [11.032197, 77.032698], [11.032097, 77.032698], [11.031997, 77.032698], [11.031897, 77.032718],
  [11.032401, 77.032743], [11.032401, 77.032843], [11.032401, 77.032953], [11.032401, 77.033053],
  [11.032401, 77.033153], [11.032411, 77.033215], [11.032411, 77.033415], [11.032456, 77.032939],
  [11.032471, 77.033215], [11.032457, 77.033430], [11.032257, 77.033430], [11.032147, 77.033430],
  [11.032140, 77.033530], [11.032140, 77.033630], [11.032140, 77.033830], [11.032160, 77.033890],
  [11.032160, 77.033990], [11.032160, 77.034090], [11.032160, 77.034190], [11.032160, 77.034290],
  [11.032160, 77.034350], [11.032559, 77.034353], [11.032459, 77.034353], [11.032259, 77.034353],
  [11.032059, 77.034363], [11.031959, 77.034363], [11.031859, 77.034363], [11.031759, 77.034363],
  [11.031659, 77.034363], [11.032585, 77.035260], [11.032485, 77.035260], [11.032385, 77.035270],
  [11.032285, 77.035270], [11.032085, 77.035270], [11.031985, 77.035270], [11.031785, 77.035270],
  [11.031585, 77.035280], [11.031285, 77.035280], [11.031085, 77.035280], [11.030985, 77.035290],
  [11.030785, 77.035290], [11.030685, 77.035290]
];

// ===============================
// DIJKSTRA'S ALGORITHM FUNCTIONS
// ===============================

// Calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Find nearest road node
function findNearestNode(point) {
  let minDist = Infinity;
  let nearestIndex = 0;

  roadNodes.forEach((node, idx) => {
    const dist = calculateDistance(point[0], point[1], node[0], node[1]);
    if (dist < minDist) {
      minDist = dist;
      nearestIndex = idx;
    }
  });

  return nearestIndex;
}

// Build graph of connected nodes
function buildGraph() {
  const graph = {};
  const connectionThreshold = 15;

  roadNodes.forEach((node, i) => {
    graph[i] = [];
    roadNodes.forEach((otherNode, j) => {
      if (i !== j) {
        const dist = calculateDistance(node[0], node[1], otherNode[0], otherNode[1]);
        if (dist < connectionThreshold) {
          graph[i].push({ node: j, weight: dist });
        }
      }
    });
  });

  return graph;
}

// Dijkstra's algorithm
function dijkstra(graph, startNode, endNode, excludeNodes = []) {
  const distances = {};
  const previous = {};
  const unvisited = new Set();

  Object.keys(graph).forEach(node => {
    const n = parseInt(node);
    distances[n] = Infinity;
    previous[n] = null;
    unvisited.add(n);
  });

  distances[startNode] = 0;

  while (unvisited.size > 0) {
    let currentNode = null;
    let minDistance = Infinity;

    unvisited.forEach(node => {
      if (distances[node] < minDistance && !excludeNodes.includes(node)) {
        minDistance = distances[node];
        currentNode = node;
      }
    });

    if (currentNode === null || currentNode === endNode) break;

    unvisited.delete(currentNode);

    if (graph[currentNode]) {
      graph[currentNode].forEach(({ node, weight }) => {
        if (!excludeNodes.includes(node)) {
          const alternativeDistance = distances[currentNode] + weight;
          if (alternativeDistance < distances[node]) {
            distances[node] = alternativeDistance;
            previous[node] = currentNode;
          }
        }
      });
    }
  }

  const path = [];
  let current = endNode;
  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }

  return path.length > 1 ? path : null;
}

// Find primary (shortest) and alternate (2nd shortest) routes
function findRoutes(startPoint, endPoint) {
  const graph = buildGraph();
  const startNode = findNearestNode(startPoint);
  const endNode = findNearestNode(endPoint);

  // Find shortest route
  const primaryPath = dijkstra(graph, startNode, endNode);

  if (!primaryPath) {
    return {
      primary: null,
      alternate: null,
      primaryDistance: 0,
      alternateDistance: 0
    };
  }

  // Exclude more nodes from the primary path to find a truly different alternate route
  const excludeMiddleNodes = primaryPath.slice(1, -1).slice(0, Math.floor(primaryPath.length / 2));
  const alternatePath = dijkstra(graph, startNode, endNode, excludeMiddleNodes);

  const primaryCoords = [startPoint, ...primaryPath.map(i => roadNodes[i]), endPoint];
  const alternateCoords = alternatePath ? [startPoint, ...alternatePath.map(i => roadNodes[i]), endPoint] : null;

  const primaryDist = primaryCoords.reduce((sum, coord, i) => {
    if (i === 0) return 0;
    return sum + calculateDistance(
      primaryCoords[i - 1][0], primaryCoords[i - 1][1],
      coord[0], coord[1]
    );
  }, 0);

  const alternateDist = alternateCoords ? alternateCoords.reduce((sum, coord, i) => {
    if (i === 0) return 0;
    return sum + calculateDistance(
      alternateCoords[i - 1][0], alternateCoords[i - 1][1],
      coord[0], coord[1]
    );
  }, 0) : 0;

  return {
    primary: primaryCoords,
    alternate: alternateCoords,
    primaryDistance: primaryDist,
    alternateDistance: alternateDist
  };
}

// ===============================
// MAP INITIALIZATION
// ===============================

function initializeFullscreenMap() {
  if (fullscreenMap) {
    fullscreenMap.invalidateSize();
    return;
  }

  fullscreenMap = L.map('fullscreenMapContainer').setView([11.033, 77.034], 16);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(fullscreenMap);

  // Add markers for campus locations (removed from map display)
  // User location will only be shown when actively tracking
}

// ===============================
// GEOLOCATION TRACKING
// ===============================
function startGeolocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser");
    return;
  }
  
  if (userWatchId) {
    navigator.geolocation.clearWatch(userWatchId);
  }
  
  userWatchId = navigator.geolocation.watchPosition(
    geolocationSuccess,
    geolocationError,
    {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 5000
    }
  );
}

function geolocationSuccess(pos) {
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;
  const accuracy = pos.coords.accuracy;
  
  userLatLng = [lat, lng];
  
  // Remove existing user location marker and accuracy circle
  if (userLocationMarker) {
    fullscreenMap.removeLayer(userLocationMarker);
    userLocationMarker = null;
  }
  if (accuracyCircle) {
    fullscreenMap.removeLayer(accuracyCircle);
    accuracyCircle = null;
  }
  
  // Add blue circle marker for user location
  userLocationMarker = L.circleMarker(userLatLng, {
    radius: 10,
    fillColor: '#4285F4',
    color: '#ffffff',
    weight: 3,
    opacity: 1,
    fillOpacity: 0.8
  }).addTo(fullscreenMap);
  
  // Add accuracy circle (semi-transparent)
  accuracyCircle = L.circle(userLatLng, {
    radius: accuracy,
    fillColor: '#4285F4',
    color: '#4285F4',
    weight: 1,
    opacity: 0.3,
    fillOpacity: 0.1
  }).addTo(fullscreenMap);
  
  console.log(`Location updated: ${lat.toFixed(6)}, ${lng.toFixed(6)} - Accuracy: ${accuracy.toFixed(0)}m`);
}

function geolocationError(err) {
  console.error('Geolocation error:', err);
  switch (err.code) {
    case err.PERMISSION_DENIED:
      alert("Please allow geolocation access in your browser settings.");
      break;
    case err.POSITION_UNAVAILABLE:
      alert("Location information is unavailable.");
      break;
    case err.TIMEOUT:
      alert("The request to get your location timed out. Retrying...");
      break;
    default:
      alert("An unknown error occurred while getting your location.");
      break;
  }
}

function centerOnUserLocation() {
  if (userLatLng) {
    fullscreenMap.setView(userLatLng, 18);
  } else {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (pos) {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        userLatLng = [lat, lng];
        fullscreenMap.setView(userLatLng, 18);
        geolocationSuccess(pos);
      }, geolocationError, {
        enableHighAccuracy: true,
        timeout: 10000
      });
    }
  }
}
// ===============================
// ROUTE DISPLAY FUNCTIONS
// ===============================
function drawRouteOnLeaflet(routes) {
// Remove existing routes
if (primaryRoutePolyline) {
fullscreenMap.removeLayer(primaryRoutePolyline);
}
if (alternateRoutePolyline) {
fullscreenMap.removeLayer(alternateRoutePolyline);
}
if (startMarker) {
fullscreenMap.removeLayer(startMarker);
}
if (destinationMarker) {
fullscreenMap.removeLayer(destinationMarker);
}
// Draw alternate route (light gray)
if (routes.alternate) {
alternateRoutePolyline = L.polyline(routes.alternate, {
color: 'rgba(48, 45, 45, 0.8)',
weight: 4,
opacity: 0.5
}).addTo(fullscreenMap);
}
// Draw primary route (dark blue)
if (routes.primary) {
primaryRoutePolyline = L.polyline(routes.primary, {
color: '#1e40af',
weight: 6,
opacity: 0.8
}).addTo(fullscreenMap);
// Start marker (black circle with white outline)
const startIcon = L.divIcon({
  className: 'start-marker',
  html: '<div style="background-color: #000000; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>',
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

startMarker = L.marker(routes.primary[0], { icon: startIcon })
  .addTo(fullscreenMap)
  .bindPopup('Start');

// Destination marker (red location pin)
const destIcon = L.divIcon({
  className: 'dest-marker',
  html: '<div style="color: #FF0000; font-size: 30px; text-align: center; line-height: 30px;">📍</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30]
});

destinationMarker = L.marker(routes.primary[routes.primary.length - 1], { icon: destIcon })
  .addTo(fullscreenMap)
  .bindPopup('Destination');

// Fit map to show entire route
const bounds = L.latLngBounds(routes.primary);
fullscreenMap.fitBounds(bounds, { padding: [50, 50] });

// Display distance info
console.log(`Primary route: ${routes.primaryDistance.toFixed(0)}m`);
if (routes.alternate) {
  console.log(`Alternate route: ${routes.alternateDistance.toFixed(0)}m`);
}
}
}
// ===============================
// ROUTE TRACKING
// ===============================
function startRouteTracking(destination) {
if (!navigator.geolocation) {
console.error('Geolocation not supported');
return;
}
isTrackingRoute = true;
routeWatchId = navigator.geolocation.watchPosition(
(position) => {
const newPosition = [position.coords.latitude, position.coords.longitude];
userLatLng = newPosition;
const endPoint = campusLocations[destination];
  const distanceToDestination = calculateDistance(
    newPosition[0], newPosition[1],
    endPoint[0], endPoint[1]
  );

  // Check if destination reached
  if (distanceToDestination < 10) {
    alert('You have reached your destination!');
    stopRouteTracking();
    return;
  }

  // Re-calculate route
  const routes = findRoutes(newPosition, endPoint);
  drawRouteOnLeaflet(routes);
},
(error) => {
  console.error('Route tracking error:', error);
},
{
  enableHighAccuracy: true,
  maximumAge: 1000,
  timeout: 5000
}
);
}
function stopRouteTracking() {
if (routeWatchId !== null) {
navigator.geolocation.clearWatch(routeWatchId);
routeWatchId = null;
}
isTrackingRoute = false;
}
// ===============================
// MAIN SEARCH ROUTE FUNCTION
// ===============================
function searchRoute() {
document.getElementById('fullscreenMap').style.display = 'block';
initializeFullscreenMap();
var fromLocation = document.getElementById('fromBox').value;
var toLocation = document.getElementById('toBox').value;
if (!fromLocation || !toLocation) {
alert('Please select both From and To locations');
return;
}
startGeolocation();
// Get coordinates
let startPoint;
if (fromLocation === 'Current Location') {
if (!userLatLng) {
alert('Waiting for your location...');
setTimeout(() => searchRoute(), 2000);
return;
}
startPoint = userLatLng;
} else {
startPoint = campusLocations[fromLocation];
}
const endPoint = campusLocations[toLocation];
if (!startPoint || !endPoint) {
alert('Invalid location selected');
return;
}
// Calculate routes
const routes = findRoutes(startPoint, endPoint);
if (!routes.primary) {
alert('No route found between these locations');
return;
}
// Draw routes on map
drawRouteOnLeaflet(routes);
// Start live tracking if using current location
if (fromLocation === 'Current Location') {
startRouteTracking(toLocation);
}
}
// ===============================
// CLOSE MAP FUNCTION
// ===============================
function closeFullscreenMap() {
document.getElementById('fullscreenMap').style.display = 'none';
if (userWatchId) {
navigator.geolocation.clearWatch(userWatchId);
userWatchId = null;
}
if (routeWatchId) {
navigator.geolocation.clearWatch(routeWatchId);
routeWatchId = null;
}
isTrackingRoute = false;
}
// ===============================
// EVENT LISTENERS FOR MAP
// ===============================
document.addEventListener('DOMContentLoaded', function () {
var closeMapBtn = document.getElementById('closeMap');
if (closeMapBtn) {
closeMapBtn.addEventListener('click', closeFullscreenMap);
}
var currentLocBtn = document.getElementById('currentLocationBtn');
if (currentLocBtn) {
currentLocBtn.addEventListener('click', centerOnUserLocation);
}
document.addEventListener('keydown', function (e) {
if (e.key === 'Escape') {
closeFullscreenMap();
}
});
});