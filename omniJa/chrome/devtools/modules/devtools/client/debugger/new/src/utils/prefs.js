"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.asyncStore = exports.features = exports.prefs = undefined;
exports.verifyPrefSchema = verifyPrefSchema;

var _devtoolsModules = require("devtools/client/debugger/new/dist/vendors").vendored["devtools-modules"];

var _devtoolsEnvironment = require("devtools/client/debugger/new/dist/vendors").vendored["devtools-environment"];

var _devtoolsServices = require("Services");

var _devtoolsServices2 = _interopRequireDefault(_devtoolsServices);

var _asyncStoreHelper = require("./asyncStoreHelper");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

const prefsSchemaVersion = "1.0.9";
const pref = _devtoolsServices2.default.pref;

if ((0, _devtoolsEnvironment.isDevelopment)()) {
  pref("devtools.debugger.logging", false);
  pref("devtools.debugger.alphabetize-outline", false);
  pref("devtools.debugger.auto-pretty-print", false);
  pref("devtools.source-map.client-service.enabled", true);
  pref("devtools.chrome.enabled", false);
  pref("devtools.debugger.pause-on-exceptions", false);
  pref("devtools.debugger.pause-on-caught-exceptions", false);
  pref("devtools.debugger.ignore-caught-exceptions", true);
  pref("devtools.debugger.call-stack-visible", true);
  pref("devtools.debugger.scopes-visible", true);
  pref("devtools.debugger.component-visible", true);
  pref("devtools.debugger.workers-visible", true);
  pref("devtools.debugger.expressions-visible", true);
  pref("devtools.debugger.xhr-breakpoints-visible", true);
  pref("devtools.debugger.breakpoints-visible", true);
  pref("devtools.debugger.event-listeners-visible", true);
  pref("devtools.debugger.start-panel-collapsed", false);
  pref("devtools.debugger.end-panel-collapsed", false);
  pref("devtools.debugger.start-panel-size", 300);
  pref("devtools.debugger.end-panel-size", 300);
  pref("devtools.debugger.tabsBlackBoxed", "[]");
  pref("devtools.debugger.ui.editor-wrapping", false);
  pref("devtools.debugger.ui.framework-grouping-on", true);
  pref("devtools.debugger.pending-selected-location", "{}");
  pref("devtools.debugger.expressions", "[]");
  pref("devtools.debugger.file-search-case-sensitive", false);
  pref("devtools.debugger.file-search-whole-word", false);
  pref("devtools.debugger.file-search-regex-match", false);
  pref("devtools.debugger.project-directory-root", "");
  pref("devtools.debugger.map-scopes-enabled", false);
  pref("devtools.debugger.prefs-schema-version", "1.0.1");
  pref("devtools.debugger.skip-pausing", false);
  pref("devtools.debugger.features.workers", true);
  pref("devtools.debugger.features.async-stepping", true);
  pref("devtools.debugger.features.wasm", true);
  pref("devtools.debugger.features.shortcuts", true);
  pref("devtools.debugger.features.root", true);
  pref("devtools.debugger.features.map-scopes", true);
  pref("devtools.debugger.features.remove-command-bar-options", true);
  pref("devtools.debugger.features.code-folding", false);
  pref("devtools.debugger.features.outline", true);
  pref("devtools.debugger.features.column-breakpoints", true);
  pref("devtools.debugger.features.skip-pausing", true);
  pref("devtools.debugger.features.component-pane", false);
  pref("devtools.debugger.features.autocomplete-expressions", false);
  pref("devtools.debugger.features.map-expression-bindings", true);
  pref("devtools.debugger.features.map-await-expression", true);
  pref("devtools.debugger.features.xhr-breakpoints", true);
  pref("devtools.debugger.features.original-blackbox", true);
  pref("devtools.debugger.features.windowless-workers", true);
  pref("devtools.debugger.features.event-listeners-breakpoints", true);
  pref("devtools.debugger.features.log-points", true);
}

