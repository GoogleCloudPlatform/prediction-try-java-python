/*
 * Copyright 2012 Google Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * Author: Marc Cohen
 *
 */

// Global constants set here.
var PREDICT = 'predict';
var ERR_TAG = '<HttpError>';
var ERR_END = '</HttpError>';
var Chart_type = 'pie';
var Chart_rows = Array();

// Toggle between pie and bar charts.
function switch_chart_type() {
  if (Chart_type == 'pie') {
    Chart_type = 'bar';
  } else if (Chart_type == 'bar') {
    Chart_type = 'pie';
  }
  draw_chart();
  return false;
}

// Render results chart based on data received from AJAX call.
function draw_chart() {
  // Create the data table.
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'Prediction');
  data.addColumn('number', 'Confidence');
  data.addRows(Chart_rows);
  
  // Set chart options
  var options = {'title'  : '',
                 'width'  : 600,
                 'height' : 400};

  // Instantiate and draw our chart, passing in some options.
  if (Chart_type == 'pie') {
    chart = new google.visualization.PieChart(
      document.getElementById('results_chart'));
  } else if (Chart_type == 'bar') {
    chart = new google.visualization.BarChart(
      document.getElementById('results_chart'));
  }
  chart.draw(data, options);

  // Setup hyperlink to support dynamically switching chart type.
  $('#switch_chart_link').text('Switch chart type');
  $('#switch_chart_link').unbind('click');
  $('#switch_chart_link').click(switch_chart_type);
}

// Process AJAX response. This is the respond from the app engine's predict
// method, which simply passes the JSON encoded response from the prediction
// API call run on the server, so we can assume this response looks exactly
// like what we would see if made the prediction call directly, with one
// exception: errors are wrapped in a special HttpError tag to make it
// easy to distinguish them on the client side.
function response(resp) {
  err_tag_len = ERR_TAG.length;
  if (resp.substr(0, err_tag_len) == ERR_TAG) {
    // We received an error - display the error to the user and return.
    // The following substr() peels off the leading and trailing <HttpError>
    // tags for user-friendly presentation of the contained error message.
    err_str = resp.substr(err_tag_len, resp.length - (err_tag_len * 2) - 1);
    $('#prediction_result').text('ERROR:' + err_str);
    return;
  }

  // We got a successful response. Parse the JSON text and interpret content.
  var obj = JSON.parse(resp);
  if ('kind' in obj) {
    if (obj['kind'] == 'prediction#output') {
      result = 'unknown';
      if ('outputLabel' in obj) {
        // An outputLabel means we have a classification result.
        result = obj['outputLabel'];
      } else if ('outputValue' in obj) {
        // An outputValue means we have a regression result.
        result = obj['outputValue'];
      }
      if ('outputMulti' in obj) {
        category_results = obj['outputMulti'];
        // For a classification result, store the category results for
        // grahical display.
        var rows = new Array();
        for (i in category_results) {
          label = category_results[i]['label']
          score = parseFloat(category_results[i]['score'])
          rows.push([label, score]);
        }
        // Draw the chart showing detailed per category results
        // (only done for a classification model result).
        Chart_rows = rows;
        draw_chart();
      }
      // Display classification or regression prediction result.
      $('#prediction_result').text(result);
    }
  } else {
    // Unparsable response not enveloped by an HttpError tag -
    // flag as error and display reponse to aid debugging.
    alert('failed request: ' + resp);
  }
}

// Launch a prediction request via AJAX.
function predict() {
  // Clear any current results chart, text and chart switching link.
  $('#results_chart').html('');
  $('#prediction_result').text('Obtaining prediction result...');
  $('#switch_chart_link').text('');

  // Build URI params containing selected model and input data.
  var uri = '/predict?model=';
  model = $('#model_id option:selected').val();
  model = escape(model);
  uri += model;
  input_fields = $('.input');
  for (i = 0; i < input_fields.length; i++) {
    elem = input_fields[i];
    uri += '&' + escape(elem.id) + '=' + escape(elem.value);
  }

  // Send the prediction call in a jQuery AJAX request. The response
  // will be fielded asynchronously by the response() callback function.
  $.ajax({
    url: uri,
    type: 'POST',
    dataType: 'text',
    success: [response]
  });
}

// Handle user changing selection in the model selection pull-down menu.
function change_model(elem) {
  model = elem.options[elem.selectedIndex].text;
  // Execute model change by submiting a dynamically generated form.
  // Eventually this should be a local Javascript action but for now
  // it requires a round-trip to the server.
  $('<form action="/" method="post"><input type="text" name="model" value="' + 
    model + '"></form>').submit();
}

// Callback function called when Google Charts Javascript API is loaded.
// Not currently used but available for debugging purposes.
function charts_ready() {
}

// Process keydown event - this is used to automatically trigger a 
// prediction request when the user presses the enter key in an input
// control of type text. Note that we only use this for single line
// text input - for multiple line text boxes (HTML textarea elements),
// we don't interpret enter as submit because the user will often want
// the enter key to have it's usual function in moving to the next line
// of multi-line text input.
function keydown(event) {
  if(event.keyCode == 13){
    // Only assume form submit if the pressed key was the enter key.
    predict();
    // Returning false causes JS to stop sending this event downstream.
    return false;
  } else {
    return true;
  }
}

// Initialization functions for this file.
function init() {
  // Load the Visualization API and the charts package.
  google.load('visualization', '1.0', {'packages':['corechart']});
  // Set a callback to run when the Google Visualization API is loaded.
  google.setOnLoadCallback(charts_ready);
}

// Invoke this file's initialization function. This is the only line of
// executable code in this file - the rest is only function definitions.
init();
