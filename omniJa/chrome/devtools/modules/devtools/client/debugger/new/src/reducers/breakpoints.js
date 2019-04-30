"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initialBreakpointsState = initialBreakpointsState;
exports.getBreakpointsMap = getBreakpointsMap;
exports.getBreakpointsList = getBreakpointsList;
exports.getBreakpointCount = getBreakpointCount;
exports.getBreakpoint = getBreakpoint;
exports.getBreakpointsDisabled = getBreakpointsDisabled;
exports.getBreakpointsLoading = getBreakpointsLoading;
exports.getBreakpointsForSource = getBreakpointsForSource;
exports.getBreakpointForLocation = getBreakpointForLocation;
exports.getHiddenBreakpoint = getHiddenBreakpoint;
exports.getBreakpointPositions = getBreakpointPositions;
exports.getBreakpointPositionsForSource = getBreakpointPositionsForSource;
exports.hasBreakpointPositions = hasBreakpointPositions;
exports.getBreakpointPositionsForLine = getBreakpointPositionsForLine;
exports.isEmptyLineInSource = isEmptyLineInSource;
exports.getEmptyLines = getEmptyLines;

var _devtoolsSourceMap = require("devtools/client/shared/source-map/index.js");

var _lodash = require("devtools/client/shared/vendor/lodash");

var _breakpoint = require("../utils/breakpoint/index");

var _emptyLines = require("../utils/empty-lines");

var _breakpoints = require("../selectors/breakpoints");

function initialBreakpointsState(xhrBreakpoints = []) {
  return {
    breakpoints: {},
    xhrBreakpoints: xhrBreakpoints,
    breakpointPositions: {},
    breakpointsDisabled: false,
    emptyLines: {}
  };
}

// eslint-disable-next-line max-len
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

/**
 * Breakpoints reducer
 * @module reducers/breakpoints
 */

function update(state = initialBreakpointsState(), action) {
  switch (action.type) {
    case "ADD_BREAKPOINT":
      {
        return addBreakpoint(state, action);
      }

    case "SYNC_BREAKPOINT":
      {
        return syncBreakpoint(state, action);
      }

    case "ENABLE_BREAKPOINT":
      {
        return addBreakpoint(state, action);
      }

    case "DISABLE_BREAKPOINT":
      {
        return updateBreakpoint(state, action);
      }

    case "DISABLE_ALL_BREAKPOINTS":
      {
        return updateAllBreakpoints(state, action);
      }

    case "ENABLE_ALL_BREAKPOINTS":
      {
        return updateAllBreakpoints(state, action);
      }

    case "SET_BREAKPOINT_OPTIONS":
      {
        return updateBreakpoint(state, action);
      }

    case "REMOVE_BREAKPOINT":
      {
        return removeBreakpoint(state, action);
      }

    case "REMAP_BREAKPOINTS":
      {
        return remapBreakpoints(state, action);
      }

    case "NAVIGATE":
      {
        return initialBreakpointsState(state.xhrBreakpoints);
      }

    case "SET_XHR_BREAKPOINT":
      {
        return addXHRBreakpoint(state, action);
      }

    case "REMOVE_XHR_BREAKPOINT":
      {
        return removeXHRBreakpoint(state, action);
      }

    case "UPDATE_XHR_BREAKPOINT":
      {
        return updateXHRBreakpoint(state, action);
      }

    case "ENABLE_XHR_BREAKPOINT":
      {
        return updateXHRBreakpoint(state, action);
      }

    case "DISABLE_XHR_BREAKPOINT":
      {
        return updateXHRBreakpoint(state, action);
      }

    case "ADD_BREAKPOINT_POSITIONS":
      {
        const { source, positions } = action;
        const emptyLines = (0, _emptyLines.findEmptyLines)(source, positions);

        return {
          ...state,
          breakpointPositions: {
            ...state.breakpointPositions,
            [source.id]: positions
          },
          emptyLines: {
            ...state.emptyLines,
            [source.id]: emptyLines
          }
        };
      }
  }

  return state;
}

function addXHRBreakpoint(state, action) {
  const { xhrBreakpoints } = state;
  const { breakpoint } = action;
  const { path, method } = breakpoint;

  const existingBreakpointIndex = state.xhrBreakpoints.findIndex(bp => bp.path === path && bp.method === method);

  if (existingBreakpointIndex === -1) {
    return {
      ...state,
      xhrBreakpoints: [...xhrBreakpoints, breakpoint]
    };
  } else if (xhrBreakpoints[existingBreakpointIndex] !== breakpoint) {
    const newXhrBreakpoints = [...xhrBreakpoints];
    newXhrBreakpoints[existingBreakpointIndex] = breakpoint;
    return {
      ...state,
      xhrBreakpoints: newXhrBreakpoints
    };
  }

  return state;
}

function removeXHRBreakpoint(state, action) {
  const { breakpoint } = action;
  const { xhrBreakpoints } = state;

  if (action.status === "start") {
    return state;
  }

  return {
    ...state,
    xhrBreakpoints: xhrBreakpoints.filter(bp => !(0, _lodash.isEqual)(bp, breakpoint))
  };
}

function updateXHRBreakpoint(state, action) {
  const { breakpoint, index } = action;
  const { xhrBreakpoints } = state;
  const newXhrBreakpoints = [...xhrBreakpoints];
  newXhrBreakpoints[index] = breakpoint;
  return {
    ...state,
    xhrBreakpoints: newXhrBreakpoints
  };
}

function setBreakpoint(state, locationId, breakpoint) {
  return {
    ...state,
    breakpoints: { ...state.breakpoints, [locationId]: breakpoint }
  };
}

