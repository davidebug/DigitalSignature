"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ConditionalPanel = undefined;

var _react = require("devtools/client/shared/vendor/react");

var _react2 = _interopRequireDefault(_react);

var _reactDom = require("devtools/client/shared/vendor/react-dom");

var _reactDom2 = _interopRequireDefault(_reactDom);

var _connect = require("../../utils/connect");

var _classnames = require("devtools/client/debugger/new/dist/vendors").vendored["classnames"];

var _classnames2 = _interopRequireDefault(_classnames);

var _editor = require("../../utils/editor/index");

var _actions = require("../../actions/index");

var _actions2 = _interopRequireDefault(_actions);

var _selectors = require("../../selectors/index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class ConditionalPanel extends _react.PureComponent {

  constructor() {
    super();

    this.saveAndClose = () => {
      if (this.input) {
        this.setBreakpoint(this.input.value);
      }

      this.props.closeConditionalPanel();
    };

    this.onKey = e => {
      if (e.key === "Enter") {
        this.saveAndClose();
      } else if (e.key === "Escape") {
        this.props.closeConditionalPanel();
      }
    };

    this.repositionOnScroll = () => {
      if (this.panelNode && this.scrollParent) {
        const { scrollLeft } = this.scrollParent;
        this.panelNode.style.transform = `translateX(${scrollLeft}px)`;
      }
    };

    this.cbPanel = null;
  }

  keepFocusOnInput() {
    if (this.input) {
      this.input.focus();
    }
  }

  setBreakpoint(value) {
    const { location, log, breakpoint } = this.props;
    const options = breakpoint ? breakpoint.options : {};
    const type = log ? "logValue" : "condition";
    return this.props.setBreakpointOptions(location, {
      ...options,
      [type]: value
    });
  }

  clearConditionalPanel() {
    if (this.cbPanel) {
      this.cbPanel.clear();
      this.cbPanel = null;
    }
    if (this.scrollParent) {
      this.scrollParent.removeEventListener("scroll", this.repositionOnScroll);
    }
  }

  componentWillMount() {
    return this.renderToWidget(this.props);
  }

  componentWillUpdate() {
    return this.clearConditionalPanel();
  }

  componentDidUpdate(prevProps) {
    this.keepFocusOnInput();
  }

  componentWillUnmount() {
    // This is called if CodeMirror is re-initializing itself before the
    // user closes the conditional panel. Clear the widget, and re-render it
    // as soon as this component gets remounted
    return this.clearConditionalPanel();
  }

  renderToWidget(props) {
    if (this.cbPanel) {
      this.clearConditionalPanel();
    }

    const { location, editor } = props;

    const editorLine = (0, _editor.toEditorLine)(location.sourceId, location.line || 0);
    this.cbPanel = editor.codeMirror.addLineWidget(editorLine, this.renderConditionalPanel(props), {
      coverGutter: true,
      noHScroll: true
    });
    if (this.input) {
      let parent = this.input.parentNode;
      while (parent) {
        if (parent instanceof HTMLElement && parent.classList.contains("CodeMirror-scroll")) {
          this.scrollParent = parent;
          break;
        }
        parent = parent.parentNode;
      }

      if (this.scrollParent) {
        this.scrollParent.addEventListener("scroll", this.repositionOnScroll);
        this.repositionOnScroll();
      }
    }
  }

  renderConditionalPanel(props) {
    const { breakpoint, log, editor } = props;
    const options = breakpoint && breakpoint.options || {};
    const condition = log ? options.logValue : options.condition;

    const panel = document.createElement("div");
    _reactDom2.default.render(_react2.default.createElement(
      "div",
      {
        className: (0, _classnames2.default)("conditional-breakpoint-panel", {
          "log-point": log
        }),
        onClick: () => this.keepFocusOnInput(),
        onBlur: this.props.closeConditionalPanel,
        ref: node => this.panelNode = node
      },
      _react2.default.createElement(
        "div",
        { className: "prompt" },
        "\xBB"
      ),
      _react2.default.createElement("input", {
        defaultValue: condition,
        ref: input => {
          const codeMirror = editor.CodeMirror.fromTextArea(input, {
            mode: "javascript",
            theme: "mozilla",
            placeholder: L10N.getStr(log ? "editor.conditionalPanel.logPoint.placeholder" : "editor.conditionalPanel.placeholder")
          });
          const codeMirrorWrapper = codeMirror.getWrapperElement();

          codeMirrorWrapper.addEventListener("keydown", e => {
            codeMirror.save();
            this.onKey(e);
          });

          this.input = input;
          codeMirror.focus();
          codeMirror.setCursor(codeMirror.lineCount(), 0);
        }
      })
    ), panel);
    return panel;
  }

  render() {
    return null;
  }
}

exports.ConditionalPanel = ConditionalPanel; /* This Source Code Form is subject to the terms of the Mozilla Public
                                              * License, v. 2.0. If a copy of the MPL was not distributed with this
                                              * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

const mapStateToProps = state => {
  const location = (0, _selectors.getConditionalPanelLocation)(state);
  const log = (0, _selectors.getLogPointStatus)(state);
  return {
    breakpoint: (0, _selectors.getBreakpointForLocation)(state, location),
    location,
    log
  };
};

const {
  setBreakpointOptions,
  openConditionalPanel,
  closeConditionalPanel
} = _actions2.default;

const mapDispatchToProps = {
  setBreakpointOptions,
  openConditionalPanel,
  closeConditionalPanel
};

exports.default = (0, _connect.connect)(mapStateToProps, mapDispatchToProps)(ConditionalPanel);