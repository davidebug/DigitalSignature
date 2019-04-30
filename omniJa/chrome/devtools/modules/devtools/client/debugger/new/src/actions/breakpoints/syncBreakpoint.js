"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.syncBreakpointPromise = syncBreakpointPromise;
exports.syncBreakpoint = syncBreakpoint;

var _breakpointPositions = require("./breakpointPositions");

var _breakpoint = require("../../utils/breakpoint/index");

var _source = require("../../utils/source");

var _location = require("../../utils/location");

var _devtoolsSourceMap = require("devtools/client/shared/source-map/index.js");

var _selectors = require("../../selectors/index");

var _ = require("./index");

async function findBreakpointPosition({ getState, dispatch }, location) {
  const positions = await dispatch((0, _breakpointPositions.setBreakpointPositions)(location.sourceId));
  const position = (0, _breakpoint.findPosition)(positions, location);
  return position && position.generatedLocation;
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

async function findNewLocation({ name, offset, index }, location, source) {
  const func = await (0, _breakpoint.findFunctionByName)(source, name, index);

  // Fallback onto the location line, if we do not find a function is not found
  let line = location.line;
  if (func) {
    line = func.location.start.line + offset.line;
  }

  return {
    line,
    column: location.column,
    sourceUrl: source.url,
    sourceId: source.id
  };
}

function createSyncData(pendingBreakpoint, location, generatedLocation, previousLocation, text, originalText) {
  const overrides = {
    ...pendingBreakpoint,
    text,
    originalText
  };
  const breakpoint = (0, _breakpoint.createBreakpoint)({ generatedLocation, location }, overrides);

  (0, _breakpoint.assertBreakpoint)(breakpoint);
  return { breakpoint, previousLocation };
}

// Look for an existing breakpoint at the specified generated location.
function findExistingBreakpoint(state, generatedLocation) {
  const breakpoints = (0, _selectors.getBreakpointsList)(state);

  return breakpoints.find(bp => {
    return bp.generatedLocation.sourceUrl == generatedLocation.sourceUrl && bp.generatedLocation.line == generatedLocation.line && bp.generatedLocation.column == generatedLocation.column;
  });
}

// we have three forms of syncing: disabled syncing, existing server syncing
// and adding a new breakpoint
async function syncBreakpointPromise(thunkArgs, sourceId, pendingBreakpoint) {
  const { getState, client, dispatch } = thunkArgs;
  (0, _breakpoint.assertPendingBreakpoint)(pendingBreakpoint);

  const source = (0, _selectors.getSource)(getState(), sourceId);

  const generatedSourceId = (0, _devtoolsSourceMap.isOriginalId)(sourceId) ? (0, _devtoolsSourceMap.originalToGeneratedId)(sourceId) : sourceId;

  const generatedSource = (0, _selectors.getSource)(getState(), generatedSourceId);

  if (!source || !generatedSource) {
    return;
  }

  const { location, generatedLocation, astLocation } = pendingBreakpoint;
  const previousLocation = { ...location, sourceId };

  const newLocation = await findNewLocation(astLocation, previousLocation, source);

  const newGeneratedLocation = await findBreakpointPosition(thunkArgs, newLocation);

  const isSameLocation = (0, _location.comparePosition)(generatedLocation, newGeneratedLocation);

  /** ******* CASE 1: No server change ***********/
  // early return if breakpoint is disabled or we are in the sameLocation
  if (newGeneratedLocation && (pendingBreakpoint.disabled || isSameLocation)) {
    // Make sure the breakpoint is installed on all source actors.
    if (!pendingBreakpoint.disabled) {
      await client.setBreakpoint((0, _breakpoint.makeBreakpointLocation)(getState(), newGeneratedLocation), pendingBreakpoint.options);
    }

    const originalText = (0, _source.getTextAtPosition)(source, previousLocation);
    const text = (0, _source.getTextAtPosition)(generatedSource, newGeneratedLocation);

    return createSyncData(pendingBreakpoint, newLocation, newGeneratedLocation, previousLocation, text, originalText);
  }

  // Clear any breakpoint for the generated location.
  const bp = findExistingBreakpoint(getState(), generatedLocation);
  if (bp) {
    await dispatch((0, _.removeBreakpoint)(bp));
  }

  if (!newGeneratedLocation) {
    return { previousLocation, breakpoint: null };
  }

  /** ******* Case 2: Add New Breakpoint ***********/
  // If we are not disabled, set the breakpoint on the server and get
  // that info so we can set it on our breakpoints.
  await client.setBreakpoint((0, _breakpoint.makeBreakpointLocation)(getState(), newGeneratedLocation), pendingBreakpoint.options);

  const originalText = (0, _source.getTextAtPosition)(source, newLocation);
  const text = (0, _source.getTextAtPosition)(generatedSource, newGeneratedLocation);

  return createSyncData(pendingBreakpoint, newLocation, newGeneratedLocation, previousLocation, text, originalText);
}

/**
 * Syncing a breakpoint add breakpoint information that is stored, and
 * contact the server for more data.
 */
function syncBreakpoint(sourceId, pendingBreakpoint) {
  return async thunkArgs => {
    const { dispatch } = thunkArgs;

    const response = await syncBreakpointPromise(thunkArgs, sourceId, pendingBreakpoint);

    if (!response) {
      return;
    }

    const { breakpoint, previousLocation } = response;
    return dispatch({
      type: "SYNC_BREAKPOINT",
      breakpoint,
      previousLocation
    });
  };
}