function unsetBreakpoint(state, locationId) {
  const breakpoints = { ...state.breakpoints };
  delete breakpoints[locationId];
  return {
    ...state,
    breakpoints: { ...breakpoints }
  };
}

function addBreakpoint(state, action) {
  if (action.status === "start" && action.breakpoint) {
    const { breakpoint } = action;
    const locationId = (0, _breakpoint.makeBreakpointId)(breakpoint.location);
    return setBreakpoint(state, locationId, breakpoint);
  }

  // when the action completes, we can commit the breakpoint
  if (action.status === "done") {
    const { value } = action;
    return syncBreakpoint(state, { breakpoint: value, previousLocation: null });
  }

  // Remove the optimistic update
  if (action.status === "error" && action.breakpoint) {
    const locationId = (0, _breakpoint.makeBreakpointId)(action.breakpoint.location);
    return unsetBreakpoint(state, locationId);
  }

  return state;
}

function syncBreakpoint(state, data) {
  const { breakpoint, previousLocation } = data;

  if (previousLocation) {
    state = {
      ...state,
      breakpoints: { ...state.breakpoints }
    };
    delete state.breakpoints[(0, _breakpoint.makeBreakpointId)(previousLocation)];
  }

  if (!breakpoint) {
    return state;
  }

  const locationId = (0, _breakpoint.makeBreakpointId)(breakpoint.location);
  return setBreakpoint(state, locationId, breakpoint);
}

function updateBreakpoint(state, action) {
  const { breakpoint } = action;
  const locationId = (0, _breakpoint.makeBreakpointId)(breakpoint.location);
  return setBreakpoint(state, locationId, breakpoint);
}

function updateAllBreakpoints(state, action) {
  const { breakpoints } = action;
  state = {
    ...state,
    breakpoints: { ...state.breakpoints }
  };
  breakpoints.forEach(breakpoint => {
    const locationId = (0, _breakpoint.makeBreakpointId)(breakpoint.location);
    state.breakpoints[locationId] = breakpoint;
  });
  return state;
}

function remapBreakpoints(state, action) {
  const breakpoints = action.breakpoints.reduce((updatedBreakpoints, breakpoint) => {
    const locationId = (0, _breakpoint.makeBreakpointId)(breakpoint.location);
    return { ...updatedBreakpoints, [locationId]: breakpoint };
  }, {});

  return { ...state, breakpoints };
}

function removeBreakpoint(state, action) {
  const { breakpoint } = action;
  const id = (0, _breakpoint.makeBreakpointId)(breakpoint.location);
  return unsetBreakpoint(state, id);
}

function isMatchingLocation(location1, location2) {
  return (0, _lodash.isEqual)(location1, location2);
}

// Selectors
// TODO: these functions should be moved out of the reducer

function getBreakpointsMap(state) {
  return state.breakpoints.breakpoints;
}

function getBreakpointsList(state) {
  return (0, _breakpoints.getBreakpointsList)(state);
}

function getBreakpointCount(state) {
  return getBreakpointsList(state).length;
}

function getBreakpoint(state, location) {
  const breakpoints = getBreakpointsMap(state);
  return breakpoints[(0, _breakpoint.makeBreakpointId)(location)];
}

function getBreakpointsDisabled(state) {
  const breakpoints = getBreakpointsList(state);
  return breakpoints.every(breakpoint => breakpoint.disabled);
}

function getBreakpointsLoading(state) {
  const breakpoints = getBreakpointsList(state);
  const isLoading = breakpoints.some(breakpoint => breakpoint.loading);
  return breakpoints.length > 0 && isLoading;
}

function getBreakpointsForSource(state, sourceId, line) {
  if (!sourceId) {
    return [];
  }

  const isGeneratedSource = (0, _devtoolsSourceMap.isGeneratedId)(sourceId);
  const breakpoints = getBreakpointsList(state);
  return breakpoints.filter(bp => {
    const location = isGeneratedSource ? bp.generatedLocation : bp.location;
    return location.sourceId === sourceId && (!line || line == location.line);
  });
}

function getBreakpointForLocation(state, location) {
  if (!location || !location.sourceId) {
    return undefined;
  }

  const isGeneratedSource = (0, _devtoolsSourceMap.isGeneratedId)(location.sourceId);
  return getBreakpointsList(state).find(bp => {
    const loc = isGeneratedSource ? bp.generatedLocation : bp.location;
    return isMatchingLocation(loc, location);
  });
}

function getHiddenBreakpoint(state) {
  const breakpoints = getBreakpointsList(state);
  return breakpoints.find(bp => bp.options.hidden);
}

function getBreakpointPositions(state) {
  return state.breakpoints.breakpointPositions;
}

function getBreakpointPositionsForSource(state, sourceId) {
  const positions = getBreakpointPositions(state);
  return positions && positions[sourceId];
}

function hasBreakpointPositions(state, sourceId) {
  return !!getBreakpointPositionsForSource(state, sourceId);
}

function getBreakpointPositionsForLine(state, sourceId, line) {
  const positions = getBreakpointPositionsForSource(state, sourceId);
  if (!positions) {
    return null;
  }
  return positions.filter(({ location, generatedLocation }) => {
    const loc = (0, _devtoolsSourceMap.isOriginalId)(sourceId) ? location : generatedLocation;
    return loc.line == line;
  });
}

function isEmptyLineInSource(state, line, selectedSourceId) {
  const emptyLines = getEmptyLines(state, selectedSourceId);
  return emptyLines && emptyLines.includes(line);
}

function getEmptyLines(state, sourceId) {
  if (!sourceId) {
    return null;
  }

  return state.breakpoints.emptyLines[sourceId];
}

exports.default = update;