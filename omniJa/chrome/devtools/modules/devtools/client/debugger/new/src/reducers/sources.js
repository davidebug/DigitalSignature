"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDisplayedSources = exports.getSelectedSource = exports.getSelectedLocation = undefined;
exports.initialSourcesState = initialSourcesState;
exports.createSource = createSource;
exports.getBlackBoxList = getBlackBoxList;
exports.getSourceThreads = getSourceThreads;
exports.getSourceInSources = getSourceInSources;
exports.getSource = getSource;
exports.getSourceFromId = getSourceFromId;
exports.getSourceByActorId = getSourceByActorId;
exports.getSourcesByURLInSources = getSourcesByURLInSources;
exports.getSourcesByURL = getSourcesByURL;
exports.getSourceByURL = getSourceByURL;
exports.getSpecificSourceByURLInSources = getSpecificSourceByURLInSources;
exports.getSpecificSourceByURL = getSpecificSourceByURL;
exports.getOriginalSourceByURL = getOriginalSourceByURL;
exports.getGeneratedSourceByURL = getGeneratedSourceByURL;
exports.getGeneratedSource = getGeneratedSource;
exports.getPendingSelectedLocation = getPendingSelectedLocation;
exports.getPrettySource = getPrettySource;
exports.hasPrettySource = hasPrettySource;
exports.getSourcesUrlsInSources = getSourcesUrlsInSources;
exports.getHasSiblingOfSameName = getHasSiblingOfSameName;
exports.getSources = getSources;
exports.getSourcesEpoch = getSourcesEpoch;
exports.getUrls = getUrls;
exports.getSourceList = getSourceList;
exports.getDisplayedSourcesList = getDisplayedSourcesList;
exports.getSourceCount = getSourceCount;
exports.getSelectedSourceId = getSelectedSourceId;
exports.getProjectDirectoryRoot = getProjectDirectoryRoot;
exports.getDisplayedSourcesForThread = getDisplayedSourcesForThread;
exports.getFocusedSourceItem = getFocusedSourceItem;

var _reselect = require("devtools/client/debugger/new/dist/vendors").vendored["reselect"];

var _source = require("../utils/source");

var _devtoolsSourceMap = require("devtools/client/shared/source-map/index.js");

var _prefs = require("../utils/prefs");

var _lodash = require("devtools/client/shared/vendor/lodash");

const emptySources = {
  sources: {},
  urls: {},
  displayed: {}
}; /* This Source Code Form is subject to the terms of the Mozilla Public
    * License, v. 2.0. If a copy of the MPL was not distributed with this
    * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

/**
 * Sources reducer
 * @module reducers/sources
 */

function initialSourcesState() {
  return {
    ...emptySources,
    epoch: 1,
    selectedLocation: undefined,
    pendingSelectedLocation: _prefs.prefs.pendingSelectedLocation,
    projectDirectoryRoot: _prefs.prefs.projectDirectoryRoot,
    chromeAndExtenstionsEnabled: _prefs.prefs.chromeAndExtenstionsEnabled,
    focusedItem: null
  };
}

function createSource(state, source) {
  const root = state.projectDirectoryRoot;
  return {
    id: undefined,
    url: undefined,
    sourceMapURL: undefined,
    isBlackBoxed: false,
    isPrettyPrinted: false,
    isWasm: false,
    isExtension: source.url && (0, _source.isUrlExtension)(source.url) || false,
    text: undefined,
    contentType: "",
    error: undefined,
    loadedState: "unloaded",
    relativeUrl: (0, _source.getRelativeUrl)(source, root),
    actors: [],
    ...source
  };
}

