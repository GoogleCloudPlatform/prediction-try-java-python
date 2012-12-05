#!/usr/bin/env python
#
# Copyright 2012 Google Inc.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# Author: Marc Cohen
#

'''Render Home Page.'''

import json
import logging
import pickle
from google.appengine.api import memcache
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import login_required
from oauth2client.appengine import StorageByKeyName
from oauth2client.appengine import CredentialsModel
from oauth2client.client import OAuth2WebServerFlow

# NOTE: You need to edit the redirect URI into the Dev Console, and that value 
# needs to be updated when you move from running this app locally to running
# on Google App Engine (else you'll get a 'redirect_uri_mismatch' error).

# Static configuation constants.
SCOPE = ('https://www.googleapis.com/auth/devstorage.read_write ' +
         'https://www.googleapis.com/auth/prediction')
USER_AGENT = 'try-prediction/1.0'
DEFAULT_MODEL = 'Language Detection'
SECRETS_FILE = 'rc/client_secrets.json'
MODELS_FILE = 'rc/models.json'


def parse_json_file(file):
  '''Utility function to open, read, and parse the contents of
     a file containing text encoded as a JSON document, and
     return resulting json object to caller.
  '''
  f = open(file, 'r')
  json_str = f.read()
  f.close()
  return json.loads(json_str)

class HomePage(webapp.RequestHandler):
  '''This class renders the main home page for the "Try Prediction" app.'''

  def post(self):
    '''Use the same logic for posts and gets.'''
    self.get()

  def get(self):
    '''Process get requests.'''
    user = users.get_current_user()

    # Fetch stored server credentials.
    credentials = StorageByKeyName(CredentialsModel, USER_AGENT,
                                   'credentials').locked_get()

    # If server credentials not found, trigger OAuth2.0 web server flow.
    if not credentials or credentials.invalid:
      # If no credentials and no user logged in, redirect to the reset, 
      # which will force a login to make sure this user has permission
      # to initialize the shared server credentials.
      if not user:
        self.redirect("/reset")

      # Read and parse client secrets JSON file.
      secrets = parse_json_file(SECRETS_FILE)

      client_id = secrets['installed']['client_id']
      client_secret = secrets['installed']['client_secret']

      flow = OAuth2WebServerFlow(client_id=client_id,
                                 client_secret=client_secret,
                                 scope=SCOPE,
                                 user_agent=USER_AGENT,
                                 access_type = 'offline',
                                 approval_prompt='force')
      callback = self.request.relative_url('/auth_return')
      authorize_url = flow.step1_get_authorize_url(callback)

      # Save flow object in memcache for later retrieval on OAuth callback,
      # and redirect this session to Google's OAuth 2.0 authorization site.
      logging.info('saving flow for user ' + user.user_id())
      memcache.set(user.user_id(), pickle.dumps(flow))
      self.redirect(authorize_url)

    # At this point we should have valid server credentials stored away.

    # Get user's chosen model, if selected, or default model.
    selected_model = self.request.get('model', DEFAULT_MODEL)

    # Read and parse model description JSON file.
    models = parse_json_file(MODELS_FILE)

    # Set django template and render home page.
    template_values = {
      'user' : str(user),
      'selected_model' : selected_model,
      'models' : models,
    }
    self.response.out.write(template.render('home.html', template_values))

class AuthHandler(webapp.RequestHandler):
  '''This class fields OAuth 2.0 web callback for the "Try Prediction" app.'''

  @login_required
  def get(self):
    user = users.get_current_user()

    # Retrieve flow object from memcache.
    logging.info('retrieving flow for user ' + user.user_id())
    flow = pickle.loads(memcache.get(user.user_id()))
    if flow:
      # Extract newly acquired server credentials, store creds
      # in datatore for future retrieval and redirect session
      # back to app's main page.
      credentials = flow.step2_exchange(self.request.params)
      StorageByKeyName(CredentialsModel, USER_AGENT,
                       'credentials').locked_put(credentials)
      self.redirect('/')
    else:
      raise('unable to obtain OAuth 2.0 credentials')

class Reset(webapp.RequestHandler):
  '''This class processes requests to reset the server's OAuth 2.0 
     credentials. It should only be executed by the application
     administrator per the app.yaml configuration file.'''

  @login_required
  def get(self):
    # Store empty credentials in the datastore and redirect to main page.
    StorageByKeyName(CredentialsModel, USER_AGENT,
                     'credentials').locked_put(None)
    self.redirect('/')
