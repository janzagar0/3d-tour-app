// Global variables
let webscene;
let view;
let sceneLayer;
let objectId;
let map;
let mapView;
let hideText;
let clickHighlight;
let errorScreen;
let splashCheck;
let idTarget;
let queryResponse;
let targetGeom;
let defaultExtent;
let homeWidget;
let cards;

// Function to hide displays
function showElement(element) {
  element.style.display = "block";
}

// Function to show displays
function hideElement(element) {
  element.style.display = "none";
}

// Get blackout screen
const shadow = document.querySelector("#shadow");

// Get splash page elements
const splash = document.querySelector("#splash");
const splashButton = document.querySelector("#splash-button");

// Create timer for loader (5 seconds) to allow 3D model some time to load
/*
let loaderTimer;
function spinner() {
  loaderTimer = setTimeout(showPage, 5000);
}
*/

function showPage() {
  hideElement(document.querySelector("#loader"));
  hideElement(document.querySelector("#loader-page"));
}

/**************************************************************************
    The only cookies this application uses are for tracking if the user
    wants to hide the splash screen next time they visit (valid for 7
    days).
**************************************************************************/
if (document.cookie) {
  hideElement(splash);
  hideElement(shadow);
}

function setCookie() {
  const isChecked = document.querySelector("#dontshow-check").checked;

  if (isChecked)
    document.cookie = `hideSplash = yes; path=/; max-age=${60 * 60 * 24 * 7}`;
}

// Close splash screen on clicking button
splashButton.onclick = function () {
  setCookie();
  hideElement(splash);
  hideElement(shadow);
};

const queryIcon = document.querySelector("#queryIcon");
const selectModal = document.querySelector("#selectModal");

// Select popup doesn't show on default; clicking on search button displays it (no shadow)
hideElement(selectModal);
function showSelect() {
  if (selectModal.style.display === "none") {
    showElement(selectModal);
  } else {
    hideElement(selectModal);
  }
}

const form = document.querySelector("#search-form");

document.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && selectModal.style.display === "block") {
    executeQuery();
    e.preventDefault();
  }
});

// Create empty legend div, to be populated later in API function
const legendModal = document.querySelector("#legendModal");
const legendIcon = document.querySelector("#legendIcon");
hideElement(legendModal);

// When the "more info" link is clicked on the header bar, display moreInfo and shadow
const moreInfo = document.querySelector("#moreInfo");
const linkText = document.querySelector("#linkText");

linkText.addEventListener("click", function () {
  showElement(moreInfo);
  showElement(shadow);
});

// When the button inside moreInfo is clicked, hide it and the shadow
const closeMoreInfo = document.querySelector("#closeMoreInfo");
closeMoreInfo.addEventListener("click", function () {
  hideElement(moreInfo);
  hideElement(shadow);
});

// When the splash icon button is clicked, display the splash screen and dim the screen
const splashIcon = document.querySelector("#splash-cell-text");
splashIcon.addEventListener("click", function () {
  showElement(splash);
  showElement(shadow);
});

// When the shadow background is clicked, hide the pop-up window (splash, moreInfo) and the shadow
document.onclick = function (e) {
  if (e.target.id === "shadow") {
    hideElement(moreInfo);
    hideElement(splash);
    hideElement(shadow);
  }
};

// Show/hide button labels and scrunch them together when change is detected in checkbox
const buttonLabels = document.querySelector(".buttonLabels");
const buttonLabelsStatus = document.querySelector(
  "input[name=buttonLabelCheck]"
);

buttonLabelsStatus.addEventListener("change", function () {
  if (this.checked) {
    hideElement(buttonLabels);
    /*splashIcon.style.top = "62px";*/
    legendIcon.style.top = "62px";
  } else {
    showElement(buttonLabels);
    /*splashIcon.style.top = "";*/
    legendIcon.style.top = "";
  }
});

// Moved API code to main.js file to promote modularity
