"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateWorkers = updateWorkers;
function updateWorkers() {
  return async function ({ dispatch, getState, client }) {
    const workers = await client.fetchWorkers();
    const mainThread = client.getMainThread();
    dispatch({ type: "SET_WORKERS", workers, mainThread });
  };
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */