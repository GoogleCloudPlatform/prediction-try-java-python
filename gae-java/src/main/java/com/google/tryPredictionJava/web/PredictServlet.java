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

package com.google.tryPredictionJava.web;

import java.util.*;
import java.io.IOException;
import java.io.FileInputStream;

import javax.servlet.RequestDispatcher;
import javax.servlet.ServletException;
import javax.servlet.http.HttpSession;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.api.client.http.HttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonParser;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson.JacksonFactory;
import com.google.api.client.googleapis.auth.oauth2.draft10.GoogleAccessProtectedResource;
import com.google.api.client.auth.oauth2.draft10.AccessTokenResponse;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.EntityNotFoundException;

import com.google.api.services.prediction.Prediction;
import com.google.api.services.prediction.model.Input;
import com.google.api.services.prediction.model.InputInput;
import com.google.api.services.prediction.model.Output;

import com.google.tryPredictionJava.web.IndexServlet;

public class PredictServlet extends HttpServlet {

  @Override
  protected void doGet(HttpServletRequest request,
                       HttpServletResponse response) throws ServletException, 
                                                            IOException {
    Entity credentials = null;
    try {
      // Retrieve server credentials from app engine datastore.
      DatastoreService datastore = 
        DatastoreServiceFactory.getDatastoreService();
      Key credsKey = KeyFactory.createKey("Credentials", "Credentials");
      credentials = datastore.get(credsKey);
    } catch (EntityNotFoundException ex) {
      // If can't obtain credentials, send exception back to Javascript client.
      response.setContentType("text/html");
      response.getWriter().println("exception: " + ex.getMessage());
    }

    // Extract tokens from retrieved credentials.
    AccessTokenResponse tokens = new AccessTokenResponse();
    tokens.accessToken = (String) credentials.getProperty("accessToken");
    tokens.expiresIn = (Long) credentials.getProperty("expiresIn");
    tokens.refreshToken = (String) credentials.getProperty("refreshToken");
    String clientId = (String) credentials.getProperty("clientId");
    String clientSecret = (String) credentials.getProperty("clientSecret");
    tokens.scope = IndexServlet.scope;

    // Set up the HTTP transport and JSON factory
    HttpTransport httpTransport = new NetHttpTransport();
    JsonFactory jsonFactory = new JacksonFactory();

    // Get user requested model, if specified.
    String model_name = request.getParameter("model");

    // Parse model descriptions from models.json file.
    Map<String, Object> models = 
      IndexServlet.parseJsonFile(IndexServlet.modelsFile);

    // Setup reference to user specified model description.
    Map<String, Object> selectedModel = 
      (Map<String, Object>) models.get(model_name);
    
    // Obtain model id (the name under which model was trained), 
    // and iterate over the model fields, building a list of Strings
    // to pass into the prediction request.
    String modelId = (String) selectedModel.get("model_id");
    List<Object> params = new ArrayList<Object>();
    List<Map<String, String> > fields = 
      (List<Map<String, String> >) selectedModel.get("fields");
    for (Map<String, String> field : fields) {
      // This loop is populating the input csv values for the prediction call.
      String label = field.get("label");
      String value = request.getParameter(label);
      params.add(value);
    }

    // Set up OAuth 2.0 access of protected resources using the retrieved
    // refresh and access tokens, automatically refreshing the access token 
    // whenever it expires.
    GoogleAccessProtectedResource requestInitializer = 
      new GoogleAccessProtectedResource(tokens.accessToken, httpTransport, 
                                        jsonFactory, clientId, clientSecret, 
                                        tokens.refreshToken);

    // Now populate the prediction data, issue the API call and return the
    // JSON results to the Javascript AJAX client.
    Prediction prediction = new Prediction(httpTransport, requestInitializer, 
                                           jsonFactory);
    Input input = new Input();
    InputInput inputInput = new InputInput();
    inputInput.setCsvInstance(params);
    input.setInput(inputInput);
    Output output = 
      prediction.trainedmodels().predict(modelId, input).execute();
    response.getWriter().println(output.toPrettyString());
  }
}
