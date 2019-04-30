"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.disableBreakpointsOnLineItem = exports.enableBreakpointsOnLineItem = exports.removeBreakpointsOnLineItem = exports.toggleDisabledBreakpointItem = exports.logPointItem = exports.editLogPointItem = exports.addLogPointItem = exports.conditionalBreakpointItem = exports.editConditionalBreakpointItem = exports.addConditionalBreakpointItem = exports.removeBreakpointItem = exports.addBreakpointItem = undefined;
exports.breakpointItems = breakpointItems;
exports.createBreakpointItems = createBreakpointItems;
exports.breakpointItemActions = breakpointItemActions;

var _actions = require("../../../actions/index");

var _actions2 = _interopRequireDefault(_actions);

var _redux = require("devtools/client/shared/vendor/redux");

var _prefs = require("../../../utils/prefs");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const addBreakpointItem = exports.addBreakpointItem = (location, breakpointActions) => ({
  id: "node-menu-add-breakpoint",
  label: L10N.getStr("editor.addBreakpoint"),
  accesskey: L10N.getStr("shortcuts.toggleBreakpoint.accesskey"),
  disabled: false,
  click: () => breakpointActions.addBreakpoint(location),
  accelerator: L10N.getStr("toggleBreakpoint.key")
}); /* This Source Code Form is subject to the terms of the Mozilla Public
     * License, v. 2.0. If a copy of the MPL was not distributed with this
     * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

const removeBreakpointItem = exports.removeBreakpointItem = (breakpoint, breakpointActions) => ({
  id: "node-menu-remove-breakpoint",
  label: L10N.getStr("editor.removeBreakpoint"),
  accesskey: L10N.getStr("shortcuts.toggleBreakpoint.accesskey"),
  disabled: false,
  click: () => breakpointActions.removeBreakpoint(breakpoint),
  accelerator: L10N.getStr("toggleBreakpoint.key")
});

const addConditionalBreakpointItem = exports.addConditionalBreakpointItem = (location, breakpointActions) => ({
  id: "node-menu-add-conditional-breakpoint",
  label: L10N.getStr("editor.addConditionBreakpoint"),
  accelerator: L10N.getStr("toggleCondPanel.breakpoint.key"),
  accesskey: L10N.getStr("editor.addConditionBreakpoint.accesskey"),
  disabled: false,
  click: () => breakpointActions.openConditionalPanel(location)
});

const editConditionalBreakpointItem = exports.editConditionalBreakpointItem = (location, breakpointActions) => ({
  id: "node-menu-edit-conditional-breakpoint",
  label: L10N.getStr("editor.editConditionBreakpoint"),
  accelerator: L10N.getStr("toggleCondPanel.breakpoint.key"),
  accesskey: L10N.getStr("editor.addConditionBreakpoint.accesskey"),
  disabled: false,
  click: () => breakpointActions.openConditionalPanel(location)
});

const conditionalBreakpointItem = exports.conditionalBreakpointItem = (breakpoint, breakpointActions) => {
  const {
    options: { condition },
    location
  } = breakpoint;
  return condition ? editConditionalBreakpointItem(location, breakpointActions) : addConditionalBreakpointItem(location, breakpointActions);
};

const addLogPointItem = exports.addLogPointItem = (location, breakpointActions) => ({
  id: "node-menu-add-log-point",
  label: L10N.getStr("editor.addLogPoint"),
  accesskey: L10N.getStr("editor.addLogPoint.accesskey"),
  disabled: false,
  click: () => breakpointActions.openConditionalPanel(location, true),
  accelerator: L10N.getStr("toggleCondPanel.logPoint.key")
});

const editLogPointItem = exports.editLogPointItem = (location, breakpointActions) => ({
  id: "node-menu-edit-log-point",
  label: L10N.getStr("editor.editLogPoint"),
  accesskey: L10N.getStr("editor.addLogPoint.accesskey"),
  disabled: false,
  click: () => breakpointActions.openConditionalPanel(location, true),
  accelerator: L10N.getStr("toggleCondPanel.logPoint.key")
});

const logPointItem = exports.logPointItem = (breakpoint, breakpointActions) => {
  const {
    options: { logValue },
    location
  } = breakpoint;
  return logValue ? editLogPointItem(location, breakpointActions) : addLogPointItem(location, breakpointActions);
};

const toggleDisabledBreakpointItem = exports.toggleDisabledBreakpointItem = (breakpoint, breakpointActions) => {
  return {
    accesskey: L10N.getStr("editor.disableBreakpoint.accesskey"),
    disabled: false,
    click: () => breakpointActions.toggleDisabledBreakpoint(breakpoint),
    ...(breakpoint.disabled ? {
      id: "node-menu-enable-breakpoint",
      label: L10N.getStr("editor.enableBreakpoint")
    } : {
      id: "node-menu-disable-breakpoint",
      label: L10N.getStr("editor.disableBreakpoint")
    })
  };
};

function breakpointItems(breakpoint, breakpointActions) {
  const items = [removeBreakpointItem(breakpoint, breakpointActions), toggleDisabledBreakpointItem(breakpoint, breakpointActions)];

  if (_prefs.features.columnBreakpoints) {
    items.push({ type: "separator" }, removeBreakpointsOnLineItem(breakpoint.location, breakpointActions), breakpoint.disabled ? enableBreakpointsOnLineItem(breakpoint.location, breakpointActions) : disableBreakpointsOnLineItem(breakpoint.location, breakpointActions), { type: "separator" });
  }

  items.push(conditionalBreakpointItem(breakpoint, breakpointActions));

  if (_prefs.features.logPoints) {
    items.push(logPointItem(breakpoint, breakpointActions));
  }

  return items;
}

function createBreakpointItems(location, breakpointActions) {
  const items = [addBreakpointItem(location, breakpointActions), addConditionalBreakpointItem(location, breakpointActions)];

  if (_prefs.features.logPoints) {
    items.push(addLogPointItem(location, breakpointActions));
  }
  return items;
}

// ToDo: Only enable if there are more than one breakpoints on a line?
const removeBreakpointsOnLineItem = exports.removeBreakpointsOnLineItem = (location, breakpointActions) => ({
  id: "node-menu-remove-breakpoints-on-line",
  label: L10N.getStr("breakpointMenuItem.removeAllAtLine.label"),
  accesskey: L10N.getStr("breakpointMenuItem.removeAllAtLine.accesskey"),
  disabled: false,
  click: () => breakpointActions.removeBreakpointsAtLine(location.sourceId, location.line)
});

const enableBreakpointsOnLineItem = exports.enableBreakpointsOnLineItem = (location, breakpointActions) => ({
  id: "node-menu-remove-breakpoints-on-line",
  label: L10N.getStr("breakpointMenuItem.enableAllAtLine.label"),
  accesskey: L10N.getStr("breakpointMenuItem.enableAllAtLine.accesskey"),
  disabled: false,
  click: () => breakpointActions.enableBreakpointsAtLine(location.sourceId, location.line)
});

const disableBreakpointsOnLineItem = exports.disableBreakpointsOnLineItem = (location, breakpointActions) => ({
  id: "node-menu-remove-breakpoints-on-line",
  label: L10N.getStr("breakpointMenuItem.disableAllAtLine.label"),
  accesskey: L10N.getStr("breakpointMenuItem.disableAllAtLine.accesskey"),
  disabled: false,
  click: () => breakpointActions.disableBreakpointsAtLine(location.sourceId, location.line)
});

function breakpointItemActions(dispatch) {
  return (0, _redux.bindActionCreators)({
    addBreakpoint: _actions2.default.addBreakpoint,
    removeBreakpoint: _actions2.default.removeBreakpoint,
    removeBreakpointsAtLine: _actions2.default.removeBreakpointsAtLine,
    enableBreakpointsAtLine: _actions2.default.enableBreakpointsAtLine,
    disableBreakpointsAtLine: _actions2.default.disableBreakpointsAtLine,
    disableBreakpoint: _actions2.default.disableBreakpoint,
    toggleDisabledBreakpoint: _actions2.default.toggleDisabledBreakpoint,
    openConditionalPanel: _actions2.default.openConditionalPanel
  }, dispatch);
}