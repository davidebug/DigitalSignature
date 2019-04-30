"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getWorkerCount = exports.getWorkers = undefined;
exports.initialDebuggeeState = initialDebuggeeState;
exports.default = debuggee;
exports.getWorkerByThread = getWorkerByThread;
exports.getMainThread = getMainThread;
exports.getDebuggeeUrl = getDebuggeeUrl;
exports.getThreads = getThreads;

var _lodash = require("devtools/client/shared/vendor/lodash");

var _workers = require("../utils/workers");

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

/**
 * Debuggee reducer
 * @module reducers/debuggee
 */

function initialDebuggeeState() {
  return { workers: [], mainThread: { actor: "", url: "", type: -1 } };
}

function debuggee(state = initialDebuggeeState(), action) {
  switch (action.type) {
    case "CONNECT":
      return {
        ...state,
        mainThread: action.mainThread
      };
    case "SET_WORKERS":
      return { ...state, workers: action.workers };
    case "NAVIGATE":
      return {
        ...initialDebuggeeState(),
        mainThread: action.mainThread
      };
    default:
      return state;
  }
}

const getWorkers = exports.getWorkers = state => state.debuggee.workers;

const getWorkerCount = exports.getWorkerCount = state => getWorkers(state).length;

function getWorkerByThread(state, thread) {
  return getWorkers(state).find(worker => worker.actor == thread);
}

function getMainThread(state) {
  return state.debuggee.mainThread;
}

function getDebuggeeUrl(state) {
  return getMainThread(state).url;
}

function getThreads(state) {
  return [getMainThread(state), ...(0, _lodash.sortBy)(getWorkers(state), _workers.getDisplayName)];
}