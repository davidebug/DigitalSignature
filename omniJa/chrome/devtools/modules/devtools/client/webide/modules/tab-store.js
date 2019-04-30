/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const EventEmitter = require("devtools/shared/event-emitter");
const { Connection } = require("devtools/shared/client/connection-manager");

const _knownTabStores = new WeakMap();

var TabStore;

module.exports = TabStore = function(connection) {
  // If we already know about this connection,
  // let's re-use the existing store.
  if (_knownTabStores.has(connection)) {
    return _knownTabStores.get(connection);
  }

  _knownTabStores.set(connection, this);

  EventEmitter.decorate(this);

  this._resetStore();

  this.destroy = this.destroy.bind(this);
  this._onStatusChanged = this._onStatusChanged.bind(this);

  this._connection = connection;
  this._connection.once(Connection.Events.DESTROYED, this.destroy);
  this._connection.on(Connection.Events.STATUS_CHANGED, this._onStatusChanged);
  this._onTabListChanged = this._onTabListChanged.bind(this);
  this._onTabNavigated = this._onTabNavigated.bind(this);
  this._onStatusChanged();
  return this;
};

TabStore.prototype = {

  destroy: function() {
    if (this._connection) {
      // While this.destroy is bound using .once() above, that event may not
      // have occurred when the TabStore client calls destroy, so we
      // manually remove it here.
      this._connection.off(Connection.Events.DESTROYED, this.destroy);
      this._connection.off(Connection.Events.STATUS_CHANGED, this._onStatusChanged);
      _knownTabStores.delete(this._connection);
      this._connection = null;
    }
  },

  _resetStore: function() {
    this.tabs = [];
    this._selectedTab = null;
    this._selectedTabTargetPromise = null;
  },

  _onStatusChanged: function() {
    if (this._connection.status == Connection.Status.CONNECTED) {
      // Watch for changes to remote browser tabs
      this._connection.client.mainRoot.on("tabListChanged",
                                          this._onTabListChanged);
      this.listTabs();
    } else {
      if (this._connection.client) {
        this._connection.client.mainRoot.off("tabListChanged",
                                             this._onTabListChanged);
      }
      this._resetStore();
    }
  },

  _onTabListChanged: function() {
    this.listTabs().then(() => this.emit("tab-list"))
                   .catch(console.error);
  },

  _onTabNavigated: function(e, { from, title, url }) {
    if (!this._selectedTab || from !== this._selectedTab.actor) {
      return;
    }
    this._selectedTab.url = url;
    this._selectedTab.title = title;
    this.emit("navigate");
  },

  listTabs: function() {
    if (!this._connection || !this._connection.client) {
      return Promise.reject(new Error("Can't listTabs, not connected."));
    }

    return new Promise((resolve, reject) => {
      this._connection.client.mainRoot.listTabs().then(tabs => {
        // To avoid refactoring WebIDE while switching from form to Target Front for
        // listTabs. Convert front to form list here.
        tabs = tabs.map(tab => tab.targetForm);
        const tabsChanged = JSON.stringify(this.tabs) !== JSON.stringify(tabs);
        this.tabs = tabs;
        this._checkSelectedTab();
        if (tabsChanged) {
          this.emit("tab-list");
        }
        resolve(tabs);
      }, error => {
        this._connection.disconnect();
        reject(error);
      });
    });
  },

  // TODO: Tab "selection" should really take place by creating a TabProject
  // which is the selected project.  This should be done as part of the
  // project-agnostic work.
  _selectedTab: null,
  _selectedTabTargetPromise: null,
  get selectedTab() {
    return this._selectedTab;
  },
  set selectedTab(tab) {
    if (this._selectedTab === tab) {
      return;
    }
    this._selectedTab = tab;
    this._selectedTabTargetPromise = null;
    // Attach to the tab to follow navigation events
    if (this._selectedTab) {
      this.getTargetForTab();
    }
  },

  _checkSelectedTab: function() {
    if (!this._selectedTab) {
      return;
    }
    const alive = this.tabs.some(tab => {
      return tab.actor === this._selectedTab.actor;
    });
    if (!alive) {
      this._selectedTab = null;
      this._selectedTabTargetPromise = null;
      this.emit("closed");
    }
  },

  getTargetForTab: function() {
    if (this._selectedTabTargetPromise) {
      return this._selectedTabTargetPromise;
    }
    const store = this;
    this._selectedTabTargetPromise = (async function() {
      // If you connect to a tab, then detach from it, the root actor may have
      // de-listed the actors that belong to the tab.  This breaks the toolbox
      // if you try to connect to the same tab again.  To work around this
      // issue, we force a "listTabs" request before connecting to a tab.
      await store.listTabs();

      const { outerWindowID } = store._selectedTab;
      return store._connection.client.mainRoot.getTab({ outerWindowID });
    })();
    this._selectedTabTargetPromise.then(target => {
      target.once("close", () => {
        this._selectedTabTargetPromise = null;
      });
    });
    return this._selectedTabTargetPromise;
  },

};