const prefs = exports.prefs = new _devtoolsModules.PrefsHelper("devtools", {
  logging: ["Bool", "debugger.logging"],
  editorWrapping: ["Bool", "debugger.ui.editor-wrapping"],
  alphabetizeOutline: ["Bool", "debugger.alphabetize-outline"],
  autoPrettyPrint: ["Bool", "debugger.auto-pretty-print"],
  clientSourceMapsEnabled: ["Bool", "source-map.client-service.enabled"],
  chromeAndExtenstionsEnabled: ["Bool", "chrome.enabled"],
  pauseOnExceptions: ["Bool", "debugger.pause-on-exceptions"],
  pauseOnCaughtExceptions: ["Bool", "debugger.pause-on-caught-exceptions"],
  ignoreCaughtExceptions: ["Bool", "debugger.ignore-caught-exceptions"],
  callStackVisible: ["Bool", "debugger.call-stack-visible"],
  scopesVisible: ["Bool", "debugger.scopes-visible"],
  componentVisible: ["Bool", "debugger.component-visible"],
  workersVisible: ["Bool", "debugger.workers-visible"],
  breakpointsVisible: ["Bool", "debugger.breakpoints-visible"],
  expressionsVisible: ["Bool", "debugger.expressions-visible"],
  xhrBreakpointsVisible: ["Bool", "debugger.xhr-breakpoints-visible"],
  eventListenersVisible: ["Bool", "debugger.event-listeners-visible"],
  startPanelCollapsed: ["Bool", "debugger.start-panel-collapsed"],
  endPanelCollapsed: ["Bool", "debugger.end-panel-collapsed"],
  startPanelSize: ["Int", "debugger.start-panel-size"],
  endPanelSize: ["Int", "debugger.end-panel-size"],
  frameworkGroupingOn: ["Bool", "debugger.ui.framework-grouping-on"],
  tabsBlackBoxed: ["Json", "debugger.tabsBlackBoxed", []],
  pendingSelectedLocation: ["Json", "debugger.pending-selected-location", {}],
  expressions: ["Json", "debugger.expressions", []],
  fileSearchCaseSensitive: ["Bool", "debugger.file-search-case-sensitive"],
  fileSearchWholeWord: ["Bool", "debugger.file-search-whole-word"],
  fileSearchRegexMatch: ["Bool", "debugger.file-search-regex-match"],
  debuggerPrefsSchemaVersion: ["Char", "debugger.prefs-schema-version"],
  projectDirectoryRoot: ["Char", "debugger.project-directory-root", ""],
  skipPausing: ["Bool", "debugger.skip-pausing"],
  mapScopes: ["Bool", "debugger.map-scopes-enabled"]
});

const features = exports.features = new _devtoolsModules.PrefsHelper("devtools.debugger.features", {
  asyncStepping: ["Bool", "async-stepping"],
  wasm: ["Bool", "wasm"],
  shortcuts: ["Bool", "shortcuts"],
  root: ["Bool", "root"],
  columnBreakpoints: ["Bool", "column-breakpoints"],
  mapScopes: ["Bool", "map-scopes"],
  removeCommandBarOptions: ["Bool", "remove-command-bar-options"],
  workers: ["Bool", "workers"],
  windowlessWorkers: ["Bool", "windowless-workers"],
  outline: ["Bool", "outline"],
  codeFolding: ["Bool", "code-folding"],
  skipPausing: ["Bool", "skip-pausing"],
  autocompleteExpression: ["Bool", "autocomplete-expressions"],
  mapExpressionBindings: ["Bool", "map-expression-bindings"],
  mapAwaitExpression: ["Bool", "map-await-expression"],
  componentPane: ["Bool", "component-pane"],
  xhrBreakpoints: ["Bool", "xhr-breakpoints"],
  originalBlackbox: ["Bool", "original-blackbox"],
  eventListenersBreakpoints: ["Bool", "event-listeners-breakpoints"],
  logPoints: ["Bool", "log-points"]
});

const asyncStore = exports.asyncStore = (0, _asyncStoreHelper.asyncStoreHelper)("debugger", {
  pendingBreakpoints: ["pending-breakpoints", {}],
  tabs: ["tabs", []],
  xhrBreakpoints: ["xhr-breakpoints", []],
  eventListenerBreakpoints: ["event-listener-breakpoints", []]
});

function verifyPrefSchema() {
  if (prefs.debuggerPrefsSchemaVersion !== prefsSchemaVersion) {
    // clear pending Breakpoints
    asyncStore.pendingBreakpoints = {};
    asyncStore.tabs = [];
    asyncStore.xhrBreakpoints = [];
    prefs.debuggerPrefsSchemaVersion = prefsSchemaVersion;
  }
}