"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addHiddenBreakpoint = addHiddenBreakpoint;
exports.enableBreakpoint = enableBreakpoint;
exports.addBreakpoint = addBreakpoint;

var _breakpoint = require("../../utils/breakpoint/index");

var _promise = require("../utils/middleware/promise");

var _selectors = require("../../selectors/index");

var _source = require("../../utils/source");

var _telemetry = require("../../utils/telemetry");

async function addBreakpointPromise(getState, client, sourceMaps, breakpoint) {
  const state = getState();
  const { location, generatedLocation } = breakpoint;
  const source = (0, _selectors.getSourceFromId)(state, location.sourceId);
  const generatedSource = (0, _selectors.getSourceFromId)(state, generatedLocation.sourceId);

  const breakpointLocation = (0, _breakpoint.makeBreakpointLocation)(getState(), generatedLocation);
  await client.setBreakpoint(breakpointLocation, breakpoint.options);

  const symbols = (0, _selectors.getSymbols)(getState(), source);
  const astLocation = await (0, _breakpoint.getASTLocation)(source, symbols, location);

  const originalText = (0, _source.getTextAtPosition)(source, location);
  const text = (0, _source.getTextAtPosition)(generatedSource, generatedLocation);

  const newBreakpoint = {
    id: (0, _breakpoint.makeBreakpointId)(generatedLocation),
    disabled: false,
    loading: false,
    options: breakpoint.options,
    location,
    astLocation,
    generatedLocation,
    text,
    originalText
  };

  (0, _breakpoint.assertBreakpoint)(newBreakpoint);

  return newBreakpoint;
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

function addHiddenBreakpoint(location) {
  return ({ dispatch }) => {
    return dispatch(addBreakpoint(location, { hidden: true }));
  };
}

function enableBreakpoint(breakpoint) {
  return async ({ dispatch, getState, client, sourceMaps }) => {
    if (breakpoint.loading) {
      return;
    }

    // To instantly reflect in the UI, we optimistically enable the breakpoint
    const enabledBreakpoint = { ...breakpoint, disabled: false };

    return dispatch({
      type: "ENABLE_BREAKPOINT",
      breakpoint: enabledBreakpoint,
      [_promise.PROMISE]: addBreakpointPromise(getState, client, sourceMaps, breakpoint)
    });
  };
}

function addBreakpoint(location, options = {}) {
  return async ({ dispatch, getState, sourceMaps, client }) => {
    (0, _telemetry.recordEvent)("add_breakpoint");
    let position;
    const { sourceId, column } = location;

    if (column === undefined) {
      position = (0, _selectors.getFirstBreakpointPosition)(getState(), location);
    } else {
      const positions = (0, _selectors.getBreakpointPositionsForSource)(getState(), sourceId);
      position = (0, _breakpoint.findPosition)(positions, location);
    }

    if (!position) {
      return;
    }

    const breakpoint = (0, _breakpoint.createBreakpoint)(position, { options });

    return dispatch({
      type: "ADD_BREAKPOINT",
      breakpoint,
      [_promise.PROMISE]: addBreakpointPromise(getState, client, sourceMaps, breakpoint)
    });
  };
}