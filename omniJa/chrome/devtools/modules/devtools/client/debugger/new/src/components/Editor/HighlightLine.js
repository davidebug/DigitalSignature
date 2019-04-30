"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HighlightLine = undefined;

var _react = require("devtools/client/shared/vendor/react");

var _editor = require("../../utils/editor/index");

var _sourceDocuments = require("../../utils/editor/source-documents");

var _source = require("../../utils/source");

var _connect = require("../../utils/connect");

var _selectors = require("../../selectors/index");

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

function isDebugLine(selectedFrame, selectedLocation) {
  if (!selectedFrame) {
    return;
  }

  return selectedFrame.location.sourceId == selectedLocation.sourceId && selectedFrame.location.line == selectedLocation.line;
}

function isDocumentReady(selectedSource, selectedLocation) {
  return selectedLocation && (0, _source.isLoaded)(selectedSource) && (0, _sourceDocuments.hasDocument)(selectedLocation.sourceId);
}

class HighlightLine extends _react.Component {
  constructor(...args) {
    var _temp;

    return _temp = super(...args), this.isStepping = false, this.previousEditorLine = null, _temp;
  }

  shouldComponentUpdate(nextProps) {
    const { selectedLocation, selectedSource } = nextProps;
    return this.shouldSetHighlightLine(selectedLocation, selectedSource);
  }

  componentDidUpdate(prevProps) {
    this.completeHighlightLine(prevProps);
  }

  componentDidMount() {
    this.completeHighlightLine(null);
  }

  shouldSetHighlightLine(selectedLocation, selectedSource) {
    const { sourceId, line } = selectedLocation;
    const editorLine = (0, _editor.toEditorLine)(sourceId, line);

    if (!isDocumentReady(selectedSource, selectedLocation)) {
      return false;
    }

    if (this.isStepping && editorLine === this.previousEditorLine) {
      return false;
    }

    return true;
  }

  completeHighlightLine(prevProps) {
    const {
      pauseCommand,
      selectedLocation,
      selectedFrame,
      selectedSource
    } = this.props;
    if (pauseCommand) {
      this.isStepping = true;
    }

    (0, _editor.startOperation)();
    if (prevProps) {
      this.clearHighlightLine(prevProps.selectedLocation, prevProps.selectedSource);
    }
    this.setHighlightLine(selectedLocation, selectedFrame, selectedSource);
    (0, _editor.endOperation)();
  }

  setHighlightLine(selectedLocation, selectedFrame, selectedSource) {
    const { sourceId, line } = selectedLocation;
    if (!this.shouldSetHighlightLine(selectedLocation, selectedSource)) {
      return;
    }

    this.isStepping = false;
    const editorLine = (0, _editor.toEditorLine)(sourceId, line);
    this.previousEditorLine = editorLine;

    if (!line || isDebugLine(selectedFrame, selectedLocation)) {
      return;
    }

    const doc = (0, _sourceDocuments.getDocument)(sourceId);
    doc.addLineClass(editorLine, "line", "highlight-line");
    this.resetHighlightLine(doc, editorLine);
  }

  resetHighlightLine(doc, editorLine) {
    const editorWrapper = document.querySelector(".editor-wrapper");

    if (editorWrapper === null) {
      return;
    }

    const style = getComputedStyle(editorWrapper);
    const durationString = style.getPropertyValue("--highlight-line-duration");

    let duration = durationString.match(/\d+/);
    duration = duration.length ? Number(duration[0]) : 0;

    setTimeout(() => doc && doc.removeLineClass(editorLine, "line", "highlight-line"), duration);
  }

  clearHighlightLine(selectedLocation, selectedSource) {
    if (!isDocumentReady(selectedSource, selectedLocation)) {
      return;
    }

    const { line, sourceId } = selectedLocation;
    const editorLine = (0, _editor.toEditorLine)(sourceId, line);
    const doc = (0, _sourceDocuments.getDocument)(sourceId);
    doc.removeLineClass(editorLine, "line", "highlight-line");
  }

  render() {
    return null;
  }
}

exports.HighlightLine = HighlightLine;
exports.default = (0, _connect.connect)(state => ({
  pauseCommand: (0, _selectors.getPauseCommand)(state, (0, _selectors.getCurrentThread)(state)),
  selectedFrame: (0, _selectors.getVisibleSelectedFrame)(state),
  selectedLocation: (0, _selectors.getSelectedLocation)(state),
  selectedSource: (0, _selectors.getSelectedSource)(state)
}))(HighlightLine);