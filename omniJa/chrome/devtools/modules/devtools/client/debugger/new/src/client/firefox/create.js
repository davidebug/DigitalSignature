"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createFrame = createFrame;
exports.createSource = createSource;
exports.createPause = createPause;
exports.createWorker = createWorker;

var _source = require("../../utils/source");

var _commands = require("./commands");

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// This module converts Firefox specific types to the generic types

function createFrame(thread, frame) {
  if (!frame) {
    return null;
  }

  const location = {
    sourceId: _commands.clientCommands.getSourceForActor(frame.where.actor),
    line: frame.where.line,
    column: frame.where.column
  };

  return {
    id: frame.actor,
    thread,
    displayName: frame.displayName,
    location,
    generatedLocation: location,
    this: frame.this,
    source: null,
    scope: frame.environment
  };
}

function makeSourceId(source) {
  return source.url ? `sourceURL-${source.url}` : `source-${source.actor}`;
}

function createSource(thread, source, { supportsWasm }) {
  const id = makeSourceId(source);
  const sourceActor = {
    actor: source.actor,
    source: id,
    thread
  };
  const createdSource = {
    id,
    url: source.url,
    relativeUrl: source.url,
    isPrettyPrinted: false,
    sourceMapURL: source.sourceMapURL,
    introductionUrl: source.introductionUrl,
    isBlackBoxed: false,
    loadedState: "unloaded",
    isWasm: supportsWasm && source.introductionType === "wasm",
    isExtension: source.url && (0, _source.isUrlExtension)(source.url) || false,
    actors: [sourceActor]
  };
  _commands.clientCommands.registerSourceActor(sourceActor);
  return createdSource;
}

function createPause(thread, packet, response) {
  // NOTE: useful when the debugger is already paused
  const frame = packet.frame || response.frames[0];

  return {
    ...packet,
    thread,
    frame: createFrame(thread, frame),
    frames: response.frames.map(createFrame.bind(null, thread))
  };
}

function createWorker(actor, url) {
  return {
    actor,
    url,
    // Ci.nsIWorkerDebugger.TYPE_DEDICATED
    type: 0
  };
}