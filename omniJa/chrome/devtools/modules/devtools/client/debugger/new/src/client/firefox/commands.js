"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clientCommands = exports.setupCommands = undefined;

var _create = require("./create");

var _workers = require("./workers");

var _prefs = require("../../utils/prefs");

let workerClients; /* This Source Code Form is subject to the terms of the Mozilla Public
                    * License, v. 2.0. If a copy of the MPL was not distributed with this
                    * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

let threadClient;
let tabTarget;
let debuggerClient;
let sourceActors;
let breakpoints;
let supportsWasm;

let shouldWaitForWorkers = false;

function setupCommands(dependencies) {
  threadClient = dependencies.threadClient;
  tabTarget = dependencies.tabTarget;
  debuggerClient = dependencies.debuggerClient;
  supportsWasm = dependencies.supportsWasm;
  workerClients = {};
  sourceActors = {};
  breakpoints = {};
}

function createObjectClient(grip) {
  return debuggerClient.createObjectClient(grip);
}

function releaseActor(actor) {
  if (!actor) {
    return;
  }

  return debuggerClient.release(actor);
}

function sendPacket(packet) {
  return debuggerClient.request(packet);
}

function lookupThreadClient(thread) {
  if (thread == threadClient.actor) {
    return threadClient;
  }
  if (!workerClients[thread]) {
    throw new Error(`Unknown thread client: ${thread}`);
  }
  return workerClients[thread].thread;
}

function lookupConsoleClient(thread) {
  if (thread == threadClient.actor) {
    return tabTarget.activeConsole;
  }
  return workerClients[thread].console;
}

function listWorkerThreadClients() {
  return Object.values(workerClients).map(({ thread }) => thread);
}

function forEachWorkerThread(iteratee) {
  const promises = listWorkerThreadClients().map(thread => iteratee(thread));

  if (shouldWaitForWorkers) {
    return Promise.all(promises);
  }
}

function resume(thread) {
  return new Promise(resolve => {
    lookupThreadClient(thread).resume(resolve);
  });
}

function stepIn(thread) {
  return new Promise(resolve => {
    lookupThreadClient(thread).stepIn(resolve);
  });
}

function stepOver(thread) {
  return new Promise(resolve => {
    lookupThreadClient(thread).stepOver(resolve);
  });
}

function stepOut(thread) {
  return new Promise(resolve => {
    lookupThreadClient(thread).stepOut(resolve);
  });
}

function rewind(thread) {
  return new Promise(resolve => {
    lookupThreadClient(thread).rewind(resolve);
  });
}

function reverseStepIn(thread) {
  return new Promise(resolve => {
    lookupThreadClient(thread).reverseStepIn(resolve);
  });
}

function reverseStepOver(thread) {
  return new Promise(resolve => {
    lookupThreadClient(thread).reverseStepOver(resolve);
  });
}

function reverseStepOut(thread) {
  return new Promise(resolve => {
    lookupThreadClient(thread).reverseStepOut(resolve);
  });
}

function breakOnNext(thread) {
  return lookupThreadClient(thread).breakOnNext();
}

async function sourceContents({
  actor,
  thread
}) {
  const sourceThreadClient = lookupThreadClient(thread);
  const sourceClient = sourceThreadClient.source({ actor });
  const { source, contentType } = await sourceClient.source();
  return { source, contentType };
}

function setXHRBreakpoint(path, method) {
  return threadClient.setXHRBreakpoint(path, method);
}

function removeXHRBreakpoint(path, method) {
  return threadClient.removeXHRBreakpoint(path, method);
}

// Get the string key to use for a breakpoint location.
// See also duplicate code in breakpoint-actor-map.js :(
function locationKey(location) {
  const { sourceUrl, line, column } = location;
  const sourceId = location.sourceId || "";
  return `${sourceUrl}:${sourceId}:${line}:${column}`;
}

function waitForWorkers(shouldWait) {
  shouldWaitForWorkers = shouldWait;
}

function detachWorkers() {
  for (const thread of listWorkerThreadClients()) {
    thread.detach();
  }
}

function maybeGenerateLogGroupId(options) {
  if (options.logValue && tabTarget.traits && tabTarget.traits.canRewind) {
    return { ...options, logGroupId: `logGroup-${Math.random()}` };
  }
  return options;
}

function maybeClearLogpoint(location) {
  const bp = breakpoints[locationKey(location)];
  if (bp && bp.options.logGroupId && tabTarget.activeConsole) {
    tabTarget.activeConsole.emit("clearLogpointMessages", bp.options.logGroupId);
  }
}

async function setBreakpoint(location, options) {
  maybeClearLogpoint(location);
  options = maybeGenerateLogGroupId(options);
  breakpoints[locationKey(location)] = { location, options };
  await threadClient.setBreakpoint(location, options);

  // Set breakpoints in other threads as well, but do not wait for the requests
  // to complete, so that we don't get hung up if one of the threads stops
  // responding. We don't strictly need to wait for the main thread to finish
  // setting its breakpoint, but this leads to more consistent behavior if the
  // user sets a breakpoint and immediately starts interacting with the page.
  // If the main thread stops responding then we're toast regardless.
  await forEachWorkerThread(thread => thread.setBreakpoint(location, options));
}

async function removeBreakpoint(location) {
  maybeClearLogpoint(location);
  delete breakpoints[locationKey(location)];
  await threadClient.removeBreakpoint(location);

  // Remove breakpoints without waiting for the thread to respond, for the same
  // reason as in setBreakpoint.
  await forEachWorkerThread(thread => thread.removeBreakpoint(location));
}

async function evaluateInFrame(script, options) {
  return evaluate(script, options);
}

async function evaluateExpressions(scripts, options) {
  return Promise.all(scripts.map(script => evaluate(script, options)));
}

function evaluate(script, { thread, frameId } = {}) {
  const params = { thread, frameActor: frameId };
  if (!tabTarget || !script) {
    return Promise.resolve({ result: null });
  }

  const console = thread ? lookupConsoleClient(thread) : tabTarget.activeConsole;
  if (!console) {
    return Promise.resolve({ result: null });
  }

  return console.evaluateJSAsync(script, params);
}

function autocomplete(input, cursor, frameId) {
  if (!tabTarget || !tabTarget.activeConsole || !input) {
    return Promise.resolve({});
  }
  return new Promise(resolve => {
    tabTarget.activeConsole.autocomplete(input, cursor, result => resolve(result), frameId);
  });
}

function navigate(url) {
  return tabTarget.navigateTo({ url });
}

function reload() {
  return tabTarget.reload();
}

function getProperties(thread, grip) {
  const objClient = lookupThreadClient(thread).pauseGrip(grip);

  return objClient.getPrototypeAndProperties().then(resp => {
    const { ownProperties, safeGetterValues } = resp;
    for (const name in safeGetterValues) {
      const { enumerable, writable, getterValue } = safeGetterValues[name];
      ownProperties[name] = { enumerable, writable, value: getterValue };
    }
    return resp;
  });
}

async function getFrameScopes(frame) {
  if (frame.scope) {
    return frame.scope;
  }

  const sourceThreadClient = lookupThreadClient(frame.thread);
  return sourceThreadClient.getEnvironment(frame.id);
}

async function pauseOnExceptions(shouldPauseOnExceptions, shouldPauseOnCaughtExceptions) {
  await threadClient.pauseOnExceptions(shouldPauseOnExceptions,
  // Providing opposite value because server
  // uses "shouldIgnoreCaughtExceptions"
  !shouldPauseOnCaughtExceptions);

  await forEachWorkerThread(thread => thread.pauseOnExceptions(shouldPauseOnExceptions, !shouldPauseOnCaughtExceptions));
}

async function blackBox(sourceActor, isBlackBoxed, range) {
  const sourceClient = threadClient.source({ actor: sourceActor.actor });
  if (isBlackBoxed) {
    await sourceClient.unblackBox(range);
  } else {
    await sourceClient.blackBox(range);
  }
}

async function setSkipPausing(shouldSkip) {
  await threadClient.skipBreakpoints(shouldSkip);
  await forEachWorkerThread(thread => thread.skipBreakpoints(shouldSkip));
}

function interrupt(thread) {
  return lookupThreadClient(thread).interrupt();
}

function setEventListenerBreakpoints(eventTypes) {
  // TODO: Figure out what sendpoint we want to hit
}

function pauseGrip(thread, func) {
  return lookupThreadClient(thread).pauseGrip(func);
}

function registerSourceActor(sourceActor) {
  sourceActors[sourceActor.actor] = sourceActor.source;
}

async function createSources(client) {
  const { sources } = await client.getSources();
  if (!sources) {
    return null;
  }
  return sources.map(packet => (0, _create.createSource)(client.actor, packet, { supportsWasm }));
}

async function fetchSources() {
  const sources = await createSources(threadClient);

  // NOTE: this happens when we fetch sources and then immediately navigate
  if (!sources) {
    return [];
  }

  return sources;
}

function getSourceForActor(actor) {
  if (!sourceActors[actor]) {
    throw new Error(`Unknown source actor: ${actor}`);
  }
  return sourceActors[actor];
}

async function fetchWorkers() {
  if (_prefs.features.windowlessWorkers) {
    const options = {
      breakpoints,
      observeAsmJS: true
    };

    const newWorkerClients = await (0, _workers.updateWorkerClients)({
      tabTarget,
      debuggerClient,
      threadClient,
      workerClients,
      options
    });

    // Fetch the sources and install breakpoints on any new workers.
    const workerNames = Object.getOwnPropertyNames(newWorkerClients);
    for (const actor of workerNames) {
      if (!workerClients[actor]) {
        const client = newWorkerClients[actor].thread;
        createSources(client);
      }
    }

    workerClients = newWorkerClients;

    return workerNames.map(actor => (0, _create.createWorker)(actor, workerClients[actor].url));
  }

  if (!(0, _workers.supportsWorkers)(tabTarget)) {
    return Promise.resolve([]);
  }

  const { workers } = await tabTarget.listWorkers();
  return workers;
}

function getMainThread() {
  return threadClient.actor;
}

async function getBreakpointPositions(source, range) {
  const sourceActor = source.actors[0];
  const { thread, actor } = sourceActor;
  const sourceThreadClient = lookupThreadClient(thread);
  const sourceClient = sourceThreadClient.source({ actor });
  const { positions } = await sourceClient.getBreakpointPositionsCompressed(range);
  return positions;
}

const clientCommands = {
  autocomplete,
  blackBox,
  createObjectClient,
  releaseActor,
  interrupt,
  pauseGrip,
  resume,
  stepIn,
  stepOut,
  stepOver,
  rewind,
  reverseStepIn,
  reverseStepOut,
  reverseStepOver,
  breakOnNext,
  sourceContents,
  getSourceForActor,
  getBreakpointPositions,
  setBreakpoint,
  setXHRBreakpoint,
  removeXHRBreakpoint,
  removeBreakpoint,
  evaluate,
  evaluateInFrame,
  evaluateExpressions,
  navigate,
  reload,
  getProperties,
  getFrameScopes,
  pauseOnExceptions,
  fetchSources,
  registerSourceActor,
  fetchWorkers,
  getMainThread,
  sendPacket,
  setSkipPausing,
  setEventListenerBreakpoints,
  waitForWorkers,
  detachWorkers
};

exports.setupCommands = setupCommands;
exports.clientCommands = clientCommands;