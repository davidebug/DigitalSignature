"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DebugLine = undefined;

var _react = require("devtools/client/shared/vendor/react");

var _editor = require("../../utils/editor/index");

var _source = require("../../utils/source");

var _pause = require("../../utils/pause/index");

var _indentation = require("../../utils/indentation");

var _connect = require("../../utils/connect");

var _selectors = require("../../selectors/index");

function isDocumentReady(source, frame) {
  return frame && (0, _source.isLoaded)(source) && (0, _editor.hasDocument)(frame.location.sourceId);
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

class DebugLine extends _react.Component {

  componentDidUpdate(prevProps) {
    const { why, frame, source } = this.props;

    (0, _editor.startOperation)();
    this.clearDebugLine(prevProps.why, prevProps.frame, prevProps.source);
    this.setDebugLine(why, frame, source);
    (0, _editor.endOperation)();
  }

  componentDidMount() {
    const { why, frame, source } = this.props;
    this.setDebugLine(why, frame, source);
  }

  componentWillUnmount() {
    const { why, frame, source } = this.props;
    this.clearDebugLine(why, frame, source);
  }

  setDebugLine(why, frame, source) {
    if (!isDocumentReady(source, frame)) {
      return;
    }
    const sourceId = frame.location.sourceId;
    const doc = (0, _editor.getDocument)(sourceId);

    let { line, column } = (0, _editor.toEditorPosition)(frame.location);
    const { markTextClass, lineClass } = this.getTextClasses(why);
    doc.addLineClass(line, "line", lineClass);

    const lineText = doc.getLine(line);
    column = Math.max(column, (0, _indentation.getIndentation)(lineText));

    this.debugExpression = doc.markText({ ch: column, line }, { ch: null, line }, { className: markTextClass });
  }

  clearDebugLine(why, frame, source) {
    if (!isDocumentReady(source, frame)) {
      return;
    }

    if (this.debugExpression) {
      this.debugExpression.clear();
    }

    const sourceId = frame.location.sourceId;
    const { line } = (0, _editor.toEditorPosition)(frame.location);
    const doc = (0, _editor.getDocument)(sourceId);
    const { lineClass } = this.getTextClasses(why);
    doc.removeLineClass(line, "line", lineClass);
  }

  getTextClasses(why) {
    if ((0, _pause.isException)(why)) {
      return {
        markTextClass: "debug-expression-error",
        lineClass: "new-debug-line-error"
      };
    }

    return { markTextClass: "debug-expression", lineClass: "new-debug-line" };
  }

  render() {
    return null;
  }
}

exports.DebugLine = DebugLine;
const mapStateToProps = state => {
  const frame = (0, _selectors.getVisibleSelectedFrame)(state);
  return {
    frame,
    source: frame && (0, _selectors.getSourceFromId)(state, frame.location.sourceId),
    why: (0, _selectors.getPauseReason)(state, (0, _selectors.getCurrentThread)(state))
  };
};

exports.default = (0, _connect.connect)(mapStateToProps)(DebugLine);