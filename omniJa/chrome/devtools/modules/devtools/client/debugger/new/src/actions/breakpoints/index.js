"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.syncBreakpoint = exports.enableBreakpoint = exports.addHiddenBreakpoint = exports.addBreakpoint = undefined;

var _breakpointPositions = require("./breakpointPositions");

Object.keys(_breakpointPositions).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _breakpointPositions[key];
    }
  });
});
exports.removeBreakpoint = removeBreakpoint;
exports.disableBreakpoint = disableBreakpoint;
exports.disableBreakpointsInSource = disableBreakpointsInSource;
exports.enableBreakpointsInSource = enableBreakpointsInSource;
exports.toggleAllBreakpoints = toggleAllBreakpoints;
exports.toggleBreakpoints = toggleBreakpoints;
exports.removeAllBreakpoints = removeAllBreakpoints;
exports.removeBreakpoints = removeBreakpoints;
exports.removeBreakpointsInSource = removeBreakpointsInSource;
exports.remapBreakpoints = remapBreakpoints;
exports.setBreakpointOptions = setBreakpointOptions;
exports.toggleBreakpointAtLine = toggleBreakpointAtLine;
exports.addBreakpointAtLine = addBreakpointAtLine;
exports.removeBreakpointsAtLine = removeBreakpointsAtLine;
exports.disableBreakpointsAtLine = disableBreakpointsAtLine;
exports.enableBreakpointsAtLine = enableBreakpointsAtLine;
exports.toggleDisabledBreakpoint = toggleDisabledBreakpoint;
exports.enableXHRBreakpoint = enableXHRBreakpoint;
exports.disableXHRBreakpoint = disableXHRBreakpoint;
exports.updateXHRBreakpoint = updateXHRBreakpoint;
exports.togglePauseOnAny = togglePauseOnAny;
exports.setXHRBreakpoint = setXHRBreakpoint;
exports.removeXHRBreakpoint = removeXHRBreakpoint;

var _promise = require("../utils/middleware/promise");

var _selectors = require("../../selectors/index");

var _breakpoint = require("../../utils/breakpoint/index");

var _addBreakpoint = require("./addBreakpoint");

var _remapLocations = require("./remapLocations");

var _remapLocations2 = _interopRequireDefault(_remapLocations);

var _syncBreakpoint = require("./syncBreakpoint");

var _ui = require("../ui");

var _telemetry = require("../../utils/telemetry");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// this will need to be changed so that addCLientBreakpoint is removed

async function removeBreakpointsPromise(client, state, breakpoint) {
  const breakpointLocation = (0, _breakpoint.makeBreakpointLocation)(state, breakpoint.generatedLocation);
  await client.removeBreakpoint(breakpointLocation);
}

/**
 * Remove a single breakpoint
 *
 * @memberof actions/breakpoints
 * @static
 */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

/**
 * Redux actions for breakpoints
 * @module actions/breakpoints
 */

function removeBreakpoint(breakpoint) {
  return ({ dispatch, getState, client }) => {
    if (breakpoint.loading) {
      return;
    }

    (0, _telemetry.recordEvent)("remove_breakpoint");

    // If the breakpoint is already disabled, we don't need to communicate
    // with the server. We just need to dispatch an action
    // simulating a successful server request
    if (breakpoint.disabled) {
      return dispatch({ type: "REMOVE_BREAKPOINT", breakpoint, status: "done" });
    }

    return dispatch({
      type: "REMOVE_BREAKPOINT",
      breakpoint,
      disabled: false,
      [_promise.PROMISE]: removeBreakpointsPromise(client, getState(), breakpoint)
    });
  };
}

/**
 * Disable a single breakpoint
 *
 * @memberof actions/breakpoints
 * @static
 */
function disableBreakpoint(breakpoint) {
  return async ({ dispatch, getState, client }) => {
    if (breakpoint.loading) {
      return;
    }

    await removeBreakpointsPromise(client, getState(), breakpoint);

    const newBreakpoint = { ...breakpoint, disabled: true };

    return dispatch({ type: "DISABLE_BREAKPOINT", breakpoint: newBreakpoint });
  };
}

/**
 * Disable all breakpoints in a source
 *
 * @memberof actions/breakpoints
 * @static
 */
function disableBreakpointsInSource(source) {
  return async ({ dispatch, getState, client }) => {
    const breakpoints = (0, _selectors.getBreakpointsForSource)(getState(), source.id);
    for (const breakpoint of breakpoints) {
      if (!breakpoint.disabled) {
        dispatch(disableBreakpoint(breakpoint));
      }
    }
  };
}

/**
 * Enable all breakpoints in a source
 *
 * @memberof actions/breakpoints
 * @static
 */
function enableBreakpointsInSource(source) {
  return async ({ dispatch, getState, client }) => {
    const breakpoints = (0, _selectors.getBreakpointsForSource)(getState(), source.id);
    for (const breakpoint of breakpoints) {
      if (breakpoint.disabled) {
        dispatch((0, _addBreakpoint.enableBreakpoint)(breakpoint));
      }
    }
  };
}

/**
 * Toggle All Breakpoints
 *
 * @memberof actions/breakpoints
 * @static
 */
function toggleAllBreakpoints(shouldDisableBreakpoints) {
  return async ({ dispatch, getState, client }) => {
    const breakpoints = (0, _selectors.getBreakpointsList)(getState());

    const modifiedBreakpoints = [];

    for (const breakpoint of breakpoints) {
      if (shouldDisableBreakpoints) {
        await removeBreakpointsPromise(client, getState(), breakpoint);
        const newBreakpoint = { ...breakpoint, disabled: true };
        modifiedBreakpoints.push(newBreakpoint);
      } else {
        const newBreakpoint = { ...breakpoint, disabled: false };
        modifiedBreakpoints.push(newBreakpoint);
      }
    }

    if (shouldDisableBreakpoints) {
      return dispatch({
        type: "DISABLE_ALL_BREAKPOINTS",
        breakpoints: modifiedBreakpoints
      });
    }

    return dispatch({
      type: "ENABLE_ALL_BREAKPOINTS",
      breakpoints: modifiedBreakpoints
    });
  };
}

/**
 * Toggle Breakpoints
 *
 * @memberof actions/breakpoints
 * @static
 */
function toggleBreakpoints(shouldDisableBreakpoints, breakpoints) {
  return async ({ dispatch }) => {
    const promises = breakpoints.map(breakpoint => shouldDisableBreakpoints ? dispatch(disableBreakpoint(breakpoint)) : dispatch((0, _addBreakpoint.enableBreakpoint)(breakpoint)));

    await Promise.all(promises);
  };
}

/**
 * Removes all breakpoints
 *
 * @memberof actions/breakpoints
 * @static
 */
function removeAllBreakpoints() {
  return async ({ dispatch, getState }) => {
    const breakpointList = (0, _selectors.getBreakpointsList)(getState());
    return Promise.all(breakpointList.map(bp => dispatch(removeBreakpoint(bp))));
  };
}

/**
 * Removes breakpoints
 *
 * @memberof actions/breakpoints
 * @static
 */
function removeBreakpoints(breakpoints) {
  return async ({ dispatch }) => {
    return Promise.all(breakpoints.map(bp => dispatch(removeBreakpoint(bp))));
  };
}

/**
 * Removes all breakpoints in a source
 *
 * @memberof actions/breakpoints
 * @static
 */
function removeBreakpointsInSource(source) {
  return async ({ dispatch, getState, client }) => {
    const breakpoints = (0, _selectors.getBreakpointsForSource)(getState(), source.id);
    for (const breakpoint of breakpoints) {
      dispatch(removeBreakpoint(breakpoint));
    }
  };
}

