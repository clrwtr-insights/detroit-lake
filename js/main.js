$(window).ready(function() {
    $('.loader').fadeOut("slow");
  });

  // bounds of lake
  var lakeBounds = L.latLngBounds(
    L.latLng(44.607486241841485, -122.65328825946432), //Southwest
    L.latLng(44.79646203583117, -122.09510671380221), //Northeast
  );

  var lakeBoundsClosed = L.latLngBounds(
    L.latLng(44.6518457695288, -122.30459300466374), //Southwest
    L.latLng(44.76672930999038, -122.09269384395935), //Northeast
  );

  var lakeBoundsClosedMini = L.latLngBounds(
    L.latLng(44.6518457695288, -122.43459300466374), //Southwest
    L.latLng(44.76672930999038, -122.09269384395935), //Northeast
  );

  var mymap = L.map('map', {
    // center: [44.70580544041939, -122.24899460193791],
    zoomControl: false,
    zoom: 14,
    maxZoom: 15,
    minZoom: 11,
    // maxBounds: lakeBounds,
    // maxBoundsViscosity: .8,
  });


  mymap.fitBounds(lakeBoundsClosedMini);

  var voyager =
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png');
  var satellite =
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}');
  var USGS_USImagery = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 20,
    attribution: 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>'
  }).addTo(mymap);

  var baseLayers = {
    'CartoDB Voyager': voyager,
    'ESRI Satellite': satellite,
    'USGS_USImagery': USGS_USImagery,
  }
  L.Control.MousePosition = L.Control.extend({
    options: {
      position: 'bottomleft',
      separator: ' : ',
      emptyString: 'Unavailable',
      lngFirst: false,
      numDigits: 5,
      lngFormatter: undefined,
      latFormatter: undefined,
      prefix: ""
    },

    onAdd: function(map) {
      this._container = L.DomUtil.create('div', 'leaflet-control-mouseposition');
      L.DomEvent.disableClickPropagation(this._container);
      mymap.on('mousemove', this._onMouseMove, this);
      this._container.innerHTML = this.options.emptyString;
      return this._container;
    },

    onRemove: function(map) {
      map.off('mousemove', this._onMouseMove)
    },

    _onMouseMove: function(e) {
      var lng = this.options.lngFormatter ? this.options.lngFormatter(e.latlng.lng) : L.Util.formatNum(e.latlng.lng, this.options.numDigits);
      var lat = this.options.latFormatter ? this.options.latFormatter(e.latlng.lat) : L.Util.formatNum(e.latlng.lat, this.options.numDigits);
      var value = this.options.lngFirst ? lng + this.options.separator + lat : lat + this.options.separator + lng;
      var prefixAndValue = this.options.prefix + ' ' + value;
      this._container.innerHTML = prefixAndValue;
    }

  });

  L.Map.mergeOptions({
    positionControl: false
  });

  L.Map.addInitHook(function() {
    if (this.options.positionControl) {
      this.positionControl = new L.Control.MousePosition();
      this.addControl(this.positionControl);
    }
  });

  L.control.mousePosition = function(options) {
    return new L.Control.MousePosition(options);
  };
  L.control.mousePosition({
    position: 'topright'
  }).addTo(mymap);
  L.control.scale({
    position: 'topright'
  }).addTo(mymap);
  new L.control.layers(baseLayers, {}, {
    collapsed: true
  }).addTo(mymap);

  new L.Control.zoomHome({
    position: 'topright'
  }).addTo(mymap);

  var chart, sampleChart, precipChart, airTempChart, toxinChart, nitrateChart;

  var colors = chroma.scale('Spectral').domain([0, 1]).padding(0.15).mode('lch').colors(6);
  var color = chroma.scale('Spectral').domain([0, 1]).padding(0.15).mode('lch').colors(6);

  for (i = 0; i < 6; i++) {
    $('head').append($("<style> .legend-color-" + (i + 1).toString() + " { background: " + color[i] + "; font-size: 15px; opacity: .6; text-shadow: 0 0 0px #ffffff;} </style>"));
  }







  // hexbin options
  var options = {
    radius: 12,
    opacity: .6,
    colorRange: [colors[5], colors[4], colors[3], colors[2], colors[1], colors[0]],
    colorScaleExtent: [1, 1.2],
    duration: 500,
    radiusRange: [11, 11],
  };


  // hexbin map layer
  var hexLayer = L.hexbinLayer(options).addTo(mymap)


  // hexlayer options
  function tooltip_function(d) {

    var users_sum = d.reduce(function(acc, obj) {
      return (acc + parseFloat(obj["o"][2]));
    }, 0);

    avgChl = users_sum / d.length;
    avgChl = d3.format(".3")(avgChl);
    var tooltip_text = `Avg. Chlorophyll: ${String(avgChl)}`

    return tooltip_text
  }

  $('#myOpacityRange').on('input', function(value) {
    $('.hexbin').css({
      opacity: $(this).val() * '.1'
    });
  });

  hexLayer
    .lng(function(d) {
      return d[0];
    })
    .lat(function(d) {
      return d[1];
    })
    .colorValue(
      function(d) {
        var sum = d.reduce(function(acc, obj) {
          return (acc + parseFloat(obj["o"][2]));
        }, 0);
        avgChl = sum / d.length;
        return avgChl
      }
    )
    .hoverHandler(L.HexbinHoverHandler.compound({
      handlers: [
        L.HexbinHoverHandler.resizeFill(),
        L.HexbinHoverHandler.tooltip({
          tooltipContent: tooltip_function
        })
      ]
    }));


  // $('#myOpacityRange').on('input', function (value) {
  //     $('.hexbin-container').css({
  //         opacity: $(this).val() * '.1'
  //     });
  // });
  // Set up events
  // hexLayer.dispatch()
  //   .on('mouseover', function(d, i) {
  //     console.log({
  //       type: 'mouseover',
  //       event: d,
  //       index: i,
  //       context: this
  //     });
  //     setHovered(d);
  //   })
  //   .on('mouseout', function(d, i) {
  //     console.log({
  //       type: 'mouseout',
  //       event: d,
  //       index: i,
  //       context: this
  //     });
  //     setHovered();
  //   })
  //   .on('click', function(d, i) {
  //     console.log({
  //       type: 'click',
  //       event: d,
  //       index: i,
  //       context: this
  //     });
  //     setClicked(d);
  //   });
  //
  // function setHovered(d) {
  //   d3.select('#hovered .count').text((null != d) ? d.length : '');
  // }
  //
  // function setClicked(d) {
  //   d3.select('#clicked .count').text((null != d) ? d.length : '');
  // }



  dateSelect = $('#d0').val();
  let [y, m, d] = dateSelect.split('-');
  mapYear = y;
  mapMonth = m;
  mapDay = d;
  mapDateString = mapYear + '_' + mapMonth + '_' + mapDay;
  // Parse date in YYYY-MM-DD format as local date
  function parseISOLocal(s) {
    let [y, m, d] = s.split('-');
    return new Date(y, m - 1, d);
  }

  // Format date as YYYY-MM-DD
  function dateToISOLocal(date) {
    let z = n => ('0' + n).slice(-2);
    return date.getFullYear() + '-' + z(date.getMonth() + 1) + '-' + z(date.getDate());
  }

  // Convert range slider value to date string
  function range2date(evt) {
    let dateInput = document.querySelector('#d0');
    let minDate = parseISOLocal(dateInput.defaultValue);
    minDate.setDate(minDate.getDate() + Number(this.value));
    dateInput.value = dateToISOLocal(minDate);
    dateSelect = $('#d0').val();
    let [y, m, d] = dateSelect.split('-');
    mapYear = y;
    mapMonth = m;
    mapDay = d;
    mapDateString = mapYear + '_' + mapMonth + '_' + mapDay;
    titleDateString = mapMonth + '/' + mapDay + '/' + mapYear;
    Promise.all([
      d3.csv('assets/satellite_map/detroit_lake_chlorophyll_' + mapDateString + '.csv'), //datasets[0]
    ]).then(function(datasets) {
      hexdata = [];
      datasets[0].forEach(function(d) {
        hexdata.push([
          d.lon,
          d.lat,
          d.Chlorophyll,
        ]);
      })
      hexLayer.data(hexdata);
    });
    $("#sat-title").text(titleDateString);
  }


  // Convert entered date to range
  function date2range(evt) {
    let date = parseISOLocal(this.value);
    let numDays = (date - new Date(this.min)) / 8.64e7;
    document.querySelector('#myRange').value = numDays;
    dateSelect = $('#d0').val();
    let [y, m, d] = dateSelect.split('-');
    mapYear = y;
    mapMonth = m;
    mapDay = d;
    mapDateString = mapYear + '_' + mapMonth + '_' + mapDay;

    Promise.all([
      d3.csv('assets/satellite_map/detroit_lake_chlorophyll_' + mapDateString + '.csv'), //datasets[0]
    ]).then(function(datasets) {
      hexdata = [];
      datasets[0].forEach(function(d) {
        hexdata.push([
          d.lon,
          d.lat,
          d.Chlorophyll,
        ]);
      })
      hexLayer.data(hexdata);
    });


  }

  window.onload = function() {
    let rangeInput = document.querySelector('#myRange');
    let dateInput = document.querySelector('#d0');
    // Get the number of days from the date min and max
    // Dates in YYYY-MM-DD format are treated as UTC
    // so will be exact whole days

    let rangeMax = (new Date(dateInput.max) - new Date(dateInput.min)) / 8.64e7;
    // Set the range min and max values
    rangeInput.min = 0;
    rangeInput.max = rangeMax;
    // Add listener to set the date input value based on the slider
    rangeInput.addEventListener('input', range2date, false);
    // Add listener to set the range input value based on the date
    dateInput.addEventListener('change', date2range, false);

  }

  var gageID = "14178000";

  Promise.all([
    d3.csv('assets/stream_gauge_tab/gage.csv'), //datasets[0]
    d3.json("assets/stream_gauge_tab/usgs.geojson"), //datasets[1]
    d3.csv('assets/water_sample_tab/algae.csv'), //datasets[2]
    d3.json("assets/water_sample_tab/ws.geojson"), //datasets[3]
    d3.csv('assets/satellite_map/detroit_lake_chlorophyll_' + mapDateString + '.csv'), //datasets[4]
    d3.csv('assets/weather_tab/detroit_lake_prism_2020_01_01_2021_09_15.csv'), //datasets[5]
    d3.csv('assets/water_sample_tab/toxin.csv'), //datasets[6]
    d3.csv('assets/water_sample_tab/nitrate.csv'), //datasets[7]
    d3.json("assets/weather_tab/weather.geojson"), //datasets[8]
    d3.csv('assets/water_sample_tab/algae/algae2016.csv'), //datasets[9]
    d3.csv('assets/water_sample_tab/algae/algae2017.csv'), //datasets[10]
    d3.csv('assets/water_sample_tab/algae/algae2018.csv'), //datasets[11]
    d3.csv('assets/water_sample_tab/algae/algae2019.csv'), //datasets[12]
    d3.csv('assets/water_sample_tab/toxin/toxin2016.csv'), //datasets[13]
    d3.csv('assets/water_sample_tab/toxin/toxin2017.csv'), //datasets[14]
    d3.csv('assets/water_sample_tab/toxin/toxin2018.csv'), //datasets[15]
    d3.csv('assets/water_sample_tab/toxin/toxin2019.csv'), //datasets[16]
    d3.csv('assets/water_sample_tab/nitrate/nitrate2016.csv'), //datasets[17]
    d3.csv('assets/water_sample_tab/nitrate/nitrate2017.csv'), //datasets[18]
    d3.csv('assets/water_sample_tab/nitrate/nitrate2018.csv'), //datasets[19]
    d3.csv('assets/water_sample_tab/nitrate/nitrate2019.csv'), //datasets[20]
    d3.csv('assets/stream_gauge_tab/gage2020.csv'), //datasets[21]
    d3.csv('assets/stream_gauge_tab/gage2021.csv'), //datasets[22]
    d3.csv('assets/weather_tab/prism2020.csv'), //datasets[23]
    d3.csv('assets/weather_tab/prism2021.csv'), //datasets[24]
    d3.csv('assets/stream_gauge_tab/detroit_lake_usgstreamgage_2012_01_01_2021_09_29.csv'), //datasets[25]
    d3.csv('assets/satellite_map/dates.csv'), //datasets[26]
    d3.csv('assets/weather_tab/detroit_lake_prism_2012_01_01_2021_09_27.csv'), //datasets[27]
    d3.csv('assets/water_sample_tab/detroit_lake_algae_2016_05_03_2019_10_30.csv'), //datasets[28]

  ]).then(function(datasets) {

    hexdata = [];
    datasets[4].forEach(function(d) {
      hexdata.push([
        d.lon,
        d.lat,
        d.Chlorophyll,
      ]);
    })
    hexLayer.data(hexdata);

    // Weather Data
    var wt = ["Date"];
    var wt2020 = ["Date"];
    var wt2021 = ["Date"];
    var precip = ["Precipitation"];
    var precip2020 = ["2020"];
    var precip2021 = ["2021"];
    var airTemp = ["Air Temperature"];
    var airTemp2020 = ["2020"];
    var airTemp2021 = ["2021"];
    weatherData2021 = [];
    weatherData2021pcMean = ["2021"];
    weatherData2021pcSum = ["2021"];
    weatherData2021atempMean = ["2021"];
    weatherData2021atempSum = ["2021"];
    weatherData2020 = [];
    weatherData2020pcMean = ["2020"];
    weatherData2020pcSum = ["2020"];
    weatherData2020atempMean = ["2020"];
    weatherData2020atempSum = ["2020"];
    weatherData2019 = [];
    weatherData2019pcMean = ["2019"];
    weatherData2019pcSum = ["2019"];
    weatherData2019atempMean = ["2019"];
    weatherData2019atempSum = ["2019"];
    weatherData2018 = [];
    weatherData2018pcMean = ["2018"];
    weatherData2018pcSum = ["2018"];
    weatherData2018atempMean = ["2018"];
    weatherData2018atempSum = ["2018"];
    weatherData2017 = [];
    weatherData2017pcMean = ["2017"];
    weatherData2017pcSum = ["2017"];
    weatherData2017atempMean = ["2017"];
    weatherData2017atempSum = ["2017"];
    weatherData2016 = [];
    weatherData2016pcMean = ["2016"];
    weatherData2016pcSum = ["2016"];
    weatherData2016atempMean = ["2016"];
    weatherData2016atempSum = ["2016"];
    weatherData2015 = [];
    weatherData2015pcMean = ["2015"];
    weatherData2015pcSum = ["2015"];
    weatherData2015atempMean = ["2015"];
    weatherData2015atempSum = ["2015"];
    weatherData2014 = [];
    weatherData2014pcMean = ["2014"];
    weatherData2014pcSum = ["2014"];
    weatherData2014atempMean = ["2014"];
    weatherData2014atempSum = ["2014"];
    weatherData2013 = [];
    weatherData2013pcMean = ["2013"];
    weatherData2013pcSum = ["2013"];
    weatherData2013atempMean = ["2013"];
    weatherData2013atempSum = ["2013"];
    weatherData2012 = [];
    weatherData2012pcMean = ["2012"];
    weatherData2012pcSum = ["2012"];
    weatherData2012atempMean = ["2012"];
    weatherData2012atempSum = ["2012"];



    var weatherVars = {
      name: "Precip",
      p: precip,
      p2020: precip2020,
      p2021: precip2021,
      a: airTemp,
      a2020: airTemp2020,
      a2021: airTemp2021,
      pcM2021: weatherData2021pcMean,
      pcS2021: weatherData2021pcSum,
      atempM2021: weatherData2021atempMean,
      atempS2021: weatherData2021atempSum,
      pcM2020: weatherData2020pcMean,
      pcS2020: weatherData2020pcSum,
      atempM2020: weatherData2020atempMean,
      atempS2020: weatherData2020atempSum,
      pcM2019: weatherData2019pcMean,
      pcS2019: weatherData2019pcSum,
      atempM2019: weatherData2019atempMean,
      atempS2019: weatherData2019atempSum,
      pcM2018: weatherData2018pcMean,
      pcS2018: weatherData2018pcSum,
      atempM2018: weatherData2018atempMean,
      atempS2018: weatherData2018atempSum,
      pcM2017: weatherData2017pcMean,
      pcS2017: weatherData2017pcSum,
      atempM2017: weatherData2017atempMean,
      atempS2017: weatherData2017atempSum,
      pcM2016: weatherData2016pcMean,
      pcS2016: weatherData2016pcSum,
      atempM2016: weatherData2016atempMean,
      atempS2016: weatherData2016atempSum,
      pcM2015: weatherData2015pcMean,
      pcS2015: weatherData2015pcSum,
      atempM2015: weatherData2015atempMean,
      atempS2015: weatherData2015atempSum,
      pcM2014: weatherData2014pcMean,
      pcS2014: weatherData2014pcSum,
      atempM2014: weatherData2014atempMean,
      atempS2014: weatherData2014atempSum,
      pcM2013: weatherData2013pcMean,
      pcS2013: weatherData2013pcSum,
      atempM2013: weatherData2013atempMean,
      atempS2013: weatherData2013atempSum,
      pcM2012: weatherData2012pcMean,
      pcS2012: weatherData2012pcSum,
      atempM2012: weatherData2012atempMean,
      atempS2012: weatherData2012atempSum,
    }

    function varsCounts(i) {
      tp = 0, ta = 0;
      datasets[5].forEach(function(d) {
        var USTd = new Date(d["date"])
        wt.push(USTd.setHours(USTd.getHours() + 8));
        tp = 0, ta = 0;
        current = d;
        delete current["date"];
        if (i["name"] = "Precip") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              tp += +items[0];
              break;
          };

        }

        if (i["name"] = "Air_Temp") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              ta += +items[0];
              break;
          };

        }
        i["p"].push(tp);
        i["a"].push(ta);
      });
      tp2020 = 0, ta2020 = 0;
      datasets[23].forEach(function(d) {
        var USTd = new Date(d["date"])
        wt2020.push(USTd.setHours(USTd.getHours() + 8));
        tp2020 = 0, ta2020 = 0;
        current = d;
        delete current["date"];
        if (i["name"] = "Precip") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              tp2020 += +items[0];
              break;
          };

        }

        if (i["name"] = "Air_Temp") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              ta2020 += +items[0];
              break;
          };

        }
        i["p2020"].push(tp2020);
        i["a2020"].push(ta2020);
      });
      tp2021 = 0, ta2021 = 0;
      datasets[24].forEach(function(d) {
        var USTd = new Date(d["date"])
        wt2021.push(USTd.setHours(USTd.getHours() + 8));
        tp2021 = 0, ta2021 = 0;
        current = d;
        delete current["date"];
        if (i["name"] = "Precip") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              tp2021 += +items[0];
              break;
          };

        }

        if (i["name"] = "Air_Temp") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              ta2021 += +items[0];
              break;
          };

        }
        i["p2021"].push(tp2021);
        i["a2021"].push(ta2021);
      });

      let weatherData = datasets[27];
      for (let i = 0; i < weatherData.length; i++) {
        switch (weatherData[i].year) {
          case "2021":
            weatherData2021pcMean.push(weatherData[i].Precip_mean);
            weatherData2021pcSum.push(weatherData[i].Precip_cumsum);
            weatherData2021atempMean.push(weatherData[i].Air_Temp_mean);
            weatherData2021atempSum.push(weatherData[i].Air_Temp_cumsum);
            break;
          case "2020":
            weatherData2020pcMean.push(weatherData[i].Precip_mean);
            weatherData2020pcSum.push(weatherData[i].Precip_cumsum);
            weatherData2020atempMean.push(weatherData[i].Air_Temp_mean);
            weatherData2020atempSum.push(weatherData[i].Air_Temp_cumsum);
            break;
          case "2019":
            weatherData2019pcMean.push(weatherData[i].Precip_mean);
            weatherData2019pcSum.push(weatherData[i].Precip_cumsum);
            weatherData2019atempMean.push(weatherData[i].Air_Temp_mean);
            weatherData2019atempSum.push(weatherData[i].Air_Temp_cumsum);
            break;
          case "2018":
            weatherData2018pcMean.push(weatherData[i].Precip_mean);
            weatherData2018pcSum.push(weatherData[i].Precip_cumsum);
            weatherData2018atempMean.push(weatherData[i].Air_Temp_mean);
            weatherData2018atempSum.push(weatherData[i].Air_Temp_cumsum);
            break;
          case "2017":
            weatherData2017pcMean.push(weatherData[i].Precip_mean);
            weatherData2017pcSum.push(weatherData[i].Precip_cumsum);
            weatherData2017atempMean.push(weatherData[i].Air_Temp_mean);
            weatherData2017atempSum.push(weatherData[i].Air_Temp_cumsum);
            break;
          case "2016":
            weatherData2016pcMean.push(weatherData[i].Precip_mean);
            weatherData2016pcSum.push(weatherData[i].Precip_cumsum);
            weatherData2016atempMean.push(weatherData[i].Air_Temp_mean);
            weatherData2016atempSum.push(weatherData[i].Air_Temp_cumsum);
            break;
          case "2015":
            weatherData2015pcMean.push(weatherData[i].Precip_mean);
            weatherData2015pcSum.push(weatherData[i].Precip_cumsum);
            weatherData2015atempMean.push(weatherData[i].Air_Temp_mean);
            weatherData2015atempSum.push(weatherData[i].Air_Temp_cumsum);
            break;
          case "2014":
            weatherData2014pcMean.push(weatherData[i].Precip_mean);
            weatherData2014pcSum.push(weatherData[i].Precip_cumsum);
            weatherData2014atempMean.push(weatherData[i].Air_Temp_mean);
            weatherData2014atempSum.push(weatherData[i].Air_Temp_cumsum);
            break;
          case "2013":
            weatherData2013pcMean.push(weatherData[i].Precip_mean);
            weatherData2013pcSum.push(weatherData[i].Precip_cumsum);
            weatherData2013atempMean.push(weatherData[i].Air_Temp_mean);
            weatherData2013atempSum.push(weatherData[i].Air_Temp_cumsum);
            break;
          case "2012":
            weatherData2012pcMean.push(weatherData[i].Precip_mean);
            weatherData2012pcSum.push(weatherData[i].Precip_cumsum);
            weatherData2012atempMean.push(weatherData[i].Air_Temp_mean);
            weatherData2012atempSum.push(weatherData[i].Air_Temp_cumsum);
            break;
          case "2011":
            weatherData2011pcMean.push(weatherData[i].Precip_mean);
            weatherData2011pcSum.push(weatherData[i].Precip_cumsum);
            weatherData2011atempMean.push(weatherData[i].Air_Temp_mean);
            weatherData2011atempSum.push(weatherData[i].Air_Temp_cumsum);
            break;
          case "2010":
            weatherData2010pcMean.push(weatherData[i].Precip_mean);
            weatherData2010pcSum.push(weatherData[i].Precip_cumsum);
            weatherData2010atempMean.push(weatherData[i].Air_Temp_mean);
            weatherData2010atempSum.push(weatherData[i].Air_Temp_cumsum);
            break;
          default:
        }


      }
    }


    // const distinct = (value, index, self) => {
    //   return self.indexOf(value) === index;
    // }
    //       var years = ["Years"];
    //       datasets[25].forEach(function(d) {
    //         var yearList = d["year"];
    //         years.push(yearList);
    //         var distinctYears = years.filter(distinct);
    //         for (var i = 0; i < distinctYears.length; i++) {
    //           distinctYears[i]
    //         }
    //       });


    // streamData = [];

    // streamGage1Data2021 = datasets[25].filter(function(d) {
    //
    //   return d.usgs_site = "14178000";
    // })





    // Stream Gage Data

    var t = ["Date"];
    var t2020 = ["Date"];
    var t2021 = ["Date"];
    var water_temp = ["Water Temperature"];
    var water_temp2020 = ["2020"];
    var water_temp2021 = ["2021"];
    streamGage1Data2021 = [];
    streamGage1Data2021wtMean = ["2021"];
    streamGage1Data2021wtSum = ["2021"];
    streamGage1Data2021dchMean = ["2021"];
    streamGage1Data2021dchSum = ["2021"];
    streamGage1Data2020 = [];
    streamGage1Data2020wtMean = ["2020"];
    streamGage1Data2020wtSum = ["2020"];
    streamGage1Data2020dchMean = ["2020"];
    streamGage1Data2020dchSum = ["2020"];
    streamGage1Data2019 = [];
    streamGage1Data2019wtMean = ["2019"];
    streamGage1Data2019wtSum = ["2019"];
    streamGage1Data2019dchMean = ["2019"];
    streamGage1Data2019dchSum = ["2019"];
    streamGage1Data2018 = [];
    streamGage1Data2018wtMean = ["2018"];
    streamGage1Data2018wtSum = ["2018"];
    streamGage1Data2018dchMean = ["2018"];
    streamGage1Data2018dchSum = ["2018"];
    streamGage1Data2017 = [];
    streamGage1Data2017wtMean = ["2017"];
    streamGage1Data2017wtSum = ["2017"];
    streamGage1Data2017dchMean = ["2017"];
    streamGage1Data2017dchSum = ["2017"];
    streamGage1Data2016 = [];
    streamGage1Data2016wtMean = ["2016"];
    streamGage1Data2016wtSum = ["2016"];
    streamGage1Data2016dchMean = ["2016"];
    streamGage1Data2016dchSum = ["2016"];
    streamGage1Data2015 = [];
    streamGage1Data2015wtMean = ["2015"];
    streamGage1Data2015wtSum = ["2015"];
    streamGage1Data2015dchMean = ["2015"];
    streamGage1Data2015dchSum = ["2015"];
    streamGage1Data2014 = [];
    streamGage1Data2014wtMean = ["2014"];
    streamGage1Data2014wtSum = ["2014"];
    streamGage1Data2014dchMean = ["2014"];
    streamGage1Data2014dchSum = ["2014"];
    streamGage1Data2013 = [];
    streamGage1Data2013wtMean = ["2013"];
    streamGage1Data2013wtSum = ["2013"];
    streamGage1Data2013dchMean = ["2013"];
    streamGage1Data2013dchSum = ["2013"];
    streamGage1Data2012 = [];
    streamGage1Data2012wtMean = ["2012"];
    streamGage1Data2012wtSum = ["2012"];
    streamGage1Data2012dchMean = ["2012"];
    streamGage1Data2012dchSum = ["2012"];
    streamGage1Data2011 = [];
    streamGage1Data2011wtMean = ["2011"];
    streamGage1Data2011wtSum = ["2011"];
    streamGage1Data2011dchMean = ["2011"];
    streamGage1Data2011dchSum = ["2011"];
    streamGage1Data2010 = [];
    streamGage1Data2010wtMean = ["2010"];
    streamGage1Data2010wtSum = ["2010"];
    streamGage1Data2010dchMean = ["2010"];
    streamGage1Data2010dchSum = ["2010"];

    var gage1 = {
      name: "14178000",
      wt: water_temp,
      wt2020: water_temp2020,
      wt2021: water_temp2021,
      wtM2021: streamGage1Data2021wtMean,
      wtS2021: streamGage1Data2021wtSum,
      dchM2021: streamGage1Data2021dchMean,
      dchS2021: streamGage1Data2021dchSum,
      wtM2020: streamGage1Data2020wtMean,
      wtS2020: streamGage1Data2020wtSum,
      dchM2020: streamGage1Data2020dchMean,
      dchS2020: streamGage1Data2020dchSum,
      wtM2019: streamGage1Data2019wtMean,
      wtS2019: streamGage1Data2019wtSum,
      dchM2019: streamGage1Data2019dchMean,
      dchS2019: streamGage1Data2019dchSum,
      wtM2018: streamGage1Data2018wtMean,
      wtS2018: streamGage1Data2018wtSum,
      dchM2018: streamGage1Data2018dchMean,
      dchS2018: streamGage1Data2018dchSum,
      wtM2017: streamGage1Data2017wtMean,
      wtS2017: streamGage1Data2017wtSum,
      dchM2017: streamGage1Data2017dchMean,
      dchS2017: streamGage1Data2017dchSum,
      wtM2016: streamGage1Data2016wtMean,
      wtS2016: streamGage1Data2016wtSum,
      dchM2016: streamGage1Data2016dchMean,
      dchS2016: streamGage1Data2016dchSum,
      wtM2015: streamGage1Data2015wtMean,
      wtS2015: streamGage1Data2015wtSum,
      dchM2015: streamGage1Data2015dchMean,
      dchS2015: streamGage1Data2015dchSum,
      wtM2014: streamGage1Data2014wtMean,
      wtS2014: streamGage1Data2014wtSum,
      dchM2014: streamGage1Data2014dchMean,
      dchS2014: streamGage1Data2014dchSum,
      wtM2013: streamGage1Data2013wtMean,
      wtS2013: streamGage1Data2013wtSum,
      dchM2013: streamGage1Data2013dchMean,
      dchS2013: streamGage1Data2013dchSum,
      wtM2012: streamGage1Data2012wtMean,
      wtS2012: streamGage1Data2012wtSum,
      dchM2012: streamGage1Data2012dchMean,
      dchS2012: streamGage1Data2012dchSum,
      wtM2011: streamGage1Data2011wtMean,
      wtS2011: streamGage1Data2011wtSum,
      dchM2011: streamGage1Data2011dchMean,
      dchS2011: streamGage1Data2011dchSum,
      wtM2010: streamGage1Data2010wtMean,
      wtS2010: streamGage1Data2010wtSum,
      dchM2010: streamGage1Data2010dchMean,
      dchS2010: streamGage1Data2010dchSum,
    }

    function gage1Counts(i) {
      gageID = "14178000";
      $("#gageDropdown").text("NO SANTIAM R BLW BOULDER CRK, NR DETROIT, OR");

      let streamGageData = datasets[25];
      for (let i = 0; i < streamGageData.length; i++) {
        if (streamGageData[i].usgs_site == "14178000") {
          switch (streamGageData[i].year) {
            case "2021":
              streamGage1Data2021wtMean.push(streamGageData[i].Water_Temp_mean);
              streamGage1Data2021wtSum.push(streamGageData[i].Water_Temp_cumsum);
              streamGage1Data2021dchMean.push(streamGageData[i].Discharge_mean);
              streamGage1Data2021dchSum.push(streamGageData[i].Discharge_cumsum);
              break;
            case "2020":
              streamGage1Data2020wtMean.push(streamGageData[i].Water_Temp_mean);
              streamGage1Data2020wtSum.push(streamGageData[i].Water_Temp_cumsum);
              streamGage1Data2020dchMean.push(streamGageData[i].Discharge_mean);
              streamGage1Data2020dchSum.push(streamGageData[i].Discharge_cumsum);
              break;
            case "2019":
              streamGage1Data2019wtMean.push(streamGageData[i].Water_Temp_mean);
              streamGage1Data2019wtSum.push(streamGageData[i].Water_Temp_cumsum);
              streamGage1Data2019dchMean.push(streamGageData[i].Discharge_mean);
              streamGage1Data2019dchSum.push(streamGageData[i].Discharge_cumsum);
              break;
            case "2018":
              streamGage1Data2018wtMean.push(streamGageData[i].Water_Temp_mean);
              streamGage1Data2018wtSum.push(streamGageData[i].Water_Temp_cumsum);
              streamGage1Data2018dchMean.push(streamGageData[i].Discharge_mean);
              streamGage1Data2018dchSum.push(streamGageData[i].Discharge_cumsum);
              break;
            case "2017":
              streamGage1Data2017wtMean.push(streamGageData[i].Water_Temp_mean);
              streamGage1Data2017wtSum.push(streamGageData[i].Water_Temp_cumsum);
              streamGage1Data2017dchMean.push(streamGageData[i].Discharge_mean);
              streamGage1Data2017dchSum.push(streamGageData[i].Discharge_cumsum);
              break;
            case "2016":
              streamGage1Data2016wtMean.push(streamGageData[i].Water_Temp_mean);
              streamGage1Data2016wtSum.push(streamGageData[i].Water_Temp_cumsum);
              streamGage1Data2016dchMean.push(streamGageData[i].Discharge_mean);
              streamGage1Data2016dchSum.push(streamGageData[i].Discharge_cumsum);
              break;
            case "2015":
              streamGage1Data2015wtMean.push(streamGageData[i].Water_Temp_mean);
              streamGage1Data2015wtSum.push(streamGageData[i].Water_Temp_cumsum);
              streamGage1Data2015dchMean.push(streamGageData[i].Discharge_mean);
              streamGage1Data2015dchSum.push(streamGageData[i].Discharge_cumsum);
              break;
            case "2014":
              streamGage1Data2014wtMean.push(streamGageData[i].Water_Temp_mean);
              streamGage1Data2014wtSum.push(streamGageData[i].Water_Temp_cumsum);
              streamGage1Data2014dchMean.push(streamGageData[i].Discharge_mean);
              streamGage1Data2014dchSum.push(streamGageData[i].Discharge_cumsum);
              break;
            case "2013":
              streamGage1Data2013wtMean.push(streamGageData[i].Water_Temp_mean);
              streamGage1Data2013wtSum.push(streamGageData[i].Water_Temp_cumsum);
              streamGage1Data2013dchMean.push(streamGageData[i].Discharge_mean);
              streamGage1Data2013dchSum.push(streamGageData[i].Discharge_cumsum);
              break;
            case "2012":
              streamGage1Data2012wtMean.push(streamGageData[i].Water_Temp_mean);
              streamGage1Data2012wtSum.push(streamGageData[i].Water_Temp_cumsum);
              streamGage1Data2012dchMean.push(streamGageData[i].Discharge_mean);
              streamGage1Data2012dchSum.push(streamGageData[i].Discharge_cumsum);
              break;
            case "2011":
              streamGage1Data2011wtMean.push(streamGageData[i].Water_Temp_mean);
              streamGage1Data2011wtSum.push(streamGageData[i].Water_Temp_cumsum);
              streamGage1Data2011dchMean.push(streamGageData[i].Discharge_mean);
              streamGage1Data2011dchSum.push(streamGageData[i].Discharge_cumsum);
              break;
            case "2010":
              streamGage1Data2010wtMean.push(streamGageData[i].Water_Temp_mean);
              streamGage1Data2010wtSum.push(streamGageData[i].Water_Temp_cumsum);
              streamGage1Data2010dchMean.push(streamGageData[i].Discharge_mean);
              streamGage1Data2010dchSum.push(streamGageData[i].Discharge_cumsum);
              break;
            default:
          }
        }

      }

      twt = 0;
      datasets[0].forEach(function(d) {
        var USTd = new Date(d["date"])
        t.push(USTd.setHours(USTd.getHours() + 8));
        twt = 0;
        current = d;
        delete current["date"];
        if (i["name"] = "14178000") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:

              twt += +items[0];
              break;
          };

        }
        i["wt"].push(twt);
      });
      twt2020 = 0;
      datasets[21].forEach(function(d) {
        var USTd = new Date(d["date"])
        t2020.push(USTd.setHours(USTd.getHours() + 8));
        twt2020 = 0;
        current = d;
        delete current["date"];
        if (i["name"] = "14178000") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:

              twt2020 += +items[0];
              break;
          };

        }
        i["wt2020"].push(twt2020);
      });
      twt2021 = 0;
      datasets[22].forEach(function(d) {
        var USTd = new Date(d["date"])
        t2021.push(USTd.setHours(USTd.getHours() + 8));
        twt2021 = 0;
        current = d;
        delete current["date"];
        if (i["name"] = "14178000") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:

              twt2021 += +items[0];
              break;
          };

        }
        i["wt2021"].push(twt2021);
      });


    }

    function siteCounts(i) {
      let streamGageData = datasets[25];

      for (let t = 0; t < streamGageData.length; t++) {
        if (streamGageData[t].usgs_site == i["name"]) {
          switch (streamGageData[t].year) {
            case "2021":
              streamGage1Data2021.push(streamGageData[t]);
              streamGage1Data2021wtMean.push(streamGageData[t].Water_Temp_mean);
              streamGage1Data2021wtSum.push(streamGageData[t].Water_Temp_cumsum);
              streamGage1Data2021dchMean.push(streamGageData[t].Discharge_mean);
              streamGage1Data2021dchSum.push(streamGageData[t].Discharge_cumsum);
              break;
            case "2020":
              streamGage1Data2020.push(streamGageData[t]);
              streamGage1Data2020wtMean.push(streamGageData[t].Water_Temp_mean);
              streamGage1Data2020wtSum.push(streamGageData[t].Water_Temp_cumsum);
              streamGage1Data2020dchMean.push(streamGageData[t].Discharge_mean);
              streamGage1Data2020dchSum.push(streamGageData[t].Discharge_cumsum);
              break;
            case "2019":
              streamGage1Data2019.push(streamGageData[t]);
              streamGage1Data2019wtMean.push(streamGageData[t].Water_Temp_mean);
              streamGage1Data2019wtSum.push(streamGageData[t].Water_Temp_cumsum);
              streamGage1Data2019dchMean.push(streamGageData[t].Discharge_mean);
              streamGage1Data2019dchSum.push(streamGageData[t].Discharge_cumsum);
              break;
            case "2018":
              streamGage1Data2018.push(streamGageData[t]);
              streamGage1Data2018wtMean.push(streamGageData[t].Water_Temp_mean);
              streamGage1Data2018wtSum.push(streamGageData[t].Water_Temp_cumsum);
              streamGage1Data2018dchMean.push(streamGageData[t].Discharge_mean);
              streamGage1Data2018dchSum.push(streamGageData[t].Discharge_cumsum);
              break;
            case "2017":
              streamGage1Data2017.push(streamGageData[t]);
              streamGage1Data2017wtMean.push(streamGageData[t].Water_Temp_mean);
              streamGage1Data2017wtSum.push(streamGageData[t].Water_Temp_cumsum);
              streamGage1Data2017dchMean.push(streamGageData[t].Discharge_mean);
              streamGage1Data2017dchSum.push(streamGageData[t].Discharge_cumsum);
              break;
            case "2016":
              streamGage1Data2016.push(streamGageData[t]);
              streamGage1Data2016wtMean.push(streamGageData[t].Water_Temp_mean);
              streamGage1Data2016wtSum.push(streamGageData[t].Water_Temp_cumsum);
              streamGage1Data2016dchMean.push(streamGageData[t].Discharge_mean);
              streamGage1Data2016dchSum.push(streamGageData[t].Discharge_cumsum);
              break;
            case "2015":
              streamGage1Data2015.push(streamGageData[t]);
              streamGage1Data2015wtMean.push(streamGageData[t].Water_Temp_mean);
              streamGage1Data2015wtSum.push(streamGageData[t].Water_Temp_cumsum);
              streamGage1Data2015dchMean.push(streamGageData[t].Discharge_mean);
              streamGage1Data2015dchSum.push(streamGageData[t].Discharge_cumsum);
              break;
            case "2014":
              streamGage1Data2014.push(streamGageData[t]);
              streamGage1Data2014wtMean.push(streamGageData[t].Water_Temp_mean);
              streamGage1Data2014wtSum.push(streamGageData[t].Water_Temp_cumsum);
              streamGage1Data2014dchMean.push(streamGageData[t].Discharge_mean);
              streamGage1Data2014dchSum.push(streamGageData[t].Discharge_cumsum);
              break;
            case "2013":
              streamGage1Data2013.push(streamGageData[t]);
              streamGage1Data2013wtMean.push(streamGageData[t].Water_Temp_mean);
              streamGage1Data2013wtSum.push(streamGageData[t].Water_Temp_cumsum);
              streamGage1Data2013dchMean.push(streamGageData[t].Discharge_mean);
              streamGage1Data2013dchSum.push(streamGageData[t].Discharge_cumsum);
              break;
            case "2012":
              streamGage1Data2012.push(streamGageData[t]);
              streamGage1Data2012wtMean.push(streamGageData[t].Water_Temp_mean);
              streamGage1Data2012wtSum.push(streamGageData[t].Water_Temp_cumsum);
              streamGage1Data2012dchMean.push(streamGageData[t].Discharge_mean);
              streamGage1Data2012dchSum.push(streamGageData[t].Discharge_cumsum);
              break;
            case "2011":
              streamGage1Data2011.push(streamGageData[t]);
              streamGage1Data2011wtMean.push(streamGageData[t].Water_Temp_mean);
              streamGage1Data2011wtSum.push(streamGageData[t].Water_Temp_cumsum);
              streamGage1Data2011dchMean.push(streamGageData[t].Discharge_mean);
              streamGage1Data2011dchSum.push(streamGageData[t].Discharge_cumsum);
              break;
            case "2010":
              streamGage1Data2010.push(streamGageData[t]);
              streamGage1Data2010wtMean.push(streamGageData[t].Water_Temp_mean);
              streamGage1Data2010wtSum.push(streamGageData[t].Water_Temp_cumsum);
              streamGage1Data2010dchMean.push(streamGageData[t].Discharge_mean);
              streamGage1Data2010dchSum.push(streamGageData[t].Discharge_cumsum);
              break;
            default:
          }
        }
      }


      twt = 0;
      datasets[0].forEach(function(d) {
        var USTd = new Date(d["Date"])
        t.push(USTd.setHours(USTd.getHours() + 8));
        twt = 0;
        current = d;
        delete current["Date"];
        if (i["name"] != "14178000") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              twt += +items[0];
              break;
          };

        } else {

          Object.values(current).forEach(function(d) {
            if (d == undefined) {
              d = "0"
            };
            items = d.split("-");
            switch (items.length) {
              case 1:
                twt += +items[0];
                break;
            };

          });
          //
        }
        i["wt"].push(twt);
      });
      twt2020 = 0;
      datasets[21].forEach(function(d) {
        var USTd = new Date(d["Date"])
        t2020.push(USTd.setHours(USTd.getHours() + 8));
        twt2020 = 0;
        current = d;
        delete current["Date"];
        if (i["name"] != "14178000") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              twt2020 += +items[0];
              break;
          };

        } else {

          Object.values(current).forEach(function(d) {
            if (d == undefined) {
              d = "0"
            };
            items = d.split("-");
            switch (items.length) {
              case 1:
                twt2020 += +items[0];
                break;
            };

          });
          //
        }
        i["wt2020"].push(twt2020);
      });
      twt2021 = 0;
      datasets[22].forEach(function(d) {
        var USTd = new Date(d["Date"])
        t2021.push(USTd.setHours(USTd.getHours() + 8));
        twt2021 = 0;
        current = d;
        delete current["Date"];
        if (i["name"] != "14178000") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              twt2021 += +items[0];
              break;
          };

        } else {

          Object.values(current).forEach(function(d) {
            if (d == undefined) {
              d = "0"
            };
            items = d.split("-");
            switch (items.length) {
              case 1:
                twt2021 += +items[0];
                break;
            };

          });
          //
        }
        i["wt2021"].push(twt2021);
      });


    }

    // Water sample Data
    var wstnew = ["Date"];
    var wst = ["Date"];
    var wst2016 = ["Date"];
    var wst2017 = ["Date"];
    var wst2018 = ["Date"];
    var wst2019 = ["Date"];
    var wstt = ["Date"];
    var wstt2016 = ["Date"];
    var wstt2017 = ["Date"];
    var wstt2018 = ["Date"];
    var wstt2019 = ["Date"];
    var wsnt = ["Date"];
    var wsnt2016 = ["Date"];
    var wsnt2017 = ["Date"];
    var wsnt2018 = ["Date"];
    var wsnt2019 = ["Date"];
    var algae = ["Algae"];
    var algae2016 = ["2016"];
    var algae2017 = ["2017"];
    var algae2018 = ["2018"];
    var algae2019 = ["2019"];
    var toxin = ["Toxins"];
    var toxin2013 = ["2013"];
    var toxin2014 = ["2014"];
    var toxin2015 = ["2015"];
    var toxin2016 = ["2016"];
    var toxin2017 = ["2017"];
    var toxin2018 = ["2018"];
    var toxin2019 = ["2019"];
    var nitrate = ["Total Nitrate"];
    var nitrate2016 = ["2016"];
    var nitrate2017 = ["2017"];
    var nitrate2018 = ["2018"];
    var nitrate2019 = ["2019"];

    var sampleLoc1 = {
      name: "Log Boom",
      a: algae,
      a2016: algae2016,
      a2017: algae2017,
      a2018: algae2018,
      a2019: algae2019,
      t: toxin,
      t2013: toxin2013,
      t2014: toxin2014,
      t2015: toxin2015,
      t2016: toxin2016,
      t2017: toxin2017,
      t2018: toxin2018,
      t2019: toxin2019,
      n: nitrate,
      n2016: nitrate2016,
      n2017: nitrate2017,
      n2018: nitrate2018,
      n2019: nitrate2019,
    }

    function sample1Counts(i) {
      // algae datas
      // let algaeData = datasets[28];
      // for (let i = 0; i < algaeData.length; i++) {
      //   var  sampleDate = new Date(algaeData[i].date);
      //   year = sampleDate.getFullYear();
      //   if (i["name"] = "Log Boom") {
      //     switch (year) {
      //       case "2019":
      //         algae2019.push(algaeData[i].Toxin);
      //         break;
      //       case "2018":
      //         algae201.push(weatherData[i].Toxin);
      //         break;
      //       case "2017":
      //         algae2017.push(weatherData[i].Toxin);
      //         break;
      //       case "2016":
      //         algae2016.push(weatherData[i].Toxin);
      //         break;
      //       default:
      //     }
      //   }
      // }


      // algae data
      ta = 0;
      datasets[2].forEach(function(d) {
        var USTd = new Date(d["t"])
        wst.push(USTd.setHours(USTd.getHours() + 8));
        ta = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              ta += +items[0];
              break;
          };

        }
        i["a"].push(ta);
      });
      ta2016 = 0;
      datasets[9].forEach(function(d) {
        var USTd = new Date(d["t"])
        wst2016.push(USTd.setHours(USTd.getHours() + 8));
        ta2016 = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              ta2016 += +items[0];
              break;
          };

        }
        i["a2016"].push(ta2016);
      });
      ta2017 = 0;
      datasets[10].forEach(function(d) {
        var USTd = new Date(d["t"])
        wst2017.push(USTd.setHours(USTd.getHours() + 8));
        ta2017 = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              ta2017 += +items[0];
              break;
          };

        }
        i["a2017"].push(ta2017);
      });
      ta2018 = 0;
      datasets[11].forEach(function(d) {
        var USTd = new Date(d["t"])
        wst2018.push(USTd.setHours(USTd.getHours() + 8));
        ta2018 = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              ta2018 += +items[0];
              break;
          };

        }
        i["a2018"].push(ta2018);
      });
      ta2019 = 0;
      datasets[12].forEach(function(d) {
        var USTd = new Date(d["t"])
        wst2019.push(USTd.setHours(USTd.getHours() + 8));
        ta2019 = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              ta2019 += +items[0];
              break;
          };

        }
        i["a2019"].push(ta2019);
      });
      // toxin data
      tt = 0;
      datasets[6].forEach(function(d) {
        var USTd = new Date(d["t"])
        wstt.push(USTd.setHours(USTd.getHours() + 8));
        tt = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              tt += +items[0];
              break;
          };

        }
        i["t"].push(tt);
      });
      tt2016 = 0;
      datasets[13].forEach(function(d) {
        var USTd = new Date(d["t"])
        wstt2016.push(USTd.setHours(USTd.getHours() + 8));
        tt2016 = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              tt2016 += +items[0];
              break;
          };

        }
        i["t2016"].push(tt2016);
      });
      tt2017 = 0;
      datasets[14].forEach(function(d) {
        var USTd = new Date(d["t"])
        wstt2017.push(USTd.setHours(USTd.getHours() + 8));
        tt2017 = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              tt2017 += +items[0];
              break;
          };

        }
        i["t2017"].push(tt2017);
      });
      tt2018 = 0;
      datasets[15].forEach(function(d) {
        var USTd = new Date(d["t"])
        wstt2018.push(USTd.setHours(USTd.getHours() + 8));
        tt2018 = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              tt2018 += +items[0];
              break;
          };

        }
        i["t2018"].push(tt2018);
      });
      tt2019 = 0;
      datasets[16].forEach(function(d) {
        var USTd = new Date(d["t"])
        wstt2019.push(USTd.setHours(USTd.getHours() + 8));
        tt2019 = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              tt2019 += +items[0];
              break;
          };

        }
        i["t2019"].push(tt2019);
      });
      // nitrate data
      tn = 0;
      datasets[7].forEach(function(d) {
        var USTd = new Date(d["t"])
        wsnt.push(USTd.setHours(USTd.getHours() + 8));
        tn = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              tn += +items[0];
              break;
          };

        }
        i["n"].push(tn);
      });
      tn2016 = 0;
      datasets[17].forEach(function(d) {
        var USTd = new Date(d["t"])
        wsnt2016.push(USTd.setHours(USTd.getHours() + 8));
        tn2016 = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              tn2016 += +items[0];
              break;
          };

        }
        i["n2016"].push(tn2016);
      });
      tn2017 = 0;
      datasets[18].forEach(function(d) {
        var USTd = new Date(d["t"])
        wsnt2017.push(USTd.setHours(USTd.getHours() + 8));
        tn2017 = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              tn2017 += +items[0];
              break;
          };

        }
        i["n2017"].push(tn2017);
      });
      tn2018 = 0;
      datasets[19].forEach(function(d) {
        var USTd = new Date(d["t"])
        wsnt2018.push(USTd.setHours(USTd.getHours() + 8));
        tn2018 = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              tn2018 += +items[0];
              break;
          };

        }
        i["n2018"].push(tn2018);
      });
      tn2019 = 0;
      datasets[20].forEach(function(d) {
        var USTd = new Date(d["t"])
        wsnt2019.push(USTd.setHours(USTd.getHours() + 8));
        tn2019 = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              tn2019 += +items[0];
              break;
          };

        }
        i["n2019"].push(tn2019);
      });
    }

    function sampleSiteCounts(i) {
      // algae data
      ta = 0;
      datasets[2].forEach(function(d) {
        var USTd = new Date(d["t"])
        wst.push(USTd.setHours(USTd.getHours() + 8));
        ta = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              ta += +items[0];
              break;
          };

        } else {

          Object.values(current).forEach(function(d) {
            if (d == undefined) {
              d = "0"
            };
            items = d.split("-");
            switch (items.length) {
              case 1:
                ta += +items[0];
                break;
            };

          });
          //
        }
        i["a"].push(ta);
      });
      ta2016 = 0;
      datasets[9].forEach(function(d) {
        var USTd = new Date(d["t"])
        wst2016.push(USTd.setHours(USTd.getHours() + 8));
        ta2016 = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              ta2016 += +items[0];
              break;
          };

        } else {

          Object.values(current).forEach(function(d) {
            if (d == undefined) {
              d = "0"
            };
            items = d.split("-");
            switch (items.length) {
              case 1:
                ta2016 += +items[0];
                break;
            };

          });
          //
        }
        i["a2016"].push(ta2016);
      });
      ta2017 = 0;
      datasets[10].forEach(function(d) {
        var USTd = new Date(d["t"])
        wst2017.push(USTd.setHours(USTd.getHours() + 8));
        ta2017 = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              ta2017 += +items[0];
              break;
          };

        } else {

          Object.values(current).forEach(function(d) {
            if (d == undefined) {
              d = "0"
            };
            items = d.split("-");
            switch (items.length) {
              case 1:
                ta2017 += +items[0];
                break;
            };

          });
          //
        }
        i["a2017"].push(ta2017);
      });
      ta2018 = 0;
      datasets[11].forEach(function(d) {
        var USTd = new Date(d["t"])
        wst2018.push(USTd.setHours(USTd.getHours() + 8));
        ta2018 = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              ta2018 += +items[0];
              break;
          };

        } else {

          Object.values(current).forEach(function(d) {
            if (d == undefined) {
              d = "0"
            };
            items = d.split("-");
            switch (items.length) {
              case 1:
                ta2018 += +items[0];
                break;
            };

          });
          //
        }
        i["a2018"].push(ta2018);
      });
      ta2019 = 0;
      datasets[12].forEach(function(d) {
        var USTd = new Date(d["t"])
        wst2019.push(USTd.setHours(USTd.getHours() + 8));
        ta2019 = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              ta2019 += +items[0];
              break;
          };

        } else {

          Object.values(current).forEach(function(d) {
            if (d == undefined) {
              d = "0"
            };
            items = d.split("-");
            switch (items.length) {
              case 1:
                ta2019 += +items[0];
                break;
            };

          });
          //
        }
        i["a2019"].push(ta2019);
      });
      // toxin data
      tt = 0;
      datasets[6].forEach(function(d) {
        var USTd = new Date(d["t"])
        wstt.push(USTd.setHours(USTd.getHours() + 8));
        tt = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              tt += +items[0];
              break;
          };

        } else {

          Object.values(current).forEach(function(d) {
            if (d == undefined) {
              d = "0"
            };
            items = d.split("-");
            switch (items.length) {
              case 1:
                tt += +items[0];
                break;
            };

          });
          //
        }
        i["t"].push(tt);
      });
      tt2016 = 0;
      datasets[13].forEach(function(d) {
        var USTd = new Date(d["t"])
        wstt2016.push(USTd.setHours(USTd.getHours() + 8));
        tt2016 = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              tt2016 += +items[0];
              break;
          };

        } else {

          Object.values(current).forEach(function(d) {
            if (d == undefined) {
              d = "0"
            };
            items = d.split("-");
            switch (items.length) {
              case 1:
                tt2016 += +items[0];
                break;
            };

          });
          //
        }
        i["t2016"].push(tt2016);
      });
      tt2017 = 0;
      datasets[14].forEach(function(d) {
        var USTd = new Date(d["t"])
        wstt2017.push(USTd.setHours(USTd.getHours() + 8));
        tt2017 = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              tt2017 += +items[0];
              break;
          };

        } else {

          Object.values(current).forEach(function(d) {
            if (d == undefined) {
              d = "0"
            };
            items = d.split("-");
            switch (items.length) {
              case 1:
                tt2017 += +items[0];
                break;
            };

          });
          //
        }
        i["t2017"].push(tt2017);
      });
      tt2018 = 0;
      datasets[15].forEach(function(d) {
        var USTd = new Date(d["t"])
        wstt2018.push(USTd.setHours(USTd.getHours() + 8));
        tt2018 = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              tt2018 += +items[0];
              break;
          };

        } else {

          Object.values(current).forEach(function(d) {
            if (d == undefined) {
              d = "0"
            };
            items = d.split("-");
            switch (items.length) {
              case 1:
                tt2018 += +items[0];
                break;
            };

          });
          //
        }
        i["t2018"].push(tt2018);
      });
      tt2019 = 0;
      datasets[16].forEach(function(d) {
        var USTd = new Date(d["t"])
        wstt2019.push(USTd.setHours(USTd.getHours() + 8));
        tt2019 = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              tt2019 += +items[0];
              break;
          };

        } else {

          Object.values(current).forEach(function(d) {
            if (d == undefined) {
              d = "0"
            };
            items = d.split("-");
            switch (items.length) {
              case 1:
                tt2019 += +items[0];
                break;
            };

          });
          //
        }
        i["t2019"].push(tt2019);
      });
      // nitrate data
      tn = 0;
      datasets[7].forEach(function(d) {
        var USTd = new Date(d["t"])
        wsnt.push(USTd.setHours(USTd.getHours() + 8));
        tn = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              tn += +items[0];
              break;
          };

        } else {

          Object.values(current).forEach(function(d) {
            if (d == undefined) {
              d = "0"
            };
            items = d.split("-");
            switch (items.length) {
              case 1:
                tn += +items[0];
                break;
            };

          });
          //
        }
        i["n"].push(tn);
      });
      tn2016 = 0;
      datasets[17].forEach(function(d) {
        var USTd = new Date(d["t"])
        wsnt2016.push(USTd.setHours(USTd.getHours() + 8));
        tn2016 = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              tn2016 += +items[0];
              break;
          };

        } else {

          Object.values(current).forEach(function(d) {
            if (d == undefined) {
              d = "0"
            };
            items = d.split("-");
            switch (items.length) {
              case 1:
                tn2016 += +items[0];
                break;
            };

          });
          //
        }
        i["n2016"].push(tn2016);
      });
      tn2017 = 0;
      datasets[18].forEach(function(d) {
        var USTd = new Date(d["t"])
        wsnt2017.push(USTd.setHours(USTd.getHours() + 8));
        tn2017 = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              tn2017 += +items[0];
              break;
          };

        } else {

          Object.values(current).forEach(function(d) {
            if (d == undefined) {
              d = "0"
            };
            items = d.split("-");
            switch (items.length) {
              case 1:
                tn2017 += +items[0];
                break;
            };

          });
          //
        }
        i["n2017"].push(tn2017);
      });
      tn2018 = 0;
      datasets[19].forEach(function(d) {
        var USTd = new Date(d["t"])
        wsnt2018.push(USTd.setHours(USTd.getHours() + 8));
        tn2018 = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              tn2018 += +items[0];
              break;
          };

        } else {

          Object.values(current).forEach(function(d) {
            if (d == undefined) {
              d = "0"
            };
            items = d.split("-");
            switch (items.length) {
              case 1:
                tn2018 += +items[0];
                break;
            };

          });
          //
        }
        i["n2018"].push(tn2018);
      });
      tn2019 = 0;
      datasets[20].forEach(function(d) {
        var USTd = new Date(d["t"])
        wsnt2019.push(USTd.setHours(USTd.getHours() + 8));
        tn2019 = 0;
        current = d;
        delete current["t"];
        if (i["name"] = "Log Boom") {
          d = current[i["name"]];
          if (d == undefined) {
            d = "0"
          };
          items = d.split("-");
          switch (items.length) {
            case 1:
              tn2019 += +items[0];
              break;
          };

        } else {

          Object.values(current).forEach(function(d) {
            if (d == undefined) {
              d = "0"
            };
            items = d.split("-");
            switch (items.length) {
              case 1:
                tn2019 += +items[0];
                break;
            };

          });
          //
        }
        i["n2019"].push(tn2019);
      });
    }

    // checkbox js


    function setColor(cases) {

      if (cases >= .874) {
        id = 4;
      } else if (cases > .795 && cases <= .874) {
        id = 3;
      } else if (cases > .742 && cases <= .795) {
        id = 2;
      } else if (cases > .655 && cases <= .742) {
        id = 1;
      } else if (cases > 0.006 && cases <= 0.655) {
        id = 0;
      } else {
        id = -1;
        return "#00000000";
      }

      return colors[id];

    }


    function style(feature) {

      return {
        fillColor: setColor(feature.properties.Cases),
        fillOpacity: 0.4,
        weight: 1,
        opacity: 1,
        color: '#b4b4b4',
        dashArray: '3'
      };

    }

    function sampleStyle(feature) {

      return {
        fillColor: setColor(feature.properties.Cases),
        fillOpacity: 0.4,
        weight: 1,
        opacity: 1,
        color: '#b4b4b4',
        dashArray: '3'
      };

    }

    function weatherStyle(feature) {

      return {
        fillColor: setColor(feature.properties.Cases),
        fillOpacity: 0.4,
        weight: 1,
        opacity: 1,
        color: '#b4b4b4',
        dashArray: '3'
      };

    }


    function highlightFeature(e) {
      // e indicates the current event
      var layer = e.target; //the target capture the object which the event associates with
      layer.setStyle({
        weight: 4,
        opacity: 0.8,
        color: '#e3e3e3',
        fillColor: '#00ffd9',
        fillOpacity: 0.1
      });
      // bring the layer to the front.
      layer.bringToFront();
    }

    // 3.2.2 zoom to the highlighted feature when the mouse is clicking onto it.
    // 3.2.2 zoom to the highlighted feature when the mouse is clicking onto it.
    function zoomToFeature(e) {
      // mymap.fitBounds(e.target.getBounds());
      L.DomEvent.stopPropagation(e);
      // $("#hint").text("Click here to for State trend.");


      var t = ["Date"];
      var t2020 = ["Date"];
      var t2021 = ["Date"];
      var water_temp = ["Water Temperature"];
      var water_temp2020 = ["2020"];
      var water_temp2021 = ["2021"];
      streamGage1Data2021 = [];
      streamGage1Data2021wtMean = ["2021"];
      streamGage1Data2021wtSum = ["2021"];
      streamGage1Data2021dchMean = ["2021"];
      streamGage1Data2021dchSum = ["2021"];
      streamGage1Data2020 = [];
      streamGage1Data2020wtMean = ["2020"];
      streamGage1Data2020wtSum = ["2020"];
      streamGage1Data2020dchMean = ["2020"];
      streamGage1Data2020dchSum = ["2020"];
      streamGage1Data2019 = [];
      streamGage1Data2019wtMean = ["2019"];
      streamGage1Data2019wtSum = ["2019"];
      streamGage1Data2019dchMean = ["2019"];
      streamGage1Data2019dchSum = ["2019"];
      streamGage1Data2018 = [];
      streamGage1Data2018wtMean = ["2018"];
      streamGage1Data2018wtSum = ["2018"];
      streamGage1Data2018dchMean = ["2018"];
      streamGage1Data2018dchSum = ["2018"];
      streamGage1Data2017 = [];
      streamGage1Data2017wtMean = ["2017"];
      streamGage1Data2017wtSum = ["2017"];
      streamGage1Data2017dchMean = ["2017"];
      streamGage1Data2017dchSum = ["2017"];
      streamGage1Data2016 = [];
      streamGage1Data2016wtMean = ["2016"];
      streamGage1Data2016wtSum = ["2016"];
      streamGage1Data2016dchMean = ["2016"];
      streamGage1Data2016dchSum = ["2016"];
      streamGage1Data2015 = [];
      streamGage1Data2015wtMean = ["2015"];
      streamGage1Data2015wtSum = ["2015"];
      streamGage1Data2015dchMean = ["2015"];
      streamGage1Data2015dchSum = ["2015"];
      streamGage1Data2014 = [];
      streamGage1Data2014wtMean = ["2014"];
      streamGage1Data2014wtSum = ["2014"];
      streamGage1Data2014dchMean = ["2014"];
      streamGage1Data2014dchSum = ["2014"];
      streamGage1Data2013 = [];
      streamGage1Data2013wtMean = ["2013"];
      streamGage1Data2013wtSum = ["2013"];
      streamGage1Data2013dchMean = ["2013"];
      streamGage1Data2013dchSum = ["2013"];
      streamGage1Data2012 = [];
      streamGage1Data2012wtMean = ["2012"];
      streamGage1Data2012wtSum = ["2012"];
      streamGage1Data2012dchMean = ["2012"];
      streamGage1Data2012dchSum = ["2012"];
      streamGage1Data2011 = [];
      streamGage1Data2011wtMean = ["2011"];
      streamGage1Data2011wtSum = ["2011"];
      streamGage1Data2011dchMean = ["2011"];
      streamGage1Data2011dchSum = ["2011"];
      streamGage1Data2010 = [];
      streamGage1Data2010wtMean = ["2010"];
      streamGage1Data2010wtSum = ["2010"];
      streamGage1Data2010dchMean = ["2010"];
      streamGage1Data2010dchSum = ["2010"];

      gageID = e.target.feature.properties.usgs_site;
      var siteSelect = {
        name: gageID,
        wt: water_temp,
        wt2020: water_temp2020,
        wt2021: water_temp2021,
        wtM2021: streamGage1Data2021wtMean,
        wtS2021: streamGage1Data2021wtSum,
        dchM2021: streamGage1Data2021dchMean,
        dchS2021: streamGage1Data2021dchSum,
        wtM2020: streamGage1Data2020wtMean,
        wtS2020: streamGage1Data2020wtSum,
        dchM2020: streamGage1Data2020dchMean,
        dchS2020: streamGage1Data2020dchSum,
        wtM2019: streamGage1Data2019wtMean,
        wtS2019: streamGage1Data2019wtSum,
        dchM2019: streamGage1Data2019dchMean,
        dchS2019: streamGage1Data2019dchSum,
        wtM2018: streamGage1Data2018wtMean,
        wtS2018: streamGage1Data2018wtSum,
        dchM2018: streamGage1Data2018dchMean,
        dchS2018: streamGage1Data2018dchSum,
        wtM2017: streamGage1Data2017wtMean,
        wtS2017: streamGage1Data2017wtSum,
        dchM2017: streamGage1Data2017dchMean,
        dchS2017: streamGage1Data2017dchSum,
        wtM2016: streamGage1Data2016wtMean,
        wtS2016: streamGage1Data2016wtSum,
        dchM2016: streamGage1Data2016dchMean,
        dchS2016: streamGage1Data2016dchSum,
        wtM2015: streamGage1Data2015wtMean,
        wtS2015: streamGage1Data2015wtSum,
        dchM2015: streamGage1Data2015dchMean,
        dchS2015: streamGage1Data2015dchSum,
        wtM2014: streamGage1Data2014wtMean,
        wtS2014: streamGage1Data2014wtSum,
        dchM2014: streamGage1Data2014dchMean,
        dchS2014: streamGage1Data2014dchSum,
        wtM2013: streamGage1Data2013wtMean,
        wtS2013: streamGage1Data2013wtSum,
        dchM2013: streamGage1Data2013dchMean,
        dchS2013: streamGage1Data2013dchSum,
        wtM2012: streamGage1Data2012wtMean,
        wtS2012: streamGage1Data2012wtSum,
        dchM2012: streamGage1Data2012dchMean,
        dchS2012: streamGage1Data2012dchSum,
        wtM2011: streamGage1Data2011wtMean,
        wtS2011: streamGage1Data2011wtSum,
        dchM2011: streamGage1Data2011dchMean,
        dchS2011: streamGage1Data2011dchSum,
        wtM2010: streamGage1Data2010wtMean,
        wtS2010: streamGage1Data2010wtSum,
        dchM2010: streamGage1Data2010dchMean,
        dchS2010: streamGage1Data2010dchSum,
      }

      siteCounts(siteSelect);


      chart.load({
        unload: true,
        columns: [siteSelect.wtM2020, siteSelect.wtM2021],
      });
      chart2.load({
        unload: true,
        columns: [siteSelect.wtM2020, siteSelect.wtM2021],
      });
      h20SumChart.load({
        unload: true,
        columns: [siteSelect.wtS2020, siteSelect.wtS2021],
      });
      dchMeanChart.load({
        unload: true,
        columns: [siteSelect.dchM2020, siteSelect.dchM2021],
      });
      dchSumChart.load({
        unload: true,
        columns: [siteSelect.dchS2020, siteSelect.dchS2021],
      });
      $("#gage-chart > svg > g:nth-child(2)").hide();
      $("#gageDropdown").text(e.target.feature.properties.site_name);

      // $("#deck-2 > div.col-lg-2 > center > div:nth-child(4) > label").css('color', 'white');
      $("#gage2019").css('color', 'white');
      $("#gage2018").css('color', 'white');
      $("#gage2017").css('color', 'white');
      $("#gage2016").css('color', 'white');
      $("#gage2015").css('color', 'white');
      $("#gage2014").css('color', 'white');
      $("#gage2013").css('color', 'white');
      $("#gage2012").css('color', 'white');
      $("#gage2011").css('color', 'white');
      $("#gage2010").css('color', 'white');

    }


    function sampleZoomToFeature(e) {
      // mymap.fitBounds(e.target.getBounds());
      L.DomEvent.stopPropagation(e);
      // $("#hint").text("Click here to for State trend.");


      // Water sample Data
      var wst = ["Date"];
      var wst2016 = ["Date"];
      var wst2017 = ["Date"];
      var wst2018 = ["Date"];
      var wst2019 = ["Date"];
      var wstt = ["Date"];
      var wstt2016 = ["Date"];
      var wstt2017 = ["Date"];
      var wstt2018 = ["Date"];
      var wstt2019 = ["Date"];
      var wsnt = ["Date"];
      var wsnt2016 = ["Date"];
      var wsnt2017 = ["Date"];
      var wsnt2018 = ["Date"];
      var wsnt2019 = ["Date"];
      var algae = ["Algae"];
      var algae2016 = ["2016"];
      var algae2017 = ["2017"];
      var algae2018 = ["2018"];
      var algae2019 = ["2019"];
      var toxin = ["Toxins"];
      var toxin2016 = ["2016"];
      var toxin2017 = ["2017"];
      var toxin2018 = ["2018"];
      var toxin2019 = ["2019"];
      var nitrate = ["Total Nitrate"];
      var nitrate2016 = ["2016"];
      var nitrate2017 = ["2017"];
      var nitrate2018 = ["2018"];
      var nitrate2019 = ["2019"];

      var sampleLoc = {
        name: e.target.feature.properties.site,
        a: algae,
        a2016: algae2016,
        a2017: algae2017,
        a2018: algae2018,
        a2019: algae2019,
        t: toxin,
        t2016: toxin2016,
        t2017: toxin2017,
        t2018: toxin2018,
        t2019: toxin2019,
        n: nitrate,
        n2016: nitrate2016,
        n2017: nitrate2017,
        n2018: nitrate2018,
        n2019: nitrate2019,
      }


      sampleSiteCounts(sampleLoc);


      sampleSubChart.load({
        unload: true,
        columns: [sampleLoc.a2019, sampleLoc.a2018],
      });
      sampleChart.load({
        unload: true,
        columns: [sampleLoc.a2019, sampleLoc.a2018],
      });
      toxinChart.load({
        unload: true,
        columns: [sampleLoc.t2019, sampleLoc.t2018],
      });
      nitrateChart.load({
        unload: true,
        columns: [sampleLoc.n2019, sampleLoc.n2018],
      });
      $("#sample2017").css('color', 'white');
      $("#sample2016").css('color', 'white');

      $("#sampleDropdown").text(e.target.feature.properties.site);
    }


    // 3.2.3 reset the hightlighted feature when the mouse is out of its region.
    function resetHighlight(e) {
      county.resetStyle(e.target);

    }

    // 3.3 add these event the layer obejct.
    function onEachFeature(feature, layer) {
      layer.on({
          // mouseover: highlightFeature,
          click: zoomToFeature,
          // mouseout: resetHighlight
        }),
        layer.bindTooltip(feature.properties.site_name, {
          className: 'feature-label',
          permanent: false,
          sticky: true,
          direction: 'auto'
        });
    }

    // 3.3 add these event the layer obejct.
    function sampleOnEachFeature(feature, layer) {
      layer.on({
          // mouseover: highlightFeature,
          click: sampleZoomToFeature,
          // mouseout: resetHighlight
        }),
        layer.bindTooltip(feature.properties.site, {
          className: 'feature-label',
          permanent: false,
          sticky: true,
          direction: 'auto'
        });
    }
    // 3.3 add these event the layer obejct.
    function weatherOnEachFeature(feature, layer) {
      layer.on({
          // mouseover: highlightFeature,
          // click: sampleZoomToFeature,
          // mouseout: resetHighlight
        }),
        layer.bindTooltip(feature.properties.site, {
          className: 'feature-label',
          permanent: false,
          sticky: true,
          direction: 'auto'
        });
    }

    // var county = new L.GeoJSON(datasets[1], {
    //   style: style,
    //   onEachFeature: onEachFeature
    // }).addTo(mymap);
    // mymap.fitBounds(county.getBounds());

    var sites = new L.GeoJSON(datasets[1], {
      style: style,
      onEachFeature: onEachFeature,
      // onEachFeature: function(feature, layer) {
      //   layer.bindPopup('<b>Site Name: </b>' + feature.properties.usgs_site)
      // },
      pointToLayer: function(feature, latlng) {
        return L.marker(latlng, {
          icon: L.divIcon({
            className: 'map fas fa-tachometer-alt blinking',
          })
        });
      },
    }).addTo(mymap);

    var sampleSites = new L.GeoJSON(datasets[3], {
      style: sampleStyle,
      onEachFeature: sampleOnEachFeature,
      // onEachFeature: function(feature, layer) {
      //   layer.bindPopup('<b>Site Name: </b>' + feature.properties.usgs_site)
      // },

      pointToLayer: function(feature, latlng) {
        return L.marker(latlng, {
          icon: L.divIcon({
            className: 'map fas fa-vials blinking',
          })
        });
      },
    });

    var weatherSites = new L.GeoJSON(datasets[8], {
      style: weatherStyle,
      onEachFeature: weatherOnEachFeature,
      // onEachFeature: function(feature, layer) {
      //   layer.bindPopup('<b>Site Name: </b>' + feature.properties.usgs_site)
      // },

      pointToLayer: function(feature, latlng) {
        return L.marker(latlng, {
          icon: L.divIcon({
            className: 'map fas fa-cloud-sun-rain blinking',
          })
        });
      },
    });




    $("#hint").on("click", function() {
      gage1Counts(gage1);
      chart.load({
        unload: true,
        columns: [t, gage1.wt],
      });
      chart2.load({
        unload: true,
        columns: [t, gage1.wt],
      });
      $("#gage-chart > svg > g:nth-child(2)").hide();
      $("#hint").text("Click on map to review county trend.");

    });


    function onMapClick(e) {
      $("#hint").click();
    }

    mymap.on('click', onMapClick);
    gage1Counts(gage1);
    sample1Counts(sampleLoc1);
    varsCounts(weatherVars);
    chartColor = 'white'

    // function annualUpdate(d) {
    //   var currentDate = new Date(d.x.toString());
    //   var currentYear = 2020;
    //   $("#year").text(d.x);
    //
    //   var start = currentYear.toString() + "-01-01";
    //   var end = currentYear.toString() + "-12-31";
    //
    //   var ticks = [];
    //   start = new Date(start.toString());
    //   end = new Date(end.toString());
    //
    //   s = start.getTime();
    //   e = end.getTime();
    //   breaks = 5;
    //   interval = Math.floor(e - s) / breaks
    //   ticks = [];
    //   for (var j = 0; j < breaks; j++) {
    //     ticks.push(new Date(s + interval * j))
    //   }
    //   ticks.push(end);
    //
    //   chart.internal.config.axis_x_tick_values = ticks;
    //   // chart.flush();
    //
    //
    //   chart.zoom([new Date(start.toString()), new Date(end.toString())]);
    // }

    var padTop = 10;
    var padRight = 30;
    // var padSide = 30;
    // gage chart



    // Stream gage charts
    // stream gage subchart
    chart = c3.generate({
      size: {
        height: 250,
      },
      data: {
        x: "Date",
        columns: [
          t, gage1.wtM2021, gage1.wtM2020
        ],
        // onmouseover: annualUpdate,
        type: 'spline',
      },
      // color: {
      //   pattern: [chartColor]
      // },
      subchart: {
        show: true,
        axis: {
          x: {
            show: false
          }
        },
        size: {
          height: 15
        },
        onbrush: function(d) {
          chart2.zoom(chart.zoom());
          h20SumChart.zoom(chart.zoom());
          dchMeanChart.zoom(chart.zoom());
          dchSumChart.zoom(chart.zoom());
        },
      },
      padding: {
        // bottom: 10,
        right: padRight,
        // left: padSide,
      },
      axis: {
        x: {
          type: "timeseries",
          tick: {
            format: "%b %d",
            centered: true,
            fit: true,
            count: 20
          }
        },
      },
      zoom: {
        // rescale: true,+
        enabled: true,
        type: "scroll",
        onzoom: function(d) {
          chart2.zoom(chart.zoom());
          h20SumChart.zoom(chart.zoom());
          dchMeanChart.zoom(chart.zoom());
          dchSumChart.zoom(chart.zoom());
        }
      },
      legend: {
        show: true,
        position: 'bottom',
        enabled: false,
      },
      line: {
        connectNull: true
      },
      bindto: "#gage-chart"
    });
    $("#gage-chart > svg > g:nth-child(2)").hide();
    var stroke2021 = chart.color('2021');
    $("#gage2021").css('color', stroke2021);
    var stroke2020 = chart.color('2020');
    $("#gage2020").css('color', stroke2020);
    // mean water temp
    chart2 = c3.generate({
      size: {
        height: 220,
      },
      data: {
        x: "Date",
        columns: [t, gage1.wtM2021, gage1.wtM2020],
        // onmouseover: annualUpdate,
        type: 'spline',
      },
      subchart: {
        show: false,
        axis: {
          x: {
            show: false
          }
        },
        size: {
          height: 15
        },
      },
      // color: {
      //   pattern: [chartColor]
      // },
      padding: {
        // bottom: 10,
        top: padTop,
        right: padRight,
        // left: padSide,
      },
      axis: {
        x: {
          type: "timeseries",
          tick: {
            format: "%b %d",
            centered: true,
            fit: true,
            count: 20
          }
        },
        y: {
          label: {
            text: 'mean water temp (deg C)',
            position: 'outer-middle'
          },
          min: 0,
          padding: {
            bottom: 0
          },
          type: 'linear',
          tick: {
            format: d3.format(".2s"),

            count: 5,
            // values: [0,5000,10000,15000]
          }
        }
      },
      point: {
        r: 0,
        focus: {
          expand: {
            r: 10
          }
        }
      },
      zoom: {
        // enabled: true,
        // type: "scroll",
        // onzoom: function(d) {
        //   chart.zoom(chart2.zoom());
        // }
      },
      tooltip: {
        linked: true,
      },
      legend: {
        show: false,
        position: 'inset',
        inset: {
          anchor: 'top-right',
          x: 20,
          y: 10,
          step: 11
        }
      },
      line: {
        connectNull: true
      },
      bindto: "#gage-chart2"
    });
    var h20SumChart = c3.generate({
      size: {
        height: 220,
      },
      data: {
        x: "Date",
        columns: [t, gage1.wtS2021, gage1.wtS2020],
        type: 'spline',
      },
      // color: {
      //   pattern: [chartColor]
      // },
      padding: {
        top: padTop,
        right: padRight,
        // left: padSide,
      },
      axis: {
        x: {
          type: "timeseries",
          tick: {
            format: "%b %d ",
            centered: true,
            fit: true,
            count: 20
          }
        },
        y: {
          label: {
            text: 'cumulative sum water temp (deg C)',
            position: 'outer-middle'
          },
          min: 0,
          padding: {
            bottom: 0
          },
          type: 'linear',
          tick: {
            format: d3.format(".2s"),

            count: 5,
            // values: [0,5000,10000,15000]
          }
        }
      },
      point: {
        r: 0,
        focus: {
          expand: {
            r: 10
          }
        }
      },
      // zoom: {
      //   enabled: {
      //     type: "drag"
      //   },
      // },
      tooltip: {
        linked: true,
      },
      legend: {
        show: false,
      },
      line: {
        connectNull: true
      },
      bindto: "#h20Sum-chart"
    });
    var dchMeanChart = c3.generate({
      size: {
        height: 220,
      },
      data: {
        x: "Date",
        columns: [t, gage1.dchM2021, gage1.dchM2020],
        type: 'spline',
      },
      // color: {
      //   pattern: [chartColor]
      // },
      padding: {
        top: padTop,
        right: padRight,
        // left: padSide,
      },
      axis: {
        x: {
          type: "timeseries",
          tick: {
            format: "%b %d ",
            centered: true,
            fit: true,
            count: 20
          }
        },
        y: {
          label: {
            text: 'mean water discharge (cu/sec)',
            position: 'outer-middle'
          },
          min: 0,
          padding: {
            bottom: 0
          },
          type: 'linear',
          tick: {
            format: d3.format(".2s"),

            count: 5,
            // values: [0,5000,10000,15000]
          }
        }
      },
      point: {
        r: 0,
        focus: {
          expand: {
            r: 10
          }
        }
      },
      // zoom: {
      //   enabled: {
      //     type: "drag"
      //   },
      // },
      tooltip: {
        linked: true,
      },
      legend: {
        show: false,
      },
      line: {
        connectNull: true
      },
      bindto: "#dchMean-chart"
    });
    var dchSumChart = c3.generate({
      size: {
        height: 220,
      },
      data: {
        x: "Date",
        columns: [wt2020, gage1.dchS2021, gage1.dchS2020],
        type: 'spline',
      },
      // color: {
      //   pattern: [chartColor]
      // },
      padding: {
        top: padTop,
        right: padRight,
        // left: padSide,
      },
      axis: {
        x: {
          type: "timeseries",
          tick: {
            format: "%b %d ",
            centered: true,
            fit: true,
            count: 20
          }
        },
        y: {
          label: {
            text: 'cumulative sum water discharge (cu/sec)',
            position: 'outer-middle'
          },
          min: 0,
          padding: {
            bottom: 0
          },
          type: 'linear',
          tick: {
            format: d3.format(".2s"),

            count: 5,
            // values: [0,5000,10000,15000]
          }
        }
      },
      point: {
        r: 0,
        focus: {
          expand: {
            r: 10
          }
        }
      },
      // zoom: {
      //   enabled: {
      //     type: "drag"
      //   },
      // },
      tooltip: {
        linked: true,
      },
      legend: {
        show: false,
      },
      line: {
        connectNull: true
      },
      bindto: "#dchSum-chart"
    });


    // sample algae chart
    sampleSubChart = c3.generate({
      size: {
        height: 250,

      },
      data: {
        x: "Date",
        columns: [wst2016, sampleLoc1.a2019, sampleLoc1.a2018],
        type: 'scatter',
      },
      color: {
        // pattern: [chartColor]
      },
      subchart: {
        show: true,
        axis: {
          x: {
            show: false
          }
        },
        size: {
          height: 15
        },
        onbrush: function(d) {
          sampleChart.zoom(sampleSubChart.zoom());
          toxinChart.zoom(sampleSubChart.zoom());
          nitrateChart.zoom(sampleSubChart.zoom());
        }
      },
      padding: {
        // bottom: 10,
        top: padTop,
        right: padRight,
        // left: padSide,
      },
      axis: {
        x: {
          type: "timeseries",
          tick: {
            format: "%b %d",
            centered: true,
            fit: true,
            count: 20
          }
        },
        y: {
          label: {
            text: 'Biovolume (um3\mL)',
            position: 'outer-middle'
          },
          min: 0,
          padding: {
            bottom: 0
          },
          type: 'linear',
          tick: {
            format: d3.format(".2s"),
            count: 5,
          }
        }
      },
      point: {
        r: 3,
        focus: {
          expand: {
            r: 10
          }
        }
      },
      zoom: {
        // rescale: true,+
        enabled: true,
        type: "scroll",
        onzoom: function(d) {
          sampleChart.zoom(sampleSubChart.zoom());
          toxinChart.zoom(sampleSubChart.zoom());
          nitrateChart.zoom(sampleSubChart.zoom());
        }
      },
      tooltip: {
        linked: true,
      },
      legend: {
        enabled: false,
      },
      line: {
        connectNull: true
      },
      bindto: "#sampleSub-chart"
    });
    $("#sampleSub-chart > svg > g:nth-child(2)").hide();
    var stroke2019 = sampleSubChart.color('2019');
    $("#sample2019").css('color', stroke2019);
    var stroke2018 = sampleSubChart.color('2018');
    $("#sample2018").css('color', stroke2018);
    // sample algae chart
    sampleChart = c3.generate({
      size: {
        height: 220,

      },
      data: {
        x: "Date",
        columns: [wst2016, sampleLoc1.a2019, sampleLoc1.a2018],
        type: 'scatter',
      },
      color: {
        // pattern: [chartColor]
      },
      // subchart: {
      //   show: true,
      //   axis: {
      //     x: {
      //       show: false
      //     }
      //   },
      //   size: {
      //     height: 15
      //   },
      //   onbrush: function(d) {
      //     toxinChart.zoom(sampleChart.zoom());
      //     nitrateChart.zoom(sampleChart.zoom());
      //   }
      // },
      padding: {
        // bottom: 10,
        top: padTop,
        right: padRight,
        // left: padSide,
      },
      axis: {
        x: {
          type: "timeseries",
          tick: {
            format: "%b %d",
            centered: true,
            fit: true,
            count: 20
          }
        },
        y: {
          label: {
            text: 'Biovolume (um3\mL)',
            position: 'outer-middle'
          },
          min: 0,
          padding: {
            bottom: 0
          },
          type: 'linear',
          tick: {
            format: d3.format(".2s"),
            count: 5,
          }
        }
      },
      point: {
        r: 7,
        focus: {
          expand: {
            enabled: true
          }
        }
      },
      // zoom: {
      //   // rescale: true,+
      //   enabled: true,
      //   type: "scroll",
      //   onzoom: function(d) {
      //     toxinChart.zoom(sampleChart.zoom());
      //     nitrateChart.zoom(sampleChart.zoom());
      //   }
      // },
      tooltip: {
        linked: true,
      },
      legend: {
        show: false,
      },
      line: {
        connectNull: true
      },
      bindto: "#sample-chart"
    });
    // toxin chart
    toxinChart = c3.generate({
      size: {
        height: 220,

      },
      data: {
        x: "Date",
        columns: [wst2016, sampleLoc1.t2019, sampleLoc1.t2018],
        type: 'scatter',
      },
      // color: {
      //   pattern: [chartColor]
      // },
      padding: {
        top: padTop,
        right: padRight,
        // left: padSide,
      },
      axis: {
        x: {
          type: "timeseries",
          tick: {
            format: "%b %d",
            centered: true,
            fit: true,
            count: 20
          }
        },
        y: {
          label: {
            text: 'Microcystin observed (ppb)',
            position: 'outer-middle'
          },
          min: 0,
          padding: {
            bottom: 0
          },
          type: 'linear',
          // tick: {
          //   format: d3.format(".2s"),
          //   count: 5,
          // }
        }
      },
      point: {
        r: 7,
        focus: {
          expand: {
            enabled: true
          }
        }
      },
      // zoom: {
      //   enabled: true,
      //   type: "scroll",
      // },
      tooltip: {
        linked: true,
      },
      legend: {
        show: false,
      },
      line: {
        connectNull: true
      },
      bindto: "#toxin-chart"
    });
    // toxin chart
    nitrateChart = c3.generate({
      size: {
        height: 220,
      },
      data: {
        x: "Date",
        columns: [wst2016, sampleLoc1.n2019, sampleLoc1.n2018],
        type: 'scatter',
      },
      // color: {
      //   pattern: [chartColor]
      // },
      padding: {
        top: padTop,
        right: padRight,
        // left: padSide,
      },
      axis: {
        x: {
          type: "timeseries",
          tick: {
            format: "%b %d",
            centered: true,
            fit: true,
            count: 20
          }
        },
        y: {
          label: {
            text: 'Total nitrates observed (mg/L)',
            position: 'outer-middle'
          },
          min: 0,
          padding: {
            bottom: 0
          },
          type: 'linear',
          // tick: {
          //   format: d3.format(".2s"),
          //   count: 5,
          // }
        }
      },
      point: {
        r: 7,
        focus: {
          expand: {
            enabled: true
          }
        }
      },
      // zoom: {
      //   enabled: true,
      //   type: "scroll",
      // },
      tooltip: {
        linked: true,
      },
      legend: {
        show: false,
      },
      line: {
        connectNull: true
      },
      bindto: "#nitrate-chart"
    });
    // weather chart
    precipSubChart = c3.generate({
      size: {
        height: 250,

      },
      data: {
        x: "Date",
        columns: [wt2020, weatherVars.pcM2021, weatherVars.pcM2020],
        type: 'spline',
      },
      // color: {
      //   pattern: [chartColor]
      // },
      subchart: {
        show: true,
        axis: {
          x: {
            show: false
          }
        },
        size: {
          height: 15
        },
        onbrush: function(d) {
          precipChart.zoom(precipSubChart.zoom());
          aitTempChart.zoom(precipSubChart.zoom());
          precipSumChart.zoom(precipSubChart.zoom());
          aitTempSumChart.zoom(precipSubChart.zoom());
        },
      },

      padding: {
        top: padTop,
        right: padRight,
        // left: padSide,
      },
      axis: {
        x: {
          type: "timeseries",
          tick: {
            format: "%b %d",
            centered: true,
            fit: true,
            count: 20
          }
        },
        y: {
          label: {
            text: 'Avg. precipitation (mL)',
            position: 'outer-middle'
          },
          min: 0,
          padding: {
            bottom: 0
          },
          type: 'linear',
          tick: {
            format: d3.format(".2s"),

            count: 5,
            // values: [0,5000,10000,15000]
          }
        }
      },
      point: {
        r: 0,
        focus: {
          expand: {
            r: 10
          }
        }
      },
      zoom: {
        // rescale: true,+
        enabled: true,
        type: "scroll",
        onzoom: function(d) {
          precipChart.zoom(precipSubChart.zoom());
          aitTempChart.zoom(precipSubChart.zoom());
          precipSumChart.zoom(precipSubChart.zoom());
          aitTempSumChart.zoom(precipSubChart.zoom());
        }
      },
      tooltip: {
        linked: true,
      },
      legend: {
        enabled: false,
      },
      line: {
        connectNull: true
      },
      bindto: "#precipSub-chart"
    });
    $("#precipSub-chart > svg > g:nth-child(2)").hide();
    var stroke2021 = chart.color('2021');
    $("#weather2021").css('color', stroke2021);
    var stroke2020 = chart.color('2020');
    $("#weather2020").css('color', stroke2020);
    // weather chart
    precipChart = c3.generate({
      size: {
        height: 220,

      },
      data: {
        x: "Date",
        columns: [wt2020, weatherVars.pcM2021, weatherVars.pcM2020],
        type: 'spline',
      },

      padding: {
        top: padTop,
        right: padRight,
        // left: padSide,
      },
      axis: {
        x: {
          type: "timeseries",
          tick: {
            format: "%b %d",
            centered: true,
            fit: true,
            count: 20
          }
        },
        y: {
          label: {
            text: 'Avg. precipitation (mL)',
            position: 'outer-middle'
          },
          min: 0,
          padding: {
            bottom: 0
          },
          type: 'linear',
          tick: {
            format: d3.format(".2s"),

            count: 5,
            // values: [0,5000,10000,15000]
          }
        }
      },
      point: {
        r: 0,
        focus: {
          expand: {
            r: 10
          }
        }
      },
      // zoom: {
      //   // rescale: true,+
      //   enabled: true,
      //   type: "scroll",
      //   onzoom: function(d) {
      //     aitTempChart.zoom(precipChart.zoom());
      //     // step();
      //   }
      // },
      tooltip: {
        linked: true,
      },
      legend: {
        show: false,
      },
      line: {
        connectNull: true
      },
      bindto: "#precip-chart"
    });
    // Air Temp Chart
    aitTempChart = c3.generate({
      size: {
        height: 220,
      },
      data: {
        x: "Date",
        columns: [wt2020, weatherVars.atempM2021, weatherVars.atempM2020],
        type: 'spline',
      },
      // color: {
      //   pattern: [chartColor]
      // },
      padding: {
        top: padTop,
        right: padRight,
        // left: padSide,
      },
      axis: {
        x: {
          type: "timeseries",
          tick: {
            format: "%b %d ",
            centered: true,
            fit: true,
            count: 20
          }
        },
        y: {
          label: {
            text: 'Avg. air temp (deg C)',
            position: 'outer-middle'
          },
          min: 0,
          padding: {
            bottom: 0
          },
          type: 'linear',
          tick: {
            format: d3.format(".2s"),

            count: 5,
            // values: [0,5000,10000,15000]
          }
        }
      },
      point: {
        r: 0,
        focus: {
          expand: {
            r: 10
          }
        }
      },
      // zoom: {
      //   enabled: {
      //     type: "drag"
      //   },
      // },
      tooltip: {
        linked: true,
      },
      legend: {
        show: false,
      },
      line: {
        connectNull: true
      },
      bindto: "#airTemp-chart"
    });
    precipSumChart = c3.generate({
      size: {
        height: 220,
      },
      data: {
        x: "Date",
        columns: [wt2020, weatherVars.pcS2021, weatherVars.pcS2020],
        type: 'spline',
      },
      // color: {
      //   pattern: [chartColor]
      // },
      padding: {
        top: padTop,
        right: padRight,
        // left: padSide,
      },
      axis: {
        x: {
          type: "timeseries",
          tick: {
            format: "%b %d ",
            centered: true,
            fit: true,
            count: 20
          }
        },
        y: {
          label: {
            text: 'cumulative sum of mean precip. (deg C)',
            position: 'outer-middle'
          },
          min: 0,
          padding: {
            bottom: 0
          },
          type: 'linear',
          tick: {
            format: d3.format(".2s"),

            count: 5,
            // values: [0,5000,10000,15000]
          }
        }
      },
      point: {
        r: 0,
        focus: {
          expand: {
            r: 10
          }
        }
      },
      // zoom: {
      //   enabled: {
      //     type: "drag"
      //   },
      // },
      tooltip: {
        linked: true,
      },
      legend: {
        show: false,
      },
      line: {
        connectNull: true
      },
      bindto: "#precipSum-chart"
    });
    aitTempSumChart = c3.generate({
      size: {
        height: 220,
      },
      data: {
        x: "Date",
        columns: [wt2020, weatherVars.atempS2021, weatherVars.atempS2020],
        type: 'spline',
      },
      // color: {
      //   pattern: [chartColor]
      // },
      padding: {
        top: padTop,
        right: padRight,
        // left: padSide,
      },
      axis: {
        x: {
          type: "timeseries",
          tick: {
            format: "%b %d ",
            centered: true,
            fit: true,
            count: 20
          }
        },
        y: {
          label: {
            text: 'cumulative sum of mean air temp. (mL)',
            position: 'outer-middle'
          },
          min: 0,
          padding: {
            bottom: 0
          },
          type: 'linear',
          tick: {
            format: d3.format(".2s"),

            count: 5,
            // values: [0,5000,10000,15000]
          }
        }
      },
      point: {
        r: 0,
        focus: {
          expand: {
            r: 10
          }
        }
      },
      // zoom: {
      //   enabled: {
      //     type: "drag"
      //   },
      // },
      tooltip: {
        linked: true,
      },
      legend: {
        show: false,
      },
      line: {
        connectNull: true
      },
      bindto: "#airTempSum-chart"
    });


    // Tab Interactions
    $("#weather-tab").on("click", function() {
      // Remove Map Layers
      mymap.removeLayer(sites);
      mymap.removeLayer(sampleSites);
      mymap.removeLayer(weatherSites);
      // Add selected geo layer for selected year
      mymap.addLayer(weatherSites);
      mymap.fitBounds(lakeBoundsClosedMini);
    });
    $("#stream-tab").on("click", function() {
      // Remove Map Layers
      mymap.removeLayer(sites);
      mymap.removeLayer(sampleSites);
      mymap.removeLayer(weatherSites);
      // Add selected geo layer for selected year
      mymap.addLayer(sites);
      mymap.fitBounds(lakeBoundsClosedMini)
    });
    $("#sample-tab").on("click", function() {
      // Remove Map Layers
      mymap.removeLayer(sites);
      mymap.removeLayer(sampleSites);
      mymap.removeLayer(weatherSites);
      // Add selected geo layer for selected year
      mymap.addLayer(sampleSites);
      mymap.fitBounds(lakeBoundsClosedMini)
    });

    // Stream Gage Year Selection
    $("#gage2021").on("click", function() {
      color2021 = $("#gage2021").css('color');
      if (color2021 == 'rgb(255, 255, 255)') {
        var t = ["Date"];
        var t2020 = ["Date"];
        var t2021 = ["Date"];
        var water_temp = ["Water Temperature"];
        var water_temp2020 = ["2020"];
        var water_temp2021 = ["2021"];
        streamGage1Data2021 = [];
        streamGage1Data2021wtMean = ["2021"];
        streamGage1Data2021wtSum = ["2021"];
        streamGage1Data2021dchMean = ["2021"];
        streamGage1Data2021dchSum = ["2021"];
        streamGage1Data2020 = [];
        streamGage1Data2020wtMean = ["2020"];
        streamGage1Data2020wtSum = ["2020"];
        streamGage1Data2020dchMean = ["2020"];
        streamGage1Data2020dchSum = ["2020"];
        streamGage1Data2019 = [];
        streamGage1Data2019wtMean = ["2019"];
        streamGage1Data2019wtSum = ["2019"];
        streamGage1Data2019dchMean = ["2019"];
        streamGage1Data2019dchSum = ["2019"];
        streamGage1Data2018 = [];
        streamGage1Data2018wtMean = ["2018"];
        streamGage1Data2018wtSum = ["2018"];
        streamGage1Data2018dchMean = ["2018"];
        streamGage1Data2018dchSum = ["2018"];
        streamGage1Data2017 = [];
        streamGage1Data2017wtMean = ["2017"];
        streamGage1Data2017wtSum = ["2017"];
        streamGage1Data2017dchMean = ["2017"];
        streamGage1Data2017dchSum = ["2017"];
        streamGage1Data2016 = [];
        streamGage1Data2016wtMean = ["2016"];
        streamGage1Data2016wtSum = ["2016"];
        streamGage1Data2016dchMean = ["2016"];
        streamGage1Data2016dchSum = ["2016"];
        streamGage1Data2015 = [];
        streamGage1Data2015wtMean = ["2015"];
        streamGage1Data2015wtSum = ["2015"];
        streamGage1Data2015dchMean = ["2015"];
        streamGage1Data2015dchSum = ["2015"];
        streamGage1Data2014 = [];
        streamGage1Data2014wtMean = ["2014"];
        streamGage1Data2014wtSum = ["2014"];
        streamGage1Data2014dchMean = ["2014"];
        streamGage1Data2014dchSum = ["2014"];
        streamGage1Data2013 = [];
        streamGage1Data2013wtMean = ["2013"];
        streamGage1Data2013wtSum = ["2013"];
        streamGage1Data2013dchMean = ["2013"];
        streamGage1Data2013dchSum = ["2013"];
        streamGage1Data2012 = [];
        streamGage1Data2012wtMean = ["2012"];
        streamGage1Data2012wtSum = ["2012"];
        streamGage1Data2012dchMean = ["2012"];
        streamGage1Data2012dchSum = ["2012"];
        streamGage1Data2011 = [];
        streamGage1Data2011wtMean = ["2011"];
        streamGage1Data2011wtSum = ["2011"];
        streamGage1Data2011dchMean = ["2011"];
        streamGage1Data2011dchSum = ["2011"];
        streamGage1Data2010 = [];
        streamGage1Data2010wtMean = ["2010"];
        streamGage1Data2010wtSum = ["2010"];
        streamGage1Data2010dchMean = ["2010"];
        streamGage1Data2010dchSum = ["2010"];

        var siteSelect = {
          name: gageID,
          wt: water_temp,
          wt2020: water_temp2020,
          wt2021: water_temp2021,
          wtM2021: streamGage1Data2021wtMean,
          wtS2021: streamGage1Data2021wtSum,
          dchM2021: streamGage1Data2021dchMean,
          dchS2021: streamGage1Data2021dchSum,
          wtM2020: streamGage1Data2020wtMean,
          wtS2020: streamGage1Data2020wtSum,
          dchM2020: streamGage1Data2020dchMean,
          dchS2020: streamGage1Data2020dchSum,
          wtM2019: streamGage1Data2019wtMean,
          wtS2019: streamGage1Data2019wtSum,
          dchM2019: streamGage1Data2019dchMean,
          dchS2019: streamGage1Data2019dchSum,
          wtM2018: streamGage1Data2018wtMean,
          wtS2018: streamGage1Data2018wtSum,
          dchM2018: streamGage1Data2018dchMean,
          dchS2018: streamGage1Data2018dchSum,
          wtM2017: streamGage1Data2017wtMean,
          wtS2017: streamGage1Data2017wtSum,
          dchM2017: streamGage1Data2017dchMean,
          dchS2017: streamGage1Data2017dchSum,
          wtM2016: streamGage1Data2016wtMean,
          wtS2016: streamGage1Data2016wtSum,
          dchM2016: streamGage1Data2016dchMean,
          dchS2016: streamGage1Data2016dchSum,
          wtM2015: streamGage1Data2015wtMean,
          wtS2015: streamGage1Data2015wtSum,
          dchM2015: streamGage1Data2015dchMean,
          dchS2015: streamGage1Data2015dchSum,
          wtM2014: streamGage1Data2014wtMean,
          wtS2014: streamGage1Data2014wtSum,
          dchM2014: streamGage1Data2014dchMean,
          dchS2014: streamGage1Data2014dchSum,
          wtM2013: streamGage1Data2013wtMean,
          wtS2013: streamGage1Data2013wtSum,
          dchM2013: streamGage1Data2013dchMean,
          dchS2013: streamGage1Data2013dchSum,
          wtM2012: streamGage1Data2012wtMean,
          wtS2012: streamGage1Data2012wtSum,
          dchM2012: streamGage1Data2012dchMean,
          dchS2012: streamGage1Data2012dchSum,
          wtM2011: streamGage1Data2011wtMean,
          wtS2011: streamGage1Data2011wtSum,
          dchM2011: streamGage1Data2011dchMean,
          dchS2011: streamGage1Data2011dchSum,
          wtM2010: streamGage1Data2010wtMean,
          wtS2010: streamGage1Data2010wtSum,
          dchM2010: streamGage1Data2010dchMean,
          dchS2010: streamGage1Data2010dchSum,
        }

        siteCounts(siteSelect);


        chart.load({
          columns: [siteSelect.wtM2021],
        });
        chart2.load({
          columns: [siteSelect.wtM2021],
        });
        h20SumChart.load({
          columns: [siteSelect.wtS2021],
        });
        dchMeanChart.load({
          columns: [siteSelect.dchM2021],
        });
        dchSumChart.load({
          columns: [siteSelect.dchS2021],
        });
        var stroke = chart.color('2021');
        $("#gage2021").css('color', stroke);

      } else {
        chart.unload({
          ids: ["2021"],
        });
        chart2.unload({
          ids: ["2021"],
        });
        h20SumChart.unload({
          ids: ["2021"],
        });
        dchMeanChart.unload({
          ids: ["2021"],
        });
        dchSumChart.unload({
          ids: ["2021"],
        });
        $("#gage2021").css('color', 'white');

      }

    });


    $("#gage2020").on("click", function() {
      color2020 = $("#gage2020").css('color');
      if (color2020 == 'rgb(255, 255, 255)') {
        var t = ["Date"];
        var t2020 = ["Date"];
        var t2021 = ["Date"];
        var water_temp = ["Water Temperature"];
        var water_temp2020 = ["2020"];
        var water_temp2021 = ["2021"];
        streamGage1Data2021 = [];
        streamGage1Data2021wtMean = ["2021"];
        streamGage1Data2021wtSum = ["2021"];
        streamGage1Data2021dchMean = ["2021"];
        streamGage1Data2021dchSum = ["2021"];
        streamGage1Data2020 = [];
        streamGage1Data2020wtMean = ["2020"];
        streamGage1Data2020wtSum = ["2020"];
        streamGage1Data2020dchMean = ["2020"];
        streamGage1Data2020dchSum = ["2020"];
        streamGage1Data2019 = [];
        streamGage1Data2019wtMean = ["2019"];
        streamGage1Data2019wtSum = ["2019"];
        streamGage1Data2019dchMean = ["2019"];
        streamGage1Data2019dchSum = ["2019"];
        streamGage1Data2018 = [];
        streamGage1Data2018wtMean = ["2018"];
        streamGage1Data2018wtSum = ["2018"];
        streamGage1Data2018dchMean = ["2018"];
        streamGage1Data2018dchSum = ["2018"];
        streamGage1Data2017 = [];
        streamGage1Data2017wtMean = ["2017"];
        streamGage1Data2017wtSum = ["2017"];
        streamGage1Data2017dchMean = ["2017"];
        streamGage1Data2017dchSum = ["2017"];
        streamGage1Data2016 = [];
        streamGage1Data2016wtMean = ["2016"];
        streamGage1Data2016wtSum = ["2016"];
        streamGage1Data2016dchMean = ["2016"];
        streamGage1Data2016dchSum = ["2016"];
        streamGage1Data2015 = [];
        streamGage1Data2015wtMean = ["2015"];
        streamGage1Data2015wtSum = ["2015"];
        streamGage1Data2015dchMean = ["2015"];
        streamGage1Data2015dchSum = ["2015"];
        streamGage1Data2014 = [];
        streamGage1Data2014wtMean = ["2014"];
        streamGage1Data2014wtSum = ["2014"];
        streamGage1Data2014dchMean = ["2014"];
        streamGage1Data2014dchSum = ["2014"];
        streamGage1Data2013 = [];
        streamGage1Data2013wtMean = ["2013"];
        streamGage1Data2013wtSum = ["2013"];
        streamGage1Data2013dchMean = ["2013"];
        streamGage1Data2013dchSum = ["2013"];
        streamGage1Data2012 = [];
        streamGage1Data2012wtMean = ["2012"];
        streamGage1Data2012wtSum = ["2012"];
        streamGage1Data2012dchMean = ["2012"];
        streamGage1Data2012dchSum = ["2012"];
        streamGage1Data2011 = [];
        streamGage1Data2011wtMean = ["2011"];
        streamGage1Data2011wtSum = ["2011"];
        streamGage1Data2011dchMean = ["2011"];
        streamGage1Data2011dchSum = ["2011"];
        streamGage1Data2010 = [];
        streamGage1Data2010wtMean = ["2010"];
        streamGage1Data2010wtSum = ["2010"];
        streamGage1Data2010dchMean = ["2010"];
        streamGage1Data2010dchSum = ["2010"];

        var siteSelect = {
          name: gageID,
          wt: water_temp,
          wt2020: water_temp2020,
          wt2021: water_temp2021,
          wtM2021: streamGage1Data2021wtMean,
          wtS2021: streamGage1Data2021wtSum,
          dchM2021: streamGage1Data2021dchMean,
          dchS2021: streamGage1Data2021dchSum,
          wtM2020: streamGage1Data2020wtMean,
          wtS2020: streamGage1Data2020wtSum,
          dchM2020: streamGage1Data2020dchMean,
          dchS2020: streamGage1Data2020dchSum,
          wtM2019: streamGage1Data2019wtMean,
          wtS2019: streamGage1Data2019wtSum,
          dchM2019: streamGage1Data2019dchMean,
          dchS2019: streamGage1Data2019dchSum,
          wtM2018: streamGage1Data2018wtMean,
          wtS2018: streamGage1Data2018wtSum,
          dchM2018: streamGage1Data2018dchMean,
          dchS2018: streamGage1Data2018dchSum,
          wtM2017: streamGage1Data2017wtMean,
          wtS2017: streamGage1Data2017wtSum,
          dchM2017: streamGage1Data2017dchMean,
          dchS2017: streamGage1Data2017dchSum,
          wtM2016: streamGage1Data2016wtMean,
          wtS2016: streamGage1Data2016wtSum,
          dchM2016: streamGage1Data2016dchMean,
          dchS2016: streamGage1Data2016dchSum,
          wtM2015: streamGage1Data2015wtMean,
          wtS2015: streamGage1Data2015wtSum,
          dchM2015: streamGage1Data2015dchMean,
          dchS2015: streamGage1Data2015dchSum,
          wtM2014: streamGage1Data2014wtMean,
          wtS2014: streamGage1Data2014wtSum,
          dchM2014: streamGage1Data2014dchMean,
          dchS2014: streamGage1Data2014dchSum,
          wtM2013: streamGage1Data2013wtMean,
          wtS2013: streamGage1Data2013wtSum,
          dchM2013: streamGage1Data2013dchMean,
          dchS2013: streamGage1Data2013dchSum,
          wtM2012: streamGage1Data2012wtMean,
          wtS2012: streamGage1Data2012wtSum,
          dchM2012: streamGage1Data2012dchMean,
          dchS2012: streamGage1Data2012dchSum,
          wtM2011: streamGage1Data2011wtMean,
          wtS2011: streamGage1Data2011wtSum,
          dchM2011: streamGage1Data2011dchMean,
          dchS2011: streamGage1Data2011dchSum,
          wtM2010: streamGage1Data2010wtMean,
          wtS2010: streamGage1Data2010wtSum,
          dchM2010: streamGage1Data2010dchMean,
          dchS2010: streamGage1Data2010dchSum,
        }

        siteCounts(siteSelect);


        chart.load({
          columns: [siteSelect.wtM2020],
        });
        chart2.load({
          columns: [siteSelect.wtM2020],
        });
        h20SumChart.load({
          columns: [siteSelect.wtS2020],
        });
        dchMeanChart.load({
          columns: [siteSelect.dchM2020],
        });
        dchSumChart.load({
          columns: [siteSelect.dchS2020],
        });
        var stroke = chart.color('2020');
        $("#gage2020").css('color', stroke);

      } else {
        chart.unload({
          ids: ["2020"],
        });
        chart2.unload({
          ids: ["2020"],
        });
        h20SumChart.unload({
          ids: ["2020"],
        });
        dchMeanChart.unload({
          ids: ["2020"],
        });
        dchSumChart.unload({
          ids: ["2020"],
        });
        $("#gage2020").css('color', 'white');

      }

    });
    $("#gage2019").on("click", function() {
      color2019 = $("#gage2019").css('color');
      if (color2019 == 'rgb(255, 255, 255)') {
        var t = ["Date"];
        var t2020 = ["Date"];
        var t2021 = ["Date"];
        var water_temp = ["Water Temperature"];
        var water_temp2020 = ["2020"];
        var water_temp2021 = ["2021"];
        streamGage1Data2021 = [];
        streamGage1Data2021wtMean = ["2021"];
        streamGage1Data2021wtSum = ["2021"];
        streamGage1Data2021dchMean = ["2021"];
        streamGage1Data2021dchSum = ["2021"];
        streamGage1Data2020 = [];
        streamGage1Data2020wtMean = ["2020"];
        streamGage1Data2020wtSum = ["2020"];
        streamGage1Data2020dchMean = ["2020"];
        streamGage1Data2020dchSum = ["2020"];
        streamGage1Data2019 = [];
        streamGage1Data2019wtMean = ["2019"];
        streamGage1Data2019wtSum = ["2019"];
        streamGage1Data2019dchMean = ["2019"];
        streamGage1Data2019dchSum = ["2019"];
        streamGage1Data2018 = [];
        streamGage1Data2018wtMean = ["2018"];
        streamGage1Data2018wtSum = ["2018"];
        streamGage1Data2018dchMean = ["2018"];
        streamGage1Data2018dchSum = ["2018"];
        streamGage1Data2017 = [];
        streamGage1Data2017wtMean = ["2017"];
        streamGage1Data2017wtSum = ["2017"];
        streamGage1Data2017dchMean = ["2017"];
        streamGage1Data2017dchSum = ["2017"];
        streamGage1Data2016 = [];
        streamGage1Data2016wtMean = ["2016"];
        streamGage1Data2016wtSum = ["2016"];
        streamGage1Data2016dchMean = ["2016"];
        streamGage1Data2016dchSum = ["2016"];
        streamGage1Data2015 = [];
        streamGage1Data2015wtMean = ["2015"];
        streamGage1Data2015wtSum = ["2015"];
        streamGage1Data2015dchMean = ["2015"];
        streamGage1Data2015dchSum = ["2015"];
        streamGage1Data2014 = [];
        streamGage1Data2014wtMean = ["2014"];
        streamGage1Data2014wtSum = ["2014"];
        streamGage1Data2014dchMean = ["2014"];
        streamGage1Data2014dchSum = ["2014"];
        streamGage1Data2013 = [];
        streamGage1Data2013wtMean = ["2013"];
        streamGage1Data2013wtSum = ["2013"];
        streamGage1Data2013dchMean = ["2013"];
        streamGage1Data2013dchSum = ["2013"];
        streamGage1Data2012 = [];
        streamGage1Data2012wtMean = ["2012"];
        streamGage1Data2012wtSum = ["2012"];
        streamGage1Data2012dchMean = ["2012"];
        streamGage1Data2012dchSum = ["2012"];
        streamGage1Data2011 = [];
        streamGage1Data2011wtMean = ["2011"];
        streamGage1Data2011wtSum = ["2011"];
        streamGage1Data2011dchMean = ["2011"];
        streamGage1Data2011dchSum = ["2011"];
        streamGage1Data2010 = [];
        streamGage1Data2010wtMean = ["2010"];
        streamGage1Data2010wtSum = ["2010"];
        streamGage1Data2010dchMean = ["2010"];
        streamGage1Data2010dchSum = ["2010"];

        var siteSelect = {
          name: gageID,
          wt: water_temp,
          wt2020: water_temp2020,
          wt2021: water_temp2021,
          wtM2021: streamGage1Data2021wtMean,
          wtS2021: streamGage1Data2021wtSum,
          dchM2021: streamGage1Data2021dchMean,
          dchS2021: streamGage1Data2021dchSum,
          wtM2020: streamGage1Data2020wtMean,
          wtS2020: streamGage1Data2020wtSum,
          dchM2020: streamGage1Data2020dchMean,
          dchS2020: streamGage1Data2020dchSum,
          wtM2019: streamGage1Data2019wtMean,
          wtS2019: streamGage1Data2019wtSum,
          dchM2019: streamGage1Data2019dchMean,
          dchS2019: streamGage1Data2019dchSum,
          wtM2018: streamGage1Data2018wtMean,
          wtS2018: streamGage1Data2018wtSum,
          dchM2018: streamGage1Data2018dchMean,
          dchS2018: streamGage1Data2018dchSum,
          wtM2017: streamGage1Data2017wtMean,
          wtS2017: streamGage1Data2017wtSum,
          dchM2017: streamGage1Data2017dchMean,
          dchS2017: streamGage1Data2017dchSum,
          wtM2016: streamGage1Data2016wtMean,
          wtS2016: streamGage1Data2016wtSum,
          dchM2016: streamGage1Data2016dchMean,
          dchS2016: streamGage1Data2016dchSum,
          wtM2015: streamGage1Data2015wtMean,
          wtS2015: streamGage1Data2015wtSum,
          dchM2015: streamGage1Data2015dchMean,
          dchS2015: streamGage1Data2015dchSum,
          wtM2014: streamGage1Data2014wtMean,
          wtS2014: streamGage1Data2014wtSum,
          dchM2014: streamGage1Data2014dchMean,
          dchS2014: streamGage1Data2014dchSum,
          wtM2013: streamGage1Data2013wtMean,
          wtS2013: streamGage1Data2013wtSum,
          dchM2013: streamGage1Data2013dchMean,
          dchS2013: streamGage1Data2013dchSum,
          wtM2012: streamGage1Data2012wtMean,
          wtS2012: streamGage1Data2012wtSum,
          dchM2012: streamGage1Data2012dchMean,
          dchS2012: streamGage1Data2012dchSum,
          wtM2011: streamGage1Data2011wtMean,
          wtS2011: streamGage1Data2011wtSum,
          dchM2011: streamGage1Data2011dchMean,
          dchS2011: streamGage1Data2011dchSum,
          wtM2010: streamGage1Data2010wtMean,
          wtS2010: streamGage1Data2010wtSum,
          dchM2010: streamGage1Data2010dchMean,
          dchS2010: streamGage1Data2010dchSum,
        }

        siteCounts(siteSelect);


        chart.load({
          columns: [siteSelect.wtM2019],
        });
        chart2.load({
          columns: [siteSelect.wtM2019],
        });
        h20SumChart.load({
          columns: [siteSelect.wtS2019],
        });
        dchMeanChart.load({
          columns: [siteSelect.dchM2019],
        });
        dchSumChart.load({
          columns: [siteSelect.dchS2019],
        });
        var stroke = chart.color('2019');
        $("#gage2019").css('color', stroke);

      } else {
        chart.unload({
          ids: ["2019"],
        });
        chart2.unload({
          ids: ["2019"],
        });
        h20SumChart.unload({
          ids: ["2019"],
        });
        dchMeanChart.unload({
          ids: ["2019"],
        });
        dchSumChart.unload({
          ids: ["2019"],
        });
        $("#gage2019").css('color', 'white');

      }

    });
    $("#gage2018").on("click", function() {
      color2018 = $("#gage2018").css('color');
      if (color2018 == 'rgb(255, 255, 255)') {
        var t = ["Date"];
        var t2020 = ["Date"];
        var t2021 = ["Date"];
        var water_temp = ["Water Temperature"];
        var water_temp2020 = ["2020"];
        var water_temp2021 = ["2021"];
        streamGage1Data2021 = [];
        streamGage1Data2021wtMean = ["2021"];
        streamGage1Data2021wtSum = ["2021"];
        streamGage1Data2021dchMean = ["2021"];
        streamGage1Data2021dchSum = ["2021"];
        streamGage1Data2020 = [];
        streamGage1Data2020wtMean = ["2020"];
        streamGage1Data2020wtSum = ["2020"];
        streamGage1Data2020dchMean = ["2020"];
        streamGage1Data2020dchSum = ["2020"];
        streamGage1Data2019 = [];
        streamGage1Data2019wtMean = ["2019"];
        streamGage1Data2019wtSum = ["2019"];
        streamGage1Data2019dchMean = ["2019"];
        streamGage1Data2019dchSum = ["2019"];
        streamGage1Data2018 = [];
        streamGage1Data2018wtMean = ["2018"];
        streamGage1Data2018wtSum = ["2018"];
        streamGage1Data2018dchMean = ["2018"];
        streamGage1Data2018dchSum = ["2018"];
        streamGage1Data2017 = [];
        streamGage1Data2017wtMean = ["2017"];
        streamGage1Data2017wtSum = ["2017"];
        streamGage1Data2017dchMean = ["2017"];
        streamGage1Data2017dchSum = ["2017"];
        streamGage1Data2016 = [];
        streamGage1Data2016wtMean = ["2016"];
        streamGage1Data2016wtSum = ["2016"];
        streamGage1Data2016dchMean = ["2016"];
        streamGage1Data2016dchSum = ["2016"];
        streamGage1Data2015 = [];
        streamGage1Data2015wtMean = ["2015"];
        streamGage1Data2015wtSum = ["2015"];
        streamGage1Data2015dchMean = ["2015"];
        streamGage1Data2015dchSum = ["2015"];
        streamGage1Data2014 = [];
        streamGage1Data2014wtMean = ["2014"];
        streamGage1Data2014wtSum = ["2014"];
        streamGage1Data2014dchMean = ["2014"];
        streamGage1Data2014dchSum = ["2014"];
        streamGage1Data2013 = [];
        streamGage1Data2013wtMean = ["2013"];
        streamGage1Data2013wtSum = ["2013"];
        streamGage1Data2013dchMean = ["2013"];
        streamGage1Data2013dchSum = ["2013"];
        streamGage1Data2012 = [];
        streamGage1Data2012wtMean = ["2012"];
        streamGage1Data2012wtSum = ["2012"];
        streamGage1Data2012dchMean = ["2012"];
        streamGage1Data2012dchSum = ["2012"];
        streamGage1Data2011 = [];
        streamGage1Data2011wtMean = ["2011"];
        streamGage1Data2011wtSum = ["2011"];
        streamGage1Data2011dchMean = ["2011"];
        streamGage1Data2011dchSum = ["2011"];
        streamGage1Data2010 = [];
        streamGage1Data2010wtMean = ["2010"];
        streamGage1Data2010wtSum = ["2010"];
        streamGage1Data2010dchMean = ["2010"];
        streamGage1Data2010dchSum = ["2010"];

        var siteSelect = {
          name: gageID,
          wt: water_temp,
          wt2020: water_temp2020,
          wt2021: water_temp2021,
          wtM2021: streamGage1Data2021wtMean,
          wtS2021: streamGage1Data2021wtSum,
          dchM2021: streamGage1Data2021dchMean,
          dchS2021: streamGage1Data2021dchSum,
          wtM2020: streamGage1Data2020wtMean,
          wtS2020: streamGage1Data2020wtSum,
          dchM2020: streamGage1Data2020dchMean,
          dchS2020: streamGage1Data2020dchSum,
          wtM2019: streamGage1Data2019wtMean,
          wtS2019: streamGage1Data2019wtSum,
          dchM2019: streamGage1Data2019dchMean,
          dchS2019: streamGage1Data2019dchSum,
          wtM2018: streamGage1Data2018wtMean,
          wtS2018: streamGage1Data2018wtSum,
          dchM2018: streamGage1Data2018dchMean,
          dchS2018: streamGage1Data2018dchSum,
          wtM2017: streamGage1Data2017wtMean,
          wtS2017: streamGage1Data2017wtSum,
          dchM2017: streamGage1Data2017dchMean,
          dchS2017: streamGage1Data2017dchSum,
          wtM2016: streamGage1Data2016wtMean,
          wtS2016: streamGage1Data2016wtSum,
          dchM2016: streamGage1Data2016dchMean,
          dchS2016: streamGage1Data2016dchSum,
          wtM2015: streamGage1Data2015wtMean,
          wtS2015: streamGage1Data2015wtSum,
          dchM2015: streamGage1Data2015dchMean,
          dchS2015: streamGage1Data2015dchSum,
          wtM2014: streamGage1Data2014wtMean,
          wtS2014: streamGage1Data2014wtSum,
          dchM2014: streamGage1Data2014dchMean,
          dchS2014: streamGage1Data2014dchSum,
          wtM2013: streamGage1Data2013wtMean,
          wtS2013: streamGage1Data2013wtSum,
          dchM2013: streamGage1Data2013dchMean,
          dchS2013: streamGage1Data2013dchSum,
          wtM2012: streamGage1Data2012wtMean,
          wtS2012: streamGage1Data2012wtSum,
          dchM2012: streamGage1Data2012dchMean,
          dchS2012: streamGage1Data2012dchSum,
          wtM2011: streamGage1Data2011wtMean,
          wtS2011: streamGage1Data2011wtSum,
          dchM2011: streamGage1Data2011dchMean,
          dchS2011: streamGage1Data2011dchSum,
          wtM2010: streamGage1Data2010wtMean,
          wtS2010: streamGage1Data2010wtSum,
          dchM2010: streamGage1Data2010dchMean,
          dchS2010: streamGage1Data2010dchSum,
        }

        siteCounts(siteSelect);


        chart.load({
          columns: [siteSelect.wtM2018],
        });
        chart2.load({
          columns: [siteSelect.wtM2018],
        });
        h20SumChart.load({
          columns: [siteSelect.wtS2018],
        });
        dchMeanChart.load({
          columns: [siteSelect.dchM2018],
        });
        dchSumChart.load({
          columns: [siteSelect.dchS2018],
        });
        var stroke = chart.color('2018');
        $("#gage2018").css('color', stroke);

      } else {
        chart.unload({
          ids: ["2018"],
        });
        chart2.unload({
          ids: ["2018"],
        });
        h20SumChart.unload({
          ids: ["2018"],
        });
        dchMeanChart.unload({
          ids: ["2018"],
        });
        dchSumChart.unload({
          ids: ["2018"],
        });
        $("#gage2018").css('color', 'white');

      }

    });
    $("#gage2017").on("click", function() {
      color2017 = $("#gage2017").css('color');
      if (color2017 == 'rgb(255, 255, 255)') {
        var t = ["Date"];
        var t2020 = ["Date"];
        var t2021 = ["Date"];
        var water_temp = ["Water Temperature"];
        var water_temp2020 = ["2020"];
        var water_temp2021 = ["2021"];
        streamGage1Data2021 = [];
        streamGage1Data2021wtMean = ["2021"];
        streamGage1Data2021wtSum = ["2021"];
        streamGage1Data2021dchMean = ["2021"];
        streamGage1Data2021dchSum = ["2021"];
        streamGage1Data2020 = [];
        streamGage1Data2020wtMean = ["2020"];
        streamGage1Data2020wtSum = ["2020"];
        streamGage1Data2020dchMean = ["2020"];
        streamGage1Data2020dchSum = ["2020"];
        streamGage1Data2019 = [];
        streamGage1Data2019wtMean = ["2019"];
        streamGage1Data2019wtSum = ["2019"];
        streamGage1Data2019dchMean = ["2019"];
        streamGage1Data2019dchSum = ["2019"];
        streamGage1Data2018 = [];
        streamGage1Data2018wtMean = ["2018"];
        streamGage1Data2018wtSum = ["2018"];
        streamGage1Data2018dchMean = ["2018"];
        streamGage1Data2018dchSum = ["2018"];
        streamGage1Data2017 = [];
        streamGage1Data2017wtMean = ["2017"];
        streamGage1Data2017wtSum = ["2017"];
        streamGage1Data2017dchMean = ["2017"];
        streamGage1Data2017dchSum = ["2017"];
        streamGage1Data2016 = [];
        streamGage1Data2016wtMean = ["2016"];
        streamGage1Data2016wtSum = ["2016"];
        streamGage1Data2016dchMean = ["2016"];
        streamGage1Data2016dchSum = ["2016"];
        streamGage1Data2015 = [];
        streamGage1Data2015wtMean = ["2015"];
        streamGage1Data2015wtSum = ["2015"];
        streamGage1Data2015dchMean = ["2015"];
        streamGage1Data2015dchSum = ["2015"];
        streamGage1Data2014 = [];
        streamGage1Data2014wtMean = ["2014"];
        streamGage1Data2014wtSum = ["2014"];
        streamGage1Data2014dchMean = ["2014"];
        streamGage1Data2014dchSum = ["2014"];
        streamGage1Data2013 = [];
        streamGage1Data2013wtMean = ["2013"];
        streamGage1Data2013wtSum = ["2013"];
        streamGage1Data2013dchMean = ["2013"];
        streamGage1Data2013dchSum = ["2013"];
        streamGage1Data2012 = [];
        streamGage1Data2012wtMean = ["2012"];
        streamGage1Data2012wtSum = ["2012"];
        streamGage1Data2012dchMean = ["2012"];
        streamGage1Data2012dchSum = ["2012"];
        streamGage1Data2011 = [];
        streamGage1Data2011wtMean = ["2011"];
        streamGage1Data2011wtSum = ["2011"];
        streamGage1Data2011dchMean = ["2011"];
        streamGage1Data2011dchSum = ["2011"];
        streamGage1Data2010 = [];
        streamGage1Data2010wtMean = ["2010"];
        streamGage1Data2010wtSum = ["2010"];
        streamGage1Data2010dchMean = ["2010"];
        streamGage1Data2010dchSum = ["2010"];

        var siteSelect = {
          name: gageID,
          wt: water_temp,
          wt2020: water_temp2020,
          wt2021: water_temp2021,
          wtM2021: streamGage1Data2021wtMean,
          wtS2021: streamGage1Data2021wtSum,
          dchM2021: streamGage1Data2021dchMean,
          dchS2021: streamGage1Data2021dchSum,
          wtM2020: streamGage1Data2020wtMean,
          wtS2020: streamGage1Data2020wtSum,
          dchM2020: streamGage1Data2020dchMean,
          dchS2020: streamGage1Data2020dchSum,
          wtM2019: streamGage1Data2019wtMean,
          wtS2019: streamGage1Data2019wtSum,
          dchM2019: streamGage1Data2019dchMean,
          dchS2019: streamGage1Data2019dchSum,
          wtM2018: streamGage1Data2018wtMean,
          wtS2018: streamGage1Data2018wtSum,
          dchM2018: streamGage1Data2018dchMean,
          dchS2018: streamGage1Data2018dchSum,
          wtM2017: streamGage1Data2017wtMean,
          wtS2017: streamGage1Data2017wtSum,
          dchM2017: streamGage1Data2017dchMean,
          dchS2017: streamGage1Data2017dchSum,
          wtM2016: streamGage1Data2016wtMean,
          wtS2016: streamGage1Data2016wtSum,
          dchM2016: streamGage1Data2016dchMean,
          dchS2016: streamGage1Data2016dchSum,
          wtM2015: streamGage1Data2015wtMean,
          wtS2015: streamGage1Data2015wtSum,
          dchM2015: streamGage1Data2015dchMean,
          dchS2015: streamGage1Data2015dchSum,
          wtM2014: streamGage1Data2014wtMean,
          wtS2014: streamGage1Data2014wtSum,
          dchM2014: streamGage1Data2014dchMean,
          dchS2014: streamGage1Data2014dchSum,
          wtM2013: streamGage1Data2013wtMean,
          wtS2013: streamGage1Data2013wtSum,
          dchM2013: streamGage1Data2013dchMean,
          dchS2013: streamGage1Data2013dchSum,
          wtM2012: streamGage1Data2012wtMean,
          wtS2012: streamGage1Data2012wtSum,
          dchM2012: streamGage1Data2012dchMean,
          dchS2012: streamGage1Data2012dchSum,
          wtM2011: streamGage1Data2011wtMean,
          wtS2011: streamGage1Data2011wtSum,
          dchM2011: streamGage1Data2011dchMean,
          dchS2011: streamGage1Data2011dchSum,
          wtM2010: streamGage1Data2010wtMean,
          wtS2010: streamGage1Data2010wtSum,
          dchM2010: streamGage1Data2010dchMean,
          dchS2010: streamGage1Data2010dchSum,
        }

        siteCounts(siteSelect);


        chart.load({
          columns: [siteSelect.wtM2017],
        });
        chart2.load({
          columns: [siteSelect.wtM2017],
        });
        h20SumChart.load({
          columns: [siteSelect.wtS2017],
        });
        dchMeanChart.load({
          columns: [siteSelect.dchM2017],
        });
        dchSumChart.load({
          columns: [siteSelect.dchS2017],
        });
        var stroke = chart.color('2017');
        $("#gage2017").css('color', stroke);

      } else {
        chart.unload({
          ids: ["2017"],
        });
        chart2.unload({
          ids: ["2017"],
        });
        h20SumChart.unload({
          ids: ["2017"],
        });
        dchMeanChart.unload({
          ids: ["2017"],
        });
        dchSumChart.unload({
          ids: ["2017"],
        });
        $("#gage2017").css('color', 'white');

      }

    });
    $("#gage2016").on("click", function() {
      color2016 = $("#gage2016").css('color');
      if (color2016 == 'rgb(255, 255, 255)') {
        var t = ["Date"];
        var t2020 = ["Date"];
        var t2021 = ["Date"];
        var water_temp = ["Water Temperature"];
        var water_temp2020 = ["2020"];
        var water_temp2021 = ["2021"];
        streamGage1Data2021 = [];
        streamGage1Data2021wtMean = ["2021"];
        streamGage1Data2021wtSum = ["2021"];
        streamGage1Data2021dchMean = ["2021"];
        streamGage1Data2021dchSum = ["2021"];
        streamGage1Data2020 = [];
        streamGage1Data2020wtMean = ["2020"];
        streamGage1Data2020wtSum = ["2020"];
        streamGage1Data2020dchMean = ["2020"];
        streamGage1Data2020dchSum = ["2020"];
        streamGage1Data2019 = [];
        streamGage1Data2019wtMean = ["2019"];
        streamGage1Data2019wtSum = ["2019"];
        streamGage1Data2019dchMean = ["2019"];
        streamGage1Data2019dchSum = ["2019"];
        streamGage1Data2018 = [];
        streamGage1Data2018wtMean = ["2018"];
        streamGage1Data2018wtSum = ["2018"];
        streamGage1Data2018dchMean = ["2018"];
        streamGage1Data2018dchSum = ["2018"];
        streamGage1Data2017 = [];
        streamGage1Data2017wtMean = ["2017"];
        streamGage1Data2017wtSum = ["2017"];
        streamGage1Data2017dchMean = ["2017"];
        streamGage1Data2017dchSum = ["2017"];
        streamGage1Data2016 = [];
        streamGage1Data2016wtMean = ["2016"];
        streamGage1Data2016wtSum = ["2016"];
        streamGage1Data2016dchMean = ["2016"];
        streamGage1Data2016dchSum = ["2016"];
        streamGage1Data2015 = [];
        streamGage1Data2015wtMean = ["2015"];
        streamGage1Data2015wtSum = ["2015"];
        streamGage1Data2015dchMean = ["2015"];
        streamGage1Data2015dchSum = ["2015"];
        streamGage1Data2014 = [];
        streamGage1Data2014wtMean = ["2014"];
        streamGage1Data2014wtSum = ["2014"];
        streamGage1Data2014dchMean = ["2014"];
        streamGage1Data2014dchSum = ["2014"];
        streamGage1Data2013 = [];
        streamGage1Data2013wtMean = ["2013"];
        streamGage1Data2013wtSum = ["2013"];
        streamGage1Data2013dchMean = ["2013"];
        streamGage1Data2013dchSum = ["2013"];
        streamGage1Data2012 = [];
        streamGage1Data2012wtMean = ["2012"];
        streamGage1Data2012wtSum = ["2012"];
        streamGage1Data2012dchMean = ["2012"];
        streamGage1Data2012dchSum = ["2012"];
        streamGage1Data2011 = [];
        streamGage1Data2011wtMean = ["2011"];
        streamGage1Data2011wtSum = ["2011"];
        streamGage1Data2011dchMean = ["2011"];
        streamGage1Data2011dchSum = ["2011"];
        streamGage1Data2010 = [];
        streamGage1Data2010wtMean = ["2010"];
        streamGage1Data2010wtSum = ["2010"];
        streamGage1Data2010dchMean = ["2010"];
        streamGage1Data2010dchSum = ["2010"];

        var siteSelect = {
          name: gageID,
          wt: water_temp,
          wt2020: water_temp2020,
          wt2021: water_temp2021,
          wtM2021: streamGage1Data2021wtMean,
          wtS2021: streamGage1Data2021wtSum,
          dchM2021: streamGage1Data2021dchMean,
          dchS2021: streamGage1Data2021dchSum,
          wtM2020: streamGage1Data2020wtMean,
          wtS2020: streamGage1Data2020wtSum,
          dchM2020: streamGage1Data2020dchMean,
          dchS2020: streamGage1Data2020dchSum,
          wtM2019: streamGage1Data2019wtMean,
          wtS2019: streamGage1Data2019wtSum,
          dchM2019: streamGage1Data2019dchMean,
          dchS2019: streamGage1Data2019dchSum,
          wtM2018: streamGage1Data2018wtMean,
          wtS2018: streamGage1Data2018wtSum,
          dchM2018: streamGage1Data2018dchMean,
          dchS2018: streamGage1Data2018dchSum,
          wtM2017: streamGage1Data2017wtMean,
          wtS2017: streamGage1Data2017wtSum,
          dchM2017: streamGage1Data2017dchMean,
          dchS2017: streamGage1Data2017dchSum,
          wtM2016: streamGage1Data2016wtMean,
          wtS2016: streamGage1Data2016wtSum,
          dchM2016: streamGage1Data2016dchMean,
          dchS2016: streamGage1Data2016dchSum,
          wtM2015: streamGage1Data2015wtMean,
          wtS2015: streamGage1Data2015wtSum,
          dchM2015: streamGage1Data2015dchMean,
          dchS2015: streamGage1Data2015dchSum,
          wtM2014: streamGage1Data2014wtMean,
          wtS2014: streamGage1Data2014wtSum,
          dchM2014: streamGage1Data2014dchMean,
          dchS2014: streamGage1Data2014dchSum,
          wtM2013: streamGage1Data2013wtMean,
          wtS2013: streamGage1Data2013wtSum,
          dchM2013: streamGage1Data2013dchMean,
          dchS2013: streamGage1Data2013dchSum,
          wtM2012: streamGage1Data2012wtMean,
          wtS2012: streamGage1Data2012wtSum,
          dchM2012: streamGage1Data2012dchMean,
          dchS2012: streamGage1Data2012dchSum,
          wtM2011: streamGage1Data2011wtMean,
          wtS2011: streamGage1Data2011wtSum,
          dchM2011: streamGage1Data2011dchMean,
          dchS2011: streamGage1Data2011dchSum,
          wtM2010: streamGage1Data2010wtMean,
          wtS2010: streamGage1Data2010wtSum,
          dchM2010: streamGage1Data2010dchMean,
          dchS2010: streamGage1Data2010dchSum,
        }

        siteCounts(siteSelect);


        chart.load({
          columns: [siteSelect.wtM2016],
        });
        chart2.load({
          columns: [siteSelect.wtM2016],
        });
        h20SumChart.load({
          columns: [siteSelect.wtS2016],
        });
        dchMeanChart.load({
          columns: [siteSelect.dchM2016],
        });
        dchSumChart.load({
          columns: [siteSelect.dchS2016],
        });
        var stroke = chart.color('2016');
        $("#gage2016").css('color', stroke);

      } else {
        chart.unload({
          ids: ["2016"],
        });
        chart2.unload({
          ids: ["2016"],
        });
        h20SumChart.unload({
          ids: ["2016"],
        });
        dchMeanChart.unload({
          ids: ["2016"],
        });
        dchSumChart.unload({
          ids: ["2016"],
        });
        $("#gage2016").css('color', 'white');

      }

    });
    $("#gage2015").on("click", function() {
      color2015 = $("#gage2015").css('color');
      if (color2015 == 'rgb(255, 255, 255)') {
        var t = ["Date"];
        var t2020 = ["Date"];
        var t2021 = ["Date"];
        var water_temp = ["Water Temperature"];
        var water_temp2020 = ["2020"];
        var water_temp2021 = ["2021"];
        streamGage1Data2021 = [];
        streamGage1Data2021wtMean = ["2021"];
        streamGage1Data2021wtSum = ["2021"];
        streamGage1Data2021dchMean = ["2021"];
        streamGage1Data2021dchSum = ["2021"];
        streamGage1Data2020 = [];
        streamGage1Data2020wtMean = ["2020"];
        streamGage1Data2020wtSum = ["2020"];
        streamGage1Data2020dchMean = ["2020"];
        streamGage1Data2020dchSum = ["2020"];
        streamGage1Data2019 = [];
        streamGage1Data2019wtMean = ["2019"];
        streamGage1Data2019wtSum = ["2019"];
        streamGage1Data2019dchMean = ["2019"];
        streamGage1Data2019dchSum = ["2019"];
        streamGage1Data2018 = [];
        streamGage1Data2018wtMean = ["2018"];
        streamGage1Data2018wtSum = ["2018"];
        streamGage1Data2018dchMean = ["2018"];
        streamGage1Data2018dchSum = ["2018"];
        streamGage1Data2017 = [];
        streamGage1Data2017wtMean = ["2017"];
        streamGage1Data2017wtSum = ["2017"];
        streamGage1Data2017dchMean = ["2017"];
        streamGage1Data2017dchSum = ["2017"];
        streamGage1Data2016 = [];
        streamGage1Data2016wtMean = ["2016"];
        streamGage1Data2016wtSum = ["2016"];
        streamGage1Data2016dchMean = ["2016"];
        streamGage1Data2016dchSum = ["2016"];
        streamGage1Data2015 = [];
        streamGage1Data2015wtMean = ["2015"];
        streamGage1Data2015wtSum = ["2015"];
        streamGage1Data2015dchMean = ["2015"];
        streamGage1Data2015dchSum = ["2015"];
        streamGage1Data2014 = [];
        streamGage1Data2014wtMean = ["2014"];
        streamGage1Data2014wtSum = ["2014"];
        streamGage1Data2014dchMean = ["2014"];
        streamGage1Data2014dchSum = ["2014"];
        streamGage1Data2013 = [];
        streamGage1Data2013wtMean = ["2013"];
        streamGage1Data2013wtSum = ["2013"];
        streamGage1Data2013dchMean = ["2013"];
        streamGage1Data2013dchSum = ["2013"];
        streamGage1Data2012 = [];
        streamGage1Data2012wtMean = ["2012"];
        streamGage1Data2012wtSum = ["2012"];
        streamGage1Data2012dchMean = ["2012"];
        streamGage1Data2012dchSum = ["2012"];
        streamGage1Data2011 = [];
        streamGage1Data2011wtMean = ["2011"];
        streamGage1Data2011wtSum = ["2011"];
        streamGage1Data2011dchMean = ["2011"];
        streamGage1Data2011dchSum = ["2011"];
        streamGage1Data2010 = [];
        streamGage1Data2010wtMean = ["2010"];
        streamGage1Data2010wtSum = ["2010"];
        streamGage1Data2010dchMean = ["2010"];
        streamGage1Data2010dchSum = ["2010"];

        var siteSelect = {
          name: gageID,
          wt: water_temp,
          wt2020: water_temp2020,
          wt2021: water_temp2021,
          wtM2021: streamGage1Data2021wtMean,
          wtS2021: streamGage1Data2021wtSum,
          dchM2021: streamGage1Data2021dchMean,
          dchS2021: streamGage1Data2021dchSum,
          wtM2020: streamGage1Data2020wtMean,
          wtS2020: streamGage1Data2020wtSum,
          dchM2020: streamGage1Data2020dchMean,
          dchS2020: streamGage1Data2020dchSum,
          wtM2019: streamGage1Data2019wtMean,
          wtS2019: streamGage1Data2019wtSum,
          dchM2019: streamGage1Data2019dchMean,
          dchS2019: streamGage1Data2019dchSum,
          wtM2018: streamGage1Data2018wtMean,
          wtS2018: streamGage1Data2018wtSum,
          dchM2018: streamGage1Data2018dchMean,
          dchS2018: streamGage1Data2018dchSum,
          wtM2017: streamGage1Data2017wtMean,
          wtS2017: streamGage1Data2017wtSum,
          dchM2017: streamGage1Data2017dchMean,
          dchS2017: streamGage1Data2017dchSum,
          wtM2016: streamGage1Data2016wtMean,
          wtS2016: streamGage1Data2016wtSum,
          dchM2016: streamGage1Data2016dchMean,
          dchS2016: streamGage1Data2016dchSum,
          wtM2015: streamGage1Data2015wtMean,
          wtS2015: streamGage1Data2015wtSum,
          dchM2015: streamGage1Data2015dchMean,
          dchS2015: streamGage1Data2015dchSum,
          wtM2014: streamGage1Data2014wtMean,
          wtS2014: streamGage1Data2014wtSum,
          dchM2014: streamGage1Data2014dchMean,
          dchS2014: streamGage1Data2014dchSum,
          wtM2013: streamGage1Data2013wtMean,
          wtS2013: streamGage1Data2013wtSum,
          dchM2013: streamGage1Data2013dchMean,
          dchS2013: streamGage1Data2013dchSum,
          wtM2012: streamGage1Data2012wtMean,
          wtS2012: streamGage1Data2012wtSum,
          dchM2012: streamGage1Data2012dchMean,
          dchS2012: streamGage1Data2012dchSum,
          wtM2011: streamGage1Data2011wtMean,
          wtS2011: streamGage1Data2011wtSum,
          dchM2011: streamGage1Data2011dchMean,
          dchS2011: streamGage1Data2011dchSum,
          wtM2010: streamGage1Data2010wtMean,
          wtS2010: streamGage1Data2010wtSum,
          dchM2010: streamGage1Data2010dchMean,
          dchS2010: streamGage1Data2010dchSum,
        }

        siteCounts(siteSelect);


        chart.load({
          columns: [siteSelect.wtM2015],
        });
        chart2.load({
          columns: [siteSelect.wtM2015],
        });
        h20SumChart.load({
          columns: [siteSelect.wtS2015],
        });
        dchMeanChart.load({
          columns: [siteSelect.dchM2015],
        });
        dchSumChart.load({
          columns: [siteSelect.dchS2015],
        });
        var stroke = chart.color('2015');
        $("#gage2015").css('color', stroke);

      } else {
        chart.unload({
          ids: ["2015"],
        });
        chart2.unload({
          ids: ["2015"],
        });
        h20SumChart.unload({
          ids: ["2015"],
        });
        dchMeanChart.unload({
          ids: ["2015"],
        });
        dchSumChart.unload({
          ids: ["2015"],
        });
        $("#gage2015").css('color', 'white');

      }

    });
    $("#gage2014").on("click", function() {
      color2014 = $("#gage2014").css('color');
      if (color2014 == 'rgb(255, 255, 255)') {
        var t = ["Date"];
        var t2020 = ["Date"];
        var t2021 = ["Date"];
        var water_temp = ["Water Temperature"];
        var water_temp2020 = ["2020"];
        var water_temp2021 = ["2021"];
        streamGage1Data2021 = [];
        streamGage1Data2021wtMean = ["2021"];
        streamGage1Data2021wtSum = ["2021"];
        streamGage1Data2021dchMean = ["2021"];
        streamGage1Data2021dchSum = ["2021"];
        streamGage1Data2020 = [];
        streamGage1Data2020wtMean = ["2020"];
        streamGage1Data2020wtSum = ["2020"];
        streamGage1Data2020dchMean = ["2020"];
        streamGage1Data2020dchSum = ["2020"];
        streamGage1Data2019 = [];
        streamGage1Data2019wtMean = ["2019"];
        streamGage1Data2019wtSum = ["2019"];
        streamGage1Data2019dchMean = ["2019"];
        streamGage1Data2019dchSum = ["2019"];
        streamGage1Data2018 = [];
        streamGage1Data2018wtMean = ["2018"];
        streamGage1Data2018wtSum = ["2018"];
        streamGage1Data2018dchMean = ["2018"];
        streamGage1Data2018dchSum = ["2018"];
        streamGage1Data2017 = [];
        streamGage1Data2017wtMean = ["2017"];
        streamGage1Data2017wtSum = ["2017"];
        streamGage1Data2017dchMean = ["2017"];
        streamGage1Data2017dchSum = ["2017"];
        streamGage1Data2016 = [];
        streamGage1Data2016wtMean = ["2016"];
        streamGage1Data2016wtSum = ["2016"];
        streamGage1Data2016dchMean = ["2016"];
        streamGage1Data2016dchSum = ["2016"];
        streamGage1Data2015 = [];
        streamGage1Data2015wtMean = ["2015"];
        streamGage1Data2015wtSum = ["2015"];
        streamGage1Data2015dchMean = ["2015"];
        streamGage1Data2015dchSum = ["2015"];
        streamGage1Data2014 = [];
        streamGage1Data2014wtMean = ["2014"];
        streamGage1Data2014wtSum = ["2014"];
        streamGage1Data2014dchMean = ["2014"];
        streamGage1Data2014dchSum = ["2014"];
        streamGage1Data2013 = [];
        streamGage1Data2013wtMean = ["2013"];
        streamGage1Data2013wtSum = ["2013"];
        streamGage1Data2013dchMean = ["2013"];
        streamGage1Data2013dchSum = ["2013"];
        streamGage1Data2012 = [];
        streamGage1Data2012wtMean = ["2012"];
        streamGage1Data2012wtSum = ["2012"];
        streamGage1Data2012dchMean = ["2012"];
        streamGage1Data2012dchSum = ["2012"];
        streamGage1Data2011 = [];
        streamGage1Data2011wtMean = ["2011"];
        streamGage1Data2011wtSum = ["2011"];
        streamGage1Data2011dchMean = ["2011"];
        streamGage1Data2011dchSum = ["2011"];
        streamGage1Data2010 = [];
        streamGage1Data2010wtMean = ["2010"];
        streamGage1Data2010wtSum = ["2010"];
        streamGage1Data2010dchMean = ["2010"];
        streamGage1Data2010dchSum = ["2010"];

        var siteSelect = {
          name: gageID,
          wt: water_temp,
          wt2020: water_temp2020,
          wt2021: water_temp2021,
          wtM2021: streamGage1Data2021wtMean,
          wtS2021: streamGage1Data2021wtSum,
          dchM2021: streamGage1Data2021dchMean,
          dchS2021: streamGage1Data2021dchSum,
          wtM2020: streamGage1Data2020wtMean,
          wtS2020: streamGage1Data2020wtSum,
          dchM2020: streamGage1Data2020dchMean,
          dchS2020: streamGage1Data2020dchSum,
          wtM2019: streamGage1Data2019wtMean,
          wtS2019: streamGage1Data2019wtSum,
          dchM2019: streamGage1Data2019dchMean,
          dchS2019: streamGage1Data2019dchSum,
          wtM2018: streamGage1Data2018wtMean,
          wtS2018: streamGage1Data2018wtSum,
          dchM2018: streamGage1Data2018dchMean,
          dchS2018: streamGage1Data2018dchSum,
          wtM2017: streamGage1Data2017wtMean,
          wtS2017: streamGage1Data2017wtSum,
          dchM2017: streamGage1Data2017dchMean,
          dchS2017: streamGage1Data2017dchSum,
          wtM2016: streamGage1Data2016wtMean,
          wtS2016: streamGage1Data2016wtSum,
          dchM2016: streamGage1Data2016dchMean,
          dchS2016: streamGage1Data2016dchSum,
          wtM2015: streamGage1Data2015wtMean,
          wtS2015: streamGage1Data2015wtSum,
          dchM2015: streamGage1Data2015dchMean,
          dchS2015: streamGage1Data2015dchSum,
          wtM2014: streamGage1Data2014wtMean,
          wtS2014: streamGage1Data2014wtSum,
          dchM2014: streamGage1Data2014dchMean,
          dchS2014: streamGage1Data2014dchSum,
          wtM2013: streamGage1Data2013wtMean,
          wtS2013: streamGage1Data2013wtSum,
          dchM2013: streamGage1Data2013dchMean,
          dchS2013: streamGage1Data2013dchSum,
          wtM2012: streamGage1Data2012wtMean,
          wtS2012: streamGage1Data2012wtSum,
          dchM2012: streamGage1Data2012dchMean,
          dchS2012: streamGage1Data2012dchSum,
          wtM2011: streamGage1Data2011wtMean,
          wtS2011: streamGage1Data2011wtSum,
          dchM2011: streamGage1Data2011dchMean,
          dchS2011: streamGage1Data2011dchSum,
          wtM2010: streamGage1Data2010wtMean,
          wtS2010: streamGage1Data2010wtSum,
          dchM2010: streamGage1Data2010dchMean,
          dchS2010: streamGage1Data2010dchSum,
        }

        siteCounts(siteSelect);


        chart.load({
          columns: [siteSelect.wtM2014],
        });
        chart2.load({
          columns: [siteSelect.wtM2014],
        });
        h20SumChart.load({
          columns: [siteSelect.wtS2014],
        });
        dchMeanChart.load({
          columns: [siteSelect.dchM2014],
        });
        dchSumChart.load({
          columns: [siteSelect.dchS2014],
        });
        var stroke = chart.color('2014');
        $("#gage2014").css('color', stroke);

      } else {
        chart.unload({
          ids: ["2014"],
        });
        chart2.unload({
          ids: ["2014"],
        });
        h20SumChart.unload({
          ids: ["2014"],
        });
        dchMeanChart.unload({
          ids: ["2014"],
        });
        dchSumChart.unload({
          ids: ["2014"],
        });
        $("#gage2014").css('color', 'white');

      }

    });
    $("#gage2013").on("click", function() {
      color2013 = $("#gage2013").css('color');
      if (color2013 == 'rgb(255, 255, 255)') {
        var t = ["Date"];
        var t2020 = ["Date"];
        var t2021 = ["Date"];
        var water_temp = ["Water Temperature"];
        var water_temp2020 = ["2020"];
        var water_temp2021 = ["2021"];
        streamGage1Data2021 = [];
        streamGage1Data2021wtMean = ["2021"];
        streamGage1Data2021wtSum = ["2021"];
        streamGage1Data2021dchMean = ["2021"];
        streamGage1Data2021dchSum = ["2021"];
        streamGage1Data2020 = [];
        streamGage1Data2020wtMean = ["2020"];
        streamGage1Data2020wtSum = ["2020"];
        streamGage1Data2020dchMean = ["2020"];
        streamGage1Data2020dchSum = ["2020"];
        streamGage1Data2019 = [];
        streamGage1Data2019wtMean = ["2019"];
        streamGage1Data2019wtSum = ["2019"];
        streamGage1Data2019dchMean = ["2019"];
        streamGage1Data2019dchSum = ["2019"];
        streamGage1Data2018 = [];
        streamGage1Data2018wtMean = ["2018"];
        streamGage1Data2018wtSum = ["2018"];
        streamGage1Data2018dchMean = ["2018"];
        streamGage1Data2018dchSum = ["2018"];
        streamGage1Data2017 = [];
        streamGage1Data2017wtMean = ["2017"];
        streamGage1Data2017wtSum = ["2017"];
        streamGage1Data2017dchMean = ["2017"];
        streamGage1Data2017dchSum = ["2017"];
        streamGage1Data2016 = [];
        streamGage1Data2016wtMean = ["2016"];
        streamGage1Data2016wtSum = ["2016"];
        streamGage1Data2016dchMean = ["2016"];
        streamGage1Data2016dchSum = ["2016"];
        streamGage1Data2015 = [];
        streamGage1Data2015wtMean = ["2015"];
        streamGage1Data2015wtSum = ["2015"];
        streamGage1Data2015dchMean = ["2015"];
        streamGage1Data2015dchSum = ["2015"];
        streamGage1Data2014 = [];
        streamGage1Data2014wtMean = ["2014"];
        streamGage1Data2014wtSum = ["2014"];
        streamGage1Data2014dchMean = ["2014"];
        streamGage1Data2014dchSum = ["2014"];
        streamGage1Data2013 = [];
        streamGage1Data2013wtMean = ["2013"];
        streamGage1Data2013wtSum = ["2013"];
        streamGage1Data2013dchMean = ["2013"];
        streamGage1Data2013dchSum = ["2013"];
        streamGage1Data2012 = [];
        streamGage1Data2012wtMean = ["2012"];
        streamGage1Data2012wtSum = ["2012"];
        streamGage1Data2012dchMean = ["2012"];
        streamGage1Data2012dchSum = ["2012"];
        streamGage1Data2011 = [];
        streamGage1Data2011wtMean = ["2011"];
        streamGage1Data2011wtSum = ["2011"];
        streamGage1Data2011dchMean = ["2011"];
        streamGage1Data2011dchSum = ["2011"];
        streamGage1Data2010 = [];
        streamGage1Data2010wtMean = ["2010"];
        streamGage1Data2010wtSum = ["2010"];
        streamGage1Data2010dchMean = ["2010"];
        streamGage1Data2010dchSum = ["2010"];

        var siteSelect = {
          name: gageID,
          wt: water_temp,
          wt2020: water_temp2020,
          wt2021: water_temp2021,
          wtM2021: streamGage1Data2021wtMean,
          wtS2021: streamGage1Data2021wtSum,
          dchM2021: streamGage1Data2021dchMean,
          dchS2021: streamGage1Data2021dchSum,
          wtM2020: streamGage1Data2020wtMean,
          wtS2020: streamGage1Data2020wtSum,
          dchM2020: streamGage1Data2020dchMean,
          dchS2020: streamGage1Data2020dchSum,
          wtM2019: streamGage1Data2019wtMean,
          wtS2019: streamGage1Data2019wtSum,
          dchM2019: streamGage1Data2019dchMean,
          dchS2019: streamGage1Data2019dchSum,
          wtM2018: streamGage1Data2018wtMean,
          wtS2018: streamGage1Data2018wtSum,
          dchM2018: streamGage1Data2018dchMean,
          dchS2018: streamGage1Data2018dchSum,
          wtM2017: streamGage1Data2017wtMean,
          wtS2017: streamGage1Data2017wtSum,
          dchM2017: streamGage1Data2017dchMean,
          dchS2017: streamGage1Data2017dchSum,
          wtM2016: streamGage1Data2016wtMean,
          wtS2016: streamGage1Data2016wtSum,
          dchM2016: streamGage1Data2016dchMean,
          dchS2016: streamGage1Data2016dchSum,
          wtM2015: streamGage1Data2015wtMean,
          wtS2015: streamGage1Data2015wtSum,
          dchM2015: streamGage1Data2015dchMean,
          dchS2015: streamGage1Data2015dchSum,
          wtM2014: streamGage1Data2014wtMean,
          wtS2014: streamGage1Data2014wtSum,
          dchM2014: streamGage1Data2014dchMean,
          dchS2014: streamGage1Data2014dchSum,
          wtM2013: streamGage1Data2013wtMean,
          wtS2013: streamGage1Data2013wtSum,
          dchM2013: streamGage1Data2013dchMean,
          dchS2013: streamGage1Data2013dchSum,
          wtM2012: streamGage1Data2012wtMean,
          wtS2012: streamGage1Data2012wtSum,
          dchM2012: streamGage1Data2012dchMean,
          dchS2012: streamGage1Data2012dchSum,
          wtM2011: streamGage1Data2011wtMean,
          wtS2011: streamGage1Data2011wtSum,
          dchM2011: streamGage1Data2011dchMean,
          dchS2011: streamGage1Data2011dchSum,
          wtM2010: streamGage1Data2010wtMean,
          wtS2010: streamGage1Data2010wtSum,
          dchM2010: streamGage1Data2010dchMean,
          dchS2010: streamGage1Data2010dchSum,
        }

        siteCounts(siteSelect);


        chart.load({
          columns: [siteSelect.wtM2013],
        });
        chart2.load({
          columns: [siteSelect.wtM2013],
        });
        h20SumChart.load({
          columns: [siteSelect.wtS2013],
        });
        dchMeanChart.load({
          columns: [siteSelect.dchM2013],
        });
        dchSumChart.load({
          columns: [siteSelect.dchS2013],
        });
        var stroke = chart.color('2013');
        $("#gage2013").css('color', stroke);

      } else {
        chart.unload({
          ids: ["2013"],
        });
        chart2.unload({
          ids: ["2013"],
        });
        h20SumChart.unload({
          ids: ["2013"],
        });
        dchMeanChart.unload({
          ids: ["2013"],
        });
        dchSumChart.unload({
          ids: ["2013"],
        });
        $("#gage2013").css('color', 'white');
      }

    });
    $("#gage2012").on("click", function() {
      color2012 = $("#gage2012").css('color');
      if (color2012 == 'rgb(255, 255, 255)') {
        var t = ["Date"];
        var t2020 = ["Date"];
        var t2021 = ["Date"];
        var water_temp = ["Water Temperature"];
        var water_temp2020 = ["2020"];
        var water_temp2021 = ["2021"];
        streamGage1Data2021 = [];
        streamGage1Data2021wtMean = ["2021"];
        streamGage1Data2021wtSum = ["2021"];
        streamGage1Data2021dchMean = ["2021"];
        streamGage1Data2021dchSum = ["2021"];
        streamGage1Data2020 = [];
        streamGage1Data2020wtMean = ["2020"];
        streamGage1Data2020wtSum = ["2020"];
        streamGage1Data2020dchMean = ["2020"];
        streamGage1Data2020dchSum = ["2020"];
        streamGage1Data2019 = [];
        streamGage1Data2019wtMean = ["2019"];
        streamGage1Data2019wtSum = ["2019"];
        streamGage1Data2019dchMean = ["2019"];
        streamGage1Data2019dchSum = ["2019"];
        streamGage1Data2018 = [];
        streamGage1Data2018wtMean = ["2018"];
        streamGage1Data2018wtSum = ["2018"];
        streamGage1Data2018dchMean = ["2018"];
        streamGage1Data2018dchSum = ["2018"];
        streamGage1Data2017 = [];
        streamGage1Data2017wtMean = ["2017"];
        streamGage1Data2017wtSum = ["2017"];
        streamGage1Data2017dchMean = ["2017"];
        streamGage1Data2017dchSum = ["2017"];
        streamGage1Data2016 = [];
        streamGage1Data2016wtMean = ["2016"];
        streamGage1Data2016wtSum = ["2016"];
        streamGage1Data2016dchMean = ["2016"];
        streamGage1Data2016dchSum = ["2016"];
        streamGage1Data2015 = [];
        streamGage1Data2015wtMean = ["2015"];
        streamGage1Data2015wtSum = ["2015"];
        streamGage1Data2015dchMean = ["2015"];
        streamGage1Data2015dchSum = ["2015"];
        streamGage1Data2014 = [];
        streamGage1Data2014wtMean = ["2014"];
        streamGage1Data2014wtSum = ["2014"];
        streamGage1Data2014dchMean = ["2014"];
        streamGage1Data2014dchSum = ["2014"];
        streamGage1Data2013 = [];
        streamGage1Data2013wtMean = ["2013"];
        streamGage1Data2013wtSum = ["2013"];
        streamGage1Data2013dchMean = ["2013"];
        streamGage1Data2013dchSum = ["2013"];
        streamGage1Data2012 = [];
        streamGage1Data2012wtMean = ["2012"];
        streamGage1Data2012wtSum = ["2012"];
        streamGage1Data2012dchMean = ["2012"];
        streamGage1Data2012dchSum = ["2012"];
        streamGage1Data2011 = [];
        streamGage1Data2011wtMean = ["2011"];
        streamGage1Data2011wtSum = ["2011"];
        streamGage1Data2011dchMean = ["2011"];
        streamGage1Data2011dchSum = ["2011"];
        streamGage1Data2010 = [];
        streamGage1Data2010wtMean = ["2010"];
        streamGage1Data2010wtSum = ["2010"];
        streamGage1Data2010dchMean = ["2010"];
        streamGage1Data2010dchSum = ["2010"];

        var siteSelect = {
          name: gageID,
          wt: water_temp,
          wt2020: water_temp2020,
          wt2021: water_temp2021,
          wtM2021: streamGage1Data2021wtMean,
          wtS2021: streamGage1Data2021wtSum,
          dchM2021: streamGage1Data2021dchMean,
          dchS2021: streamGage1Data2021dchSum,
          wtM2020: streamGage1Data2020wtMean,
          wtS2020: streamGage1Data2020wtSum,
          dchM2020: streamGage1Data2020dchMean,
          dchS2020: streamGage1Data2020dchSum,
          wtM2019: streamGage1Data2019wtMean,
          wtS2019: streamGage1Data2019wtSum,
          dchM2019: streamGage1Data2019dchMean,
          dchS2019: streamGage1Data2019dchSum,
          wtM2018: streamGage1Data2018wtMean,
          wtS2018: streamGage1Data2018wtSum,
          dchM2018: streamGage1Data2018dchMean,
          dchS2018: streamGage1Data2018dchSum,
          wtM2017: streamGage1Data2017wtMean,
          wtS2017: streamGage1Data2017wtSum,
          dchM2017: streamGage1Data2017dchMean,
          dchS2017: streamGage1Data2017dchSum,
          wtM2016: streamGage1Data2016wtMean,
          wtS2016: streamGage1Data2016wtSum,
          dchM2016: streamGage1Data2016dchMean,
          dchS2016: streamGage1Data2016dchSum,
          wtM2015: streamGage1Data2015wtMean,
          wtS2015: streamGage1Data2015wtSum,
          dchM2015: streamGage1Data2015dchMean,
          dchS2015: streamGage1Data2015dchSum,
          wtM2014: streamGage1Data2014wtMean,
          wtS2014: streamGage1Data2014wtSum,
          dchM2014: streamGage1Data2014dchMean,
          dchS2014: streamGage1Data2014dchSum,
          wtM2013: streamGage1Data2013wtMean,
          wtS2013: streamGage1Data2013wtSum,
          dchM2013: streamGage1Data2013dchMean,
          dchS2013: streamGage1Data2013dchSum,
          wtM2012: streamGage1Data2012wtMean,
          wtS2012: streamGage1Data2012wtSum,
          dchM2012: streamGage1Data2012dchMean,
          dchS2012: streamGage1Data2012dchSum,
          wtM2011: streamGage1Data2011wtMean,
          wtS2011: streamGage1Data2011wtSum,
          dchM2011: streamGage1Data2011dchMean,
          dchS2011: streamGage1Data2011dchSum,
          wtM2010: streamGage1Data2010wtMean,
          wtS2010: streamGage1Data2010wtSum,
          dchM2010: streamGage1Data2010dchMean,
          dchS2010: streamGage1Data2010dchSum,
        }

        siteCounts(siteSelect);


        chart.load({
          columns: [siteSelect.wtM2012],
        });
        chart2.load({
          columns: [siteSelect.wtM2012],
        });
        h20SumChart.load({
          columns: [siteSelect.wtS2012],
        });
        dchMeanChart.load({
          columns: [siteSelect.dchM2012],
        });
        dchSumChart.load({
          columns: [siteSelect.dchS2012],
        });
        var stroke = chart.color('2012');
        $("#gage2012").css('color', stroke);

      } else {
        chart.unload({
          ids: ["2012"],
        });
        chart2.unload({
          ids: ["2012"],
        });
        h20SumChart.unload({
          ids: ["2012"],
        });
        dchMeanChart.unload({
          ids: ["2012"],
        });
        dchSumChart.unload({
          ids: ["2012"],
        });
        $("#gage2012").css('color', 'white');

      }

    });
    $("#gage2011").on("click", function() {
      color2011 = $("#gage2011").css('color');
      if (color2011 == 'rgb(255, 255, 255)') {
        var t = ["Date"];
        var t2020 = ["Date"];
        var t2021 = ["Date"];
        var water_temp = ["Water Temperature"];
        var water_temp2020 = ["2020"];
        var water_temp2021 = ["2021"];
        streamGage1Data2021 = [];
        streamGage1Data2021wtMean = ["2021"];
        streamGage1Data2021wtSum = ["2021"];
        streamGage1Data2021dchMean = ["2021"];
        streamGage1Data2021dchSum = ["2021"];
        streamGage1Data2020 = [];
        streamGage1Data2020wtMean = ["2020"];
        streamGage1Data2020wtSum = ["2020"];
        streamGage1Data2020dchMean = ["2020"];
        streamGage1Data2020dchSum = ["2020"];
        streamGage1Data2019 = [];
        streamGage1Data2019wtMean = ["2019"];
        streamGage1Data2019wtSum = ["2019"];
        streamGage1Data2019dchMean = ["2019"];
        streamGage1Data2019dchSum = ["2019"];
        streamGage1Data2018 = [];
        streamGage1Data2018wtMean = ["2018"];
        streamGage1Data2018wtSum = ["2018"];
        streamGage1Data2018dchMean = ["2018"];
        streamGage1Data2018dchSum = ["2018"];
        streamGage1Data2017 = [];
        streamGage1Data2017wtMean = ["2017"];
        streamGage1Data2017wtSum = ["2017"];
        streamGage1Data2017dchMean = ["2017"];
        streamGage1Data2017dchSum = ["2017"];
        streamGage1Data2016 = [];
        streamGage1Data2016wtMean = ["2016"];
        streamGage1Data2016wtSum = ["2016"];
        streamGage1Data2016dchMean = ["2016"];
        streamGage1Data2016dchSum = ["2016"];
        streamGage1Data2015 = [];
        streamGage1Data2015wtMean = ["2015"];
        streamGage1Data2015wtSum = ["2015"];
        streamGage1Data2015dchMean = ["2015"];
        streamGage1Data2015dchSum = ["2015"];
        streamGage1Data2014 = [];
        streamGage1Data2014wtMean = ["2014"];
        streamGage1Data2014wtSum = ["2014"];
        streamGage1Data2014dchMean = ["2014"];
        streamGage1Data2014dchSum = ["2014"];
        streamGage1Data2013 = [];
        streamGage1Data2013wtMean = ["2013"];
        streamGage1Data2013wtSum = ["2013"];
        streamGage1Data2013dchMean = ["2013"];
        streamGage1Data2013dchSum = ["2013"];
        streamGage1Data2012 = [];
        streamGage1Data2012wtMean = ["2012"];
        streamGage1Data2012wtSum = ["2012"];
        streamGage1Data2012dchMean = ["2012"];
        streamGage1Data2012dchSum = ["2012"];
        streamGage1Data2011 = [];
        streamGage1Data2011wtMean = ["2011"];
        streamGage1Data2011wtSum = ["2011"];
        streamGage1Data2011dchMean = ["2011"];
        streamGage1Data2011dchSum = ["2011"];
        streamGage1Data2010 = [];
        streamGage1Data2010wtMean = ["2010"];
        streamGage1Data2010wtSum = ["2010"];
        streamGage1Data2010dchMean = ["2010"];
        streamGage1Data2010dchSum = ["2010"];

        var siteSelect = {
          name: gageID,
          wt: water_temp,
          wt2020: water_temp2020,
          wt2021: water_temp2021,
          wtM2021: streamGage1Data2021wtMean,
          wtS2021: streamGage1Data2021wtSum,
          dchM2021: streamGage1Data2021dchMean,
          dchS2021: streamGage1Data2021dchSum,
          wtM2020: streamGage1Data2020wtMean,
          wtS2020: streamGage1Data2020wtSum,
          dchM2020: streamGage1Data2020dchMean,
          dchS2020: streamGage1Data2020dchSum,
          wtM2019: streamGage1Data2019wtMean,
          wtS2019: streamGage1Data2019wtSum,
          dchM2019: streamGage1Data2019dchMean,
          dchS2019: streamGage1Data2019dchSum,
          wtM2018: streamGage1Data2018wtMean,
          wtS2018: streamGage1Data2018wtSum,
          dchM2018: streamGage1Data2018dchMean,
          dchS2018: streamGage1Data2018dchSum,
          wtM2017: streamGage1Data2017wtMean,
          wtS2017: streamGage1Data2017wtSum,
          dchM2017: streamGage1Data2017dchMean,
          dchS2017: streamGage1Data2017dchSum,
          wtM2016: streamGage1Data2016wtMean,
          wtS2016: streamGage1Data2016wtSum,
          dchM2016: streamGage1Data2016dchMean,
          dchS2016: streamGage1Data2016dchSum,
          wtM2015: streamGage1Data2015wtMean,
          wtS2015: streamGage1Data2015wtSum,
          dchM2015: streamGage1Data2015dchMean,
          dchS2015: streamGage1Data2015dchSum,
          wtM2014: streamGage1Data2014wtMean,
          wtS2014: streamGage1Data2014wtSum,
          dchM2014: streamGage1Data2014dchMean,
          dchS2014: streamGage1Data2014dchSum,
          wtM2013: streamGage1Data2013wtMean,
          wtS2013: streamGage1Data2013wtSum,
          dchM2013: streamGage1Data2013dchMean,
          dchS2013: streamGage1Data2013dchSum,
          wtM2012: streamGage1Data2012wtMean,
          wtS2012: streamGage1Data2012wtSum,
          dchM2012: streamGage1Data2012dchMean,
          dchS2012: streamGage1Data2012dchSum,
          wtM2011: streamGage1Data2011wtMean,
          wtS2011: streamGage1Data2011wtSum,
          dchM2011: streamGage1Data2011dchMean,
          dchS2011: streamGage1Data2011dchSum,
          wtM2010: streamGage1Data2010wtMean,
          wtS2010: streamGage1Data2010wtSum,
          dchM2010: streamGage1Data2010dchMean,
          dchS2010: streamGage1Data2010dchSum,
        }

        siteCounts(siteSelect);


        chart.load({
          columns: [siteSelect.wtM2011],
        });
        chart2.load({
          columns: [siteSelect.wtM2011],
        });
        h20SumChart.load({
          columns: [siteSelect.wtS2011],
        });
        dchMeanChart.load({
          columns: [siteSelect.dchM2011],
        });
        dchSumChart.load({
          columns: [siteSelect.dchS2011],
        });
        var stroke = chart.color('2011');
        $("#gage2011").css('color', stroke);

      } else {
        chart.unload({
          ids: ["2011"],
        });
        chart2.unload({
          ids: ["2011"],
        });
        h20SumChart.unload({
          ids: ["2011"],
        });
        dchMeanChart.unload({
          ids: ["2011"],
        });
        dchSumChart.unload({
          ids: ["2011"],
        });
        $("#gage2011").css('color', 'white');

      }

    });
    $("#gage2010").on("click", function() {
      color2010 = $("#gage2010").css('color');
      if (color2010 == 'rgb(255, 255, 255)') {
        var t = ["Date"];
        var t2020 = ["Date"];
        var t2021 = ["Date"];
        var water_temp = ["Water Temperature"];
        var water_temp2020 = ["2020"];
        var water_temp2021 = ["2021"];
        streamGage1Data2021 = [];
        streamGage1Data2021wtMean = ["2021"];
        streamGage1Data2021wtSum = ["2021"];
        streamGage1Data2021dchMean = ["2021"];
        streamGage1Data2021dchSum = ["2021"];
        streamGage1Data2020 = [];
        streamGage1Data2020wtMean = ["2020"];
        streamGage1Data2020wtSum = ["2020"];
        streamGage1Data2020dchMean = ["2020"];
        streamGage1Data2020dchSum = ["2020"];
        streamGage1Data2019 = [];
        streamGage1Data2019wtMean = ["2019"];
        streamGage1Data2019wtSum = ["2019"];
        streamGage1Data2019dchMean = ["2019"];
        streamGage1Data2019dchSum = ["2019"];
        streamGage1Data2018 = [];
        streamGage1Data2018wtMean = ["2018"];
        streamGage1Data2018wtSum = ["2018"];
        streamGage1Data2018dchMean = ["2018"];
        streamGage1Data2018dchSum = ["2018"];
        streamGage1Data2017 = [];
        streamGage1Data2017wtMean = ["2017"];
        streamGage1Data2017wtSum = ["2017"];
        streamGage1Data2017dchMean = ["2017"];
        streamGage1Data2017dchSum = ["2017"];
        streamGage1Data2016 = [];
        streamGage1Data2016wtMean = ["2016"];
        streamGage1Data2016wtSum = ["2016"];
        streamGage1Data2016dchMean = ["2016"];
        streamGage1Data2016dchSum = ["2016"];
        streamGage1Data2015 = [];
        streamGage1Data2015wtMean = ["2015"];
        streamGage1Data2015wtSum = ["2015"];
        streamGage1Data2015dchMean = ["2015"];
        streamGage1Data2015dchSum = ["2015"];
        streamGage1Data2014 = [];
        streamGage1Data2014wtMean = ["2014"];
        streamGage1Data2014wtSum = ["2014"];
        streamGage1Data2014dchMean = ["2014"];
        streamGage1Data2014dchSum = ["2014"];
        streamGage1Data2013 = [];
        streamGage1Data2013wtMean = ["2013"];
        streamGage1Data2013wtSum = ["2013"];
        streamGage1Data2013dchMean = ["2013"];
        streamGage1Data2013dchSum = ["2013"];
        streamGage1Data2012 = [];
        streamGage1Data2012wtMean = ["2012"];
        streamGage1Data2012wtSum = ["2012"];
        streamGage1Data2012dchMean = ["2012"];
        streamGage1Data2012dchSum = ["2012"];
        streamGage1Data2011 = [];
        streamGage1Data2011wtMean = ["2011"];
        streamGage1Data2011wtSum = ["2011"];
        streamGage1Data2011dchMean = ["2011"];
        streamGage1Data2011dchSum = ["2011"];
        streamGage1Data2010 = [];
        streamGage1Data2010wtMean = ["2010"];
        streamGage1Data2010wtSum = ["2010"];
        streamGage1Data2010dchMean = ["2010"];
        streamGage1Data2010dchSum = ["2010"];

        var siteSelect = {
          name: gageID,
          wt: water_temp,
          wt2020: water_temp2020,
          wt2021: water_temp2021,
          wtM2021: streamGage1Data2021wtMean,
          wtS2021: streamGage1Data2021wtSum,
          dchM2021: streamGage1Data2021dchMean,
          dchS2021: streamGage1Data2021dchSum,
          wtM2020: streamGage1Data2020wtMean,
          wtS2020: streamGage1Data2020wtSum,
          dchM2020: streamGage1Data2020dchMean,
          dchS2020: streamGage1Data2020dchSum,
          wtM2019: streamGage1Data2019wtMean,
          wtS2019: streamGage1Data2019wtSum,
          dchM2019: streamGage1Data2019dchMean,
          dchS2019: streamGage1Data2019dchSum,
          wtM2018: streamGage1Data2018wtMean,
          wtS2018: streamGage1Data2018wtSum,
          dchM2018: streamGage1Data2018dchMean,
          dchS2018: streamGage1Data2018dchSum,
          wtM2017: streamGage1Data2017wtMean,
          wtS2017: streamGage1Data2017wtSum,
          dchM2017: streamGage1Data2017dchMean,
          dchS2017: streamGage1Data2017dchSum,
          wtM2016: streamGage1Data2016wtMean,
          wtS2016: streamGage1Data2016wtSum,
          dchM2016: streamGage1Data2016dchMean,
          dchS2016: streamGage1Data2016dchSum,
          wtM2015: streamGage1Data2015wtMean,
          wtS2015: streamGage1Data2015wtSum,
          dchM2015: streamGage1Data2015dchMean,
          dchS2015: streamGage1Data2015dchSum,
          wtM2014: streamGage1Data2014wtMean,
          wtS2014: streamGage1Data2014wtSum,
          dchM2014: streamGage1Data2014dchMean,
          dchS2014: streamGage1Data2014dchSum,
          wtM2013: streamGage1Data2013wtMean,
          wtS2013: streamGage1Data2013wtSum,
          dchM2013: streamGage1Data2013dchMean,
          dchS2013: streamGage1Data2013dchSum,
          wtM2012: streamGage1Data2012wtMean,
          wtS2012: streamGage1Data2012wtSum,
          dchM2012: streamGage1Data2012dchMean,
          dchS2012: streamGage1Data2012dchSum,
          wtM2011: streamGage1Data2011wtMean,
          wtS2011: streamGage1Data2011wtSum,
          dchM2011: streamGage1Data2011dchMean,
          dchS2011: streamGage1Data2011dchSum,
          wtM2010: streamGage1Data2010wtMean,
          wtS2010: streamGage1Data2010wtSum,
          dchM2010: streamGage1Data2010dchMean,
          dchS2010: streamGage1Data2010dchSum,
        }

        siteCounts(siteSelect);


        chart.load({
          columns: [siteSelect.wtM2010],
        });
        chart2.load({
          columns: [siteSelect.wtM2010],
        });
        h20SumChart.load({
          columns: [siteSelect.wtS2010],
        });
        dchMeanChart.load({
          columns: [siteSelect.dchM2010],
        });
        dchSumChart.load({
          columns: [siteSelect.dchS2010],
        });
        var stroke = chart.color('2010');
        $("#gage2010").css('color', stroke);

      } else {
        chart.unload({
          ids: ["2010"],
        });
        chart2.unload({
          ids: ["2010"],
        });
        h20SumChart.unload({
          ids: ["2010"],
        });
        dchMeanChart.unload({
          ids: ["2010"],
        });
        dchSumChart.unload({
          ids: ["2010"],
        });
        $("#gage2010").css('color', 'white');

      }

    });

    // Weather Year Selection
    $("#weather2021").on("click", function() {
      color2021 = $("#weather2021").css('color');
      if (color2021 == 'rgb(255, 255, 255)') {
        // Weather Data
        var wt = ["Date"];
        var wt2020 = ["Date"];
        var wt2021 = ["Date"];
        var precip = ["Precipitation"];
        var precip2020 = ["2020"];
        var precip2021 = ["2021"];
        var airTemp = ["Air Temperature"];
        var airTemp2020 = ["2020"];
        var airTemp2021 = ["2021"];
        weatherData2021 = [];
        weatherData2021pcMean = ["2021"];
        weatherData2021pcSum = ["2021"];
        weatherData2021atempMean = ["2021"];
        weatherData2021atempSum = ["2021"];
        weatherData2020 = [];
        weatherData2020pcMean = ["2020"];
        weatherData2020pcSum = ["2020"];
        weatherData2020atempMean = ["2020"];
        weatherData2020atempSum = ["2020"];
        weatherData2019 = [];
        weatherData2019pcMean = ["2019"];
        weatherData2019pcSum = ["2019"];
        weatherData2019atempMean = ["2019"];
        weatherData2019atempSum = ["2019"];
        weatherData2018 = [];
        weatherData2018pcMean = ["2018"];
        weatherData2018pcSum = ["2018"];
        weatherData2018atempMean = ["2018"];
        weatherData2018atempSum = ["2018"];
        weatherData2017 = [];
        weatherData2017pcMean = ["2017"];
        weatherData2017pcSum = ["2017"];
        weatherData2017atempMean = ["2017"];
        weatherData2017atempSum = ["2017"];
        weatherData2016 = [];
        weatherData2016pcMean = ["2016"];
        weatherData2016pcSum = ["2016"];
        weatherData2016atempMean = ["2016"];
        weatherData2016atempSum = ["2016"];
        weatherData2015 = [];
        weatherData2015pcMean = ["2015"];
        weatherData2015pcSum = ["2015"];
        weatherData2015atempMean = ["2015"];
        weatherData2015atempSum = ["2015"];
        weatherData2014 = [];
        weatherData2014pcMean = ["2014"];
        weatherData2014pcSum = ["2014"];
        weatherData2014atempMean = ["2014"];
        weatherData2014atempSum = ["2014"];
        weatherData2013 = [];
        weatherData2013pcMean = ["2013"];
        weatherData2013pcSum = ["2013"];
        weatherData2013atempMean = ["2013"];
        weatherData2013atempSum = ["2013"];
        weatherData2012 = [];
        weatherData2012pcMean = ["2012"];
        weatherData2012pcSum = ["2012"];
        weatherData2012atempMean = ["2012"];
        weatherData2012atempSum = ["2012"];

        var weatherVars = {
          name: "Precip",
          p: precip,
          p2020: precip2020,
          p2021: precip2021,
          a: airTemp,
          a2020: airTemp2020,
          a2021: airTemp2021,
          pcM2021: weatherData2021pcMean,
          pcS2021: weatherData2021pcSum,
          atempM2021: weatherData2021atempMean,
          atempS2021: weatherData2021atempSum,
          pcM2020: weatherData2020pcMean,
          pcS2020: weatherData2020pcSum,
          atempM2020: weatherData2020atempMean,
          atempS2020: weatherData2020atempSum,
          pcM2019: weatherData2019pcMean,
          pcS2019: weatherData2019pcSum,
          atempM2019: weatherData2019atempMean,
          atempS2019: weatherData2019atempSum,
          pcM2018: weatherData2018pcMean,
          pcS2018: weatherData2018pcSum,
          atempM2018: weatherData2018atempMean,
          atempS2018: weatherData2018atempSum,
          pcM2017: weatherData2017pcMean,
          pcS2017: weatherData2017pcSum,
          atempM2017: weatherData2017atempMean,
          atempS2017: weatherData2017atempSum,
          pcM2016: weatherData2016pcMean,
          pcS2016: weatherData2016pcSum,
          atempM2016: weatherData2016atempMean,
          atempS2016: weatherData2016atempSum,
          pcM2015: weatherData2015pcMean,
          pcS2015: weatherData2015pcSum,
          atempM2015: weatherData2015atempMean,
          atempS2015: weatherData2015atempSum,
          pcM2014: weatherData2014pcMean,
          pcS2014: weatherData2014pcSum,
          atempM2014: weatherData2014atempMean,
          atempS2014: weatherData2014atempSum,
          pcM2013: weatherData2013pcMean,
          pcS2013: weatherData2013pcSum,
          atempM2013: weatherData2013atempMean,
          atempS2013: weatherData2013atempSum,
          pcM2012: weatherData2012pcMean,
          pcS2012: weatherData2012pcSum,
          atempM2012: weatherData2012atempMean,
          atempS2012: weatherData2012atempSum,
        }

        varsCounts(weatherVars);


        precipSubChart.load({
          columns: [weatherVars.pcM2021],
        });
        precipChart.load({
          columns: [weatherVars.pcM2021],
        });
        aitTempChart.load({
          columns: [weatherVars.atempM2021],
        });
        precipSumChart.load({
          columns: [weatherVars.pcS2021],
        });
        aitTempSumChart.load({
          columns: [weatherVars.atempS2021],
        });
        var stroke = precipSubChart.color('2021');
        $("#weather2021").css('color', stroke);

      } else {
        precipSubChart.unload({
          ids: ["2021"],
        });
        precipChart.unload({
          ids: ["2021"],
        });
        aitTempChart.unload({
          ids: ["2021"],
        });
        precipSumChart.unload({
          ids: ["2021"],
        });
        aitTempSumChart.unload({
          ids: ["2021"],
        });
        $("#weather2021").css('color', 'white');

      }

    });
    $("#weather2020").on("click", function() {
      color2020 = $("#weather2020").css('color');
      if (color2020 == 'rgb(255, 255, 255)') {
        // Weather Data
        var wt = ["Date"];
        var wt2020 = ["Date"];
        var wt2021 = ["Date"];
        var precip = ["Precipitation"];
        var precip2020 = ["2020"];
        var precip2021 = ["2021"];
        var airTemp = ["Air Temperature"];
        var airTemp2020 = ["2020"];
        var airTemp2021 = ["2021"];
        weatherData2021 = [];
        weatherData2021pcMean = ["2021"];
        weatherData2021pcSum = ["2021"];
        weatherData2021atempMean = ["2021"];
        weatherData2021atempSum = ["2021"];
        weatherData2020 = [];
        weatherData2020pcMean = ["2020"];
        weatherData2020pcSum = ["2020"];
        weatherData2020atempMean = ["2020"];
        weatherData2020atempSum = ["2020"];
        weatherData2019 = [];
        weatherData2019pcMean = ["2019"];
        weatherData2019pcSum = ["2019"];
        weatherData2019atempMean = ["2019"];
        weatherData2019atempSum = ["2019"];
        weatherData2018 = [];
        weatherData2018pcMean = ["2018"];
        weatherData2018pcSum = ["2018"];
        weatherData2018atempMean = ["2018"];
        weatherData2018atempSum = ["2018"];
        weatherData2017 = [];
        weatherData2017pcMean = ["2017"];
        weatherData2017pcSum = ["2017"];
        weatherData2017atempMean = ["2017"];
        weatherData2017atempSum = ["2017"];
        weatherData2016 = [];
        weatherData2016pcMean = ["2016"];
        weatherData2016pcSum = ["2016"];
        weatherData2016atempMean = ["2016"];
        weatherData2016atempSum = ["2016"];
        weatherData2015 = [];
        weatherData2015pcMean = ["2015"];
        weatherData2015pcSum = ["2015"];
        weatherData2015atempMean = ["2015"];
        weatherData2015atempSum = ["2015"];
        weatherData2014 = [];
        weatherData2014pcMean = ["2014"];
        weatherData2014pcSum = ["2014"];
        weatherData2014atempMean = ["2014"];
        weatherData2014atempSum = ["2014"];
        weatherData2013 = [];
        weatherData2013pcMean = ["2013"];
        weatherData2013pcSum = ["2013"];
        weatherData2013atempMean = ["2013"];
        weatherData2013atempSum = ["2013"];
        weatherData2012 = [];
        weatherData2012pcMean = ["2012"];
        weatherData2012pcSum = ["2012"];
        weatherData2012atempMean = ["2012"];
        weatherData2012atempSum = ["2012"];

        var weatherVars = {
          name: "Precip",
          p: precip,
          p2020: precip2020,
          p2021: precip2021,
          a: airTemp,
          a2020: airTemp2020,
          a2021: airTemp2021,
          pcM2021: weatherData2021pcMean,
          pcS2021: weatherData2021pcSum,
          atempM2021: weatherData2021atempMean,
          atempS2021: weatherData2021atempSum,
          pcM2020: weatherData2020pcMean,
          pcS2020: weatherData2020pcSum,
          atempM2020: weatherData2020atempMean,
          atempS2020: weatherData2020atempSum,
          pcM2019: weatherData2019pcMean,
          pcS2019: weatherData2019pcSum,
          atempM2019: weatherData2019atempMean,
          atempS2019: weatherData2019atempSum,
          pcM2018: weatherData2018pcMean,
          pcS2018: weatherData2018pcSum,
          atempM2018: weatherData2018atempMean,
          atempS2018: weatherData2018atempSum,
          pcM2017: weatherData2017pcMean,
          pcS2017: weatherData2017pcSum,
          atempM2017: weatherData2017atempMean,
          atempS2017: weatherData2017atempSum,
          pcM2016: weatherData2016pcMean,
          pcS2016: weatherData2016pcSum,
          atempM2016: weatherData2016atempMean,
          atempS2016: weatherData2016atempSum,
          pcM2015: weatherData2015pcMean,
          pcS2015: weatherData2015pcSum,
          atempM2015: weatherData2015atempMean,
          atempS2015: weatherData2015atempSum,
          pcM2014: weatherData2014pcMean,
          pcS2014: weatherData2014pcSum,
          atempM2014: weatherData2014atempMean,
          atempS2014: weatherData2014atempSum,
          pcM2013: weatherData2013pcMean,
          pcS2013: weatherData2013pcSum,
          atempM2013: weatherData2013atempMean,
          atempS2013: weatherData2013atempSum,
          pcM2012: weatherData2012pcMean,
          pcS2012: weatherData2012pcSum,
          atempM2012: weatherData2012atempMean,
          atempS2012: weatherData2012atempSum,
        }

        varsCounts(weatherVars);


        precipSubChart.load({
          columns: [weatherVars.pcM2020],
        });
        precipChart.load({
          columns: [weatherVars.pcM2020],
        });
        aitTempChart.load({
          columns: [weatherVars.atempM2020],
        });
        precipSumChart.load({
          columns: [weatherVars.pcS2020],
        });
        aitTempSumChart.load({
          columns: [weatherVars.atempS2020],
        });
        var stroke = precipSubChart.color('2020');
        $("#weather2020").css('color', stroke);

      } else {
        precipSubChart.unload({
          ids: ["2020"],
        });
        precipChart.unload({
          ids: ["2020"],
        });
        aitTempChart.unload({
          ids: ["2020"],
        });
        precipSumChart.unload({
          ids: ["2020"],
        });
        aitTempSumChart.unload({
          ids: ["2020"],
        });
        $("#weather2020").css('color', 'white');

      }

    });
    $("#weather2019").on("click", function() {
      color2019 = $("#weather2019").css('color');
      if (color2019 == 'rgb(255, 255, 255)') {
        // Weather Data
        var wt = ["Date"];
        var wt2020 = ["Date"];
        var wt2021 = ["Date"];
        var precip = ["Precipitation"];
        var precip2020 = ["2020"];
        var precip2021 = ["2021"];
        var airTemp = ["Air Temperature"];
        var airTemp2020 = ["2020"];
        var airTemp2021 = ["2021"];
        weatherData2021 = [];
        weatherData2021pcMean = ["2021"];
        weatherData2021pcSum = ["2021"];
        weatherData2021atempMean = ["2021"];
        weatherData2021atempSum = ["2021"];
        weatherData2020 = [];
        weatherData2020pcMean = ["2020"];
        weatherData2020pcSum = ["2020"];
        weatherData2020atempMean = ["2020"];
        weatherData2020atempSum = ["2020"];
        weatherData2019 = [];
        weatherData2019pcMean = ["2019"];
        weatherData2019pcSum = ["2019"];
        weatherData2019atempMean = ["2019"];
        weatherData2019atempSum = ["2019"];
        weatherData2018 = [];
        weatherData2018pcMean = ["2018"];
        weatherData2018pcSum = ["2018"];
        weatherData2018atempMean = ["2018"];
        weatherData2018atempSum = ["2018"];
        weatherData2017 = [];
        weatherData2017pcMean = ["2017"];
        weatherData2017pcSum = ["2017"];
        weatherData2017atempMean = ["2017"];
        weatherData2017atempSum = ["2017"];
        weatherData2016 = [];
        weatherData2016pcMean = ["2016"];
        weatherData2016pcSum = ["2016"];
        weatherData2016atempMean = ["2016"];
        weatherData2016atempSum = ["2016"];
        weatherData2015 = [];
        weatherData2015pcMean = ["2015"];
        weatherData2015pcSum = ["2015"];
        weatherData2015atempMean = ["2015"];
        weatherData2015atempSum = ["2015"];
        weatherData2014 = [];
        weatherData2014pcMean = ["2014"];
        weatherData2014pcSum = ["2014"];
        weatherData2014atempMean = ["2014"];
        weatherData2014atempSum = ["2014"];
        weatherData2013 = [];
        weatherData2013pcMean = ["2013"];
        weatherData2013pcSum = ["2013"];
        weatherData2013atempMean = ["2013"];
        weatherData2013atempSum = ["2013"];
        weatherData2012 = [];
        weatherData2012pcMean = ["2012"];
        weatherData2012pcSum = ["2012"];
        weatherData2012atempMean = ["2012"];
        weatherData2012atempSum = ["2012"];

        var weatherVars = {
          name: "Precip",
          p: precip,
          p2020: precip2020,
          p2021: precip2021,
          a: airTemp,
          a2020: airTemp2020,
          a2021: airTemp2021,
          pcM2021: weatherData2021pcMean,
          pcS2021: weatherData2021pcSum,
          atempM2021: weatherData2021atempMean,
          atempS2021: weatherData2021atempSum,
          pcM2020: weatherData2020pcMean,
          pcS2020: weatherData2020pcSum,
          atempM2020: weatherData2020atempMean,
          atempS2020: weatherData2020atempSum,
          pcM2019: weatherData2019pcMean,
          pcS2019: weatherData2019pcSum,
          atempM2019: weatherData2019atempMean,
          atempS2019: weatherData2019atempSum,
          pcM2018: weatherData2018pcMean,
          pcS2018: weatherData2018pcSum,
          atempM2018: weatherData2018atempMean,
          atempS2018: weatherData2018atempSum,
          pcM2017: weatherData2017pcMean,
          pcS2017: weatherData2017pcSum,
          atempM2017: weatherData2017atempMean,
          atempS2017: weatherData2017atempSum,
          pcM2016: weatherData2016pcMean,
          pcS2016: weatherData2016pcSum,
          atempM2016: weatherData2016atempMean,
          atempS2016: weatherData2016atempSum,
          pcM2015: weatherData2015pcMean,
          pcS2015: weatherData2015pcSum,
          atempM2015: weatherData2015atempMean,
          atempS2015: weatherData2015atempSum,
          pcM2014: weatherData2014pcMean,
          pcS2014: weatherData2014pcSum,
          atempM2014: weatherData2014atempMean,
          atempS2014: weatherData2014atempSum,
          pcM2013: weatherData2013pcMean,
          pcS2013: weatherData2013pcSum,
          atempM2013: weatherData2013atempMean,
          atempS2013: weatherData2013atempSum,
          pcM2012: weatherData2012pcMean,
          pcS2012: weatherData2012pcSum,
          atempM2012: weatherData2012atempMean,
          atempS2012: weatherData2012atempSum,
        }

        varsCounts(weatherVars);


        precipSubChart.load({
          columns: [weatherVars.pcM2019],
        });
        precipChart.load({
          columns: [weatherVars.pcM2019],
        });
        aitTempChart.load({
          columns: [weatherVars.atempM2019],
        });
        precipSumChart.load({
          columns: [weatherVars.pcS2019],
        });
        aitTempSumChart.load({
          columns: [weatherVars.atempS2019],
        });
        var stroke = precipSubChart.color('2019');
        $("#weather2019").css('color', stroke);

      } else {
        precipSubChart.unload({
          ids: ["2019"],
        });
        precipChart.unload({
          ids: ["2019"],
        });
        aitTempChart.unload({
          ids: ["2019"],
        });
        precipSumChart.unload({
          ids: ["2019"],
        });
        aitTempSumChart.unload({
          ids: ["2019"],
        });
        $("#weather2019").css('color', 'white');

      }

    });
    $("#weather2018").on("click", function() {
      color2018 = $("#weather2018").css('color');
      if (color2018 == 'rgb(255, 255, 255)') {
        // Weather Data
        var wt = ["Date"];
        var wt2020 = ["Date"];
        var wt2021 = ["Date"];
        var precip = ["Precipitation"];
        var precip2020 = ["2020"];
        var precip2021 = ["2021"];
        var airTemp = ["Air Temperature"];
        var airTemp2020 = ["2020"];
        var airTemp2021 = ["2021"];
        weatherData2021 = [];
        weatherData2021pcMean = ["2021"];
        weatherData2021pcSum = ["2021"];
        weatherData2021atempMean = ["2021"];
        weatherData2021atempSum = ["2021"];
        weatherData2020 = [];
        weatherData2020pcMean = ["2020"];
        weatherData2020pcSum = ["2020"];
        weatherData2020atempMean = ["2020"];
        weatherData2020atempSum = ["2020"];
        weatherData2019 = [];
        weatherData2019pcMean = ["2019"];
        weatherData2019pcSum = ["2019"];
        weatherData2019atempMean = ["2019"];
        weatherData2019atempSum = ["2019"];
        weatherData2018 = [];
        weatherData2018pcMean = ["2018"];
        weatherData2018pcSum = ["2018"];
        weatherData2018atempMean = ["2018"];
        weatherData2018atempSum = ["2018"];
        weatherData2017 = [];
        weatherData2017pcMean = ["2017"];
        weatherData2017pcSum = ["2017"];
        weatherData2017atempMean = ["2017"];
        weatherData2017atempSum = ["2017"];
        weatherData2016 = [];
        weatherData2016pcMean = ["2016"];
        weatherData2016pcSum = ["2016"];
        weatherData2016atempMean = ["2016"];
        weatherData2016atempSum = ["2016"];
        weatherData2015 = [];
        weatherData2015pcMean = ["2015"];
        weatherData2015pcSum = ["2015"];
        weatherData2015atempMean = ["2015"];
        weatherData2015atempSum = ["2015"];
        weatherData2014 = [];
        weatherData2014pcMean = ["2014"];
        weatherData2014pcSum = ["2014"];
        weatherData2014atempMean = ["2014"];
        weatherData2014atempSum = ["2014"];
        weatherData2013 = [];
        weatherData2013pcMean = ["2013"];
        weatherData2013pcSum = ["2013"];
        weatherData2013atempMean = ["2013"];
        weatherData2013atempSum = ["2013"];
        weatherData2012 = [];
        weatherData2012pcMean = ["2012"];
        weatherData2012pcSum = ["2012"];
        weatherData2012atempMean = ["2012"];
        weatherData2012atempSum = ["2012"];

        var weatherVars = {
          name: "Precip",
          p: precip,
          p2020: precip2020,
          p2021: precip2021,
          a: airTemp,
          a2020: airTemp2020,
          a2021: airTemp2021,
          pcM2021: weatherData2021pcMean,
          pcS2021: weatherData2021pcSum,
          atempM2021: weatherData2021atempMean,
          atempS2021: weatherData2021atempSum,
          pcM2020: weatherData2020pcMean,
          pcS2020: weatherData2020pcSum,
          atempM2020: weatherData2020atempMean,
          atempS2020: weatherData2020atempSum,
          pcM2019: weatherData2019pcMean,
          pcS2019: weatherData2019pcSum,
          atempM2019: weatherData2019atempMean,
          atempS2019: weatherData2019atempSum,
          pcM2018: weatherData2018pcMean,
          pcS2018: weatherData2018pcSum,
          atempM2018: weatherData2018atempMean,
          atempS2018: weatherData2018atempSum,
          pcM2017: weatherData2017pcMean,
          pcS2017: weatherData2017pcSum,
          atempM2017: weatherData2017atempMean,
          atempS2017: weatherData2017atempSum,
          pcM2016: weatherData2016pcMean,
          pcS2016: weatherData2016pcSum,
          atempM2016: weatherData2016atempMean,
          atempS2016: weatherData2016atempSum,
          pcM2015: weatherData2015pcMean,
          pcS2015: weatherData2015pcSum,
          atempM2015: weatherData2015atempMean,
          atempS2015: weatherData2015atempSum,
          pcM2014: weatherData2014pcMean,
          pcS2014: weatherData2014pcSum,
          atempM2014: weatherData2014atempMean,
          atempS2014: weatherData2014atempSum,
          pcM2013: weatherData2013pcMean,
          pcS2013: weatherData2013pcSum,
          atempM2013: weatherData2013atempMean,
          atempS2013: weatherData2013atempSum,
          pcM2012: weatherData2012pcMean,
          pcS2012: weatherData2012pcSum,
          atempM2012: weatherData2012atempMean,
          atempS2012: weatherData2012atempSum,
        }

        varsCounts(weatherVars);


        precipSubChart.load({
          columns: [weatherVars.pcM2018],
        });
        precipChart.load({
          columns: [weatherVars.pcM2018],
        });
        aitTempChart.load({
          columns: [weatherVars.atempM2018],
        });
        precipSumChart.load({
          columns: [weatherVars.pcS2018],
        });
        aitTempSumChart.load({
          columns: [weatherVars.atempS2018],
        });
        var stroke = precipSubChart.color('2018');
        $("#weather2018").css('color', stroke);

      } else {
        precipSubChart.unload({
          ids: ["2018"],
        });
        precipChart.unload({
          ids: ["2018"],
        });
        aitTempChart.unload({
          ids: ["2018"],
        });
        precipSumChart.unload({
          ids: ["2018"],
        });
        aitTempSumChart.unload({
          ids: ["2018"],
        });
        $("#weather2018").css('color', 'white');

      }

    });
    $("#weather2017").on("click", function() {
      color2017 = $("#weather2017").css('color');
      if (color2017 == 'rgb(255, 255, 255)') {
        // Weather Data
        var wt = ["Date"];
        var wt2020 = ["Date"];
        var wt2021 = ["Date"];
        var precip = ["Precipitation"];
        var precip2020 = ["2020"];
        var precip2021 = ["2021"];
        var airTemp = ["Air Temperature"];
        var airTemp2020 = ["2020"];
        var airTemp2021 = ["2021"];
        weatherData2021 = [];
        weatherData2021pcMean = ["2021"];
        weatherData2021pcSum = ["2021"];
        weatherData2021atempMean = ["2021"];
        weatherData2021atempSum = ["2021"];
        weatherData2020 = [];
        weatherData2020pcMean = ["2020"];
        weatherData2020pcSum = ["2020"];
        weatherData2020atempMean = ["2020"];
        weatherData2020atempSum = ["2020"];
        weatherData2019 = [];
        weatherData2019pcMean = ["2019"];
        weatherData2019pcSum = ["2019"];
        weatherData2019atempMean = ["2019"];
        weatherData2019atempSum = ["2019"];
        weatherData2018 = [];
        weatherData2018pcMean = ["2018"];
        weatherData2018pcSum = ["2018"];
        weatherData2018atempMean = ["2018"];
        weatherData2018atempSum = ["2018"];
        weatherData2017 = [];
        weatherData2017pcMean = ["2017"];
        weatherData2017pcSum = ["2017"];
        weatherData2017atempMean = ["2017"];
        weatherData2017atempSum = ["2017"];
        weatherData2016 = [];
        weatherData2016pcMean = ["2016"];
        weatherData2016pcSum = ["2016"];
        weatherData2016atempMean = ["2016"];
        weatherData2016atempSum = ["2016"];
        weatherData2015 = [];
        weatherData2015pcMean = ["2015"];
        weatherData2015pcSum = ["2015"];
        weatherData2015atempMean = ["2015"];
        weatherData2015atempSum = ["2015"];
        weatherData2014 = [];
        weatherData2014pcMean = ["2014"];
        weatherData2014pcSum = ["2014"];
        weatherData2014atempMean = ["2014"];
        weatherData2014atempSum = ["2014"];
        weatherData2013 = [];
        weatherData2013pcMean = ["2013"];
        weatherData2013pcSum = ["2013"];
        weatherData2013atempMean = ["2013"];
        weatherData2013atempSum = ["2013"];
        weatherData2012 = [];
        weatherData2012pcMean = ["2012"];
        weatherData2012pcSum = ["2012"];
        weatherData2012atempMean = ["2012"];
        weatherData2012atempSum = ["2012"];

        var weatherVars = {
          name: "Precip",
          p: precip,
          p2020: precip2020,
          p2021: precip2021,
          a: airTemp,
          a2020: airTemp2020,
          a2021: airTemp2021,
          pcM2021: weatherData2021pcMean,
          pcS2021: weatherData2021pcSum,
          atempM2021: weatherData2021atempMean,
          atempS2021: weatherData2021atempSum,
          pcM2020: weatherData2020pcMean,
          pcS2020: weatherData2020pcSum,
          atempM2020: weatherData2020atempMean,
          atempS2020: weatherData2020atempSum,
          pcM2019: weatherData2019pcMean,
          pcS2019: weatherData2019pcSum,
          atempM2019: weatherData2019atempMean,
          atempS2019: weatherData2019atempSum,
          pcM2018: weatherData2018pcMean,
          pcS2018: weatherData2018pcSum,
          atempM2018: weatherData2018atempMean,
          atempS2018: weatherData2018atempSum,
          pcM2017: weatherData2017pcMean,
          pcS2017: weatherData2017pcSum,
          atempM2017: weatherData2017atempMean,
          atempS2017: weatherData2017atempSum,
          pcM2016: weatherData2016pcMean,
          pcS2016: weatherData2016pcSum,
          atempM2016: weatherData2016atempMean,
          atempS2016: weatherData2016atempSum,
          pcM2015: weatherData2015pcMean,
          pcS2015: weatherData2015pcSum,
          atempM2015: weatherData2015atempMean,
          atempS2015: weatherData2015atempSum,
          pcM2014: weatherData2014pcMean,
          pcS2014: weatherData2014pcSum,
          atempM2014: weatherData2014atempMean,
          atempS2014: weatherData2014atempSum,
          pcM2013: weatherData2013pcMean,
          pcS2013: weatherData2013pcSum,
          atempM2013: weatherData2013atempMean,
          atempS2013: weatherData2013atempSum,
          pcM2012: weatherData2012pcMean,
          pcS2012: weatherData2012pcSum,
          atempM2012: weatherData2012atempMean,
          atempS2012: weatherData2012atempSum,
        }

        varsCounts(weatherVars);


        precipSubChart.load({
          columns: [weatherVars.pcM2017],
        });
        precipChart.load({
          columns: [weatherVars.pcM2017],
        });
        aitTempChart.load({
          columns: [weatherVars.atempM2017],
        });
        precipSumChart.load({
          columns: [weatherVars.pcS2017],
        });
        aitTempSumChart.load({
          columns: [weatherVars.atempS2017],
        });
        var stroke = precipSubChart.color('2017');
        $("#weather2017").css('color', stroke);

      } else {
        precipSubChart.unload({
          ids: ["2017"],
        });
        precipChart.unload({
          ids: ["2017"],
        });
        aitTempChart.unload({
          ids: ["2017"],
        });
        precipSumChart.unload({
          ids: ["2017"],
        });
        aitTempSumChart.unload({
          ids: ["2017"],
        });
        $("#weather2017").css('color', 'white');

      }

    });
    $("#weather2016").on("click", function() {
      color2016 = $("#weather2016").css('color');
      if (color2016 == 'rgb(255, 255, 255)') {
        // Weather Data
        var wt = ["Date"];
        var wt2020 = ["Date"];
        var wt2021 = ["Date"];
        var precip = ["Precipitation"];
        var precip2020 = ["2020"];
        var precip2021 = ["2021"];
        var airTemp = ["Air Temperature"];
        var airTemp2020 = ["2020"];
        var airTemp2021 = ["2021"];
        weatherData2021 = [];
        weatherData2021pcMean = ["2021"];
        weatherData2021pcSum = ["2021"];
        weatherData2021atempMean = ["2021"];
        weatherData2021atempSum = ["2021"];
        weatherData2020 = [];
        weatherData2020pcMean = ["2020"];
        weatherData2020pcSum = ["2020"];
        weatherData2020atempMean = ["2020"];
        weatherData2020atempSum = ["2020"];
        weatherData2019 = [];
        weatherData2019pcMean = ["2019"];
        weatherData2019pcSum = ["2019"];
        weatherData2019atempMean = ["2019"];
        weatherData2019atempSum = ["2019"];
        weatherData2018 = [];
        weatherData2018pcMean = ["2018"];
        weatherData2018pcSum = ["2018"];
        weatherData2018atempMean = ["2018"];
        weatherData2018atempSum = ["2018"];
        weatherData2017 = [];
        weatherData2017pcMean = ["2017"];
        weatherData2017pcSum = ["2017"];
        weatherData2017atempMean = ["2017"];
        weatherData2017atempSum = ["2017"];
        weatherData2016 = [];
        weatherData2016pcMean = ["2016"];
        weatherData2016pcSum = ["2016"];
        weatherData2016atempMean = ["2016"];
        weatherData2016atempSum = ["2016"];
        weatherData2015 = [];
        weatherData2015pcMean = ["2015"];
        weatherData2015pcSum = ["2015"];
        weatherData2015atempMean = ["2015"];
        weatherData2015atempSum = ["2015"];
        weatherData2014 = [];
        weatherData2014pcMean = ["2014"];
        weatherData2014pcSum = ["2014"];
        weatherData2014atempMean = ["2014"];
        weatherData2014atempSum = ["2014"];
        weatherData2013 = [];
        weatherData2013pcMean = ["2013"];
        weatherData2013pcSum = ["2013"];
        weatherData2013atempMean = ["2013"];
        weatherData2013atempSum = ["2013"];
        weatherData2012 = [];
        weatherData2012pcMean = ["2012"];
        weatherData2012pcSum = ["2012"];
        weatherData2012atempMean = ["2012"];
        weatherData2012atempSum = ["2012"];

        var weatherVars = {
          name: "Precip",
          p: precip,
          p2020: precip2020,
          p2021: precip2021,
          a: airTemp,
          a2020: airTemp2020,
          a2021: airTemp2021,
          pcM2021: weatherData2021pcMean,
          pcS2021: weatherData2021pcSum,
          atempM2021: weatherData2021atempMean,
          atempS2021: weatherData2021atempSum,
          pcM2020: weatherData2020pcMean,
          pcS2020: weatherData2020pcSum,
          atempM2020: weatherData2020atempMean,
          atempS2020: weatherData2020atempSum,
          pcM2019: weatherData2019pcMean,
          pcS2019: weatherData2019pcSum,
          atempM2019: weatherData2019atempMean,
          atempS2019: weatherData2019atempSum,
          pcM2018: weatherData2018pcMean,
          pcS2018: weatherData2018pcSum,
          atempM2018: weatherData2018atempMean,
          atempS2018: weatherData2018atempSum,
          pcM2017: weatherData2017pcMean,
          pcS2017: weatherData2017pcSum,
          atempM2017: weatherData2017atempMean,
          atempS2017: weatherData2017atempSum,
          pcM2016: weatherData2016pcMean,
          pcS2016: weatherData2016pcSum,
          atempM2016: weatherData2016atempMean,
          atempS2016: weatherData2016atempSum,
          pcM2015: weatherData2015pcMean,
          pcS2015: weatherData2015pcSum,
          atempM2015: weatherData2015atempMean,
          atempS2015: weatherData2015atempSum,
          pcM2014: weatherData2014pcMean,
          pcS2014: weatherData2014pcSum,
          atempM2014: weatherData2014atempMean,
          atempS2014: weatherData2014atempSum,
          pcM2013: weatherData2013pcMean,
          pcS2013: weatherData2013pcSum,
          atempM2013: weatherData2013atempMean,
          atempS2013: weatherData2013atempSum,
          pcM2012: weatherData2012pcMean,
          pcS2012: weatherData2012pcSum,
          atempM2012: weatherData2012atempMean,
          atempS2012: weatherData2012atempSum,
        }

        varsCounts(weatherVars);


        precipSubChart.load({
          columns: [weatherVars.pcM2016],
        });
        precipChart.load({
          columns: [weatherVars.pcM2016],
        });
        aitTempChart.load({
          columns: [weatherVars.atempM2016],
        });
        precipSumChart.load({
          columns: [weatherVars.pcS2016],
        });
        aitTempSumChart.load({
          columns: [weatherVars.atempS2016],
        });
        var stroke = precipSubChart.color('2016');
        $("#weather2016").css('color', stroke);

      } else {
        precipSubChart.unload({
          ids: ["2016"],
        });
        precipChart.unload({
          ids: ["2016"],
        });
        aitTempChart.unload({
          ids: ["2016"],
        });
        precipSumChart.unload({
          ids: ["2016"],
        });
        aitTempSumChart.unload({
          ids: ["2016"],
        });
        $("#weather2016").css('color', 'white');

      }

    });
    $("#weather2015").on("click", function() {
      color2015 = $("#weather2015").css('color');
      if (color2015 == 'rgb(255, 255, 255)') {
        // Weather Data
        var wt = ["Date"];
        var wt2020 = ["Date"];
        var wt2021 = ["Date"];
        var precip = ["Precipitation"];
        var precip2020 = ["2020"];
        var precip2021 = ["2021"];
        var airTemp = ["Air Temperature"];
        var airTemp2020 = ["2020"];
        var airTemp2021 = ["2021"];
        weatherData2021 = [];
        weatherData2021pcMean = ["2021"];
        weatherData2021pcSum = ["2021"];
        weatherData2021atempMean = ["2021"];
        weatherData2021atempSum = ["2021"];
        weatherData2020 = [];
        weatherData2020pcMean = ["2020"];
        weatherData2020pcSum = ["2020"];
        weatherData2020atempMean = ["2020"];
        weatherData2020atempSum = ["2020"];
        weatherData2019 = [];
        weatherData2019pcMean = ["2019"];
        weatherData2019pcSum = ["2019"];
        weatherData2019atempMean = ["2019"];
        weatherData2019atempSum = ["2019"];
        weatherData2018 = [];
        weatherData2018pcMean = ["2018"];
        weatherData2018pcSum = ["2018"];
        weatherData2018atempMean = ["2018"];
        weatherData2018atempSum = ["2018"];
        weatherData2017 = [];
        weatherData2017pcMean = ["2017"];
        weatherData2017pcSum = ["2017"];
        weatherData2017atempMean = ["2017"];
        weatherData2017atempSum = ["2017"];
        weatherData2016 = [];
        weatherData2016pcMean = ["2016"];
        weatherData2016pcSum = ["2016"];
        weatherData2016atempMean = ["2016"];
        weatherData2016atempSum = ["2016"];
        weatherData2015 = [];
        weatherData2015pcMean = ["2015"];
        weatherData2015pcSum = ["2015"];
        weatherData2015atempMean = ["2015"];
        weatherData2015atempSum = ["2015"];
        weatherData2014 = [];
        weatherData2014pcMean = ["2014"];
        weatherData2014pcSum = ["2014"];
        weatherData2014atempMean = ["2014"];
        weatherData2014atempSum = ["2014"];
        weatherData2013 = [];
        weatherData2013pcMean = ["2013"];
        weatherData2013pcSum = ["2013"];
        weatherData2013atempMean = ["2013"];
        weatherData2013atempSum = ["2013"];
        weatherData2012 = [];
        weatherData2012pcMean = ["2012"];
        weatherData2012pcSum = ["2012"];
        weatherData2012atempMean = ["2012"];
        weatherData2012atempSum = ["2012"];

        var weatherVars = {
          name: "Precip",
          p: precip,
          p2020: precip2020,
          p2021: precip2021,
          a: airTemp,
          a2020: airTemp2020,
          a2021: airTemp2021,
          pcM2021: weatherData2021pcMean,
          pcS2021: weatherData2021pcSum,
          atempM2021: weatherData2021atempMean,
          atempS2021: weatherData2021atempSum,
          pcM2020: weatherData2020pcMean,
          pcS2020: weatherData2020pcSum,
          atempM2020: weatherData2020atempMean,
          atempS2020: weatherData2020atempSum,
          pcM2019: weatherData2019pcMean,
          pcS2019: weatherData2019pcSum,
          atempM2019: weatherData2019atempMean,
          atempS2019: weatherData2019atempSum,
          pcM2018: weatherData2018pcMean,
          pcS2018: weatherData2018pcSum,
          atempM2018: weatherData2018atempMean,
          atempS2018: weatherData2018atempSum,
          pcM2017: weatherData2017pcMean,
          pcS2017: weatherData2017pcSum,
          atempM2017: weatherData2017atempMean,
          atempS2017: weatherData2017atempSum,
          pcM2016: weatherData2016pcMean,
          pcS2016: weatherData2016pcSum,
          atempM2016: weatherData2016atempMean,
          atempS2016: weatherData2016atempSum,
          pcM2015: weatherData2015pcMean,
          pcS2015: weatherData2015pcSum,
          atempM2015: weatherData2015atempMean,
          atempS2015: weatherData2015atempSum,
          pcM2014: weatherData2014pcMean,
          pcS2014: weatherData2014pcSum,
          atempM2014: weatherData2014atempMean,
          atempS2014: weatherData2014atempSum,
          pcM2013: weatherData2013pcMean,
          pcS2013: weatherData2013pcSum,
          atempM2013: weatherData2013atempMean,
          atempS2013: weatherData2013atempSum,
          pcM2012: weatherData2012pcMean,
          pcS2012: weatherData2012pcSum,
          atempM2012: weatherData2012atempMean,
          atempS2012: weatherData2012atempSum,
        }

        varsCounts(weatherVars);


        precipSubChart.load({
          columns: [weatherVars.pcM2015],
        });
        precipChart.load({
          columns: [weatherVars.pcM2015],
        });
        aitTempChart.load({
          columns: [weatherVars.atempM2015],
        });
        precipSumChart.load({
          columns: [weatherVars.pcS2015],
        });
        aitTempSumChart.load({
          columns: [weatherVars.atempS2015],
        });
        var stroke = precipSubChart.color('2015');
        $("#weather2015").css('color', stroke);

      } else {
        precipSubChart.unload({
          ids: ["2015"],
        });
        precipChart.unload({
          ids: ["2015"],
        });
        aitTempChart.unload({
          ids: ["2015"],
        });
        precipSumChart.unload({
          ids: ["2015"],
        });
        aitTempSumChart.unload({
          ids: ["2015"],
        });
        $("#weather2015").css('color', 'white');

      }

    });
    $("#weather2014").on("click", function() {
      color2014 = $("#weather2014").css('color');
      if (color2014 == 'rgb(255, 255, 255)') {
        // Weather Data
        var wt = ["Date"];
        var wt2020 = ["Date"];
        var wt2021 = ["Date"];
        var precip = ["Precipitation"];
        var precip2020 = ["2020"];
        var precip2021 = ["2021"];
        var airTemp = ["Air Temperature"];
        var airTemp2020 = ["2020"];
        var airTemp2021 = ["2021"];
        weatherData2021 = [];
        weatherData2021pcMean = ["2021"];
        weatherData2021pcSum = ["2021"];
        weatherData2021atempMean = ["2021"];
        weatherData2021atempSum = ["2021"];
        weatherData2020 = [];
        weatherData2020pcMean = ["2020"];
        weatherData2020pcSum = ["2020"];
        weatherData2020atempMean = ["2020"];
        weatherData2020atempSum = ["2020"];
        weatherData2019 = [];
        weatherData2019pcMean = ["2019"];
        weatherData2019pcSum = ["2019"];
        weatherData2019atempMean = ["2019"];
        weatherData2019atempSum = ["2019"];
        weatherData2018 = [];
        weatherData2018pcMean = ["2018"];
        weatherData2018pcSum = ["2018"];
        weatherData2018atempMean = ["2018"];
        weatherData2018atempSum = ["2018"];
        weatherData2017 = [];
        weatherData2017pcMean = ["2017"];
        weatherData2017pcSum = ["2017"];
        weatherData2017atempMean = ["2017"];
        weatherData2017atempSum = ["2017"];
        weatherData2016 = [];
        weatherData2016pcMean = ["2016"];
        weatherData2016pcSum = ["2016"];
        weatherData2016atempMean = ["2016"];
        weatherData2016atempSum = ["2016"];
        weatherData2015 = [];
        weatherData2015pcMean = ["2015"];
        weatherData2015pcSum = ["2015"];
        weatherData2015atempMean = ["2015"];
        weatherData2015atempSum = ["2015"];
        weatherData2014 = [];
        weatherData2014pcMean = ["2014"];
        weatherData2014pcSum = ["2014"];
        weatherData2014atempMean = ["2014"];
        weatherData2014atempSum = ["2014"];
        weatherData2013 = [];
        weatherData2013pcMean = ["2013"];
        weatherData2013pcSum = ["2013"];
        weatherData2013atempMean = ["2013"];
        weatherData2013atempSum = ["2013"];
        weatherData2012 = [];
        weatherData2012pcMean = ["2012"];
        weatherData2012pcSum = ["2012"];
        weatherData2012atempMean = ["2012"];
        weatherData2012atempSum = ["2012"];

        var weatherVars = {
          name: "Precip",
          p: precip,
          p2020: precip2020,
          p2021: precip2021,
          a: airTemp,
          a2020: airTemp2020,
          a2021: airTemp2021,
          pcM2021: weatherData2021pcMean,
          pcS2021: weatherData2021pcSum,
          atempM2021: weatherData2021atempMean,
          atempS2021: weatherData2021atempSum,
          pcM2020: weatherData2020pcMean,
          pcS2020: weatherData2020pcSum,
          atempM2020: weatherData2020atempMean,
          atempS2020: weatherData2020atempSum,
          pcM2019: weatherData2019pcMean,
          pcS2019: weatherData2019pcSum,
          atempM2019: weatherData2019atempMean,
          atempS2019: weatherData2019atempSum,
          pcM2018: weatherData2018pcMean,
          pcS2018: weatherData2018pcSum,
          atempM2018: weatherData2018atempMean,
          atempS2018: weatherData2018atempSum,
          pcM2017: weatherData2017pcMean,
          pcS2017: weatherData2017pcSum,
          atempM2017: weatherData2017atempMean,
          atempS2017: weatherData2017atempSum,
          pcM2016: weatherData2016pcMean,
          pcS2016: weatherData2016pcSum,
          atempM2016: weatherData2016atempMean,
          atempS2016: weatherData2016atempSum,
          pcM2015: weatherData2015pcMean,
          pcS2015: weatherData2015pcSum,
          atempM2015: weatherData2015atempMean,
          atempS2015: weatherData2015atempSum,
          pcM2014: weatherData2014pcMean,
          pcS2014: weatherData2014pcSum,
          atempM2014: weatherData2014atempMean,
          atempS2014: weatherData2014atempSum,
          pcM2013: weatherData2013pcMean,
          pcS2013: weatherData2013pcSum,
          atempM2013: weatherData2013atempMean,
          atempS2013: weatherData2013atempSum,
          pcM2012: weatherData2012pcMean,
          pcS2012: weatherData2012pcSum,
          atempM2012: weatherData2012atempMean,
          atempS2012: weatherData2012atempSum,
        }

        varsCounts(weatherVars);


        precipSubChart.load({
          columns: [weatherVars.pcM2014],
        });
        precipChart.load({
          columns: [weatherVars.pcM2014],
        });
        aitTempChart.load({
          columns: [weatherVars.atempM2014],
        });
        precipSumChart.load({
          columns: [weatherVars.pcS2014],
        });
        aitTempSumChart.load({
          columns: [weatherVars.atempS2014],
        });
        var stroke = precipSubChart.color('2014');
        $("#weather2014").css('color', stroke);

      } else {
        precipSubChart.unload({
          ids: ["2014"],
        });
        precipChart.unload({
          ids: ["2014"],
        });
        aitTempChart.unload({
          ids: ["2014"],
        });
        precipSumChart.unload({
          ids: ["2014"],
        });
        aitTempSumChart.unload({
          ids: ["2014"],
        });
        $("#weather2014").css('color', 'white');

      }

    });
    $("#weather2013").on("click", function() {
      color2013 = $("#weather2013").css('color');
      if (color2013 == 'rgb(255, 255, 255)') {
        // Weather Data
        var wt = ["Date"];
        var wt2020 = ["Date"];
        var wt2021 = ["Date"];
        var precip = ["Precipitation"];
        var precip2020 = ["2020"];
        var precip2021 = ["2021"];
        var airTemp = ["Air Temperature"];
        var airTemp2020 = ["2020"];
        var airTemp2021 = ["2021"];
        weatherData2021 = [];
        weatherData2021pcMean = ["2021"];
        weatherData2021pcSum = ["2021"];
        weatherData2021atempMean = ["2021"];
        weatherData2021atempSum = ["2021"];
        weatherData2020 = [];
        weatherData2020pcMean = ["2020"];
        weatherData2020pcSum = ["2020"];
        weatherData2020atempMean = ["2020"];
        weatherData2020atempSum = ["2020"];
        weatherData2019 = [];
        weatherData2019pcMean = ["2019"];
        weatherData2019pcSum = ["2019"];
        weatherData2019atempMean = ["2019"];
        weatherData2019atempSum = ["2019"];
        weatherData2018 = [];
        weatherData2018pcMean = ["2018"];
        weatherData2018pcSum = ["2018"];
        weatherData2018atempMean = ["2018"];
        weatherData2018atempSum = ["2018"];
        weatherData2017 = [];
        weatherData2017pcMean = ["2017"];
        weatherData2017pcSum = ["2017"];
        weatherData2017atempMean = ["2017"];
        weatherData2017atempSum = ["2017"];
        weatherData2016 = [];
        weatherData2016pcMean = ["2016"];
        weatherData2016pcSum = ["2016"];
        weatherData2016atempMean = ["2016"];
        weatherData2016atempSum = ["2016"];
        weatherData2015 = [];
        weatherData2015pcMean = ["2015"];
        weatherData2015pcSum = ["2015"];
        weatherData2015atempMean = ["2015"];
        weatherData2015atempSum = ["2015"];
        weatherData2014 = [];
        weatherData2014pcMean = ["2014"];
        weatherData2014pcSum = ["2014"];
        weatherData2014atempMean = ["2014"];
        weatherData2014atempSum = ["2014"];
        weatherData2013 = [];
        weatherData2013pcMean = ["2013"];
        weatherData2013pcSum = ["2013"];
        weatherData2013atempMean = ["2013"];
        weatherData2013atempSum = ["2013"];
        weatherData2012 = [];
        weatherData2012pcMean = ["2012"];
        weatherData2012pcSum = ["2012"];
        weatherData2012atempMean = ["2012"];
        weatherData2012atempSum = ["2012"];

        var weatherVars = {
          name: "Precip",
          p: precip,
          p2020: precip2020,
          p2021: precip2021,
          a: airTemp,
          a2020: airTemp2020,
          a2021: airTemp2021,
          pcM2021: weatherData2021pcMean,
          pcS2021: weatherData2021pcSum,
          atempM2021: weatherData2021atempMean,
          atempS2021: weatherData2021atempSum,
          pcM2020: weatherData2020pcMean,
          pcS2020: weatherData2020pcSum,
          atempM2020: weatherData2020atempMean,
          atempS2020: weatherData2020atempSum,
          pcM2019: weatherData2019pcMean,
          pcS2019: weatherData2019pcSum,
          atempM2019: weatherData2019atempMean,
          atempS2019: weatherData2019atempSum,
          pcM2018: weatherData2018pcMean,
          pcS2018: weatherData2018pcSum,
          atempM2018: weatherData2018atempMean,
          atempS2018: weatherData2018atempSum,
          pcM2017: weatherData2017pcMean,
          pcS2017: weatherData2017pcSum,
          atempM2017: weatherData2017atempMean,
          atempS2017: weatherData2017atempSum,
          pcM2016: weatherData2016pcMean,
          pcS2016: weatherData2016pcSum,
          atempM2016: weatherData2016atempMean,
          atempS2016: weatherData2016atempSum,
          pcM2015: weatherData2015pcMean,
          pcS2015: weatherData2015pcSum,
          atempM2015: weatherData2015atempMean,
          atempS2015: weatherData2015atempSum,
          pcM2014: weatherData2014pcMean,
          pcS2014: weatherData2014pcSum,
          atempM2014: weatherData2014atempMean,
          atempS2014: weatherData2014atempSum,
          pcM2013: weatherData2013pcMean,
          pcS2013: weatherData2013pcSum,
          atempM2013: weatherData2013atempMean,
          atempS2013: weatherData2013atempSum,
          pcM2012: weatherData2012pcMean,
          pcS2012: weatherData2012pcSum,
          atempM2012: weatherData2012atempMean,
          atempS2012: weatherData2012atempSum,
        }

        varsCounts(weatherVars);


        precipSubChart.load({
          columns: [weatherVars.pcM2013],
        });
        precipChart.load({
          columns: [weatherVars.pcM2013],
        });
        aitTempChart.load({
          columns: [weatherVars.atempM2013],
        });
        precipSumChart.load({
          columns: [weatherVars.pcS2013],
        });
        aitTempSumChart.load({
          columns: [weatherVars.atempS2013],
        });
        var stroke = precipSubChart.color('2013');
        $("#weather2013").css('color', stroke);

      } else {
        precipSubChart.unload({
          ids: ["2013"],
        });
        precipChart.unload({
          ids: ["2013"],
        });
        aitTempChart.unload({
          ids: ["2013"],
        });
        precipSumChart.unload({
          ids: ["2013"],
        });
        aitTempSumChart.unload({
          ids: ["2013"],
        });
        $("#weather2013").css('color', 'white');

      }

    });
    $("#weather2012").on("click", function() {
      color2012 = $("#weather2012").css('color');
      if (color2012 == 'rgb(255, 255, 255)') {
        // Weather Data
        var wt = ["Date"];
        var wt2020 = ["Date"];
        var wt2021 = ["Date"];
        var precip = ["Precipitation"];
        var precip2020 = ["2020"];
        var precip2021 = ["2021"];
        var airTemp = ["Air Temperature"];
        var airTemp2020 = ["2020"];
        var airTemp2021 = ["2021"];
        weatherData2021 = [];
        weatherData2021pcMean = ["2021"];
        weatherData2021pcSum = ["2021"];
        weatherData2021atempMean = ["2021"];
        weatherData2021atempSum = ["2021"];
        weatherData2020 = [];
        weatherData2020pcMean = ["2020"];
        weatherData2020pcSum = ["2020"];
        weatherData2020atempMean = ["2020"];
        weatherData2020atempSum = ["2020"];
        weatherData2019 = [];
        weatherData2019pcMean = ["2019"];
        weatherData2019pcSum = ["2019"];
        weatherData2019atempMean = ["2019"];
        weatherData2019atempSum = ["2019"];
        weatherData2018 = [];
        weatherData2018pcMean = ["2018"];
        weatherData2018pcSum = ["2018"];
        weatherData2018atempMean = ["2018"];
        weatherData2018atempSum = ["2018"];
        weatherData2017 = [];
        weatherData2017pcMean = ["2017"];
        weatherData2017pcSum = ["2017"];
        weatherData2017atempMean = ["2017"];
        weatherData2017atempSum = ["2017"];
        weatherData2016 = [];
        weatherData2016pcMean = ["2016"];
        weatherData2016pcSum = ["2016"];
        weatherData2016atempMean = ["2016"];
        weatherData2016atempSum = ["2016"];
        weatherData2015 = [];
        weatherData2015pcMean = ["2015"];
        weatherData2015pcSum = ["2015"];
        weatherData2015atempMean = ["2015"];
        weatherData2015atempSum = ["2015"];
        weatherData2014 = [];
        weatherData2014pcMean = ["2014"];
        weatherData2014pcSum = ["2014"];
        weatherData2014atempMean = ["2014"];
        weatherData2014atempSum = ["2014"];
        weatherData2013 = [];
        weatherData2013pcMean = ["2013"];
        weatherData2013pcSum = ["2013"];
        weatherData2013atempMean = ["2013"];
        weatherData2013atempSum = ["2013"];
        weatherData2012 = [];
        weatherData2012pcMean = ["2012"];
        weatherData2012pcSum = ["2012"];
        weatherData2012atempMean = ["2012"];
        weatherData2012atempSum = ["2012"];

        var weatherVars = {
          name: "Precip",
          p: precip,
          p2020: precip2020,
          p2021: precip2021,
          a: airTemp,
          a2020: airTemp2020,
          a2021: airTemp2021,
          pcM2021: weatherData2021pcMean,
          pcS2021: weatherData2021pcSum,
          atempM2021: weatherData2021atempMean,
          atempS2021: weatherData2021atempSum,
          pcM2020: weatherData2020pcMean,
          pcS2020: weatherData2020pcSum,
          atempM2020: weatherData2020atempMean,
          atempS2020: weatherData2020atempSum,
          pcM2019: weatherData2019pcMean,
          pcS2019: weatherData2019pcSum,
          atempM2019: weatherData2019atempMean,
          atempS2019: weatherData2019atempSum,
          pcM2018: weatherData2018pcMean,
          pcS2018: weatherData2018pcSum,
          atempM2018: weatherData2018atempMean,
          atempS2018: weatherData2018atempSum,
          pcM2017: weatherData2017pcMean,
          pcS2017: weatherData2017pcSum,
          atempM2017: weatherData2017atempMean,
          atempS2017: weatherData2017atempSum,
          pcM2016: weatherData2016pcMean,
          pcS2016: weatherData2016pcSum,
          atempM2016: weatherData2016atempMean,
          atempS2016: weatherData2016atempSum,
          pcM2015: weatherData2015pcMean,
          pcS2015: weatherData2015pcSum,
          atempM2015: weatherData2015atempMean,
          atempS2015: weatherData2015atempSum,
          pcM2014: weatherData2014pcMean,
          pcS2014: weatherData2014pcSum,
          atempM2014: weatherData2014atempMean,
          atempS2014: weatherData2014atempSum,
          pcM2013: weatherData2013pcMean,
          pcS2013: weatherData2013pcSum,
          atempM2013: weatherData2013atempMean,
          atempS2013: weatherData2013atempSum,
          pcM2012: weatherData2012pcMean,
          pcS2012: weatherData2012pcSum,
          atempM2012: weatherData2012atempMean,
          atempS2012: weatherData2012atempSum,
        }

        varsCounts(weatherVars);


        precipSubChart.load({
          columns: [weatherVars.pcM2012],
        });
        precipChart.load({
          columns: [weatherVars.pcM2012],
        });
        aitTempChart.load({
          columns: [weatherVars.atempM2012],
        });
        precipSumChart.load({
          columns: [weatherVars.pcS2012],
        });
        aitTempSumChart.load({
          columns: [weatherVars.atempS2012],
        });
        var stroke = precipSubChart.color('2012');
        $("#weather2012").css('color', stroke);

      } else {
        precipSubChart.unload({
          ids: ["2012"],
        });
        precipChart.unload({
          ids: ["2012"],
        });
        aitTempChart.unload({
          ids: ["2012"],
        });
        precipSumChart.unload({
          ids: ["2012"],
        });
        aitTempSumChart.unload({
          ids: ["2012"],
        });
        $("#weather2012").css('color', 'white');

      }

    });

    // Sample Year Selection
    $("#sample2019").on("click", function() {
      color2019 = $("#sample2019").css('color');
      sampleSite = $("#sampleDropdown").text();
      if (color2019 == 'rgb(255, 255, 255)') {
        // Weather Data
        var wst = ["Date"];
        var wst2016 = ["Date"];
        var wst2017 = ["Date"];
        var wst2018 = ["Date"];
        var wst2019 = ["Date"];
        var wstt = ["Date"];
        var wstt2016 = ["Date"];
        var wstt2017 = ["Date"];
        var wstt2018 = ["Date"];
        var wstt2019 = ["Date"];
        var wsnt = ["Date"];
        var wsnt2016 = ["Date"];
        var wsnt2017 = ["Date"];
        var wsnt2018 = ["Date"];
        var wsnt2019 = ["Date"];
        var algae = ["Algae"];
        var algae2016 = ["2016"];
        var algae2017 = ["2017"];
        var algae2018 = ["2018"];
        var algae2019 = ["2019"];
        var toxin = ["Toxins"];
        var toxin2016 = ["2016"];
        var toxin2017 = ["2017"];
        var toxin2018 = ["2018"];
        var toxin2019 = ["2019"];
        var nitrate = ["Total Nitrate"];
        var nitrate2016 = ["2016"];
        var nitrate2017 = ["2017"];
        var nitrate2018 = ["2018"];
        var nitrate2019 = ["2019"];
        // var negTests = ["Negative Tests"];
        var sampleSiteSelect = {
          name: sampleSite,
          a: algae,
          a2016: algae2016,
          a2017: algae2017,
          a2018: algae2018,
          a2019: algae2019,
          t: toxin,
          t2016: toxin2016,
          t2017: toxin2017,
          t2018: toxin2018,
          t2019: toxin2019,
          n: nitrate,
          n2016: nitrate2016,
          n2017: nitrate2017,
          n2018: nitrate2018,
          n2019: nitrate2019,
        }

        sampleSiteCounts(sampleSiteSelect);

        sampleSubChart.load({
          columns: [sampleSiteSelect.a2019],
        });
        sampleChart.load({
          columns: [sampleSiteSelect.a2019],
        });
        toxinChart.load({
          columns: [sampleSiteSelect.t2019],
        });
        nitrateChart.load({
          columns: [sampleSiteSelect.n2019],
        });
        var stroke = sampleSubChart.color('2019');
        $("#sample2019").css('color', stroke);

      } else {
        sampleSubChart.unload({
          ids: ["2019"],
        });
        sampleChart.unload({
          ids: ["2019"],
        });
        toxinChart.unload({
          ids: ["2019"],
        });
        nitrateChart.unload({
          ids: ["2019"],
        });

        $("#sample2019").css('color', 'white');
      }

    });
    $("#sample2018").on("click", function() {
      color2018 = $("#sample2018").css('color');
      sampleSite = $("#sampleDropdown").text();
      if (color2018 == 'rgb(255, 255, 255)') {
        // Weather Data
        var wst = ["Date"];
        var wst2016 = ["Date"];
        var wst2017 = ["Date"];
        var wst2018 = ["Date"];
        var wst2019 = ["Date"];
        var wstt = ["Date"];
        var wstt2016 = ["Date"];
        var wstt2017 = ["Date"];
        var wstt2018 = ["Date"];
        var wstt2019 = ["Date"];
        var wsnt = ["Date"];
        var wsnt2016 = ["Date"];
        var wsnt2017 = ["Date"];
        var wsnt2018 = ["Date"];
        var wsnt2019 = ["Date"];
        var algae = ["Algae"];
        var algae2016 = ["2016"];
        var algae2017 = ["2017"];
        var algae2018 = ["2018"];
        var algae2019 = ["2019"];
        var toxin = ["Toxins"];
        var toxin2016 = ["2016"];
        var toxin2017 = ["2017"];
        var toxin2018 = ["2018"];
        var toxin2019 = ["2019"];
        var nitrate = ["Total Nitrate"];
        var nitrate2016 = ["2016"];
        var nitrate2017 = ["2017"];
        var nitrate2018 = ["2018"];
        var nitrate2019 = ["2019"];
        // var negTests = ["Negative Tests"];
        var sampleSiteSelect = {
          name: sampleSite,
          a: algae,
          a2016: algae2016,
          a2017: algae2017,
          a2018: algae2018,
          a2019: algae2019,
          t: toxin,
          t2016: toxin2016,
          t2017: toxin2017,
          t2018: toxin2018,
          t2019: toxin2019,
          n: nitrate,
          n2016: nitrate2016,
          n2017: nitrate2017,
          n2018: nitrate2018,
          n2019: nitrate2019,
        }

        sampleSiteCounts(sampleSiteSelect);

        sampleSubChart.load({
          columns: [sampleSiteSelect.a2018],
        });
        sampleChart.load({
          columns: [sampleSiteSelect.a2018],
        });
        toxinChart.load({
          columns: [sampleSiteSelect.t2018],
        });
        nitrateChart.load({
          columns: [sampleSiteSelect.n2018],
        });
        var stroke = sampleSubChart.color('2018');
        $("#sample2018").css('color', stroke);

      } else {
        sampleSubChart.unload({
          ids: ["2018"],
        });
        sampleChart.unload({
          ids: ["2018"],
        });
        toxinChart.unload({
          ids: ["2018"],
        });
        nitrateChart.unload({
          ids: ["2018"],
        });

        $("#sample2018").css('color', 'white');
      }

    });
    $("#sample2017").on("click", function() {
      color2017 = $("#sample2017").css('color');
      sampleSite = $("#sampleDropdown").text();
      if (color2017 == 'rgb(255, 255, 255)') {
        // Weather Data
        var wst = ["Date"];
        var wst2016 = ["Date"];
        var wst2017 = ["Date"];
        var wst2018 = ["Date"];
        var wst2019 = ["Date"];
        var wstt = ["Date"];
        var wstt2016 = ["Date"];
        var wstt2017 = ["Date"];
        var wstt2018 = ["Date"];
        var wstt2019 = ["Date"];
        var wsnt = ["Date"];
        var wsnt2016 = ["Date"];
        var wsnt2017 = ["Date"];
        var wsnt2018 = ["Date"];
        var wsnt2019 = ["Date"];
        var algae = ["Algae"];
        var algae2016 = ["2016"];
        var algae2017 = ["2017"];
        var algae2018 = ["2018"];
        var algae2019 = ["2019"];
        var toxin = ["Toxins"];
        var toxin2016 = ["2016"];
        var toxin2017 = ["2017"];
        var toxin2018 = ["2018"];
        var toxin2019 = ["2019"];
        var nitrate = ["Total Nitrate"];
        var nitrate2016 = ["2016"];
        var nitrate2017 = ["2017"];
        var nitrate2018 = ["2018"];
        var nitrate2019 = ["2019"];
        // var negTests = ["Negative Tests"];
        var sampleSiteSelect = {
          name: sampleSite,
          a: algae,
          a2016: algae2016,
          a2017: algae2017,
          a2018: algae2018,
          a2019: algae2019,
          t: toxin,
          t2016: toxin2016,
          t2017: toxin2017,
          t2018: toxin2018,
          t2019: toxin2019,
          n: nitrate,
          n2016: nitrate2016,
          n2017: nitrate2017,
          n2018: nitrate2018,
          n2019: nitrate2019,
        }

        sampleSiteCounts(sampleSiteSelect);

        sampleSubChart.load({
          columns: [sampleSiteSelect.a2017],
        });
        sampleChart.load({
          columns: [sampleSiteSelect.a2017],
        });
        toxinChart.load({
          columns: [sampleSiteSelect.t2017],
        });
        nitrateChart.load({
          columns: [sampleSiteSelect.n2017],
        });
        var stroke = sampleSubChart.color('2017');
        $("#sample2017").css('color', stroke);

      } else {
        sampleSubChart.unload({
          ids: ["2017"],
        });
        sampleChart.unload({
          ids: ["2017"],
        });
        toxinChart.unload({
          ids: ["2017"],
        });
        nitrateChart.unload({
          ids: ["2017"],
        });

        $("#sample2017").css('color', 'white');
      }

    });
    $("#sample2016").on("click", function() {
      color2016 = $("#sample2016").css('color');
      sampleSite = $("#sampleDropdown").text();
      if (color2016 == 'rgb(255, 255, 255)') {
        // Weather Data
        var wst = ["Date"];
        var wst2016 = ["Date"];
        var wst2017 = ["Date"];
        var wst2018 = ["Date"];
        var wst2019 = ["Date"];
        var wstt = ["Date"];
        var wstt2016 = ["Date"];
        var wstt2017 = ["Date"];
        var wstt2018 = ["Date"];
        var wstt2019 = ["Date"];
        var wsnt = ["Date"];
        var wsnt2016 = ["Date"];
        var wsnt2017 = ["Date"];
        var wsnt2018 = ["Date"];
        var wsnt2019 = ["Date"];
        var algae = ["Algae"];
        var algae2016 = ["2016"];
        var algae2017 = ["2017"];
        var algae2018 = ["2018"];
        var algae2019 = ["2019"];
        var toxin = ["Toxins"];
        var toxin2016 = ["2016"];
        var toxin2017 = ["2017"];
        var toxin2018 = ["2018"];
        var toxin2019 = ["2019"];
        var nitrate = ["Total Nitrate"];
        var nitrate2016 = ["2016"];
        var nitrate2017 = ["2017"];
        var nitrate2018 = ["2018"];
        var nitrate2019 = ["2019"];
        // var negTests = ["Negative Tests"];
        var sampleSiteSelect = {
          name: sampleSite,
          a: algae,
          a2016: algae2016,
          a2017: algae2017,
          a2018: algae2018,
          a2019: algae2019,
          t: toxin,
          t2016: toxin2016,
          t2017: toxin2017,
          t2018: toxin2018,
          t2019: toxin2019,
          n: nitrate,
          n2016: nitrate2016,
          n2017: nitrate2017,
          n2018: nitrate2018,
          n2019: nitrate2019,
        }

        sampleSiteCounts(sampleSiteSelect);

        sampleSubChart.load({
          columns: [sampleSiteSelect.a2016],
        });
        sampleChart.load({
          columns: [sampleSiteSelect.a2016],
        });
        toxinChart.load({
          columns: [sampleSiteSelect.t2016],
        });
        nitrateChart.load({
          columns: [sampleSiteSelect.n2016],
        });
        var stroke = sampleSubChart.color('2016');
        $("#sample2016").css('color', stroke);

      } else {
        sampleSubChart.unload({
          ids: ["2016"],
        });
        sampleChart.unload({
          ids: ["2016"],
        });
        toxinChart.unload({
          ids: ["2016"],
        });
        nitrateChart.unload({
          ids: ["2016"],
        });

        $("#sample2016").css('color', 'white');
      }

    });
    $("#sample2015").on("click", function() {
      color2015 = $("#sample2015").css('color');
      sampleSite = $("#sampleDropdown").text();
      if (color2015 == 'rgb(255, 255, 255)') {
        // Weather Data
        var wst = ["Date"];
        var wst2016 = ["Date"];
        var wst2017 = ["Date"];
        var wst2018 = ["Date"];
        var wst2019 = ["Date"];
        var wstt = ["Date"];
        var wstt2016 = ["Date"];
        var wstt2017 = ["Date"];
        var wstt2018 = ["Date"];
        var wstt2019 = ["Date"];
        var wsnt = ["Date"];
        var wsnt2016 = ["Date"];
        var wsnt2017 = ["Date"];
        var wsnt2018 = ["Date"];
        var wsnt2019 = ["Date"];
        var algae = ["Algae"];
        var algae2016 = ["2016"];
        var algae2017 = ["2017"];
        var algae2018 = ["2018"];
        var algae2019 = ["2019"];
        var toxin = ["Toxins"];
        var toxin2016 = ["2016"];
        var toxin2017 = ["2017"];
        var toxin2018 = ["2018"];
        var toxin2019 = ["2019"];
        var nitrate = ["Total Nitrate"];
        var nitrate2016 = ["2016"];
        var nitrate2017 = ["2017"];
        var nitrate2018 = ["2018"];
        var nitrate2019 = ["2019"];
        // var negTests = ["Negative Tests"];
        var sampleSiteSelect = {
          name: sampleSite,
          a: algae,
          a2016: algae2016,
          a2017: algae2017,
          a2018: algae2018,
          a2019: algae2019,
          t: toxin,
          t2016: toxin2016,
          t2017: toxin2017,
          t2018: toxin2018,
          t2019: toxin2019,
          n: nitrate,
          n2016: nitrate2016,
          n2017: nitrate2017,
          n2018: nitrate2018,
          n2019: nitrate2019,
        }

        sampleSiteCounts(sampleSiteSelect);

        sampleSubChart.load({
          columns: [sampleSiteSelect.a2015],
        });
        sampleChart.load({
          columns: [sampleSiteSelect.a2015],
        });
        toxinChart.load({
          columns: [sampleSiteSelect.t2015],
        });
        nitrateChart.load({
          columns: [sampleSiteSelect.n2015],
        });
        var stroke = sampleSubChart.color('2015');
        $("#sample2015").css('color', stroke);

      } else {
        sampleSubChart.unload({
          ids: ["2015"],
        });
        sampleChart.unload({
          ids: ["2015"],
        });
        toxinChart.unload({
          ids: ["2015"],
        });
        nitrateChart.unload({
          ids: ["2015"],
        });

        $("#sample2015").css('color', 'white');
      }

    });
    $("#sample2014").on("click", function() {
      color2014 = $("#sample2014").css('color');
      sampleSite = $("#sampleDropdown").text();
      if (color2014 == 'rgb(255, 255, 255)') {
        // Weather Data
        var wst = ["Date"];
        var wst2016 = ["Date"];
        var wst2017 = ["Date"];
        var wst2018 = ["Date"];
        var wst2019 = ["Date"];
        var wstt = ["Date"];
        var wstt2016 = ["Date"];
        var wstt2017 = ["Date"];
        var wstt2018 = ["Date"];
        var wstt2019 = ["Date"];
        var wsnt = ["Date"];
        var wsnt2016 = ["Date"];
        var wsnt2017 = ["Date"];
        var wsnt2018 = ["Date"];
        var wsnt2019 = ["Date"];
        var algae = ["Algae"];
        var algae2016 = ["2016"];
        var algae2017 = ["2017"];
        var algae2018 = ["2018"];
        var algae2019 = ["2019"];
        var toxin = ["Toxins"];
        var toxin2016 = ["2016"];
        var toxin2017 = ["2017"];
        var toxin2018 = ["2018"];
        var toxin2019 = ["2019"];
        var nitrate = ["Total Nitrate"];
        var nitrate2016 = ["2016"];
        var nitrate2017 = ["2017"];
        var nitrate2018 = ["2018"];
        var nitrate2019 = ["2019"];
        // var negTests = ["Negative Tests"];
        var sampleSiteSelect = {
          name: sampleSite,
          a: algae,
          a2016: algae2016,
          a2017: algae2017,
          a2018: algae2018,
          a2019: algae2019,
          t: toxin,
          t2016: toxin2016,
          t2017: toxin2017,
          t2018: toxin2018,
          t2019: toxin2019,
          n: nitrate,
          n2016: nitrate2016,
          n2017: nitrate2017,
          n2018: nitrate2018,
          n2019: nitrate2019,
        }

        sampleSiteCounts(sampleSiteSelect);

        sampleSubChart.load({
          columns: [sampleSiteSelect.a2014],
        });
        sampleChart.load({
          columns: [sampleSiteSelect.a2014],
        });
        toxinChart.load({
          columns: [sampleSiteSelect.t2014],
        });
        nitrateChart.load({
          columns: [sampleSiteSelect.n2014],
        });
        var stroke = sampleSubChart.color('2014');
        $("#sample2014").css('color', stroke);

      } else {
        sampleSubChart.unload({
          ids: ["2014"],
        });
        sampleChart.unload({
          ids: ["2014"],
        });
        toxinChart.unload({
          ids: ["2014"],
        });
        nitrateChart.unload({
          ids: ["2014"],
        });

        $("#sample2014").css('color', 'white');
      }

    });
    $("#sample2013").on("click", function() {
      color2013 = $("#sample2013").css('color');
      sampleSite = $("#sampleDropdown").text();
      if (color2013 == 'rgb(255, 255, 255)') {
        // Weather Data
        var wst = ["Date"];
        var wst2016 = ["Date"];
        var wst2017 = ["Date"];
        var wst2018 = ["Date"];
        var wst2019 = ["Date"];
        var wstt = ["Date"];
        var wstt2016 = ["Date"];
        var wstt2017 = ["Date"];
        var wstt2018 = ["Date"];
        var wstt2019 = ["Date"];
        var wsnt = ["Date"];
        var wsnt2016 = ["Date"];
        var wsnt2017 = ["Date"];
        var wsnt2018 = ["Date"];
        var wsnt2019 = ["Date"];
        var algae = ["Algae"];
        var algae2016 = ["2016"];
        var algae2017 = ["2017"];
        var algae2018 = ["2018"];
        var algae2019 = ["2019"];
        var toxin = ["Toxins"];
        var toxin2016 = ["2016"];
        var toxin2017 = ["2017"];
        var toxin2018 = ["2018"];
        var toxin2019 = ["2019"];
        var nitrate = ["Total Nitrate"];
        var nitrate2016 = ["2016"];
        var nitrate2017 = ["2017"];
        var nitrate2018 = ["2018"];
        var nitrate2019 = ["2019"];
        // var negTests = ["Negative Tests"];
        var sampleSiteSelect = {
          name: sampleSite,
          a: algae,
          a2016: algae2016,
          a2017: algae2017,
          a2018: algae2018,
          a2019: algae2019,
          t: toxin,
          t2016: toxin2016,
          t2017: toxin2017,
          t2018: toxin2018,
          t2019: toxin2019,
          n: nitrate,
          n2016: nitrate2016,
          n2017: nitrate2017,
          n2018: nitrate2018,
          n2019: nitrate2019,
        }

        sampleSiteCounts(sampleSiteSelect);

        sampleSubChart.load({
          columns: [sampleSiteSelect.a2013],
        });
        sampleChart.load({
          columns: [sampleSiteSelect.a2013],
        });
        toxinChart.load({
          columns: [sampleSiteSelect.t2013],
        });
        nitrateChart.load({
          columns: [sampleSiteSelect.n2013],
        });
        var stroke = sampleSubChart.color('2013');
        $("#sample2013").css('color', stroke);

      } else {
        sampleSubChart.unload({
          ids: ["2013"],
        });
        sampleChart.unload({
          ids: ["2013"],
        });
        toxinChart.unload({
          ids: ["2013"],
        });
        nitrateChart.unload({
          ids: ["2013"],
        });

        $("#sample2013").css('color', 'white');
      }

    });

    $("#14179000").on("click", function() {
      $("#gageDropdown").text("BREITENBUSH R ABV FRENCH CR NR DETROIT, OR");

      var t = ["Date"];
      var t2020 = ["Date"];
      var t2021 = ["Date"];
      var water_temp = ["Water Temperature"];
      var water_temp2020 = ["2020"];
      var water_temp2021 = ["2021"];
      streamGage1Data2021 = [];
      streamGage1Data2021wtMean = ["2021"];
      streamGage1Data2021wtSum = ["2021"];
      streamGage1Data2021dchMean = ["2021"];
      streamGage1Data2021dchSum = ["2021"];
      streamGage1Data2020 = [];
      streamGage1Data2020wtMean = ["2020"];
      streamGage1Data2020wtSum = ["2020"];
      streamGage1Data2020dchMean = ["2020"];
      streamGage1Data2020dchSum = ["2020"];
      streamGage1Data2019 = [];
      streamGage1Data2019wtMean = ["2019"];
      streamGage1Data2019wtSum = ["2019"];
      streamGage1Data2019dchMean = ["2019"];
      streamGage1Data2019dchSum = ["2019"];
      streamGage1Data2018 = [];
      streamGage1Data2018wtMean = ["2018"];
      streamGage1Data2018wtSum = ["2018"];
      streamGage1Data2018dchMean = ["2018"];
      streamGage1Data2018dchSum = ["2018"];
      streamGage1Data2017 = [];
      streamGage1Data2017wtMean = ["2017"];
      streamGage1Data2017wtSum = ["2017"];
      streamGage1Data2017dchMean = ["2017"];
      streamGage1Data2017dchSum = ["2017"];
      streamGage1Data2016 = [];
      streamGage1Data2016wtMean = ["2016"];
      streamGage1Data2016wtSum = ["2016"];
      streamGage1Data2016dchMean = ["2016"];
      streamGage1Data2016dchSum = ["2016"];
      streamGage1Data2015 = [];
      streamGage1Data2015wtMean = ["2015"];
      streamGage1Data2015wtSum = ["2015"];
      streamGage1Data2015dchMean = ["2015"];
      streamGage1Data2015dchSum = ["2015"];
      streamGage1Data2014 = [];
      streamGage1Data2014wtMean = ["2014"];
      streamGage1Data2014wtSum = ["2014"];
      streamGage1Data2014dchMean = ["2014"];
      streamGage1Data2014dchSum = ["2014"];
      streamGage1Data2013 = [];
      streamGage1Data2013wtMean = ["2013"];
      streamGage1Data2013wtSum = ["2013"];
      streamGage1Data2013dchMean = ["2013"];
      streamGage1Data2013dchSum = ["2013"];
      streamGage1Data2012 = [];
      streamGage1Data2012wtMean = ["2012"];
      streamGage1Data2012wtSum = ["2012"];
      streamGage1Data2012dchMean = ["2012"];
      streamGage1Data2012dchSum = ["2012"];
      streamGage1Data2011 = [];
      streamGage1Data2011wtMean = ["2011"];
      streamGage1Data2011wtSum = ["2011"];
      streamGage1Data2011dchMean = ["2011"];
      streamGage1Data2011dchSum = ["2011"];
      streamGage1Data2010 = [];
      streamGage1Data2010wtMean = ["2010"];
      streamGage1Data2010wtSum = ["2010"];
      streamGage1Data2010dchMean = ["2010"];
      streamGage1Data2010dchSum = ["2010"];

      gageID = "14179000";
      var siteSelect = {
        name: gageID,
        wt: water_temp,
        wt2020: water_temp2020,
        wt2021: water_temp2021,
        wtM2021: streamGage1Data2021wtMean,
        wtS2021: streamGage1Data2021wtSum,
        dchM2021: streamGage1Data2021dchMean,
        dchS2021: streamGage1Data2021dchSum,
        wtM2020: streamGage1Data2020wtMean,
        wtS2020: streamGage1Data2020wtSum,
        dchM2020: streamGage1Data2020dchMean,
        dchS2020: streamGage1Data2020dchSum,
        wtM2019: streamGage1Data2019wtMean,
        wtS2019: streamGage1Data2019wtSum,
        dchM2019: streamGage1Data2019dchMean,
        dchS2019: streamGage1Data2019dchSum,
        wtM2018: streamGage1Data2018wtMean,
        wtS2018: streamGage1Data2018wtSum,
        dchM2018: streamGage1Data2018dchMean,
        dchS2018: streamGage1Data2018dchSum,
        wtM2017: streamGage1Data2017wtMean,
        wtS2017: streamGage1Data2017wtSum,
        dchM2017: streamGage1Data2017dchMean,
        dchS2017: streamGage1Data2017dchSum,
        wtM2016: streamGage1Data2016wtMean,
        wtS2016: streamGage1Data2016wtSum,
        dchM2016: streamGage1Data2016dchMean,
        dchS2016: streamGage1Data2016dchSum,
        wtM2015: streamGage1Data2015wtMean,
        wtS2015: streamGage1Data2015wtSum,
        dchM2015: streamGage1Data2015dchMean,
        dchS2015: streamGage1Data2015dchSum,
        wtM2014: streamGage1Data2014wtMean,
        wtS2014: streamGage1Data2014wtSum,
        dchM2014: streamGage1Data2014dchMean,
        dchS2014: streamGage1Data2014dchSum,
        wtM2013: streamGage1Data2013wtMean,
        wtS2013: streamGage1Data2013wtSum,
        dchM2013: streamGage1Data2013dchMean,
        dchS2013: streamGage1Data2013dchSum,
        wtM2012: streamGage1Data2012wtMean,
        wtS2012: streamGage1Data2012wtSum,
        dchM2012: streamGage1Data2012dchMean,
        dchS2012: streamGage1Data2012dchSum,
        wtM2011: streamGage1Data2011wtMean,
        wtS2011: streamGage1Data2011wtSum,
        dchM2011: streamGage1Data2011dchMean,
        dchS2011: streamGage1Data2011dchSum,
        wtM2010: streamGage1Data2010wtMean,
        wtS2010: streamGage1Data2010wtSum,
        dchM2010: streamGage1Data2010dchMean,
        dchS2010: streamGage1Data2010dchSum,
      }

      siteCounts(siteSelect);


      chart.load({
        unload: true,
        columns: [siteSelect.wtM2020, siteSelect.wtM2021],
      });
      chart2.load({
        unload: true,
        columns: [siteSelect.wtM2020, siteSelect.wtM2021],
      });
      h20SumChart.load({
        unload: true,
        columns: [siteSelect.wtS2020, siteSelect.wtS2021],
      });
      dchMeanChart.load({
        unload: true,
        columns: [siteSelect.dchM2020, siteSelect.dchM2021],
      });
      dchSumChart.load({
        unload: true,
        columns: [siteSelect.dchS2020, siteSelect.dchS2021],
      });
      $("#gage-chart > svg > g:nth-child(2)").hide();

      $("#gage2019").css('color', 'white');
      $("#gage2018").css('color', 'white');
      $("#gage2017").css('color', 'white');
      $("#gage2016").css('color', 'white');
      $("#gage2015").css('color', 'white');
      $("#gage2014").css('color', 'white');
      $("#gage2013").css('color', 'white');
      $("#gage2012").css('color', 'white');
      $("#gage2011").css('color', 'white');
      $("#gage2010").css('color', 'white');
      $("#gage-chart > svg > g:nth-child(2)").hide();
    });

    $("#14178000").on("click", function() {
      $("#gageDropdown").text("NO SANTIAM R BLW BOULDER CRK, NR DETROIT, OR");

      var t = ["Date"];
      var t2020 = ["Date"];
      var t2021 = ["Date"];
      var water_temp = ["Water Temperature"];
      var water_temp2020 = ["2020"];
      var water_temp2021 = ["2021"];
      streamGage1Data2021 = [];
      streamGage1Data2021wtMean = ["2021"];
      streamGage1Data2021wtSum = ["2021"];
      streamGage1Data2021dchMean = ["2021"];
      streamGage1Data2021dchSum = ["2021"];
      streamGage1Data2020 = [];
      streamGage1Data2020wtMean = ["2020"];
      streamGage1Data2020wtSum = ["2020"];
      streamGage1Data2020dchMean = ["2020"];
      streamGage1Data2020dchSum = ["2020"];
      streamGage1Data2019 = [];
      streamGage1Data2019wtMean = ["2019"];
      streamGage1Data2019wtSum = ["2019"];
      streamGage1Data2019dchMean = ["2019"];
      streamGage1Data2019dchSum = ["2019"];
      streamGage1Data2018 = [];
      streamGage1Data2018wtMean = ["2018"];
      streamGage1Data2018wtSum = ["2018"];
      streamGage1Data2018dchMean = ["2018"];
      streamGage1Data2018dchSum = ["2018"];
      streamGage1Data2017 = [];
      streamGage1Data2017wtMean = ["2017"];
      streamGage1Data2017wtSum = ["2017"];
      streamGage1Data2017dchMean = ["2017"];
      streamGage1Data2017dchSum = ["2017"];
      streamGage1Data2016 = [];
      streamGage1Data2016wtMean = ["2016"];
      streamGage1Data2016wtSum = ["2016"];
      streamGage1Data2016dchMean = ["2016"];
      streamGage1Data2016dchSum = ["2016"];
      streamGage1Data2015 = [];
      streamGage1Data2015wtMean = ["2015"];
      streamGage1Data2015wtSum = ["2015"];
      streamGage1Data2015dchMean = ["2015"];
      streamGage1Data2015dchSum = ["2015"];
      streamGage1Data2014 = [];
      streamGage1Data2014wtMean = ["2014"];
      streamGage1Data2014wtSum = ["2014"];
      streamGage1Data2014dchMean = ["2014"];
      streamGage1Data2014dchSum = ["2014"];
      streamGage1Data2013 = [];
      streamGage1Data2013wtMean = ["2013"];
      streamGage1Data2013wtSum = ["2013"];
      streamGage1Data2013dchMean = ["2013"];
      streamGage1Data2013dchSum = ["2013"];
      streamGage1Data2012 = [];
      streamGage1Data2012wtMean = ["2012"];
      streamGage1Data2012wtSum = ["2012"];
      streamGage1Data2012dchMean = ["2012"];
      streamGage1Data2012dchSum = ["2012"];
      streamGage1Data2011 = [];
      streamGage1Data2011wtMean = ["2011"];
      streamGage1Data2011wtSum = ["2011"];
      streamGage1Data2011dchMean = ["2011"];
      streamGage1Data2011dchSum = ["2011"];
      streamGage1Data2010 = [];
      streamGage1Data2010wtMean = ["2010"];
      streamGage1Data2010wtSum = ["2010"];
      streamGage1Data2010dchMean = ["2010"];
      streamGage1Data2010dchSum = ["2010"];

      gageID = "14178000";
      var siteSelect = {
        name: gageID,
        wt: water_temp,
        wt2020: water_temp2020,
        wt2021: water_temp2021,
        wtM2021: streamGage1Data2021wtMean,
        wtS2021: streamGage1Data2021wtSum,
        dchM2021: streamGage1Data2021dchMean,
        dchS2021: streamGage1Data2021dchSum,
        wtM2020: streamGage1Data2020wtMean,
        wtS2020: streamGage1Data2020wtSum,
        dchM2020: streamGage1Data2020dchMean,
        dchS2020: streamGage1Data2020dchSum,
        wtM2019: streamGage1Data2019wtMean,
        wtS2019: streamGage1Data2019wtSum,
        dchM2019: streamGage1Data2019dchMean,
        dchS2019: streamGage1Data2019dchSum,
        wtM2018: streamGage1Data2018wtMean,
        wtS2018: streamGage1Data2018wtSum,
        dchM2018: streamGage1Data2018dchMean,
        dchS2018: streamGage1Data2018dchSum,
        wtM2017: streamGage1Data2017wtMean,
        wtS2017: streamGage1Data2017wtSum,
        dchM2017: streamGage1Data2017dchMean,
        dchS2017: streamGage1Data2017dchSum,
        wtM2016: streamGage1Data2016wtMean,
        wtS2016: streamGage1Data2016wtSum,
        dchM2016: streamGage1Data2016dchMean,
        dchS2016: streamGage1Data2016dchSum,
        wtM2015: streamGage1Data2015wtMean,
        wtS2015: streamGage1Data2015wtSum,
        dchM2015: streamGage1Data2015dchMean,
        dchS2015: streamGage1Data2015dchSum,
        wtM2014: streamGage1Data2014wtMean,
        wtS2014: streamGage1Data2014wtSum,
        dchM2014: streamGage1Data2014dchMean,
        dchS2014: streamGage1Data2014dchSum,
        wtM2013: streamGage1Data2013wtMean,
        wtS2013: streamGage1Data2013wtSum,
        dchM2013: streamGage1Data2013dchMean,
        dchS2013: streamGage1Data2013dchSum,
        wtM2012: streamGage1Data2012wtMean,
        wtS2012: streamGage1Data2012wtSum,
        dchM2012: streamGage1Data2012dchMean,
        dchS2012: streamGage1Data2012dchSum,
        wtM2011: streamGage1Data2011wtMean,
        wtS2011: streamGage1Data2011wtSum,
        dchM2011: streamGage1Data2011dchMean,
        dchS2011: streamGage1Data2011dchSum,
        wtM2010: streamGage1Data2010wtMean,
        wtS2010: streamGage1Data2010wtSum,
        dchM2010: streamGage1Data2010dchMean,
        dchS2010: streamGage1Data2010dchSum,
      }

      siteCounts(siteSelect);


      chart.load({
        unload: true,
        columns: [siteSelect.wtM2020, siteSelect.wtM2021],
      });
      chart2.load({
        unload: true,
        columns: [siteSelect.wtM2020, siteSelect.wtM2021],
      });
      h20SumChart.load({
        unload: true,
        columns: [siteSelect.wtS2020, siteSelect.wtS2021],
      });
      dchMeanChart.load({
        unload: true,
        columns: [siteSelect.dchM2020, siteSelect.dchM2021],
      });
      dchSumChart.load({
        unload: true,
        columns: [siteSelect.dchS2020, siteSelect.dchS2021],
      });
      $("#gage-chart > svg > g:nth-child(2)").hide();

      // $("#deck-2 > div.col-lg-2 > center > div:nth-child(4) > label").css('color', 'white');
      $("#gage2019").css('color', 'white');
      $("#gage2018").css('color', 'white');
      $("#gage2017").css('color', 'white');
      $("#gage2016").css('color', 'white');
      $("#gage2015").css('color', 'white');
      $("#gage2014").css('color', 'white');
      $("#gage2013").css('color', 'white');
      $("#gage2012").css('color', 'white');
      $("#gage2011").css('color', 'white');
      $("#gage2010").css('color', 'white');
      $("#gage-chart > svg > g:nth-child(2)").hide();
    });

    $("#14180300").on("click", function() {
      $("#gageDropdown").text("BLOWOUT CREEK NEAR DETROIT, OR");

      var t = ["Date"];
      var t2020 = ["Date"];
      var t2021 = ["Date"];
      var water_temp = ["Water Temperature"];
      var water_temp2020 = ["2020"];
      var water_temp2021 = ["2021"];
      streamGage1Data2021 = [];
      streamGage1Data2021wtMean = ["2021"];
      streamGage1Data2021wtSum = ["2021"];
      streamGage1Data2021dchMean = ["2021"];
      streamGage1Data2021dchSum = ["2021"];
      streamGage1Data2020 = [];
      streamGage1Data2020wtMean = ["2020"];
      streamGage1Data2020wtSum = ["2020"];
      streamGage1Data2020dchMean = ["2020"];
      streamGage1Data2020dchSum = ["2020"];
      streamGage1Data2019 = [];
      streamGage1Data2019wtMean = ["2019"];
      streamGage1Data2019wtSum = ["2019"];
      streamGage1Data2019dchMean = ["2019"];
      streamGage1Data2019dchSum = ["2019"];
      streamGage1Data2018 = [];
      streamGage1Data2018wtMean = ["2018"];
      streamGage1Data2018wtSum = ["2018"];
      streamGage1Data2018dchMean = ["2018"];
      streamGage1Data2018dchSum = ["2018"];
      streamGage1Data2017 = [];
      streamGage1Data2017wtMean = ["2017"];
      streamGage1Data2017wtSum = ["2017"];
      streamGage1Data2017dchMean = ["2017"];
      streamGage1Data2017dchSum = ["2017"];
      streamGage1Data2016 = [];
      streamGage1Data2016wtMean = ["2016"];
      streamGage1Data2016wtSum = ["2016"];
      streamGage1Data2016dchMean = ["2016"];
      streamGage1Data2016dchSum = ["2016"];
      streamGage1Data2015 = [];
      streamGage1Data2015wtMean = ["2015"];
      streamGage1Data2015wtSum = ["2015"];
      streamGage1Data2015dchMean = ["2015"];
      streamGage1Data2015dchSum = ["2015"];
      streamGage1Data2014 = [];
      streamGage1Data2014wtMean = ["2014"];
      streamGage1Data2014wtSum = ["2014"];
      streamGage1Data2014dchMean = ["2014"];
      streamGage1Data2014dchSum = ["2014"];
      streamGage1Data2013 = [];
      streamGage1Data2013wtMean = ["2013"];
      streamGage1Data2013wtSum = ["2013"];
      streamGage1Data2013dchMean = ["2013"];
      streamGage1Data2013dchSum = ["2013"];
      streamGage1Data2012 = [];
      streamGage1Data2012wtMean = ["2012"];
      streamGage1Data2012wtSum = ["2012"];
      streamGage1Data2012dchMean = ["2012"];
      streamGage1Data2012dchSum = ["2012"];
      streamGage1Data2011 = [];
      streamGage1Data2011wtMean = ["2011"];
      streamGage1Data2011wtSum = ["2011"];
      streamGage1Data2011dchMean = ["2011"];
      streamGage1Data2011dchSum = ["2011"];
      streamGage1Data2010 = [];
      streamGage1Data2010wtMean = ["2010"];
      streamGage1Data2010wtSum = ["2010"];
      streamGage1Data2010dchMean = ["2010"];
      streamGage1Data2010dchSum = ["2010"];

      gageID = "14180300";
      var siteSelect = {
        name: gageID,
        wt: water_temp,
        wt2020: water_temp2020,
        wt2021: water_temp2021,
        wtM2021: streamGage1Data2021wtMean,
        wtS2021: streamGage1Data2021wtSum,
        dchM2021: streamGage1Data2021dchMean,
        dchS2021: streamGage1Data2021dchSum,
        wtM2020: streamGage1Data2020wtMean,
        wtS2020: streamGage1Data2020wtSum,
        dchM2020: streamGage1Data2020dchMean,
        dchS2020: streamGage1Data2020dchSum,
        wtM2019: streamGage1Data2019wtMean,
        wtS2019: streamGage1Data2019wtSum,
        dchM2019: streamGage1Data2019dchMean,
        dchS2019: streamGage1Data2019dchSum,
        wtM2018: streamGage1Data2018wtMean,
        wtS2018: streamGage1Data2018wtSum,
        dchM2018: streamGage1Data2018dchMean,
        dchS2018: streamGage1Data2018dchSum,
        wtM2017: streamGage1Data2017wtMean,
        wtS2017: streamGage1Data2017wtSum,
        dchM2017: streamGage1Data2017dchMean,
        dchS2017: streamGage1Data2017dchSum,
        wtM2016: streamGage1Data2016wtMean,
        wtS2016: streamGage1Data2016wtSum,
        dchM2016: streamGage1Data2016dchMean,
        dchS2016: streamGage1Data2016dchSum,
        wtM2015: streamGage1Data2015wtMean,
        wtS2015: streamGage1Data2015wtSum,
        dchM2015: streamGage1Data2015dchMean,
        dchS2015: streamGage1Data2015dchSum,
        wtM2014: streamGage1Data2014wtMean,
        wtS2014: streamGage1Data2014wtSum,
        dchM2014: streamGage1Data2014dchMean,
        dchS2014: streamGage1Data2014dchSum,
        wtM2013: streamGage1Data2013wtMean,
        wtS2013: streamGage1Data2013wtSum,
        dchM2013: streamGage1Data2013dchMean,
        dchS2013: streamGage1Data2013dchSum,
        wtM2012: streamGage1Data2012wtMean,
        wtS2012: streamGage1Data2012wtSum,
        dchM2012: streamGage1Data2012dchMean,
        dchS2012: streamGage1Data2012dchSum,
        wtM2011: streamGage1Data2011wtMean,
        wtS2011: streamGage1Data2011wtSum,
        dchM2011: streamGage1Data2011dchMean,
        dchS2011: streamGage1Data2011dchSum,
        wtM2010: streamGage1Data2010wtMean,
        wtS2010: streamGage1Data2010wtSum,
        dchM2010: streamGage1Data2010dchMean,
        dchS2010: streamGage1Data2010dchSum,
      }

      siteCounts(siteSelect);


      chart.load({
        unload: true,
        columns: [siteSelect.wtM2020, siteSelect.wtM2021],
      });
      chart2.load({
        unload: true,
        columns: [siteSelect.wtM2020, siteSelect.wtM2021],
      });
      h20SumChart.load({
        unload: true,
        columns: [siteSelect.wtS2020, siteSelect.wtS2021],
      });
      dchMeanChart.load({
        unload: true,
        columns: [siteSelect.dchM2020, siteSelect.dchM2021],
      });
      dchSumChart.load({
        unload: true,
        columns: [siteSelect.dchS2020, siteSelect.dchS2021],
      });
      $("#gage-chart > svg > g:nth-child(2)").hide();

      // $("#deck-2 > div.col-lg-2 > center > div:nth-child(4) > label").css('color', 'white');
      $("#gage2019").css('color', 'white');
      $("#gage2018").css('color', 'white');
      $("#gage2017").css('color', 'white');
      $("#gage2016").css('color', 'white');
      $("#gage2015").css('color', 'white');
      $("#gage2014").css('color', 'white');
      $("#gage2013").css('color', 'white');
      $("#gage2012").css('color', 'white');
      $("#gage2011").css('color', 'white');
      $("#gage2010").css('color', 'white');
      $("#gage-chart > svg > g:nth-child(2)").hide();
    });

    $("#14181500").on("click", function() {
      $("#gageDropdown").text("NORTH SANTIAM RIVER AT NIAGARA, OR");

      var t = ["Date"];
      var t2020 = ["Date"];
      var t2021 = ["Date"];
      var water_temp = ["Water Temperature"];
      var water_temp2020 = ["2020"];
      var water_temp2021 = ["2021"];
      streamGage1Data2021 = [];
      streamGage1Data2021wtMean = ["2021"];
      streamGage1Data2021wtSum = ["2021"];
      streamGage1Data2021dchMean = ["2021"];
      streamGage1Data2021dchSum = ["2021"];
      streamGage1Data2020 = [];
      streamGage1Data2020wtMean = ["2020"];
      streamGage1Data2020wtSum = ["2020"];
      streamGage1Data2020dchMean = ["2020"];
      streamGage1Data2020dchSum = ["2020"];
      streamGage1Data2019 = [];
      streamGage1Data2019wtMean = ["2019"];
      streamGage1Data2019wtSum = ["2019"];
      streamGage1Data2019dchMean = ["2019"];
      streamGage1Data2019dchSum = ["2019"];
      streamGage1Data2018 = [];
      streamGage1Data2018wtMean = ["2018"];
      streamGage1Data2018wtSum = ["2018"];
      streamGage1Data2018dchMean = ["2018"];
      streamGage1Data2018dchSum = ["2018"];
      streamGage1Data2017 = [];
      streamGage1Data2017wtMean = ["2017"];
      streamGage1Data2017wtSum = ["2017"];
      streamGage1Data2017dchMean = ["2017"];
      streamGage1Data2017dchSum = ["2017"];
      streamGage1Data2016 = [];
      streamGage1Data2016wtMean = ["2016"];
      streamGage1Data2016wtSum = ["2016"];
      streamGage1Data2016dchMean = ["2016"];
      streamGage1Data2016dchSum = ["2016"];
      streamGage1Data2015 = [];
      streamGage1Data2015wtMean = ["2015"];
      streamGage1Data2015wtSum = ["2015"];
      streamGage1Data2015dchMean = ["2015"];
      streamGage1Data2015dchSum = ["2015"];
      streamGage1Data2014 = [];
      streamGage1Data2014wtMean = ["2014"];
      streamGage1Data2014wtSum = ["2014"];
      streamGage1Data2014dchMean = ["2014"];
      streamGage1Data2014dchSum = ["2014"];
      streamGage1Data2013 = [];
      streamGage1Data2013wtMean = ["2013"];
      streamGage1Data2013wtSum = ["2013"];
      streamGage1Data2013dchMean = ["2013"];
      streamGage1Data2013dchSum = ["2013"];
      streamGage1Data2012 = [];
      streamGage1Data2012wtMean = ["2012"];
      streamGage1Data2012wtSum = ["2012"];
      streamGage1Data2012dchMean = ["2012"];
      streamGage1Data2012dchSum = ["2012"];
      streamGage1Data2011 = [];
      streamGage1Data2011wtMean = ["2011"];
      streamGage1Data2011wtSum = ["2011"];
      streamGage1Data2011dchMean = ["2011"];
      streamGage1Data2011dchSum = ["2011"];
      streamGage1Data2010 = [];
      streamGage1Data2010wtMean = ["2010"];
      streamGage1Data2010wtSum = ["2010"];
      streamGage1Data2010dchMean = ["2010"];
      streamGage1Data2010dchSum = ["2010"];

      gageID = "14181500";
      var siteSelect = {
        name: gageID,
        wt: water_temp,
        wt2020: water_temp2020,
        wt2021: water_temp2021,
        wtM2021: streamGage1Data2021wtMean,
        wtS2021: streamGage1Data2021wtSum,
        dchM2021: streamGage1Data2021dchMean,
        dchS2021: streamGage1Data2021dchSum,
        wtM2020: streamGage1Data2020wtMean,
        wtS2020: streamGage1Data2020wtSum,
        dchM2020: streamGage1Data2020dchMean,
        dchS2020: streamGage1Data2020dchSum,
        wtM2019: streamGage1Data2019wtMean,
        wtS2019: streamGage1Data2019wtSum,
        dchM2019: streamGage1Data2019dchMean,
        dchS2019: streamGage1Data2019dchSum,
        wtM2018: streamGage1Data2018wtMean,
        wtS2018: streamGage1Data2018wtSum,
        dchM2018: streamGage1Data2018dchMean,
        dchS2018: streamGage1Data2018dchSum,
        wtM2017: streamGage1Data2017wtMean,
        wtS2017: streamGage1Data2017wtSum,
        dchM2017: streamGage1Data2017dchMean,
        dchS2017: streamGage1Data2017dchSum,
        wtM2016: streamGage1Data2016wtMean,
        wtS2016: streamGage1Data2016wtSum,
        dchM2016: streamGage1Data2016dchMean,
        dchS2016: streamGage1Data2016dchSum,
        wtM2015: streamGage1Data2015wtMean,
        wtS2015: streamGage1Data2015wtSum,
        dchM2015: streamGage1Data2015dchMean,
        dchS2015: streamGage1Data2015dchSum,
        wtM2014: streamGage1Data2014wtMean,
        wtS2014: streamGage1Data2014wtSum,
        dchM2014: streamGage1Data2014dchMean,
        dchS2014: streamGage1Data2014dchSum,
        wtM2013: streamGage1Data2013wtMean,
        wtS2013: streamGage1Data2013wtSum,
        dchM2013: streamGage1Data2013dchMean,
        dchS2013: streamGage1Data2013dchSum,
        wtM2012: streamGage1Data2012wtMean,
        wtS2012: streamGage1Data2012wtSum,
        dchM2012: streamGage1Data2012dchMean,
        dchS2012: streamGage1Data2012dchSum,
        wtM2011: streamGage1Data2011wtMean,
        wtS2011: streamGage1Data2011wtSum,
        dchM2011: streamGage1Data2011dchMean,
        dchS2011: streamGage1Data2011dchSum,
        wtM2010: streamGage1Data2010wtMean,
        wtS2010: streamGage1Data2010wtSum,
        dchM2010: streamGage1Data2010dchMean,
        dchS2010: streamGage1Data2010dchSum,
      }

      siteCounts(siteSelect);


      chart.load({
        unload: true,
        columns: [siteSelect.wtM2020, siteSelect.wtM2021],
      });
      chart2.load({
        unload: true,
        columns: [siteSelect.wtM2020, siteSelect.wtM2021],
      });
      h20SumChart.load({
        unload: true,
        columns: [siteSelect.wtS2020, siteSelect.wtS2021],
      });
      dchMeanChart.load({
        unload: true,
        columns: [siteSelect.dchM2020, siteSelect.dchM2021],
      });
      dchSumChart.load({
        unload: true,
        columns: [siteSelect.dchS2020, siteSelect.dchS2021],
      });
      $("#gage-chart > svg > g:nth-child(2)").hide();

      // $("#deck-2 > div.col-lg-2 > center > div:nth-child(4) > label").css('color', 'white');
      $("#gage2019").css('color', 'white');
      $("#gage2018").css('color', 'white');
      $("#gage2017").css('color', 'white');
      $("#gage2016").css('color', 'white');
      $("#gage2015").css('color', 'white');
      $("#gage2014").css('color', 'white');
      $("#gage2013").css('color', 'white');
      $("#gage2012").css('color', 'white');
      $("#gage2011").css('color', 'white');
      $("#gage2010").css('color', 'white');
      $("#gage-chart > svg > g:nth-child(2)").hide();
    });

    $("#Log_Boom").on("click", function() {
      $("#sampleDropdown").text("Log Boom");

      var wst = ["Date"];
      var wst2016 = ["Date"];
      var wst2017 = ["Date"];
      var wst2018 = ["Date"];
      var wst2019 = ["Date"];
      var wstt = ["Date"];
      var wstt2016 = ["Date"];
      var wstt2017 = ["Date"];
      var wstt2018 = ["Date"];
      var wstt2019 = ["Date"];
      var wsnt = ["Date"];
      var wsnt2016 = ["Date"];
      var wsnt2017 = ["Date"];
      var wsnt2018 = ["Date"];
      var wsnt2019 = ["Date"];
      var algae = ["Algae"];
      var algae2016 = ["2016"];
      var algae2017 = ["2017"];
      var algae2018 = ["2018"];
      var algae2019 = ["2019"];
      var toxin = ["Toxins"];
      var toxin2016 = ["2016"];
      var toxin2017 = ["2017"];
      var toxin2018 = ["2018"];
      var toxin2019 = ["2019"];
      var nitrate = ["Total Nitrate"];
      var nitrate2016 = ["2016"];
      var nitrate2017 = ["2017"];
      var nitrate2018 = ["2018"];
      var nitrate2019 = ["2019"];
      // var negTests = ["Negative Tests"];
      var sampleSiteSelect = {
        name: "Log_Boom",
        a: algae,
        a2016: algae2016,
        a2017: algae2017,
        a2018: algae2018,
        a2019: algae2019,
        t: toxin,
        t2016: toxin2016,
        t2017: toxin2017,
        t2018: toxin2018,
        t2019: toxin2019,
        n: nitrate,
        n2016: nitrate2016,
        n2017: nitrate2017,
        n2018: nitrate2018,
        n2019: nitrate2019,
      }

      sampleSiteCounts(sampleSiteSelect);

      sampleSubChart.load({
        unload: true,
        columns: [sampleSiteSelect.a2019, sampleSiteSelect.a2018],
      });
      sampleChart.load({
        unload: true,
        columns: [sampleSiteSelect.a2019, sampleSiteSelect.a2018],
      });
      toxinChart.load({
        unload: true,
        columns: [sampleSiteSelect.t2019, sampleSiteSelect.t2018],
      });
      nitrateChart.load({
        unload: true,
        columns: [sampleSiteSelect.n2019, sampleSiteSelect.n2018],
      });
      $("#sample2017").css('color', 'white');
      $("#sample2016").css('color', 'white');
    });

    $("#Heater").on("click", function() {
      $("#sampleDropdown").text("Heater");

      var wst = ["Date"];
      var wst2016 = ["Date"];
      var wst2017 = ["Date"];
      var wst2018 = ["Date"];
      var wst2019 = ["Date"];
      var wstt = ["Date"];
      var wstt2016 = ["Date"];
      var wstt2017 = ["Date"];
      var wstt2018 = ["Date"];
      var wstt2019 = ["Date"];
      var wsnt = ["Date"];
      var wsnt2016 = ["Date"];
      var wsnt2017 = ["Date"];
      var wsnt2018 = ["Date"];
      var wsnt2019 = ["Date"];
      var algae = ["Algae"];
      var algae2016 = ["2016"];
      var algae2017 = ["2017"];
      var algae2018 = ["2018"];
      var algae2019 = ["2019"];
      var toxin = ["Toxins"];
      var toxin2016 = ["2016"];
      var toxin2017 = ["2017"];
      var toxin2018 = ["2018"];
      var toxin2019 = ["2019"];
      var nitrate = ["Total Nitrate"];
      var nitrate2016 = ["2016"];
      var nitrate2017 = ["2017"];
      var nitrate2018 = ["2018"];
      var nitrate2019 = ["2019"];
      // var negTests = ["Negative Tests"];
      var sampleSiteSelect = {
        name: "Heater",
        a: algae,
        a2016: algae2016,
        a2017: algae2017,
        a2018: algae2018,
        a2019: algae2019,
        t: toxin,
        t2016: toxin2016,
        t2017: toxin2017,
        t2018: toxin2018,
        t2019: toxin2019,
        n: nitrate,
        n2016: nitrate2016,
        n2017: nitrate2017,
        n2018: nitrate2018,
        n2019: nitrate2019,
      }

      sampleSiteCounts(sampleSiteSelect);


      sampleSubChart.load({
        unload: true,
        columns: [sampleSiteSelect.a2019, sampleSiteSelect.a2018],
      });
      sampleChart.load({
        unload: true,
        columns: [sampleSiteSelect.a2019, sampleSiteSelect.a2018],
      });
      toxinChart.load({
        unload: true,
        columns: [sampleSiteSelect.t2019, sampleSiteSelect.t2018],
      });
      nitrateChart.load({
        unload: true,
        columns: [sampleSiteSelect.n2019, sampleSiteSelect.n2018],
      });
      $("#sample2017").css('color', 'white');
      $("#sample2016").css('color', 'white');
    });

    $("#Blowout").on("click", function() {
      $("#sampleDropdown").text("Blowout");

      var wst = ["Date"];
      var wst2016 = ["Date"];
      var wst2017 = ["Date"];
      var wst2018 = ["Date"];
      var wst2019 = ["Date"];
      var wstt = ["Date"];
      var wstt2016 = ["Date"];
      var wstt2017 = ["Date"];
      var wstt2018 = ["Date"];
      var wstt2019 = ["Date"];
      var wsnt = ["Date"];
      var wsnt2016 = ["Date"];
      var wsnt2017 = ["Date"];
      var wsnt2018 = ["Date"];
      var wsnt2019 = ["Date"];
      var algae = ["Algae"];
      var algae2016 = ["2016"];
      var algae2017 = ["2017"];
      var algae2018 = ["2018"];
      var algae2019 = ["2019"];
      var toxin = ["Toxins"];
      var toxin2016 = ["2016"];
      var toxin2017 = ["2017"];
      var toxin2018 = ["2018"];
      var toxin2019 = ["2019"];
      var nitrate = ["Total Nitrate"];
      var nitrate2016 = ["2016"];
      var nitrate2017 = ["2017"];
      var nitrate2018 = ["2018"];
      var nitrate2019 = ["2019"];
      // var negTests = ["Negative Tests"];
      var sampleSiteSelect = {
        name: "Blowout",
        a: algae,
        a2016: algae2016,
        a2017: algae2017,
        a2018: algae2018,
        a2019: algae2019,
        t: toxin,
        t2016: toxin2016,
        t2017: toxin2017,
        t2018: toxin2018,
        t2019: toxin2019,
        n: nitrate,
        n2016: nitrate2016,
        n2017: nitrate2017,
        n2018: nitrate2018,
        n2019: nitrate2019,
      }

      sampleSiteCounts(sampleSiteSelect);


      sampleSubChart.load({
        unload: true,
        columns: [sampleSiteSelect.a2019, sampleSiteSelect.a2018],
      });
      sampleChart.load({
        unload: true,
        columns: [sampleSiteSelect.a2019, sampleSiteSelect.a2018],
      });
      toxinChart.load({
        unload: true,
        columns: [sampleSiteSelect.t2019, sampleSiteSelect.t2018],
      });
      nitrateChart.load({
        unload: true,
        columns: [sampleSiteSelect.n2019, sampleSiteSelect.n2018],
      });
      $("#sample2017").css('color', 'white');
      $("#sample2016").css('color', 'white');
    });




  });






  // Tab JS
  var triggerTabList = [].slice.call(document.querySelectorAll('#weather-tab'))
  triggerTabList.forEach(function(triggerEl) {
    var tabTrigger = new bootstrap.Tab(triggerEl)
    triggerEl.addEventListener('click', function(event) {
      event.preventDefault()
      tabTrigger.show()

    })
  })
  var triggerTabList = [].slice.call(document.querySelectorAll('#stream-tab'))
  triggerTabList.forEach(function(triggerEl) {
    var tabTrigger = new bootstrap.Tab(triggerEl)
    triggerEl.addEventListener('click', function(event) {
      event.preventDefault()
      tabTrigger.show()

    })
  })
  var triggerTabList = [].slice.call(document.querySelectorAll('#sample-tab'))
  triggerTabList.forEach(function(triggerEl) {
    var tabTrigger = new bootstrap.Tab(triggerEl)
    triggerEl.addEventListener('click', function(event) {
      event.preventDefault()
      tabTrigger.show()

    })
  })


  var today = new Date();

  var date = (today.getMonth() + 1) + '-' + today.getDate() + '-' + today.getFullYear();

  $("#date").text("Last update: " + date);

  function openNav() {
    // $("#info").css("left","0%");
    $("#info").show();
    $("#openBar").hide();
    // center = L.latLng(44.70744, -126.18925);
    mymap.fitBounds(lakeBoundsClosedMini);
    // document.getElementById("main").style.marginLeft = "250px";
  }

  function closeNav() {
    // $("#info").css("left","-50%");
    $("#info").hide();
    $("#openBar").show();
    mymap.fitBounds(lakeBoundsClosed);
  }
  $("#sat-tab").on("click", function() {
    $("#infoMapLegend").hide();
    $("#sat-button").show();
  });
  $("#sat-button").on("click", function() {
    $("#infoMapLegend").show();
    $("#sat-button").hide();
  });
  $("#sat-button").hide();
  // function closeNav() {
  //   $("#infoContainer").hide();
  // }
  $("#openBar").hide();



  // Leaflet controls
  // Map Scale


  /////////////////////////
  $(".leaflet-control-attribution")
    .css("background-color", "transparent")
    .css("color", "white")
    .html("Supported by <a href='https://www.clrwater.io/' target='_blank' style='color:white;''> ClearWater Analytica </a>");