function update(state = initialSourcesState(), action) {
  let location = null;

  switch (action.type) {
    case "UPDATE_SOURCE":
      return updateSource(state, action.source);

    case "ADD_SOURCE":
      return addSources(state, [action.source]);

    case "ADD_SOURCES":
      return addSources(state, action.sources);

    case "SET_WORKERS":
      return updateWorkers(state, action);

    case "SET_SELECTED_LOCATION":
      location = {
        ...action.location,
        url: action.source.url
      };

      if (action.source.url) {
        _prefs.prefs.pendingSelectedLocation = location;
      }

      return {
        ...state,
        selectedLocation: {
          sourceId: action.source.id,
          ...action.location
        },
        pendingSelectedLocation: location
      };

    case "CLEAR_SELECTED_LOCATION":
      location = { url: "" };
      _prefs.prefs.pendingSelectedLocation = location;

      return {
        ...state,
        selectedLocation: null,
        pendingSelectedLocation: location
      };

    case "SET_PENDING_SELECTED_LOCATION":
      location = {
        url: action.url,
        line: action.line
      };

      _prefs.prefs.pendingSelectedLocation = location;
      return { ...state, pendingSelectedLocation: location };

    case "LOAD_SOURCE_TEXT":
      return updateLoadedState(state, action);

    case "BLACKBOX":
      if (action.status === "done") {
        const { id, url } = action.source;
        const { isBlackBoxed } = action.value;
        updateBlackBoxList(url, isBlackBoxed);
        return updateSource(state, { id, isBlackBoxed });
      }
      break;

    case "SET_PROJECT_DIRECTORY_ROOT":
      return updateProjectDirectoryRoot(state, action.url);

    case "NAVIGATE":
      return {
        ...initialSourcesState(),
        epoch: state.epoch + 1
      };

    case "SET_FOCUSED_SOURCE_ITEM":
      return { ...state, focusedItem: action.item };
  }

  return state;
}

/*
 * Update a source when its state changes
 * e.g. the text was loaded, it was blackboxed
 */
function updateSource(state, source) {
  const existingSource = state.sources[source.id];

  // If there is no existing version of the source, it means that we probably
  // ended up here as a result of an async action, and the sources were cleared
  // between the action starting and the source being updated.
  if (!existingSource) {
    // TODO: We may want to consider throwing here once we have a better
    // handle on async action flow control.
    return state;
  }
  return {
    ...state,
    sources: {
      ...state.sources,
      [source.id]: { ...existingSource, ...source }
    }
  };
}

/*
 * Update all of the sources when an event occurs.
 * e.g. workers are updated, project directory root changes
 */
function updateAllSources(state, callback) {
  const updatedSources = Object.values(state.sources).map(source => ({
    ...source,
    ...callback(source)
  }));

  return addSources({ ...state, ...emptySources }, updatedSources);
}

/*
 * Add sources to the sources store
 * - Add the source to the sources store
 * - Add the source URL to the urls map
 * - Add the source ID to the thread displayed map
 */
function addSources(state, sources) {
  state = {
    ...state,
    sources: { ...state.sources },
    urls: { ...state.urls },
    displayed: { ...state.displayed }
  };

  for (const source of sources) {
    const existingSource = state.sources[source.id];
    let updatedSource = existingSource || source;

    // Merge the source actor list
    if (existingSource && source.actors) {
      const actors = (0, _lodash.uniqBy)([...existingSource.actors, ...source.actors], ({ actor }) => actor);

      updatedSource = { ...updatedSource, actors };
    }

    // 1. Add the source to the sources map
    state.sources[source.id] = updatedSource;

    // 2. Update the source url map
    const existing = state.urls[source.url] || [];
    if (!existing.includes(source.id)) {
      state.urls[source.url] = [...existing, source.id];
    }

    // 3. Update the displayed actor map
    if ((0, _source.underRoot)(source, state.projectDirectoryRoot) && (!source.isExtension || getChromeAndExtenstionsEnabled({ sources: state }))) {
      for (const actor of getSourceActors(state, source)) {
        if (!state.displayed[actor.thread]) {
          state.displayed[actor.thread] = {};
        }
        state.displayed[actor.thread][source.id] = true;
      }
    }
  }

  return state;
}

