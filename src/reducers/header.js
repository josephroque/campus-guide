/**
 *
 * @license
 * Copyright (C) 2016 Joseph Roque
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Joseph Roque
 * @created 2016-10-18
 * @file header.js
 * @description Reducers for header actions
 *
 * @flow
 */
'use strict';

// Import default translations
const CoreTranslations = require('../../assets/json/CoreTranslations');

// Types
import type {
  Action,
  Name,
  TranslatedName,
} from 'types';

// Describes the header state.
type State = {
  backNavigation: number,       // Count of the times the user has navigated back in the app
  title: Name | TranslatedName, // Title for the current screen
  shouldShowBack: boolean,      // True to show a back button in the header, false to hide
  shouldShowSearch: boolean,    // True to show a search field in the header, false to hide
};

// Default title to use for the header
const defaultTitle = {
  name_en: CoreTranslations && CoreTranslations.en ? CoreTranslations.en.app_name : 'Campus Guide',
  name_fr: CoreTranslations && CoreTranslations.fr ? CoreTranslations.fr.app_name : 'Guide de campus',
};

// Initial header state.
const initialState: State = {
  backNavigation: 0,
  title: defaultTitle,
  shouldShowBack: false,
  shouldShowSearch: false,
};

/**
 * When provided with a header action, parses the parameters and returns an updated state.
 *
 * @param {State}  state  the current state
 * @param {Action} action the action being taken
 * @returns {State} an updated state based on the previous state and the action taken.
 */
function header(state: State = initialState, action: Action): State {
  switch (action.type) {
    case 'NAVIGATE_BACK':
      return {
        ...state,
        backNavigation: state.backNavigation + 1,
      };
    case 'SET_HEADER_TITLE':
      return {
        ...state,
        title: action.title || initialState.title,
      };
    case 'HEADER_SHOW_BACK':
      return {
        ...state,
        shouldShowBack: action.shouldShowBack,
      };
    case 'HEADER_SHOW_SEARCH':
      return {
        ...state,
        shouldShowSearch: action.shouldShowSearch,
      };
    default:
      return state;
  }
}

module.exports = header;