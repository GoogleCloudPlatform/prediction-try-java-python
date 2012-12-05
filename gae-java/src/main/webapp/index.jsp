<!--
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
-->

<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!doctype html>
<!--[if lt IE 7 ]> <html class="no-js ie6" lang="en"> <![endif]-->
<!--[if IE 7 ]>    <html class="no-js ie7" lang="en"> <![endif]-->
<!--[if IE 8 ]>    <html class="no-js ie8" lang="en"> <![endif]-->
<!--[if (gte IE 9)|!(IE)]><!--> <html class="no-js" lang="en"> <!--<![endif]-->
<head>
  <!-- HTML 5 Boilerplate -->
  <link rel="stylesheet" href="/css/base_style.css?v=2">
  <!-- app specific styles -->
  <link rel="stylesheet" href="/css/style.css">
  <link rel="shortcut icon" href="/images/favicon.ico" />  <title>Try the Google Prediction API</title>
  <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.5
.1/jquery.js"></script>
  <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jqueryui/1
.8.13/jquery-ui.js"></script>  <script type="text/javascript" src="https://www.google.com/jsapi"></script>
  <script type="text/javascript" src="/js/predict.js"></script>
</head>
<body>
<div>
  <header>      
    <div id="logo"></div>
    <div id="app_title">Try the <a id="api_link" href="https://developers.google.com/prediction/">Google Prediction API</a></div>
  </header>
  <table cellspacing="10">
    <tr><td>&nbsp;</td></tr>
    <tr><td>&nbsp;</td></tr>
    <tr><td><div class="label">Select a model:</div></td><td colspan="2">
      <select id="model_id" onchange="change_model(this)">
        <%@ page import="java.util.Map" %>
        <%@ page import="java.util.List" %>
        <%@ page import="java.util.Iterator" %>
        <%
          Map<String, Object> selectedModel = null;
          String selectedModelName = 
            (String) request.getAttribute("selected_model_name");
          String selectedModelDesc = "";
          Map<String, Object> models = 
            (Map<String, Object>) request.getAttribute("models"); 
          String user_email = (String) request.getAttribute("user_email");
    
          // Iterate model description data, building pull-down menu
          // and display selected model's description data.
          for (Map.Entry entry : models.entrySet()) {
            String modelName = (String) entry.getKey();
            Map<String, Object> model = (Map<String, Object>) entry.getValue();
            String modelId = (String) model.get("model_id");
            Map<String, Integer> user_list = 
              (Map<String, Integer>) model.get("user_list");
            if ((user_list.size() > 0) && 
                (!user_list.containsKey(user_email))) {
              continue;
            }
            // Mark selected model for generating input fields below.
            if (selectedModelName == null) {
              selectedModelName = modelName;
              selectedModel = model;
	    }
            String selectedMarker = "";
	    if (modelName.equals(selectedModelName)) {
              selectedModelName = modelName;
              selectedModel = model;
              selectedMarker = " selected";
              selectedModelDesc = (String) model.get("description");
            }
            out.println("<option value=\"" + modelName + "\"" + 
                        selectedMarker + ">" + modelName + "</option>");
          }
          out.println("</select><span class=\"help\">" + 
                      selectedModelDesc + "</span></td></tr>");

          // Display selected model's input fields.
          List<Map<String, String> > fields =
            (List<Map<String, String> >) selectedModel.get("fields");
          for (Map<String, String> field : fields) {
            String label = field.get("label");
            String help = field.get("help");
            String rows = field.get("rows");
            Integer num_rows = Integer.parseInt(rows);
            String cols = field.get("cols");
            Integer num_cols = Integer.parseInt(cols);
	    out.println("<tr><td><div class=\"label\">" + label + 
                        ":</div></td><td>");
            if (num_rows > 1) {
              out.println("<textarea cols=\"" + num_cols + "\" rows=\"" + 
                num_rows + "\" id=\"" + label + 
                "\" class=\"input\"></textarea></td><td><div class=\"help\">" 
                + help + "</div></td></tr>");
            } else {
              out.println(
                "<input onkeydown=\"keydown(event)\" type=\"text\" size=\"" + 
                cols + "\" id=\"" + label +
                "\" class=\"input\"></input></td><td><div class=\"help\">" + 
                help + "</div></td></tr>");
            }
          }
        %>
    </td></tr>
    <tr><td></td><td>
      <a class="atd-button atd-search-button" style="margin-left: 0px; margin-top: 10px;" onclick="predict()">Predict</a>
      </td></tr>
    <tr><td>&nbsp;</td></tr>
    <tr><td><div class="label">Results:</div></td><td><b><div id="prediction_result"></div></b><a href='' id="switch_chart_link"></a></td></tr>
    <tr><td>&nbsp;</td><td>
      <div id="results_chart"></div>
    </td></tr>
  </table>
</div>
</body>
