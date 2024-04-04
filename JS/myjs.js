function initializeMap() {
  var source = new ol.source.Vector();

  var map = new ol.Map({
    target: "map",
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM(),
      }),
      new ol.layer.Vector({
        source: source,
        style: new ol.style.Style({
          fill: new ol.style.Fill({
            color: "rgba(255, 255, 255, 0.2)",
          }),
          stroke: new ol.style.Stroke({
            color: "#ffcc33",
            width: 2,
          }),
          image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
              color: "#ffcc33",
            }),
          }),
        }),
      }),
    ],
    view: new ol.View({
      center: ol.proj.fromLonLat([51.389, 35.6892]),
      zoom: 10,
    }),
  });

  var geoserverLayer = new ol.layer.Tile({
    source: new ol.source.TileWMS({
      url: "http://localhost:8080/geoserver/wms",
      params: {
        LAYERS: "ne:gis_osm_traffic_a_free_1",
      },
      serverType: "geoserver",
    }),
  });
  map.addLayer(geoserverLayer);

  var typeSelect = document.getElementById("type");

  var draw;
  function addInteraction() {
    draw = new ol.interaction.Draw({
      source: source,
      type: typeSelect.value,
      style: new ol.style.Style({
        fill: new ol.style.Fill({
          color: "rgba(255, 255, 255, 0.2)",
        }),
        stroke: new ol.style.Stroke({
          color: "#ffcc33",
          width: 2,
        }),
        image: new ol.style.Circle({
          radius: 7,
          fill: new ol.style.Fill({
            color: "#ffcc33",
          }),
        }),
      }),
    });
    map.addInteraction(draw);

    // Add measurement tooltip
    createMeasureTooltip();
    draw.on("drawstart", function (evt) {
      // set sketch
      sketch = evt.feature;

      var tooltipCoord = evt.coordinate;

      listener = sketch.getGeometry().on("change", function (evt) {
        var geom = evt.target;
        var output;
        if (geom instanceof ol.geom.Polygon) {
          output = formatArea(geom);
          tooltipCoord = geom.getInteriorPoint().getCoordinates();
        } else if (geom instanceof ol.geom.LineString) {
          output = formatLength(geom);
          tooltipCoord = geom.getLastCoordinate();
        }
        measureTooltipElement.innerHTML = output;
        measureTooltip.setPosition(tooltipCoord);
      });
    });

    draw.on("drawend", function () {
      measureTooltipElement.className = "ol-tooltip ol-tooltip-static measurement-box";
      measureTooltip.setOffset([0, -7]);
      // unset sketch
      sketch = null;
      // unset tooltip so that a new one can be created
      measureTooltipElement = null;
      createMeasureTooltip();
      ol.Observable.unByKey(listener);
    });
  }

  typeSelect.onchange = function (e) {
    map.removeInteraction(draw);
    addInteraction();
  };

  var measureTooltipElement;
  var measureTooltip;
  function createMeasureTooltip() {
    measureTooltipElement = document.createElement("div");
    measureTooltipElement.className = "ol-tooltip ol-tooltip-measure measurement-box";
    measureTooltip = new ol.Overlay({
      element: measureTooltipElement,
      offset: [0, -15],
      positioning: "bottom-center",
    });
    map.addOverlay(measureTooltip);
  }

  var formatLength = function (line) {
    var length = ol.sphere.getLength(line);
    var output;
    if (length > 100) {
      output = Math.round((length / 1000) * 100) / 100 + " " + "km";
    } else {
      output = Math.round(length * 100) / 100 + " " + "m";
    }
    return output;
  };

  var formatArea = function (polygon) {
    var area = ol.sphere.getArea(polygon);
    var output;
    if (area > 10000) {
      output =
        Math.round((area / 1000000) * 100) / 100 + " " + "km<sup>2</sup>";
    } else {
      output = Math.round(area * 100) / 100 + " " + "m<sup>2</sup>";
    }
    return output;
  };

  var layerChecker = document.getElementById("layerChecker");
  layerChecker.onchange = function (e) {
    if (e.target.checked) {
      geoserverLayer.setVisible(true);
    } else {
      geoserverLayer.setVisible(false);
    }
  };

  mapLayer.onchange = function () {
    var selectedLayer = mapLayer.value;
    if (selectedLayer === "Google") {
      var googleLayer = new ol.layer.Tile({
        source: new ol.source.XYZ({
          url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        }),
      });
      map.getLayers().setAt(0, googleLayer);
    } else if (selectedLayer === "Bing") {
      var bingLayer = new ol.layer.Tile({
        source: new ol.source.BingMaps({
          key: "AsFhFog0dylN0aPD-0dHsunhHEs8dVE_LAMNdYiP7OWlJDRcsw0OgMjAcPp6Y3n8",
          imagerySet: "Aerial",
        }),
      });
      map.getLayers().setAt(0, bingLayer);
    } else if (selectedLayer === "OpenStreet") {
      var osmLayer = new ol.layer.Tile({
        source: new ol.source.OSM(),
      });
      map.getLayers().setAt(0, osmLayer);
    } else {
      map.getLayers().setAt(0, geoserverLayer);
    }
  };
}

document.addEventListener("DOMContentLoaded", function () {
  setTimeout(initializeMap, 500);
});
