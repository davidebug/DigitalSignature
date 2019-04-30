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

var _Svg = require("devtools/client/debugger/new/dist/vendors").vendored["Svg"];

var _Svg2 = _interopRequireDefault(_Svg);

var _editor = require("../../utils/editor/index");

var _sourceMaps = require("../../utils/source-maps");

var _prefs = require("../../utils/prefs");

var _devtoolsContextmenu = require("devtools/client/debugger/new/dist/vendors").vendored["devtools-contextmenu"];

var _breakpoints = require("./menus/breakpoints");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const breakpointSvg = document.createElement("div"); /* This Source Code Form is subject to the terms of the Mozilla Public
                                                      * License, v. 2.0. If a copy of the MPL was not distributed with this
                                                      * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

_reactDom2.default.render(_react2.default.createElement(_Svg2.default, { name: "breakpoint" }), breakpointSvg);

class Breakpoint extends _react.PureComponent {
  constructor(...args) {
    var _temp;

    return _temp = super(...args), this.onClick = event => {
      const { breakpointActions, editorActions, breakpoint } = this.props;

      // ignore right clicks
      if (event.ctrlKey && event.button === 0 || event.button === 2) {
        return;
      }

      event.stopPropagation();
      event.preventDefault();

      if (event.metaKey) {
        return editorActions.continueToHere(this.selectedLocation.line);
      }

      if (event.shiftKey) {
        return breakpointActions.toggleDisabledBreakpoint(breakpoint);
      }

      return breakpointActions.removeBreakpointsAtLine(this.selectedLocation.sourceId, this.selectedLocation.line);
    }, this.onContextMenu = event => {
      const { breakpoint, breakpointActions } = this.props;
      event.stopPropagation();
      event.preventDefault();
      (0, _devtoolsContextmenu.showMenu)(event, (0, _breakpoints.breakpointItems)(breakpoint, breakpointActions));
    }, this.addBreakpoint = () => {
      const { breakpoint, editor, selectedSource } = this.props;

      // Hidden Breakpoints are never rendered on the client
      if (breakpoint.options.hidden) {
        return;
      }

      // NOTE: we need to wait for the breakpoint to be loaded
      // to get the generated location
      if (!selectedSource || breakpoint.loading) {
        return;
      }

      const sourceId = selectedSource.id;
      const line = (0, _editor.toEditorLine)(sourceId, this.selectedLocation.line);
      const doc = (0, _editor.getDocument)(sourceId);

      doc.setGutterMarker(line, "breakpoints", this.makeMarker());

      editor.codeMirror.addLineClass(line, "line", "new-breakpoint");
      editor.codeMirror.removeLineClass(line, "line", "has-condition");
      editor.codeMirror.removeLineClass(line, "line", "has-log");

      if (breakpoint.options.logValue) {
        editor.codeMirror.addLineClass(line, "line", "has-log");
      } else if (breakpoint.options.condition) {
        editor.codeMirror.addLineClass(line, "line", "has-condition");
      }
    }, _temp;
  }

  componentDidMount() {
    this.addBreakpoint();
  }

  componentDidUpdate() {
    this.addBreakpoint();
  }

  componentWillUnmount() {
    const { breakpoint, selectedSource } = this.props;
    if (!selectedSource || breakpoint.loading) {
      return;
    }

    const sourceId = selectedSource.id;
    const doc = (0, _editor.getDocument)(sourceId);

    if (!doc) {
      return;
    }

    const line = (0, _editor.toEditorLine)(sourceId, this.selectedLocation.line);

    doc.setGutterMarker(line, "breakpoints", null);
    doc.removeLineClass(line, "line", "new-breakpoint");
    doc.removeLineClass(line, "line", "has-condition");
    doc.removeLineClass(line, "line", "has-log");
  }

  get selectedLocation() {
    const { breakpoint, selectedSource } = this.props;
    return (0, _sourceMaps.getSelectedLocation)(breakpoint, selectedSource);
  }

  makeMarker() {
    const { breakpoint } = this.props;
    const bp = breakpointSvg.cloneNode(true);

    bp.className = (0, _classnames2.default)("editor new-breakpoint", {
      "breakpoint-disabled": breakpoint.disabled,
      "folding-enabled": _prefs.features.codeFolding
    });

    bp.onmousedown = this.onClick;
    // NOTE: flow does not know about oncontextmenu
    bp.oncontextmenu = this.onContextMenu;

    return bp;
  }

  render() {
    return null;
  }
}

exports.default = Breakpoint;