function remapBreakpoints(sourceId) {
  return async ({ dispatch, getState, sourceMaps }) => {
    const breakpoints = (0, _selectors.getBreakpointsList)(getState());
    const newBreakpoints = await (0, _remapLocations2.default)(breakpoints, sourceId, sourceMaps);

    return dispatch({
      type: "REMAP_BREAKPOINTS",
      breakpoints: newBreakpoints
    });
  };
}

/**
 * Update the options of a breakpoint.
 *
 * @throws {Error} "not implemented"
 * @memberof actions/breakpoints
 * @static
 * @param {SourceLocation} location
 *        @see DebuggerController.Breakpoints.addBreakpoint
 * @param {Object} options
 *        Any options to set on the breakpoint
 */
function setBreakpointOptions(location, options = {}) {
  return async ({ dispatch, getState, client, sourceMaps }) => {
    const bp = (0, _selectors.getBreakpoint)(getState(), location);
    if (!bp) {
      return dispatch((0, _addBreakpoint.addBreakpoint)(location, options));
    }

    if (bp.loading) {
      return;
    }

    if (bp.disabled) {
      await dispatch((0, _addBreakpoint.enableBreakpoint)(bp));
    }

    const breakpointLocation = (0, _breakpoint.makeBreakpointLocation)(getState(), bp.generatedLocation);
    await client.setBreakpoint(breakpointLocation, options);

    const newBreakpoint = { ...bp, disabled: false, options };

    (0, _breakpoint.assertBreakpoint)(newBreakpoint);

    return dispatch({
      type: "SET_BREAKPOINT_OPTIONS",
      breakpoint: newBreakpoint
    });
  };
}

function toggleBreakpointAtLine(line) {
  return ({ dispatch, getState, client, sourceMaps }) => {
    const state = getState();
    const selectedSource = (0, _selectors.getSelectedSource)(state);

    if (!selectedSource) {
      return;
    }

    const bp = (0, _selectors.getBreakpointAtLocation)(state, { line, column: undefined });
    const isEmptyLine = (0, _selectors.isEmptyLineInSource)(state, line, selectedSource.id);

    if (!bp && isEmptyLine || bp && bp.loading) {
      return;
    }

    if ((0, _selectors.getConditionalPanelLocation)(getState())) {
      dispatch((0, _ui.closeConditionalPanel)());
    }

    if (bp) {
      return dispatch(removeBreakpoint(bp));
    }
    return dispatch((0, _addBreakpoint.addBreakpoint)({
      sourceId: selectedSource.id,
      sourceUrl: selectedSource.url,
      line: line
    }));
  };
}

function addBreakpointAtLine(line) {
  return ({ dispatch, getState, client, sourceMaps }) => {
    const state = getState();
    const source = (0, _selectors.getSelectedSource)(state);

    if (!source || (0, _selectors.isEmptyLineInSource)(state, line, source.id)) {
      return;
    }

    return dispatch((0, _addBreakpoint.addBreakpoint)({
      sourceId: source.id,
      sourceUrl: source.url,
      column: undefined,
      line
    }));
  };
}

function removeBreakpointsAtLine(sourceId, line) {
  return ({ dispatch, getState, client, sourceMaps }) => {
    const breakpointsAtLine = (0, _selectors.getBreakpointsForSource)(getState(), sourceId, line);
    return dispatch(removeBreakpoints(breakpointsAtLine));
  };
}

function disableBreakpointsAtLine(sourceId, line) {
  return ({ dispatch, getState, client, sourceMaps }) => {
    const breakpointsAtLine = (0, _selectors.getBreakpointsForSource)(getState(), sourceId, line);
    return dispatch(toggleBreakpoints(true, breakpointsAtLine));
  };
}

function enableBreakpointsAtLine(sourceId, line) {
  return ({ dispatch, getState, client, sourceMaps }) => {
    const breakpointsAtLine = (0, _selectors.getBreakpointsForSource)(getState(), sourceId, line);
    return dispatch(toggleBreakpoints(false, breakpointsAtLine));
  };
}