/*
 * Update sources when the worker list changes.
 * - filter source actor lists so that missing threads no longer appear
 * - NOTE: we do not remove sources for destroyed threads
 */
function updateWorkers(state, action) {
  const threads = [action.mainThread, ...action.workers.map(({ actor }) => actor)];

  return updateAllSources(state, source => ({
    actors: source.actors.filter(({ thread }) => threads.includes(thread))
  }));
}

/*
 * Update sources when the project directory root changes
 */
function updateProjectDirectoryRoot(state, root) {
  _prefs.prefs.projectDirectoryRoot = root;

  return updateAllSources({ ...state, projectDirectoryRoot: root }, source => ({
    relativeUrl: (0, _source.getRelativeUrl)(source, root)
  }));
}

/*
 * Update a source's loaded state fields
 * i.e. loadedState, text, error
 */
function updateLoadedState(state, action) {
  const { sourceId } = action;
  let source;

  // If there was a navigation between the time the action was started and
  // completed, we don't want to update the store.
  if (action.epoch !== state.epoch) {
    return state;
  }

  if (action.status === "start") {
    source = { id: sourceId, loadedState: "loading" };
  } else if (action.status === "error") {
    source = { id: sourceId, error: action.error, loadedState: "loaded" };
  } else {
    // TODO: Remove this once we centralize pretty-print and this can no longer
    // return a null value when loading a in-progress prettyprinting file.
    if (!action.value) {
      return state;
    }

    source = {
      id: sourceId,
      text: action.value.text,
      contentType: action.value.contentType,
      loadedState: "loaded"
    };
  }

  return updateSource(state, source);
}

function updateBlackBoxList(url, isBlackBoxed) {
  const tabs = getBlackBoxList();
  const i = tabs.indexOf(url);
  if (i >= 0) {
    if (!isBlackBoxed) {
      tabs.splice(i, 1);
    }
  } else if (isBlackBoxed) {
    tabs.push(url);
  }
  _prefs.prefs.tabsBlackBoxed = tabs;
}

function getBlackBoxList() {
  return _prefs.prefs.tabsBlackBoxed || [];
}

// Selectors

// Unfortunately, it's really hard to make these functions accept just
// the state that we care about and still type it with Flow. The
// problem is that we want to re-export all selectors from a single
// module for the UI, and all of those selectors should take the
// top-level app state, so we'd have to "wrap" them to automatically
// pick off the piece of state we're interested in. It's impossible
// (right now) to type those wrapped functions.


const getSourcesState = state => state.sources;

function getSourceActors(state, source) {
  if ((0, _source.isGenerated)(source)) {
    return source.actors;
  }

  // Original sources do not have actors, so use the generated source.
  const generatedSource = state.sources[(0, _devtoolsSourceMap.originalToGeneratedId)(source.id)];
  return generatedSource ? generatedSource.actors : [];
}

function getSourceThreads(state, source) {
  return (0, _lodash.uniq)(getSourceActors(state.sources, source).map(actor => actor.thread));
}

function getSourceInSources(sources, id) {
  return sources[id];
}

function getSource(state, id) {
  return getSourceInSources(getSources(state), id);
}

function getSourceFromId(state, id) {
  const source = getSource(state, id);
  if (!source) {
    throw new Error(`source ${id} does not exist`);
  }
  return source;
}

function getSourceByActorId(state, actorId) {
  // We don't index the sources by actor IDs, so this method should be used
  // sparingly.
  for (const source of getSourceList(state)) {
    if (source.actors.some(({ actor }) => actor == actorId)) {
      return source;
    }
  }
  return null;
}

function getSourcesByURLInSources(sources, urls, url) {
  if (!url || !urls[url]) {
    return [];
  }
  return urls[url].map(id => sources[id]);
}

function getSourcesByURL(state, url) {
  return getSourcesByURLInSources(getSources(state), getUrls(state), url);
}

