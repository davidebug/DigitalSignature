"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.continueToHereItem = undefined;
exports.editorMenuItems = editorMenuItems;
exports.editorItemActions = editorItemActions;

var _redux = require("devtools/client/shared/vendor/redux");

var _devtoolsSourceMap = require("devtools/client/shared/source-map/index.js");

var _clipboard = require("../../../utils/clipboard");

var _source = require("../../../utils/source");

var _utils = require("../../../utils/utils");

var _actions = require("../../../actions/index");

var _actions2 = _interopRequireDefault(_actions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

function isMapped(selectedSource) {
  return (0, _devtoolsSourceMap.isOriginalId)(selectedSource.id) || !!selectedSource.sourceMapURL;
}

const continueToHereItem = exports.continueToHereItem = (location, isPaused, editorActions) => ({
  accesskey: L10N.getStr("editor.continueToHere.accesskey"),
  disabled: !isPaused,
  click: () => editorActions.continueToHere(location.line, location.column),
  id: "node-menu-continue-to-here",
  label: L10N.getStr("editor.continueToHere.label")
});

// menu items

const copyToClipboardItem = (selectedSource, editorActions) => {
  return {
    id: "node-menu-copy-to-clipboard",
    label: L10N.getStr("copyToClipboard.label"),
    accesskey: L10N.getStr("copyToClipboard.accesskey"),
    disabled: false,
    click: () => !selectedSource.isWasm && typeof selectedSource.text == "string" && (0, _clipboard.copyToTheClipboard)(selectedSource.text)
  };
};

const copySourceItem = (selectedSource, selectionText, editorActions) => {
  if (selectedSource.isWasm) {
    return;
  }

  return {
    id: "node-menu-copy-source",
    label: L10N.getStr("copySource.label"),
    accesskey: L10N.getStr("copySource.accesskey"),
    disabled: selectionText.length === 0,
    click: () => (0, _clipboard.copyToTheClipboard)(selectionText)
  };
};

const copySourceUri2Item = (selectedSource, editorActions) => ({
  id: "node-menu-copy-source-url",
  label: L10N.getStr("copySourceUri2"),
  accesskey: L10N.getStr("copySourceUri2.accesskey"),
  disabled: !selectedSource.url,
  click: () => (0, _clipboard.copyToTheClipboard)((0, _source.getRawSourceURL)(selectedSource.url))
});

const jumpToMappedLocationItem = (selectedSource, location, hasPrettySource, editorActions) => ({
  id: "node-menu-jump",
  label: L10N.getFormatStr("editor.jumpToMappedLocation1", (0, _devtoolsSourceMap.isOriginalId)(selectedSource.id) ? L10N.getStr("generated") : L10N.getStr("original")),
  accesskey: L10N.getStr("editor.jumpToMappedLocation1.accesskey"),
  disabled: !isMapped(selectedSource) && !(0, _source.isPretty)(selectedSource) || hasPrettySource,
  click: () => editorActions.jumpToMappedLocation(location)
});

const showSourceMenuItem = (selectedSource, editorActions) => ({
  id: "node-menu-show-source",
  label: L10N.getStr("sourceTabs.revealInTree"),
  accesskey: L10N.getStr("sourceTabs.revealInTree.accesskey"),
  disabled: !selectedSource.url,
  click: () => editorActions.showSource(selectedSource.id)
});

const blackBoxMenuItem = (selectedSource, editorActions) => ({
  id: "node-menu-blackbox",
  label: selectedSource.isBlackBoxed ? L10N.getStr("sourceFooter.unblackbox") : L10N.getStr("sourceFooter.blackbox"),
  accesskey: L10N.getStr("sourceFooter.blackbox.accesskey"),
  disabled: !(0, _source.shouldBlackbox)(selectedSource),
  click: () => editorActions.toggleBlackBox(selectedSource)
});

const watchExpressionItem = (selectedSource, selectionText, editorActions) => ({
  id: "node-menu-add-watch-expression",
  label: L10N.getStr("expressions.label"),
  accesskey: L10N.getStr("expressions.accesskey"),
  click: () => editorActions.addExpression(selectionText)
});

const evaluateInConsoleItem = (selectedSource, selectionText, editorActions) => ({
  id: "node-menu-evaluate-in-console",
  label: L10N.getStr("evaluateInConsole.label"),
  click: () => editorActions.evaluateInConsole(selectionText)
});

const downloadFileItem = (selectedSource, editorActions) => {
  return {
    id: "node-menu-download-file",
    label: L10N.getStr("downloadFile.label"),
    accesskey: L10N.getStr("downloadFile.accesskey"),
    click: () => (0, _utils.downloadFile)(selectedSource, (0, _source.getFilename)(selectedSource))
  };
};

function editorMenuItems({
  editorActions,
  selectedSource,
  location,
  selectionText,
  hasPrettySource,
  isTextSelected,
  isPaused
}) {
  const items = [];

  items.push(jumpToMappedLocationItem(selectedSource, location, hasPrettySource, editorActions), continueToHereItem(location, isPaused, editorActions), { type: "separator" }, copyToClipboardItem(selectedSource, editorActions), copySourceItem(selectedSource, selectionText, editorActions), copySourceUri2Item(selectedSource, editorActions), downloadFileItem(selectedSource, editorActions), { type: "separator" }, showSourceMenuItem(selectedSource, editorActions), blackBoxMenuItem(selectedSource, editorActions));

  if (isTextSelected) {
    items.push({ type: "separator" }, watchExpressionItem(selectedSource, selectionText, editorActions), evaluateInConsoleItem(selectedSource, selectionText, editorActions));
  }

  return items;
}

function editorItemActions(dispatch) {
  return (0, _redux.bindActionCreators)({
    addExpression: _actions2.default.addExpression,
    continueToHere: _actions2.default.continueToHere,
    evaluateInConsole: _actions2.default.evaluateInConsole,
    flashLineRange: _actions2.default.flashLineRange,
    jumpToMappedLocation: _actions2.default.jumpToMappedLocation,
    showSource: _actions2.default.showSource,
    toggleBlackBox: _actions2.default.toggleBlackBox
  }, dispatch);
}