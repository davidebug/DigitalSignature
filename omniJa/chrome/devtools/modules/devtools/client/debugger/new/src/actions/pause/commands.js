"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.selectThread = selectThread;
exports.command = command;
exports.stepIn = stepIn;
exports.stepOver = stepOver;
exports.stepOut = stepOut;
exports.resume = resume;
exports.rewind = rewind;
exports.reverseStepIn = reverseStepIn;
exports.reverseStepOver = reverseStepOver;
exports.reverseStepOut = reverseStepOut;
exports.astCommand = astCommand;

var _selectors = require("../../selectors/index");

var _promise = require("../utils/middleware/promise");

var _parser = require("../../workers/parser/index");

var _breakpoints = require("../breakpoints/index");

var _expressions = require("../expressions");

var _sources = require("../sources/index");

var _prefs = require("../../utils/prefs");

var _telemetry = require("../../utils/telemetry");

/* -*- indent-tabs-mode: nil; js-indent-level: 2; js-indent-level: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

function selectThread(thread) {
  return async ({ dispatch, getState, client }) => {
    await dispatch({ type: "SELECT_THREAD", thread });
    dispatch((0, _expressions.evaluateExpressions)());

    const frame = (0, _selectors.getSelectedFrame)(getState(), thread);
    if (frame) {
      dispatch((0, _sources.selectLocation)(frame.location));
    }
  };
}

/**
 * Debugger commands like stepOver, stepIn, stepUp
 *
 * @param string $0.type
 * @memberof actions/pause
 * @static
 */
function command(thread, type) {
  return async ({ dispatch, getState, client }) => {
    if (type) {
      return dispatch({
        type: "COMMAND",
        command: type,
        thread,
        [_promise.PROMISE]: client[type](thread)
      });
    }
  };
}

/**
 * StepIn
 * @memberof actions/pause
 * @static
 * @returns {Function} {@link command}
 */
function stepIn() {
  return ({ dispatch, getState }) => {
    const thread = (0, _selectors.getCurrentThread)(getState());
    if ((0, _selectors.getIsPaused)(getState(), thread)) {
      return dispatch(command(thread, "stepIn"));
    }
  };
}

/**
 * stepOver
 * @memberof actions/pause
 * @static
 * @returns {Function} {@link command}
 */
function stepOver() {
  return ({ dispatch, getState }) => {
    const thread = (0, _selectors.getCurrentThread)(getState());
    if ((0, _selectors.getIsPaused)(getState(), thread)) {
      return dispatch(astCommand(thread, "stepOver"));
    }
  };
}

/**
 * stepOut
 * @memberof actions/pause
 * @static
 * @returns {Function} {@link command}
 */
function stepOut() {
  return ({ dispatch, getState }) => {
    const thread = (0, _selectors.getCurrentThread)(getState());
    if ((0, _selectors.getIsPaused)(getState(), thread)) {
      return dispatch(command(thread, "stepOut"));
    }
  };
}

/**
 * resume
 * @memberof actions/pause
 * @static
 * @returns {Function} {@link command}
 */
function resume() {
  return ({ dispatch, getState }) => {
    const thread = (0, _selectors.getCurrentThread)(getState());
    if ((0, _selectors.getIsPaused)(getState(), thread)) {
      (0, _telemetry.recordEvent)("continue");
      return dispatch(command(thread, "resume"));
    }
  };
}

/**
 * rewind
 * @memberof actions/pause
 * @static
 * @returns {Function} {@link command}
 */
function rewind() {
  return ({ dispatch, getState }) => {
    const thread = (0, _selectors.getCurrentThread)(getState());
    if ((0, _selectors.getIsPaused)(getState(), thread)) {
      return dispatch(command(thread, "rewind"));
    }
  };
}

/**
 * reverseStepIn
 * @memberof actions/pause
 * @static
 * @returns {Function} {@link command}
 */
function reverseStepIn() {
  return ({ dispatch, getState }) => {
    const thread = (0, _selectors.getCurrentThread)(getState());
    if ((0, _selectors.getIsPaused)(getState(), thread)) {
      return dispatch(command(thread, "reverseStepIn"));
    }
  };
}

/**
 * reverseStepOver
 * @memberof actions/pause
 * @static
 * @returns {Function} {@link command}
 */
function reverseStepOver() {
  return ({ dispatch, getState }) => {
    const thread = (0, _selectors.getCurrentThread)(getState());
    if ((0, _selectors.getIsPaused)(getState(), thread)) {
      return dispatch(astCommand(thread, "reverseStepOver"));
    }
  };
}

/**
 * reverseStepOut
 * @memberof actions/pause
 * @static
 * @returns {Function} {@link command}
 */
function reverseStepOut() {
  return ({ dispatch, getState }) => {
    const thread = (0, _selectors.getCurrentThread)(getState());
    if ((0, _selectors.getIsPaused)(getState(), thread)) {
      return dispatch(command(thread, "reverseStepOut"));
    }
  };
}

/*
 * Checks for await or yield calls on the paused line
 * This avoids potentially expensive parser calls when we are likely
 * not at an async expression.
 */
function hasAwait(source, pauseLocation) {
  const { line, column } = pauseLocation;
  if (source.isWasm || !source.text) {
    return false;
  }

  const lineText = source.text.split("\n")[line - 1];

  if (!lineText) {
    return false;
  }

  const snippet = lineText.slice(column - 50, column + 50);

  return !!snippet.match(/(yield|await)/);
}

/**
 * @memberOf actions/pause
 * @static
 * @param stepType
 * @returns {function(ThunkArgs)}
 */
function astCommand(thread, stepType) {
  return async ({ dispatch, getState, sourceMaps }) => {
    if (!_prefs.features.asyncStepping) {
      return dispatch(command(thread, stepType));
    }

    if (stepType == "stepOver") {
      // This type definition is ambiguous:
      const frame = (0, _selectors.getTopFrame)(getState(), thread);
      const source = (0, _selectors.getSource)(getState(), frame.location.sourceId);

      if (source && hasAwait(source, frame.location)) {
        const nextLocation = await (0, _parser.getNextStep)(source.id, frame.location);
        if (nextLocation) {
          await dispatch((0, _breakpoints.addHiddenBreakpoint)(nextLocation));
          return dispatch(command(thread, "resume"));
        }
      }
    }

    return dispatch(command(thread, stepType));
  };
}