"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadSourceText = loadSourceText;

var _promise = require("../utils/middleware/promise");

var _selectors = require("../../selectors/index");

var _breakpoints = require("../breakpoints/index");

var _parser = require("../../workers/parser/index");

var parser = _interopRequireWildcard(_parser);

var _source = require("../../utils/source");

var _telemetry = require("devtools/client/shared/telemetry");

var _telemetry2 = _interopRequireDefault(_telemetry);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

const requests = new Map();

// Measures the time it takes for a source to load
const loadSourceHistogram = "DEVTOOLS_DEBUGGER_LOAD_SOURCE_MS";
const telemetry = new _telemetry2.default();

async function loadSource(state, source, { sourceMaps, client }) {
  if ((0, _source.isOriginal)(source)) {
    const result = await sourceMaps.getOriginalSourceText(source);
    if (!result) {
      // TODO: This allows pretty files to continue working the way they have
      // been, but is very ugly. Remove this when we centralize pretty-printing
      // in loadSource. https://github.com/firefox-devtools/debugger/issues/8071
      if (source.isPrettyPrinted) {
        return null;
      }

      // The way we currently try to load and select a pending
      // selected location, it is possible that we will try to fetch the
      // original source text right after the source map has been cleared
      // after a navigation event.
      throw new Error("Original source text unavailable");
    }
    return result;
  }

  if (!source.actors.length) {
    throw new Error("No source actor for loadSource");
  }

  telemetry.start(loadSourceHistogram, source);
  const response = await client.sourceContents(source.actors[0]);
  telemetry.finish(loadSourceHistogram, source);

  return {
    text: response.source,
    contentType: response.contentType || "text/javascript"
  };
}

async function loadSourceTextPromise(source, epoch, { dispatch, getState, client, sourceMaps }) {
  if ((0, _source.isLoaded)(source)) {
    return source;
  }

  await dispatch({
    type: "LOAD_SOURCE_TEXT",
    sourceId: source.id,
    epoch,
    [_promise.PROMISE]: loadSource(getState(), source, { sourceMaps, client })
  });

  const newSource = (0, _selectors.getSource)(getState(), source.id);
  if (!newSource) {
    return;
  }

  if (!newSource.isWasm && (0, _source.isLoaded)(newSource)) {
    parser.setSource(newSource);
    await dispatch((0, _breakpoints.setBreakpointPositions)(newSource.id));
  }

  return newSource;
}

/**
 * @memberof actions/sources
 * @static
 */
function loadSourceText(inputSource) {
  return async thunkArgs => {
    if (!inputSource) {
      return;
    }
    // This ensures that the falsy check above is preserved into the IIFE
    // below in a way that Flow is happy with.
    const source = inputSource;

    const epoch = (0, _selectors.getSourcesEpoch)(thunkArgs.getState());

    const id = `${epoch}:${source.id}`;
    let promise = requests.get(id);
    if (!promise) {
      promise = (async () => {
        try {
          return await loadSourceTextPromise(source, epoch, thunkArgs);
        } catch (e) {
          // TODO: This swallows errors for now. Ideally we would get rid of
          // this once we have a better handle on our async state management.
        } finally {
          requests.delete(id);
        }
      })();
      requests.set(id, promise);
    }

    return promise;
  };
}