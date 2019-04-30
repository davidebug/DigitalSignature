"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.supportsWorkers = supportsWorkers;
exports.updateWorkerClients = updateWorkerClients;

var _events = require("./events");

function supportsWorkers(tabTarget) {
  return tabTarget.isBrowsingContext || tabTarget.isContentProcess;
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

async function updateWorkerClients({
  tabTarget,
  debuggerClient,
  threadClient,
  workerClients,
  options
}) {
  if (!supportsWorkers(tabTarget)) {
    return {};
  }

  const newWorkerClients = {};

  const { workers } = await tabTarget.listWorkers();
  for (const workerTargetFront of workers) {
    await workerTargetFront.attach();
    const [, workerThread] = await workerTargetFront.attachThread(options);

    if (workerClients[workerThread.actor]) {
      if (workerClients[workerThread.actor].thread != workerThread) {
        throw new Error(`Multiple clients for actor ID: ${workerThread.actor}`);
      }
      newWorkerClients[workerThread.actor] = workerClients[workerThread.actor];
    } else {
      (0, _events.addThreadEventListeners)(workerThread);
      workerThread.resume();

      const consoleFront = await workerTargetFront.getFront("console");
      await consoleFront.startListeners([]);

      newWorkerClients[workerThread.actor] = {
        url: workerTargetFront.url,
        thread: workerThread,
        console: consoleFront
      };
    }
  }

  return newWorkerClients;
}