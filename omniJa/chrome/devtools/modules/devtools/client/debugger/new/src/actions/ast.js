"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setSourceMetaData = setSourceMetaData;
exports.setSymbols = setSymbols;
exports.setOutOfScopeLocations = setOutOfScopeLocations;

var _selectors = require("../selectors/index");

var _pause = require("./pause/index");

var _tabs = require("./tabs");

var _promise = require("./utils/middleware/promise");

var _setInScopeLines = require("./ast/setInScopeLines");

var _parser = require("../workers/parser/index");

var parser = _interopRequireWildcard(_parser);

var _source = require("../utils/source");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function setSourceMetaData(sourceId) {
  return async ({ dispatch, getState }) => {
    const source = (0, _selectors.getSource)(getState(), sourceId);
    if (!source || !(0, _source.isLoaded)(source) || source.isWasm) {
      return;
    }

    const framework = await parser.getFramework(source.id);
    if (framework) {
      dispatch((0, _tabs.updateTab)(source, framework));
    }

    dispatch({
      type: "SET_SOURCE_METADATA",
      sourceId: source.id,
      sourceMetaData: {
        framework
      }
    });
  };
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

function setSymbols(sourceId) {
  return async ({ dispatch, getState, sourceMaps }) => {
    const source = (0, _selectors.getSourceFromId)(getState(), sourceId);

    if (source.isWasm || (0, _selectors.getSymbols)(getState(), source) || !(0, _source.isLoaded)(source)) {
      return;
    }

    await dispatch({
      type: "SET_SYMBOLS",
      sourceId,
      [_promise.PROMISE]: parser.getSymbols(sourceId)
    });

    const threads = (0, _selectors.getSourceThreads)(getState(), source);
    await Promise.all(threads.map(thread => dispatch((0, _pause.mapFrames)(thread))));

    await dispatch(setSourceMetaData(sourceId));
  };
}

function setOutOfScopeLocations() {
  return async ({ dispatch, getState }) => {
    const location = (0, _selectors.getSelectedLocation)(getState());
    if (!location) {
      return;
    }

    const source = (0, _selectors.getSourceFromId)(getState(), location.sourceId);

    if (!(0, _source.isLoaded)(source)) {
      return;
    }

    let locations = null;
    if (location.line && source && !source.isWasm) {
      locations = await parser.findOutOfScopeLocations(source.id, location);
    }

    dispatch({
      type: "OUT_OF_SCOPE_LOCATIONS",
      locations
    });
    dispatch((0, _setInScopeLines.setInScopeLines)());
  };
}