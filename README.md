prediction-try-java-python
==========================

Sample application illustrating use of the  Google Prediction API within the Google App Engine environmentTry Prediction (v1.0)

This project provides a complete application illustrating use of the 
Google Prediction API within the Google App Engine environment. Sample 
code is provided for both the Java and Python App Engine runtimes, 
along with resources for CSS, Javascript, images and config data files, 
all of which are shared across the two runtime environments.

The application presents a simple interactive user experience: select 
a prediction model, enter a corresponding set of input text and submit 
your prediction request. For classification models, a graphical response 
is provided showing the confidence level for each category in the 
selected model. For regression models, a numerical result is presented.

The set of models supported and the corresponding input fields are 
entirely dynamic and controlled by a runtime text file (rc/models.json). 
You can freely add, change or remove models without changing any source code.

Web services in this domain typically provide access to a prediction 
model via a common set of shared security credentials. In this model, 
there is no need to force end users to perform the OAuth token granting 
sequence - authorization of end users is entirely up to the discretion 
of the application provider. This shared-server authorization model is 
one of the key elements being illustrated in this sample application.

You can try a live instance of this application at 
http://try-prediction.appspot.com.

Prerequisites

Before using this project, you should familiarize yourself with the 
Google Prediction API Developer's Guide and experiment with the "Hello 
Prediction!" sample exercise. You should have at least one trained model 
of your own to use with the Try Prediction app.

Dependencies for the Python version:

- Python 2.5 or later
- Google App Engine
- Google Python API Client
- Command line flags modules for Python
- HTTP Client Library for Python
- Google OAuth 2.0 Client Library for Python
- URI Templates for Python

Dependencies for the Java version:

- Java 5 (or higher) standard (SE) and enterprise (EE)
- Google App Engine
- Maven
- Maven Plugin for App Engine

Getting Started

  1. Clone this repo into a new directory.

  2. Customize the following files:

    - In shared/rc/client_secrets.json, replace the placeholder strings with your actual client id and 
      client secret from the Google APIs console.

    - In shared/rc/models.json, enter information about the model(s) you would like to use, following 
      the format shown for the two sample models.

    - Java only: edit the file gae-java/src/main/java/com/google/tryPredictionJava/web/IndexServlet.java 
      to specify your redirect URI, which should be your app's base URI + 
      /auth_return, e.g. http://your-app-name.appspot.com/auth_return.

    - Add your redirect URI (defined in previous step) to the list of valid 
      redirect URIs in the "API Access" tab of the APIs Console. If you miss 
      this step, you'll get a 'redirect_uri_mismatch' error during initial 
      authorization of the shared server credentials.

  3. Build and deploy your app:

    - For Python: modify the "application:" line in your app.yaml file to 
      reflect your chosen app name and use the Google App Engine tools to 
      deploy your app.

    - For Java: modify the contents of the "application" XML element in 
      your gae-java/src/main/webapp/WEB-INF/appengine-web.xml file to 
      reflect your chosen app name and use the Maven plugin for Google 
      App Engine to deploy your app (you need to run "mvn gae:unpack" 
      once and then you can subsequently deploy your app repeatedly 
      with "mvn gae:deploy").
      
  4. The first time you access your app, it will step you through the login 
   and OAuth 2.0 sequence, however, all access thereafter, by you or anyone 
   else, will reuse your initially established security credentials. If you 
   ever wish to change or re-establish the shared server credentials, simply 
   visit your service's URI with the "/reset" suffix (note that the reset 
   service can only be invoked by the application administrator).

Try Prediction is brought to you by the Google Developer Relations team.

