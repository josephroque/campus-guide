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
 * @file Tabs.js
 * @providesModule Tabs
 * @description Provides tab functionality common to both Android and iOS.
 *
 * @flow
 */
'use strict';

// React imports
import React from 'react';
import {
  BackAndroid,
  Dimensions,
  LayoutAnimation,
  Navigator,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

// Type imports
import type {
  Route,
  TabItems,
} from 'types';

// Type definition for component state.
type State = {
  currentTab: number,
};

// Imports
const Constants = require('Constants');
const dismissKeyboard = require('dismissKeyboard');
const Ionicons = require('react-native-vector-icons/Ionicons');
const NavBar = require('NavBar');
const Preferences = require('Preferences');
const ScreenUtils = require('ScreenUtils');
const SearchManager = require('SearchManager');
const TabRouter = require('TabRouter');

// Lists the views currently on the stack in the Navigator.
let screenStack: Array < number | string > = [Constants.Views.Default];

// Determining the size of the current tab indicator based on the screen size
const {width} = Dimensions.get('window');
// Width of indicator which indicates current tab
const indicatorWidth: number = Math.ceil(width / Constants.Tabs.length);
// Size of the icons within the tabs
const tabIconSize: number = 30;

// Icons for tab items
let tabIcons: TabItems;
if (Platform.OS === 'android') {
  tabIcons = {
    find: 'directions',
    schedule: 'event',
    discover: 'near-me',
    settings: 'settings',
  };
} else {
  tabIcons = {
    find: 'ios-navigate',
    schedule: 'ios-calendar-outline',
    discover: 'ios-compass',
    settings: 'ios-settings',
  };
}

class TabsCommon extends React.Component {

  /**
   * Define type for the component state.
   */
  state: State;

  /**
   * Pass props and declares initial state.
   *
   * @param {{}} props properties passed from container to this component.
   */
  constructor(props: {}) {
    super(props);
    this.state = {
      currentTab: Constants.Views.DefaultTab,
    };

    // Explicitly binding 'this' to all methods that need it
    (this:any).getCurrentTab = this.getCurrentTab.bind(this);
    (this:any)._navigateForward = this._navigateForward.bind(this);
    (this:any)._searchAll = this._searchAll.bind(this);
  }

  /**
   * Registers a default search listener, attaches a listener to the Android back button.
   */
  componentDidMount(): void {
    SearchManager.setDefaultSearchListener({
      onSearch: this._searchAll,
    });

    if (Platform.OS === 'android') {
      BackAndroid.addEventListener('hardwareBackPress', this._navigateBack.bind(this));
    }
  }

  /**
   * Removes the default search listener, removes the listener from the Android back button.
   */
  componentWillUnmount(): void {
    SearchManager.setDefaultSearchListener(null);

    if (Platform.OS === 'android') {
      BackAndroid.removeEventListener('hardwareBackPress', this._navigateBack.bind(this));
    }
  }

  /** Screen which a tab should open. Made as a member variable so subclasses can see it. */
  tabScreens: TabItems = {
    find: Constants.Views.Find.Home,
    schedule: Constants.Views.Schedule.Home,
    discover: Constants.Views.Discover.Home,
    settings: Constants.Views.Settings.Home,
  };

  /** When set to true, the next call to _onSearch will be ignored. */
  _ignoreNextSearch: boolean;

  /**
   * Switch to the selected tab, as determined by tabId.
   *
   * @param {number} tab the tab to switch to.
   */
  _changeTabs(tab: number): void {
    SearchManager.resumeAllSearchListeners();
    this._ignoreNextSearch = true;
    this._showBackButton(false);
    this.refs.NavBar.clearSearch();
    this.refs.Navigator.resetTo({id: tab});
    LayoutAnimation.easeInEaseOut();
    this.setState({
      currentTab: tab,
    });
    screenStack = [tab];
  }

  /**
   * Sets the transition between two views in the navigator.
   *
   * @returns {Object} a configuration for the transition between scenes.
   */
  _configureScene(): Object {
    return Navigator.SceneConfigs.PushFromRight;
  }

  /**
   * Dismisses the keyboard.
   *
   * @returns {boolean} false
   */
  _dismissKeyboard(): boolean {
    dismissKeyboard();
    return false;
  }

  /**
   * Returns the current screen being displayed, or 0 if there isn't one.
   *
   * @returns {number | string} the screen at the top of {screenStack}, or 0.
   */
  _getCurrentScreen(): number | string {
    if (screenStack !== null && screenStack.length > 0) {
      return screenStack[screenStack.length - 1];
    } else {
      return 0;
    }
  }

  /**
   * Retrieves the current tab.
   *
   * @returns {number} the current tab in the state.
   */
  getCurrentTab(): number {
    return this.state.currentTab;
  }

  /**
   * Returns to the previous page.
   *
   * @returns {boolean} true if the app navigated backwards.
   */
  _navigateBack(): boolean {
    if (!ScreenUtils.isRootScreen(screenStack[screenStack.length - 1])) {
      this.refs.Navigator.pop();
      screenStack.pop();

      if (ScreenUtils.isRootScreen(screenStack[screenStack.length - 1])) {
        this._showBackButton(false);
      }

      return true;
    }

    return false;
  }

  /**
   * Opens a screen, unless the screen is already showing. Passes data to the new screen.
   *
   * @param {number | string} screenId id of the screen to display
   * @param {Object}          data     optional parameters to pass to the renderScene method.
   */
  _navigateForward(screenId: number | string, data: any): void {
    if (this._getCurrentScreen() === screenId) {
      // Don't push the screen if it's already showing.
      // TODO: change the search terms if screenId === Constants.Views.Find.Search
      return;
    }

    // Show a back button to return to the previous screen, if the screen
    // is not a home screen
    if (ScreenUtils.isRootScreen(this._getCurrentScreen())) {
      this._showBackButton(true);
    }

    this.refs.Navigator.push({id: screenId, data: data});
    screenStack.push(screenId);
  }

  /**
   * Forces the navbar to be re-rendered.
   */
  _refreshNavbar(): void {
    this.refs.NavBar.setState({refresh: !this.refs.NavBar.getRefresh()});
  }

  /**
   * Searches all components of the app and displays the results.
   *
   * @param {?string} searchTerms string of terms to search for.
   */
  _searchAll(searchTerms: ?string): void {
    if (this._getCurrentScreen() !== Constants.Views.Search
        && searchTerms != null && searchTerms.length > 0) {
      this._navigateForward(Constants.Views.Search, searchTerms);
    }
  }

  /**
   * Shows or hides the back button in the navbar.
   *
   * @param {boolean} show true to show back button, false to hide
   */
  _showBackButton(show: boolean): void {
    this.refs.NavBar.setState({
      showBackButton: show,
    });
  }

  /**
   * Passes search params onto search listeners, or the default search listener if there are no others.
   *
   * @param {?string} searchTerms string of terms to search for.
   */
  _onSearch(searchTerms: ?string): void {
    if (this._ignoreNextSearch) {
      this._ignoreNextSearch = false;
      return;
    }

    const numberOfSearchListeners = SearchManager.numberOfSearchListeners();
    if (numberOfSearchListeners > 0 && !Preferences.getAlwaysSearchAll()) {
      // Get only the search listeners with the highest priority
      const searchListeners = SearchManager.getHighestPrioritySearchListeners();

      // Iterate over each search listener and pass the search terms to each one
      for (let i = 0; i < searchListeners.length; i++) {
        if (searchListeners[i] != null) {
          searchListeners[i].onSearch(searchTerms);
        }
      }
    } else if (SearchManager.getDefaultSearchListener() != null) {
      // If there are no search listeners except for a default one, then send terms to the default
      const searchListener = SearchManager.getDefaultSearchListener();
      if (searchListener != null) {
        searchListener.onSearch(searchTerms);
      }
    }
  }

  /**
   * Renders a view according to the current route of the navigator.
   *
   * @param {Route} route object with properties to identify the route to display.
   * @returns {ReactElement<any>} the view to render, based on {route}.
   */
  _renderScene(route: Route): ReactElement < any > {
    return TabRouter.renderScene(route,
        this._changeTabs.bind(this),
        this._navigateForward,
        this._refreshNavbar.bind(this));
  }

  /**
   * Renders the app tabs and icons, an indicator to show the current tab, and a navigator with the tab contents.
   *
   * @returns {ReactElement<any>} the hierarchy of views to render.
   */
  render(): ReactElement < any > {
    let indicatorLeft: number = 0;

    const tabs: Array < ReactElement < any > > = [];
    for (let i = 0; i < Constants.Tabs.length; i++) {
      let tabColor: string = Constants.Colors.charcoalGrey;
      if (this.state.currentTab === this.tabScreens[Constants.Tabs[i]]) {
        tabColor = Constants.Colors.garnet;
        indicatorLeft = indicatorWidth * i;
      }

      tabs.push(
        <TouchableOpacity
            key={Constants.Tabs[i]}
            style={_styles.tab}
            onPress={this._changeTabs.bind(this, this.tabScreens[Constants.Tabs[i]])}>
          <Ionicons
              color={tabColor}
              name={tabIcons[Constants.Tabs[i]]}
              size={tabIconSize} />
        </TouchableOpacity>
      );
    }

    return (
      <View style={_styles.container}>
        <NavBar
            ref='NavBar'
            onBack={this._navigateBack.bind(this)}
            onSearch={this._onSearch.bind(this)} />
        <View
            style={_styles.container}
            onMoveShouldSetResponder={this._dismissKeyboard.bind(this)}
            onStartShouldSetResponder={this._dismissKeyboard.bind(this)}>
          <Navigator
              configureScene={this._configureScene}
              initialRoute={{id: Constants.Views.Default}}
              ref='Navigator'
              renderScene={this._renderScene.bind(this)}
              style={_styles.container} />
          <View style={_styles.tabContainer}>
            {tabs.map(tab => (
              tab
            ))}
            <View style={[_styles.indicator, {left: indicatorLeft}]} />
          </View>
        </View>
      </View>
    );
  }
}

// Private styles for component
const _styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    height: 60,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Constants.Colors.rootElementBorder,
    backgroundColor: Constants.Colors.polarGrey,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    width: indicatorWidth,
    height: 5,
    backgroundColor: Constants.Colors.garnet,
  },
});

module.exports = TabsCommon;