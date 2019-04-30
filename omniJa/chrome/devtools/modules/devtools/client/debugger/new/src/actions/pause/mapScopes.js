"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toggleMapScopes = toggleMapScopes;
exports.mapScopes = mapScopes;

var _selectors = require("../../selectors/index");

var _loadSourceText = require("../sources/loadSourceText");

var _promise = require("../utils/middleware/promise");

var _log = require("../../utils/log");

var _source = require("../../utils/source");

var _mapScopes = require("../../utils/pause/mapScopes/index");

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

function toggleMapScopes() {
  return async function ({ dispatch, getState, client, sourceMaps }) {
    if ((0, _selectors.getMapScopes)(getState())) {
      return dispatch({ type: "TOGGLE_MAP_SCOPES", mapScopes: false });
    }

    dispatch({ type: "TOGGLE_MAP_SCOPES", mapScopes: true });

    const thread = (0, _selectors.getCurrentThread)(getState());
    if ((0, _selectors.getSelectedOriginalScope)(getState(), thread)) {
      return;
    }

    const scopes = (0, _selectors.getSelectedGeneratedScope)(getState(), thread);
    const frame = (0, _selectors.getSelectedFrame)(getState(), thread);
    if (!scopes || !frame) {
      return;
    }

    dispatch(mapScopes(Promise.resolve(scopes.scope), frame));
  };
}

function mapScopes(scopes, frame) {
  return async function ({ dispatch, getState, client, sourceMaps }) {
    const generatedSource = (0, _selectors.getSource)(getState(), frame.generatedLocation.sourceId);

    const source = (0, _selectors.getSource)(getState(), frame.location.sourceId);

    await dispatch({
      type: "MAP_SCOPES",
      thread: frame.thread,
      frame,
      [_promise.PROMISE]: async function () {
        if (!(0, _selectors.getMapScopes)(getState()) || !source || !generatedSource || generatedSource.isWasm || source.isPrettyPrinted || (0, _source.isGenerated)(source)) {
          return null;
        }

        await dispatch((0, _loadSourceText.loadSourceText)(source));
        if ((0, _source.isOriginal)(source)) {
          await dispatch((0, _loadSourceText.loadSourceText)(generatedSource));
        }

        try {
          return await (0, _mapScopes.buildMappedScopes)(source, frame, (await scopes), sourceMaps, client);
        } catch (e) {
          (0, _log.log)(e);
          return null;
        }
      }()
    });
  };
}