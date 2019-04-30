"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("devtools/client/shared/vendor/react");

var _react2 = _interopRequireDefault(_react);

var _reactDom = require("devtools/client/shared/vendor/react-dom");

var _reactDom2 = _interopRequireDefault(_reactDom);

var _classnames = require("devtools/client/debugger/new/dist/vendors").vendored["classnames"];

var _classnames2 = _interopRequireDefault(_classnames);

var _editor = require("../../utils/editor/index");

var _Svg = require("devtools/client/debugger/new/dist/vendors").vendored["Svg"];

var _Svg2 = _interopRequireDefault(_Svg);

var _devtoolsContextmenu = require("devtools/client/debugger/new/dist/vendors").vendored["devtools-contextmenu"];

var _breakpoints = require("./menus/breakpoints");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// eslint-disable-next-line max-len
const breakpointImg = document.createElement("button"); /* This Source Code Form is subject to the terms of the Mozilla Public
                                                         * License, v. 2.0. If a copy of the MPL was not distributed with this
                                                         * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

_reactDom2.default.render(_react2.default.createElement(_Svg2.default, { name: "column-marker" }), breakpointImg);

function makeBookmark({ breakpoint }, { onClick, onContextMenu }) {
  const bp = breakpointImg.cloneNode(true);

  const isActive = breakpoint && !breakpoint.disabled;
  const isDisabled = breakpoint && breakpoint.disabled;
  const condition = breakpoint && breakpoint.options.condition;
  const logValue = breakpoint && breakpoint.options.logValue;

  bp.className = (0, _classnames2.default)("column-breakpoint", {
    "has-condition": condition,
    "has-log": logValue,
    active: isActive,
    disabled: isDisabled
  });

  if (condition) {
    bp.setAttribute("title", condition);
  }
  bp.onclick = onClick;

  // NOTE: flow does not know about oncontextmenu
  bp.oncontextmenu = onContextMenu;

  return bp;
}

class ColumnBreakpoint extends _react.PureComponent {
  constructor(...args) {
    var _temp;

    return _temp = super(...args), this.addColumnBreakpoint = nextProps => {
      const { columnBreakpoint, source } = nextProps || this.props;

      const sourceId = source.id;
      const doc = (0, _editor.getDocument)(sourceId);
      if (!doc) {
        return;
      }

      const { line, column } = columnBreakpoint.location;
      const widget = makeBookmark(columnBreakpoint, {
        onClick: this.onClick,
        onContextMenu: this.onContextMenu
      });

      this.bookmark = doc.setBookmark({ line: line - 1, ch: column }, { widget });
    }, this.clearColumnBreakpoint = () => {
      if (this.bookmark) {
        this.bookmark.clear();
        this.bookmark = null;
      }
    }, this.onClick = event => {
      event.stopPropagation();
      event.preventDefault();
      const { columnBreakpoint, breakpointActions } = this.props;
      if (columnBreakpoint.breakpoint) {
        breakpointActions.removeBreakpoint(columnBreakpoint.breakpoint);
      } else {
        breakpointActions.addBreakpoint(columnBreakpoint.location);
      }
    }, this.onContextMenu = event => {
      event.stopPropagation();
      event.preventDefault();
      const {
        columnBreakpoint: { breakpoint, location },
        breakpointActions
      } = this.props;

      const items = breakpoint ? (0, _breakpoints.breakpointItems)(breakpoint, breakpointActions) : (0, _breakpoints.createBreakpointItems)(location, breakpointActions);

      (0, _devtoolsContextmenu.showMenu)(event, items);
    }, _temp;
  }

  componentDidMount() {
    this.addColumnBreakpoint();
  }

  componentWillUnmount() {
    this.clearColumnBreakpoint();
  }

  componentDidUpdate() {
    this.clearColumnBreakpoint();
    this.addColumnBreakpoint();
  }

  render() {
    return null;
  }
}
exports.default = ColumnBreakpoint;