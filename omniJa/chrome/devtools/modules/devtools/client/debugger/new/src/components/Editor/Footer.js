"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("devtools/client/shared/vendor/react");

var _react2 = _interopRequireDefault(_react);

var _connect = require("../../utils/connect");

var _classnames = require("devtools/client/debugger/new/dist/vendors").vendored["classnames"];

var _classnames2 = _interopRequireDefault(_classnames);

var _actions = require("../../actions/index");

var _actions2 = _interopRequireDefault(_actions);

var _selectors = require("../../selectors/index");

var _source = require("../../utils/source");

var _sources = require("../../reducers/sources");

var _editor = require("../../utils/editor/index");

var _Button = require("../shared/Button/index");

var _AccessibleImage = require("../shared/AccessibleImage");

var _AccessibleImage2 = _interopRequireDefault(_AccessibleImage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

class SourceFooter extends _react.PureComponent {
  constructor() {
    super();

    this.onCursorChange = event => {
      const { line, ch } = event.doc.getCursor();
      this.setState({ cursorPosition: { line, column: ch } });
    };

    this.state = { cursorPosition: { line: 1, column: 1 } };
  }

  componentDidMount() {
    const { editor } = this.props;
    editor.codeMirror.on("cursorActivity", this.onCursorChange);
  }

  componentWillUnmount() {
    const { editor } = this.props;
    editor.codeMirror.off("cursorActivity", this.onCursorChange);
  }

  prettyPrintButton() {
    const { selectedSource, togglePrettyPrint } = this.props;

    if ((0, _source.isLoading)(selectedSource) && selectedSource.isPrettyPrinted) {
      return _react2.default.createElement(
        "div",
        { className: "loader", key: "pretty-loader" },
        _react2.default.createElement(_AccessibleImage2.default, { className: "loader" })
      );
    }

    if (!(0, _editor.shouldShowPrettyPrint)(selectedSource)) {
      return;
    }

    const tooltip = L10N.getStr("sourceTabs.prettyPrint");
    const sourceLoaded = selectedSource && (0, _source.isLoaded)(selectedSource);

    const type = "prettyPrint";
    return _react2.default.createElement(
      "button",
      {
        onClick: () => togglePrettyPrint(selectedSource.id),
        className: (0, _classnames2.default)("action", type, {
          active: sourceLoaded,
          pretty: (0, _source.isPretty)(selectedSource)
        }),
        key: type,
        title: tooltip,
        "aria-label": tooltip
      },
      _react2.default.createElement(_AccessibleImage2.default, { className: type })
    );
  }

  blackBoxButton() {
    const { selectedSource, toggleBlackBox } = this.props;
    const sourceLoaded = selectedSource && (0, _source.isLoaded)(selectedSource);

    if (!(0, _source.shouldBlackbox)(selectedSource)) {
      return;
    }

    const blackboxed = selectedSource.isBlackBoxed;

    const tooltip = L10N.getStr("sourceFooter.blackbox");
    const type = "black-box";

    return _react2.default.createElement(
      "button",
      {
        onClick: () => toggleBlackBox(selectedSource),
        className: (0, _classnames2.default)("action", type, {
          active: sourceLoaded,
          blackboxed: blackboxed
        }),
        key: type,
        title: tooltip,
        "aria-label": tooltip
      },
      _react2.default.createElement(_AccessibleImage2.default, { className: "blackBox" })
    );
  }

  renderToggleButton() {
    if (this.props.horizontal) {
      return;
    }

    return _react2.default.createElement(_Button.PaneToggleButton, {
      position: "end",
      key: "toggle",
      collapsed: this.props.endPanelCollapsed,
      horizontal: this.props.horizontal,
      handleClick: this.props.togglePaneCollapse
    });
  }

  renderCommands() {
    const commands = [this.prettyPrintButton(), this.blackBoxButton()].filter(Boolean);

    return commands.length ? _react2.default.createElement(
      "div",
      { className: "commands" },
      commands
    ) : null;
  }

  renderSourceSummary() {
    const { mappedSource, jumpToMappedLocation, selectedSource } = this.props;

    if (!mappedSource || !(0, _source.isOriginal)(selectedSource)) {
      return null;
    }

    const filename = (0, _source.getFilename)(mappedSource);
    const tooltip = L10N.getFormatStr("sourceFooter.mappedSourceTooltip", filename);
    const title = L10N.getFormatStr("sourceFooter.mappedSource", filename);
    const mappedSourceLocation = {
      sourceId: selectedSource.id,
      line: 1,
      column: 1
    };
    return _react2.default.createElement(
      "button",
      {
        className: "mapped-source",
        onClick: () => jumpToMappedLocation(mappedSourceLocation),
        title: tooltip
      },
      _react2.default.createElement(
        "span",
        null,
        title
      )
    );
  }

  renderCursorPosition() {
    const { cursorPosition } = this.state;

    const text = L10N.getFormatStr("sourceFooter.currentCursorPosition", cursorPosition.line + 1, cursorPosition.column + 1);
    const title = L10N.getFormatStr("sourceFooter.currentCursorPosition.tooltip", cursorPosition.line + 1, cursorPosition.column + 1);
    return _react2.default.createElement(
      "span",
      { className: "cursor-position", title: title },
      text
    );
  }

  render() {
    const { selectedSource, horizontal } = this.props;

    if (!(0, _editor.shouldShowFooter)(selectedSource, horizontal)) {
      return null;
    }

    return _react2.default.createElement(
      "div",
      { className: "source-footer" },
      this.renderCommands(),
      this.renderSourceSummary(),
      this.renderCursorPosition(),
      this.renderToggleButton()
    );
  }
}

const mapStateToProps = state => {
  const selectedSource = (0, _selectors.getSelectedSource)(state);

  return {
    selectedSource,
    mappedSource: (0, _sources.getGeneratedSource)(state, selectedSource),
    prettySource: (0, _selectors.getPrettySource)(state, selectedSource ? selectedSource.id : null),
    endPanelCollapsed: (0, _selectors.getPaneCollapse)(state, "end")
  };
};

exports.default = (0, _connect.connect)(mapStateToProps, {
  togglePrettyPrint: _actions2.default.togglePrettyPrint,
  toggleBlackBox: _actions2.default.toggleBlackBox,
  jumpToMappedLocation: _actions2.default.jumpToMappedLocation,
  togglePaneCollapse: _actions2.default.togglePaneCollapse
})(SourceFooter);