"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.newSource = newSource;
exports.newSources = newSources;

var _devtoolsSourceMap = require("devtools/client/shared/source-map/index.js");

var _lodash = require("devtools/client/shared/vendor/lodash");

var _blackbox = require("./blackbox");

var _breakpoints = require("../breakpoints/index");

var _loadSourceText = require("./loadSourceText");

var _prettyPrint = require("./prettyPrint");

var _sources = require("../sources/index");

var _source = require("../../utils/source");

var _selectors = require("../../selectors/index");

var _prefs = require("../../utils/prefs");

var _sourceQueue = require("../../utils/source-queue");

var _sourceQueue2 = _interopRequireDefault(_sourceQueue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createOriginalSource(originalUrl, generatedSource, sourceMaps) {
  return {
    url: originalUrl,
    relativeUrl: originalUrl,
    id: (0, _devtoolsSourceMap.generatedToOriginalId)(generatedSource.id, originalUrl),
    isPrettyPrinted: false,
    isWasm: false,
    isBlackBoxed: false,
    loadedState: "unloaded",
    introductionUrl: null,
    isExtension: false,
    actors: []
  };
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

/**
 * Redux actions for the sources state
 * @module actions/sources
 */

function loadSourceMaps(sources) {
  return async function ({
    dispatch,
    sourceMaps
  }) {
    if (!_prefs.prefs.clientSourceMapsEnabled) {
      return [];
    }

    const sourceList = await Promise.all(sources.map(async ({ id }) => {
      const originalSources = await dispatch(loadSourceMap(id));
      _sourceQueue2.default.queueSources(originalSources);
      return originalSources;
    }));

    await _sourceQueue2.default.flush();

    // We would like to sync breakpoints after we are done
    // loading source maps as sometimes generated and original
    // files share the same paths.
    for (const source of sources) {
      dispatch(checkPendingBreakpoints(source.id));
    }

    return (0, _lodash.flatten)(sourceList);
  };
}

/**
 * @memberof actions/sources
 * @static
 */
function loadSourceMap(sourceId) {
  return async function ({
    dispatch,
    getState,
    sourceMaps
  }) {
    const source = (0, _selectors.getSource)(getState(), sourceId);

    if (!source || (0, _source.isOriginal)(source) || !source.sourceMapURL) {
      return [];
    }

    let urls = null;
    try {
      const urlInfo = { ...source };
      if (!urlInfo.url) {
        // If the source was dynamically generated (via eval, dynamically
        // created script elements, and so forth), it won't have a URL, so that
        // it is not collapsed into other sources from the same place. The
        // introduction URL will include the point it was constructed at,
        // however, so use that for resolving any source maps in the source.
        urlInfo.url = urlInfo.introductionUrl;
      }
      urls = await sourceMaps.getOriginalURLs(urlInfo);
    } catch (e) {
      console.error(e);
    }

    if (!urls) {
      // The source might have changed while we looked up the URLs, so we need
      // to load it again before dispatching. We ran into an issue here because
      // this was previously using 'source' and was at risk of resetting the
      // 'loadedState' field to 'loading', putting it in an inconsistent state.
      const currentSource = (0, _selectors.getSource)(getState(), sourceId);

      // If this source doesn't have a sourcemap, enable it for pretty printing
      dispatch({
        type: "UPDATE_SOURCE",
        // NOTE: Flow https://github.com/facebook/flow/issues/6342 issue
        source: { ...currentSource, sourceMapURL: "" }
      });
      return [];
    }

    return urls.map(url => createOriginalSource(url, source, sourceMaps));
  };
}

// If a request has been made to show this source, go ahead and
// select it.
function checkSelectedSource(sourceId) {
  return async ({ dispatch, getState }) => {
    const source = (0, _selectors.getSource)(getState(), sourceId);
    const pendingLocation = (0, _selectors.getPendingSelectedLocation)(getState());

    if (!pendingLocation || !pendingLocation.url || !source || !source.url) {
      return;
    }

    const pendingUrl = pendingLocation.url;
    const rawPendingUrl = (0, _source.getRawSourceURL)(pendingUrl);

    if (rawPendingUrl === source.url) {
      if ((0, _source.isPrettyURL)(pendingUrl)) {
        const prettySource = await dispatch((0, _prettyPrint.togglePrettyPrint)(source.id));
        return dispatch(checkPendingBreakpoints(prettySource.id));
      }

      await dispatch((0, _sources.selectLocation)({
        sourceId: source.id,
        line: typeof pendingLocation.line === "number" ? pendingLocation.line : 0,
        column: pendingLocation.column
      }));
    }
  };
}

function checkPendingBreakpoints(sourceId) {
  return async ({ dispatch, getState }) => {
    // source may have been modified by selectLocation
    const source = (0, _selectors.getSource)(getState(), sourceId);
    if (!source) {
      return;
    }

    const pendingBreakpoints = (0, _selectors.getPendingBreakpointsForSource)(getState(), source);

    if (pendingBreakpoints.length === 0) {
      return;
    }

    // load the source text if there is a pending breakpoint for it
    await dispatch((0, _loadSourceText.loadSourceText)(source));

    // Matching pending breakpoints could have either the same generated or the
    // same original source. We expect the generated source to appear first and
    // will add a breakpoint at that location initially. If the original source
    // appears later then we use syncBreakpoint to see if the generated location
    // changed and we need to remove the breakpoint we added earlier.
    await Promise.all(pendingBreakpoints.map(bp => {
      if (source.url == bp.location.sourceUrl) {
        return dispatch((0, _breakpoints.syncBreakpoint)(sourceId, bp));
      }
      const { line, column } = bp.generatedLocation;
      return dispatch((0, _breakpoints.addBreakpoint)({ sourceId, line, column }, bp.options));
    }));
  };
}

function restoreBlackBoxedSources(sources) {
  return async ({ dispatch }) => {
    const tabs = (0, _selectors.getBlackBoxList)();
    if (tabs.length == 0) {
      return;
    }
    for (const source of sources) {
      if (tabs.includes(source.url) && !source.isBlackBoxed) {
        dispatch((0, _blackbox.toggleBlackBox)(source));
      }
    }
  };
}

/**
 * Handler for the debugger client's unsolicited newSource notification.
 * @memberof actions/sources
 * @static
 */
function newSource(source) {
  return async ({ dispatch }) => {
    await dispatch(newSources([source]));
  };
}

function newSources(sources) {
  return async ({ dispatch, getState }) => {
    const _newSources = sources.filter(source => !(0, _selectors.getSource)(getState(), source.id));

    dispatch({ type: "ADD_SOURCES", sources });

    for (const source of _newSources) {
      dispatch(checkSelectedSource(source.id));
    }

    dispatch(restoreBlackBoxedSources(_newSources));
    dispatch(loadSourceMaps(_newSources));
  };
}