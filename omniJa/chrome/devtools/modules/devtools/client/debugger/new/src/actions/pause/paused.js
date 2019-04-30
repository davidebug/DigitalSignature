"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.paused = paused;

var _selectors = require("../../selectors/index");

var _ = require("./index");

var _breakpoints = require("../breakpoints/index");

var _expressions = require("../expressions");

var _sources = require("../sources/index");

var _ui = require("../ui");

var _fetchScopes = require("./fetchScopes");

/**
 * Debugger has just paused
 *
 * @param {object} pauseInfo
 * @memberof actions/pause
 * @static
 */
function paused(pauseInfo) {
  return async function ({ dispatch, getState, client, sourceMaps }) {
    const { thread, frames, why, loadedObjects } = pauseInfo;
    const topFrame = frames.length > 0 ? frames[0] : null;

    dispatch({
      type: "PAUSED",
      thread,
      why,
      frames,
      selectedFrameId: topFrame ? topFrame.id : undefined,
      loadedObjects: loadedObjects || []
    });

    const hiddenBreakpoint = (0, _selectors.getHiddenBreakpoint)(getState());
    if (hiddenBreakpoint) {
      dispatch((0, _breakpoints.removeBreakpoint)(hiddenBreakpoint));
    }

    await dispatch((0, _.mapFrames)(thread));

    const selectedFrame = (0, _selectors.getSelectedFrame)(getState(), thread);
    if (selectedFrame) {
      await dispatch((0, _sources.selectLocation)(selectedFrame.location));
    }

    if (!(0, _selectors.wasStepping)(getState(), thread)) {
      dispatch((0, _ui.togglePaneCollapse)("end", false));
    }

    await dispatch((0, _fetchScopes.fetchScopes)(thread));

    // Run after fetching scoping data so that it may make use of the sourcemap
    // expression mappings for local variables.
    const atException = why.type == "exception";
    if (!atException || !(0, _selectors.isEvaluatingExpression)(getState(), thread)) {
      await dispatch((0, _expressions.evaluateExpressions)());
    }
  };
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */