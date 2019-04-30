"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findEmptyLines = findEmptyLines;

var _lodash = require("devtools/client/shared/vendor/lodash");

var _sourceMaps = require("./source-maps");

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

function findEmptyLines(source, breakpointPositions) {
  if (!breakpointPositions || source.isWasm) {
    return [];
  }

  const sourceText = source.text || "";
  const lineCount = sourceText.split("\n").length;
  const sourceLines = (0, _lodash.range)(1, lineCount + 1);

  const breakpointLines = breakpointPositions.map(point => (0, _sourceMaps.getSelectedLocation)(point, source).line)
  // NOTE: at the moment it is possible the location is an unmapped generated
  // line which could be greater than the line count.
  .filter(line => line <= lineCount);

  return (0, _lodash.xor)(sourceLines, breakpointLines);
}