function toggleDisabledBreakpoint(breakpoint) {
  return ({ dispatch, getState, client, sourceMaps }) => {
    if (breakpoint.loading) {
      return;
    }

    if (!breakpoint.disabled) {
      return dispatch(disableBreakpoint(breakpoint));
    }
    return dispatch((0, _addBreakpoint.enableBreakpoint)(breakpoint));
  };
}

function enableXHRBreakpoint(index, bp) {
  return ({ dispatch, getState, client }) => {
    const xhrBreakpoints = (0, _selectors.getXHRBreakpoints)(getState());
    const breakpoint = bp || xhrBreakpoints[index];
    const enabledBreakpoint = {
      ...breakpoint,
      disabled: false
    };

    return dispatch({
      type: "ENABLE_XHR_BREAKPOINT",
      breakpoint: enabledBreakpoint,
      index,
      [_promise.PROMISE]: client.setXHRBreakpoint(breakpoint.path, breakpoint.method)
    });
  };
}

function disableXHRBreakpoint(index, bp) {
  return ({ dispatch, getState, client }) => {
    const xhrBreakpoints = (0, _selectors.getXHRBreakpoints)(getState());
    const breakpoint = bp || xhrBreakpoints[index];
    const disabledBreakpoint = {
      ...breakpoint,
      disabled: true
    };

    return dispatch({
      type: "DISABLE_XHR_BREAKPOINT",
      breakpoint: disabledBreakpoint,
      index,
      [_promise.PROMISE]: client.removeXHRBreakpoint(breakpoint.path, breakpoint.method)
    });
  };
}

function updateXHRBreakpoint(index, path, method) {
  return ({ dispatch, getState, client }) => {
    const xhrBreakpoints = (0, _selectors.getXHRBreakpoints)(getState());
    const breakpoint = xhrBreakpoints[index];

    const updatedBreakpoint = {
      ...breakpoint,
      path,
      method,
      text: L10N.getFormatStr("xhrBreakpoints.item.label", path)
    };

    return dispatch({
      type: "UPDATE_XHR_BREAKPOINT",
      breakpoint: updatedBreakpoint,
      index,
      [_promise.PROMISE]: Promise.all([client.removeXHRBreakpoint(breakpoint.path, breakpoint.method), client.setXHRBreakpoint(path, method)])
    });
  };
}
function togglePauseOnAny() {
  return ({ dispatch, getState }) => {
    const xhrBreakpoints = (0, _selectors.getXHRBreakpoints)(getState());
    const index = xhrBreakpoints.findIndex(({ path }) => path.length === 0);
    if (index < 0) {
      return dispatch(setXHRBreakpoint("", "ANY"));
    }

    const bp = xhrBreakpoints[index];
    if (bp.disabled) {
      return dispatch(enableXHRBreakpoint(index, bp));
    }

    return dispatch(disableXHRBreakpoint(index, bp));
  };
}

function setXHRBreakpoint(path, method) {
  return ({ dispatch, getState, client }) => {
    const breakpoint = (0, _breakpoint.createXHRBreakpoint)(path, method);

    return dispatch({
      type: "SET_XHR_BREAKPOINT",
      breakpoint,
      [_promise.PROMISE]: client.setXHRBreakpoint(path, method)
    });
  };
}

function removeXHRBreakpoint(index) {
  return ({ dispatch, getState, client }) => {
    const xhrBreakpoints = (0, _selectors.getXHRBreakpoints)(getState());
    const breakpoint = xhrBreakpoints[index];
    return dispatch({
      type: "REMOVE_XHR_BREAKPOINT",
      breakpoint,
      index,
      [_promise.PROMISE]: client.removeXHRBreakpoint(breakpoint.path, breakpoint.method)
    });
  };
}

exports.addBreakpoint = _addBreakpoint.addBreakpoint;
exports.addHiddenBreakpoint = _addBreakpoint.addHiddenBreakpoint;
exports.enableBreakpoint = _addBreakpoint.enableBreakpoint;
exports.syncBreakpoint = _syncBreakpoint.syncBreakpoint;