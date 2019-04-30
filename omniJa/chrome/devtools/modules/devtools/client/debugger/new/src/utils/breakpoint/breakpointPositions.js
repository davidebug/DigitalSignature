"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findPosition = findPosition;

var _location = require("../location");

var _sourceMaps = require("../source-maps");

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

function findPosition(positions, location) {
  if (!positions) {
    return null;
  }

  return positions.find(pos => (0, _location.comparePosition)((0, _sourceMaps.getSelectedLocation)(pos, location), location));
}