"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toggleBlackBox = toggleBlackBox;

var _devtoolsSourceMap = require("devtools/client/shared/source-map/index.js");

var _telemetry = require("../../utils/telemetry");

var _prefs = require("../../utils/prefs");

var _selectors = require("../../selectors/index");

var _promise = require("../utils/middleware/promise");

async function blackboxActors(state, client, sourceId, isBlackBoxed, range) {
  const source = (0, _selectors.getSourceFromId)(state, sourceId);
  for (const sourceActor of source.actors) {
    await client.blackBox(sourceActor, isBlackBoxed, range);
  }
  return { isBlackBoxed: !isBlackBoxed };
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

/**
 * Redux actions for the sources state
 * @module actions/sources
 */

function toggleBlackBox(source) {
  return async ({ dispatch, getState, client, sourceMaps }) => {
    const { isBlackBoxed } = source;

    if (!isBlackBoxed) {
      (0, _telemetry.recordEvent)("blackbox");
    }

    let sourceId, range;
    if (_prefs.features.originalBlackbox && (0, _devtoolsSourceMap.isOriginalId)(source.id)) {
      range = await sourceMaps.getFileGeneratedRange(source);
      sourceId = (0, _devtoolsSourceMap.originalToGeneratedId)(source.id);
    } else {
      sourceId = source.id;
    }

    return dispatch({
      type: "BLACKBOX",
      source,
      [_promise.PROMISE]: blackboxActors(getState(), client, sourceId, isBlackBoxed, range)
    });
  };
}