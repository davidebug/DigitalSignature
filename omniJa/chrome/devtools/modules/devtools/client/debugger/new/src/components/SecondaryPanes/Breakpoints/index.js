"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("devtools/client/shared/vendor/react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("devtools/client/debugger/new/dist/vendors").vendored["classnames"];

var _classnames2 = _interopRequireDefault(_classnames);

var _connect = require("../../../utils/connect");

var _ExceptionOption = require("./ExceptionOption");

var _ExceptionOption2 = _interopRequireDefault(_ExceptionOption);

var _Breakpoint = require("./Breakpoint");

var _Breakpoint2 = _interopRequireDefault(_Breakpoint);

var _BreakpointHeading = require("./BreakpointHeading");

var _BreakpointHeading2 = _interopRequireDefault(_BreakpointHeading);

var _actions = require("../../../actions/index");

var _actions2 = _interopRequireDefault(_actions);

var _source = require("../../../utils/source");

var _sourceMaps = require("../../../utils/source-maps");

var _breakpoint = require("../../../utils/breakpoint/index");

var _selectors = require("../../../selectors/index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Breakpoints extends _react.Component {
  renderExceptionsOptions() {
    const {
      breakpointSources,
      shouldPauseOnExceptions,
      shouldPauseOnCaughtExceptions,
      pauseOnExceptions
    } = this.props;

    const isEmpty = breakpointSources.length == 0;

    return _react2.default.createElement(
      "div",
      {
        className: (0, _classnames2.default)("breakpoints-exceptions-options", {
          empty: isEmpty
        })
      },
      _react2.default.createElement(_ExceptionOption2.default, {
        className: "breakpoints-exceptions",
        label: L10N.getStr("pauseOnExceptionsItem2"),
        isChecked: shouldPauseOnExceptions,
        onChange: () => pauseOnExceptions(!shouldPauseOnExceptions, false)
      }),
      shouldPauseOnExceptions && _react2.default.createElement(_ExceptionOption2.default, {
        className: "breakpoints-exceptions-caught",
        label: L10N.getStr("pauseOnCaughtExceptionsItem"),
        isChecked: shouldPauseOnCaughtExceptions,
        onChange: () => pauseOnExceptions(true, !shouldPauseOnCaughtExceptions)
      })
    );
  }

  renderBreakpoints() {
    const { breakpointSources, selectedSource } = this.props;
    const sources = [...breakpointSources.map(({ source, breakpoints }) => source)];

    return [...breakpointSources.map(({ source, breakpoints, i }) => {
      const path = (0, _source.getDisplayPath)(source, sources);
      const sortedBreakpoints = (0, _breakpoint.sortSelectedBreakpoints)(breakpoints, selectedSource);

      return [_react2.default.createElement(_BreakpointHeading2.default, {
        source: source,
        sources: sources,
        path: path,
        key: source.url
      }), ...sortedBreakpoints.map(breakpoint => _react2.default.createElement(_Breakpoint2.default, {
        breakpoint: breakpoint,
        source: source,
        selectedSource: selectedSource,
        key: (0, _breakpoint.makeBreakpointId)((0, _sourceMaps.getSelectedLocation)(breakpoint, selectedSource))
      }))];
    })];
  }

  render() {
    return _react2.default.createElement(
      "div",
      { className: "pane breakpoints-list" },
      this.renderExceptionsOptions(),
      this.renderBreakpoints()
    );
  }
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

const mapStateToProps = state => ({
  breakpointSources: (0, _selectors.getBreakpointSources)(state),
  selectedSource: (0, _selectors.getSelectedSource)(state)
});

exports.default = (0, _connect.connect)(mapStateToProps, {
  pauseOnExceptions: _actions2.default.pauseOnExceptions
})(Breakpoints);