function getSourceByURL(state, url) {
  const foundSources = getSourcesByURL(state, url);
  return foundSources ? foundSources[0] : null;
}

function getSpecificSourceByURLInSources(sources, urls, url, isOriginal) {
  const foundSources = getSourcesByURLInSources(sources, urls, url);
  if (foundSources) {
    return foundSources.find(source => (0, _source.isOriginal)(source) == isOriginal);
  }
  return null;
}

function getSpecificSourceByURL(state, url, isOriginal) {
  return getSpecificSourceByURLInSources(getSources(state), getUrls(state), url, isOriginal);
}

function getOriginalSourceByURL(state, url) {
  return getSpecificSourceByURL(state, url, true);
}

function getGeneratedSourceByURL(state, url) {
  return getSpecificSourceByURL(state, url, false);
}

function getGeneratedSource(state, source) {
  if (!source) {
    return null;
  }

  if ((0, _source.isGenerated)(source)) {
    return source;
  }

  return getSourceFromId(state, (0, _devtoolsSourceMap.originalToGeneratedId)(source.id));
}

function getPendingSelectedLocation(state) {
  return state.sources.pendingSelectedLocation;
}

function getPrettySource(state, id) {
  if (!id) {
    return;
  }

  const source = getSource(state, id);
  if (!source) {
    return;
  }

  return getOriginalSourceByURL(state, (0, _source.getPrettySourceURL)(source.url));
}

function hasPrettySource(state, id) {
  return !!getPrettySource(state, id);
}

function getSourcesUrlsInSources(state, url) {
  const urls = getUrls(state);
  if (!url || !urls[url]) {
    return [];
  }
  const plainUrl = url.split("?")[0];

  return Object.keys(urls).filter(Boolean).filter(sourceUrl => sourceUrl.split("?")[0] === plainUrl);
}

function getHasSiblingOfSameName(state, source) {
  if (!source) {
    return false;
  }

  return getSourcesUrlsInSources(state, source.url).length > 1;
}

function getSources(state) {
  return state.sources.sources;
}

function getSourcesEpoch(state) {
  return state.sources.epoch;
}

function getUrls(state) {
  return state.sources.urls;
}

function getSourceList(state) {
  return Object.values(getSources(state));
}

function getDisplayedSourcesList(state) {
  return Object.values(getDisplayedSources(state)).flatMap(Object.values);
}

function getSourceCount(state) {
  return getSourceList(state).length;
}

const getSelectedLocation = exports.getSelectedLocation = (0, _reselect.createSelector)(getSourcesState, sources => sources.selectedLocation);

const getSelectedSource = exports.getSelectedSource = (0, _reselect.createSelector)(getSelectedLocation, getSources, (selectedLocation, sources) => {
  if (!selectedLocation) {
    return;
  }

  return sources[selectedLocation.sourceId];
});

function getSelectedSourceId(state) {
  const source = getSelectedSource(state);
  return source && source.id;
}

function getProjectDirectoryRoot(state) {
  return state.sources.projectDirectoryRoot;
}

function getAllDisplayedSources(state) {
  return state.sources.displayed;
}

function getChromeAndExtenstionsEnabled(state) {
  return state.sources.chromeAndExtenstionsEnabled;
}

const getDisplayedSources = exports.getDisplayedSources = (0, _reselect.createSelector)(getSources, getChromeAndExtenstionsEnabled, getAllDisplayedSources, (sources, chromeAndExtenstionsEnabled, displayed) => {
  return (0, _lodash.mapValues)(displayed, threadSourceIds => (0, _lodash.mapValues)(threadSourceIds, (_, id) => sources[id]));
});

function getDisplayedSourcesForThread(state, thread) {
  return getDisplayedSources(state)[thread] || {};
}

function getFocusedSourceItem(state) {
  return state.sources.focusedItem;
}

exports.default = update;