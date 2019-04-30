"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setBreakpointPositions = setBreakpointPositions;

var _devtoolsSourceMap = require("devtools/client/shared/source-map/index.js");

var _lodash = require("devtools/client/shared/vendor/lodash");

var _selectors = require("../../selectors/index");

var _breakpoint = require("../../utils/breakpoint/index");

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

const requests = new Map();

async function mapLocations(generatedLocations, { sourceMaps }) {
  const originalLocations = await sourceMaps.getOriginalLocations(generatedLocations);

  return (0, _lodash.zip)(originalLocations, generatedLocations).map(([location, generatedLocation]) => ({ location, generatedLocation }));
}

function filterByUniqLocation(positions) {
  return (0, _lodash.uniqBy)(positions, ({ location }) => (0, _breakpoint.makeBreakpointId)(location));
}

function convertToList(results, source) {
  const { id, url } = source;
  const positions = [];

  for (const line in results) {
    for (const column of results[line]) {
      positions.push({
        line: Number(line),
        column: column,
        sourceId: id,
        sourceUrl: url
      });
    }
  }

  return positions;
}

async function _setBreakpointPositions(sourceId, thunkArgs) {
  const { client, dispatch, getState, sourceMaps } = thunkArgs;
  let generatedSource = (0, _selectors.getSource)(getState(), sourceId);
  if (!generatedSource) {
    return;
  }

  let results = {};
  if ((0, _devtoolsSourceMap.isOriginalId)(sourceId)) {
    const ranges = await sourceMaps.getGeneratedRangesForOriginal(sourceId, generatedSource.url, true);
    const generatedSourceId = (0, _devtoolsSourceMap.originalToGeneratedId)(sourceId);
    generatedSource = (0, _selectors.getSourceFromId)(getState(), generatedSourceId);

    // Note: While looping here may not look ideal, in the vast majority of
    // cases, the number of ranges here should be very small, and is quite
    // likely to only be a single range.
    for (const range of ranges) {
      // Wrap infinite end positions to the next line to keep things simple
      // and because we know we don't care about the end-line whitespace
      // in this case.
      if (range.end.column === Infinity) {
        range.end.line += 1;
        range.end.column = 0;
      }

      const bps = await client.getBreakpointPositions(generatedSource, range);
      for (const line in bps) {
        results[line] = (results[line] || []).concat(bps[line]);
      }
    }
  } else {
    results = await client.getBreakpointPositions(generatedSource);
  }

  let positions = convertToList(results, generatedSource);
  positions = await mapLocations(positions, thunkArgs);
  positions = filterByUniqLocation(positions);

  const source = (0, _selectors.getSource)(getState(), sourceId);
  // NOTE: it's possible that the source was removed during a navigate
  if (!source) {
    return;
  }
  dispatch({
    type: "ADD_BREAKPOINT_POSITIONS",
    source: source,
    positions
  });
}

function setBreakpointPositions(sourceId) {
  return async thunkArgs => {
    const { getState } = thunkArgs;
    if ((0, _selectors.hasBreakpointPositions)(getState(), sourceId)) {
      return (0, _selectors.getBreakpointPositionsForSource)(getState(), sourceId);
    }

    if (!requests.has(sourceId)) {
      requests.set(sourceId, (async () => {
        try {
          await _setBreakpointPositions(sourceId, thunkArgs);
        } finally {
          requests.delete(sourceId);
        }
      })());
    }

    await requests.get(sourceId);
    return (0, _selectors.getBreakpointPositionsForSource)(getState(), sourceId);
  };
}