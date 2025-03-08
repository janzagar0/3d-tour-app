// API Code (ArcGIS Maps SDK for JavaScript)
require([
  "esri/WebScene",
  "esri/views/SceneView",
  "esri/widgets/Popup",
  "esri/rest/support/Query",
  "esri/widgets/Home",
  "esri/geometry/Extent",
  "esri/widgets/Legend",
], (WebScene, SceneView, Popup, Query, Home, Extent, Legend) => {
  // Create webscene
  webscene = new WebScene({
    portalItem: {
      id: "10b6da9352ec421c919777071c3f3755",
    },
    ground: {
      surfaceColor: [255, 255, 255],
    },
    clippingEnabled: true,
    // clippingArea:
  });

  // Create view
  view = new SceneView({
    map: webscene,
    container: "viewDiv",
    qualityProfile: "medium",
    highlightOptions: {
      color: [255, 210, 0],
      fillOpacity: 0.4,
    },
  });

  view.popup = new Popup();

  view.popup = {
    dockEnabled: true,
    visibleElements: {
      actionBar: false,
      collapseButton: false,
    },
    dockOptions: {
      position: "bottom-left",
      breakpoint: false,
      buttonEnabled: false,
    },
  };

  // Create and populate legend based on cabinet categories
  let legendLayer;
  webscene.loadAll().then(() => {
    legendLayer = webscene.layers.getItemAt(2);

    // Set legend
    const legend = new Legend({
      view: view,
      container: legendModal,
      layerInfos: [
        {
          layer: legendLayer,
          title: "Map Categories",
        },
      ],
    });
    view.ui.add(legend, {
      position: "bottom-right",
    });
  });

  // To show legend
  window.showLegend = function () {
    if (legendModal.style.display === "none") {
      showElement(legendModal);
    } else {
      hideElement(legendModal);
    }
  };

  // Set view constraints
  view.constraints = {
    geometry: {
      type: "extent",
      xmin: -76.945167,
      xmax: -76.945154,
      ymin: 38.985542,
      ymax: 38.98645,
      zmin: 0,
      zmax: 10,
    },
    minScale: 50,
    maxScale: 0,
    rotationEnabled: true,
  };

  // Create home button
  homeWidget = new Home({
    view: view,
  });
  view.ui.add(homeWidget, "top-left");

  // Create highlight selection
  let highlightSelect;
  hideText = document.getElementById("tableText");

  function homeView() {
    view.goTo(
      {
        target: homeWidget.viewpoint,
      },
      {
        speedFactor: 0.5,
      }
    );
  }

  // When using the clear button, sidebar results table is cleared and message shows again
  window.deselect = function () {
    homeView();
    if (highlightSelect) highlightSelect.remove();
    clickHighlight?.remove();
    // view.popup.close();
    view.closePopup();
    if (resultTable) {
      resultTable.innerHTML = "";
      // hideText.style.display = "inline";
      const recreateText = document.createElement("p");
      recreateText.setAttribute("id", "tableText");
      recreateText.innerHTML =
        "Results will appear here after a query. To make a query, click on the magnifying glass button at top right. ";
      document.getElementById("resultTable").appendChild(recreateText);
    }
  };

  // Create error screen popup
  const errorScreen = document.getElementById("error-screen");
  const errorContent = document.getElementById("error-content");
  window.closeError = function () {
    hideElement(errorScreen);
    hideElement(shadow);
  };

  /**************************************************************************
  Get category, subcategory, and cabinet info from hosted Feature Layer to
  populate drop-downs for select tool. Category and subcategory are nested.

  **************************************************************************/

  webscene.loadAll().then(() => {
    sceneLayer = webscene.layers.getItemAt(1);
    // sceneLayer.outFields = ["*"]; This breaks the popups for some reason

    const query = new Query();
    query.where = "Category LIKE '%'";
    query.outFields = [
      "Subcategory",
      "Range",
      "Cabinet",
      "Drawer",
      "ID",
      "Link",
      "Category",
      "Description",
    ];
    query.returnGeometry = true;

    sceneLayer.queryFeatures(query).then(function (response) {
      // Function for getting unique arrays
      function getUniqueArray(array) {
        return [...new Set(array)].sort();
      }

      // Get all values for category
      let category = [];
      for (var i = 0; i < response.features.length; i++) {
        category.push(response.features[i].attributes.Category);
      }

      // Get all unique values for category
      const categoryUnique = getUniqueArray(category);

      // Get all values for subcategory
      var subcategory = [];
      for (var i = 0; i < response.features.length; i++) {
        subcategory.push(response.features[i].attributes.Subcategory);
      }

      const subcategoryUnique = getUniqueArray(subcategory);

      // Get all values for cabinet (static dropdown)
      var cabinet = [];
      for (var i = 0; i < response.features.length; i++) {
        cabinet.push(response.features[i].attributes.Cabinet);
      }

      // Get all unique values for cabinet and sort them by numerical order
      const cabinetUnique = [...new Set(cabinet)].sort(function (a, b) {
        return a - b;
      });

      // Make the selection menu update dynamically to reflect existing selections
      var selectorArray = [];

      for (i = 0; i < cabinet.length; i++) {
        var newSubArray = [category[i], subcategory[i], cabinet[i]];
        selectorArray.push(newSubArray);
      }

      function makeDropDown(data, filtersAsArray, targetElement) {
        const filteredArray = filterArray(data, filtersAsArray);
        const uniqueList = getUniqueValues(
          filteredArray,
          filtersAsArray.length
        );
        populateDropDown(targetElement, uniqueList);
      }

      function applyDropDown() {
        const selectLevel1Value = document.getElementById("category").value;
        const selectLevel2 = document.getElementById("subcategory");
        makeDropDown(selectorArray, [selectLevel1Value], selectLevel2);
      }

      function afterDocumentLoads() {
        populateFirstLevelDropDown();
        applyDropDown();
      }

      function getUniqueValues(data, index) {
        const uniqueOptions = new Set();
        data.forEach((r) => uniqueOptions.add(r[index]));
        return [...uniqueOptions].sort();
      }

      function populateFirstLevelDropDown() {
        const uniqueList = getUniqueValues(selectorArray, 0);
        const el = document.getElementById("category");
        populateDropDown(el, uniqueList);
      }

      function populateDropDown(el, listAsArray) {
        el.innerHTML = "";
        el.innerHTML = "<option></option>";
        listAsArray.forEach((item) => {
          const option = document.createElement("option");
          option.textContent = item;
          el.appendChild(option);
        });
        if (el.length === 2) {
          el.options[0].remove();
        }
      }

      function filterArray(data, filtersAsArray) {
        return data.filter((r) =>
          filtersAsArray.every((item, i) => item === r[i])
        );
      }

      document
        .getElementById("category")
        .addEventListener("change", applyDropDown);
      queryIcon.addEventListener("click", afterDocumentLoads);

      // Populate independent cabinet selector
      let cabSelector = document.getElementById("cabinet");
      cabSelector.innerHTML = "<option></option>";

      cabinetUnique.forEach((item) => {
        const option = document.createElement("option");
        option.textContent = item;
        cabSelector.appendChild(option);
      });

      /**************************************************************************
        Get input from select tool, pass it to a query(); also handles result 
        cards, card highlights, and card zoom functionality. 

        **************************************************************************/

      window.executeQuery = function () {
        // Get all inputs as constants
        const categoryInput = document.getElementById("category").value;
        const subcategoryInput = document.getElementById("subcategory").value;
        const locationInput = document.getElementById("locationInput").value;
        const cabinetInput = document.getElementById("cabinet").value;

        let searchType = document.querySelector(
          'input[name="searchType"]:checked'
        );

        // Verify that a select option is chosen
        if (searchType == null) {
          showElement(shadow);
          showElement(errorScreen);
          errorContent.innerHTML = "Please specify a search type first.";
          return;
        } else {
          searchType = searchType.value;
        }

        // Get the selections and build an SQL query
        let selectedQuery = "";
        if (searchType === "category" && subcategoryInput === "") {
          selectedQuery = "Category = '" + categoryInput + "'";
        }
        if (searchType === "category" && subcategoryInput != "") {
          selectedQuery =
            "Category = '" +
            categoryInput +
            "' AND Subcategory = '" +
            subcategoryInput +
            "'";
        } else if (searchType === "cabinet") {
          selectedQuery = "Cabinet = " + cabinetInput;
        } else if (searchType === "location") {
          selectedQuery = "Description LIKE " + "'%" + locationInput + "%'";
        }

        // Specify parameters for query
        const userQuery = new Query();
        userQuery.where = selectedQuery;
        userQuery.outFields = [
          "OBJECTID",
          "Subcategory",
          "Range",
          "Cabinet",
          "Drawer",
          "ID",
          "Link",
          "Category",
          "Description",
        ];
        userQuery.orderByFields = ["ID"];
        userQuery.returnGeometry = true;
        userQuery.returnZ = true;

        // Query features
        sceneLayer.queryFeatures(userQuery).then(function (response) {
          // Exception handling for bad location queries for now...
          if (response.features.length === 0) {
            showElement(shadow);
            showElement(errorScreen);
            errorContent.innerHTML = "No results found. Please try again.";
          } else {
            homeView();
            view.closePopup();

            queryResponse = response.features;

            objectIdResponse = [];
            for (var i = 0; i < response.features.length; i++) {
              objectIdResponse.push(response.features[i].attributes.OBJECTID);
            }

            var cabinetResponse = [];
            for (var i = 0; i < response.features.length; i++) {
              cabinetResponse.push(response.features[i].attributes.Cabinet);
            }

            var drawerResponse = [];
            for (var i = 0; i < response.features.length; i++) {
              drawerResponse.push(response.features[i].attributes.Drawer);
            }

            var categoryResponse = [];
            for (var i = 0; i < response.features.length; i++) {
              categoryResponse.push(response.features[i].attributes.Category);
            }

            var contentResponse = [];
            for (var i = 0; i < response.features.length; i++) {
              contentResponse.push(response.features[i].attributes.Description);
            }

            var rangeResponse = [];
            for (var i = 0; i < response.features.length; i++) {
              rangeResponse.push(response.features[i].attributes.Range);
            }

            var linkResponse = [];
            for (var i = 0; i < response.features.length; i++) {
              linkResponse.push(response.features[i].attributes.Link);
            }

            if (hideText) {
              hideElement(hideText);
            }

            // Get sidebar result table using ID and keep it empty for now
            var resultTable = document.getElementById("resultTable");
            resultTable.innerHTML = "";

            // Populate the unique result table cards
            for (var i = 0; i < cabinetResponse.length; i++) {
              var card = document.createElement("response-card");
              card.className = "card";
              card.innerHTML =
                "<h6>Cabinet " +
                cabinetResponse[i] +
                " - Drawer " +
                drawerResponse[i] +
                "</h6><hr><b>Category:</b> " +
                categoryResponse[i] +
                "<br><b>Location(s):</b> " +
                contentResponse[i] +
                "<br><b>Label range:</b> " +
                rangeResponse[i];
              card.setAttribute("name", `${objectIdResponse[i]}`);
              resultTable.appendChild(card);
            }

            var cards = document.getElementsByClassName("card");

            // Create changes on view whenever a card is selected
            view.whenLayerView(sceneLayer).then((layerView) => {
              if (highlightSelect) {
                highlightSelect.remove();
              }

              // Remove any existing card click highlight and set highlight options
              clickHighlight?.remove();
              view.highlightOptions = {
                color: [255, 210, 0],
                fillOpacity: 0.4,
              };

              highlightSelect = layerView.highlight(objectIdResponse);

              // Card click function
              function cardClick(e) {
                // Remove any existing card click highlight
                highlightSelect?.remove();
                clickHighlight?.remove();
                // view.popup.close();
                view.closePopup();
                // Reset highlight colors
                view.highlightOptions = {
                  color: "#e21833",
                  fillOpacity: 0.25,
                };
                // Get Object ID of drawer associated with clicked card from the name attribute set to the card
                idTarget = "";

                // Make sure target is always response card, not child divs
                var cardElement;

                if (e.target.tagName != "RESPONSE-CARD") {
                  cardElement = e.target.parentElement;
                } else {
                  cardElement = e.target;
                }

                getId = cardElement.getAttribute("name");
                idTarget = parseInt(cardElement.getAttribute("name"));

                // Remove any existing card click highlight
                clickHighlight = layerView.highlight(idTarget);

                var cardClickQuery = new Query();
                cardClickQuery.where = `OBJECTID = ${idTarget}`;
                // console.log(cardClickQuery.where);
                cardClickQuery.outFields = ["OBJECTID", "Cabinet", "Drawer"];
                cardClickQuery.returnGeometry = true;
                cardClickQuery.returnZ = true;

                // When a card is clicked, zoom to the associated drawer
                sceneLayer
                  .queryFeatures(cardClickQuery)
                  .then(function (response) {
                    var clickQueryCabinet =
                      response.features[0].attributes.Cabinet;
                    var clickQueryDrawer =
                      response.features[0].attributes.Drawer;

                    view.openPopup({
                      features: response.features,
                      location: response.features.geometry,
                    });

                    // Separate cabinets into their respective directions (atlas case is separate)
                    const dir180 = [
                      5, 6, 7, 8, 15, 16, 17, 18, 19, 26, 27, 28, 29, 30, 37,
                      38, 39, 40, 41,
                    ];
                    const dir360 = [
                      1, 2, 3, 4, 9, 10, 11, 12, 13, 14, 20, 21, 23, 24, 25, 32,
                      33, 34, 35, 36,
                    ];
                    const dir90 = [41, 42, 43, 44, 45, 46, 47];
                    const cab48Dir360 = [
                      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
                      18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
                      32,
                    ];
                    const cab48Dir180 = [
                      33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46,
                      47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
                      61, 62, 63, 64,
                    ];
                    const cab50dir360 = [
                      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
                    ];
                    const cab50dir180 = [
                      17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
                      31, 32,
                    ];

                    // If the selected card's drawer is facing the 180 direction, zoom to it
                    if (dir180.indexOf(clickQueryCabinet) != -1) {
                      view.goTo(
                        {
                          target: response.features[0].geometry,
                          heading: 180,
                          tilt: 120,
                          zoom: 20,
                        },
                        {
                          speedFactor: 0.5,
                        }
                      );
                      // If the selected card's drawer is facing the 360 direction, zoom to it
                    } else if (dir360.indexOf(clickQueryCabinet) != -1) {
                      view.goTo(
                        {
                          target: response.features[0].geometry,
                          heading: 360,
                          tilt: 120,
                          zoom: 20,
                        },
                        {
                          speedFactor: 0.5,
                        }
                      );
                    } else if (dir90.indexOf(clickQueryCabinet) != -1) {
                      view.goTo(
                        {
                          target: response.features[0].geometry,
                          heading: 90,
                          tilt: 120,
                          zoom: 20,
                        },
                        {
                          speedFactor: 0.5,
                        }
                      );
                    } else if (clickQueryCabinet === 22) {
                      view.goTo(
                        {
                          target: response.features[0].geometry,
                          heading: 315,
                          tilt: 120,
                          zoom: 20,
                        },
                        {
                          speedFactor: 0.5,
                        }
                      );
                    } else if (clickQueryCabinet === 48) {
                      if (cab48Dir180.indexOf(clickQueryDrawer) != -1) {
                        view.goTo(
                          {
                            target: response.features[0].geometry,
                            heading: 180,
                            tilt: 120,
                            zoom: 20,
                          },
                          {
                            speedFactor: 0.5,
                          }
                        );
                      } else if (cab48Dir360.indexOf(clickQueryDrawer) != -1) {
                        view.goTo(
                          {
                            target: response.features[0].geometry,
                            heading: 360,
                            tilt: 120,
                            zoom: 20,
                          },
                          {
                            speedFactor: 0.5,
                          }
                        );
                      }
                    } else if (clickQueryCabinet === 49) {
                      view.goTo(
                        {
                          target: response.features[0].geometry,
                          heading: 270,
                          tilt: 120,
                          zoom: 20,
                        },
                        {
                          speedFactor: 0.5,
                        }
                      );
                    } else if (clickQueryCabinet === 50) {
                      if (cab50dir180.indexOf(clickQueryDrawer) != -1) {
                        view.goTo(
                          {
                            target: response.features[0].geometry,
                            heading: 180,
                            tilt: 120,
                            zoom: 20,
                          },
                          {
                            speedFactor: 0.5,
                          }
                        );
                      } else if (cab50dir360.indexOf(clickQueryDrawer) != -1) {
                        view.goTo(
                          {
                            target: response.features[0].geometry,
                            heading: 360,
                            tilt: 120,
                            zoom: 20,
                          },
                          {
                            speedFactor: 0.5,
                          }
                        );
                      }
                    }
                  });
              }

              // Set an event listener for every card for click
              for (var i = 0; i < cards.length; i++) {
                cards[i].addEventListener("click", cardClick);
              }

              // For selections made with the query tool, only zoom to drawer if the result is
              // one drawer
              if (objectIdResponse.length === 1) {
                const dir180 = [
                  5, 6, 7, 8, 15, 16, 17, 18, 19, 26, 27, 28, 29, 30, 37, 38,
                  39, 40, 41,
                ];
                const dir360 = [
                  1, 2, 3, 4, 9, 10, 11, 12, 13, 14, 20, 21, 22, 23, 24, 25, 32,
                  33, 34, 35, 36,
                ];
                const dir90 = [41, 42, 43, 44, 45, 46, 47];
                const cab48Dir360 = [
                  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
                  19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
                ];
                const cab48Dir180 = [
                  33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
                  48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62,
                  63, 64,
                ];
                const cab50dir360 = [
                  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
                ];
                const cab50dir180 = [
                  17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
                  32,
                ];

                if (dir180.indexOf(cabinetResponse[0]) != -1) {
                  view.goTo(
                    {
                      target: response.features[0].geometry,
                      heading: 180,
                      tilt: 55,
                      zoom: 22,
                    },
                    {
                      speedFactor: 0.5,
                    }
                  );
                } else if (dir360.indexOf(cabinetResponse[0]) != -1) {
                  view.goTo(
                    {
                      target: response.features[0].geometry,
                      heading: 360,
                      tilt: 55,
                      zoom: 22,
                    },
                    {
                      speedFactor: 0.5,
                    }
                  );
                } else if (dir90.indexOf(cabinetResponse[0]) != -1) {
                  view.goTo(
                    {
                      target: response.features[0].geometry,
                      heading: 90,
                      tilt: 55,
                      zoom: 22,
                    },
                    {
                      speedFactor: 0.5,
                    }
                  );
                } else if (clickQueryCabinet === 22) {
                  view.goTo(
                    {
                      target: response.features[0].geometry,
                      heading: 315,
                      tilt: 120,
                      zoom: 20,
                    },
                    {
                      speedFactor: 0.5,
                    }
                  );
                } else if (clickQueryCabinet === 48) {
                  if (cab48Dir180.indexOf(clickQueryDrawer) != -1) {
                    view.goTo(
                      {
                        target: response.features[0].geometry,
                        heading: 180,
                        tilt: 120,
                        zoom: 20,
                      },
                      {
                        speedFactor: 0.5,
                      }
                    );
                  } else if (cab48Dir360.indexOf(clickQueryDrawer) != -1) {
                    view.goTo(
                      {
                        target: response.features[0].geometry,
                        heading: 360,
                        tilt: 120,
                        zoom: 20,
                      },
                      {
                        speedFactor: 0.5,
                      }
                    );
                  }
                } else if (clickQueryCabinet === 49) {
                  view.goTo(
                    {
                      target: response.features[0].geometry,
                      heading: 270,
                      tilt: 120,
                      zoom: 20,
                    },
                    {
                      speedFactor: 0.5,
                    }
                  );
                } else if (clickQueryCabinet === 50) {
                  if (cab50dir180.indexOf(clickQueryDrawer) != -1) {
                    view.goTo(
                      {
                        target: response.features[0].geometry,
                        heading: 180,
                        tilt: 120,
                        zoom: 20,
                      },
                      {
                        speedFactor: 0.5,
                      }
                    );
                  } else if (cab50dir360.indexOf(clickQueryDrawer) != -1) {
                    view.goTo(
                      {
                        target: response.features[0].geometry,
                        heading: 360,
                        tilt: 120,
                        zoom: 20,
                      },
                      {
                        speedFactor: 0.5,
                      }
                    );
                  }
                }
              }
            });
          }
        });
      };
    });
  });
});
