"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("devtools/client/shared/vendor/react");

var _react2 = _interopRequireDefault(_react);

var _connect = require("../../../utils/connect");

var _Popup = require("./Popup");

var _Popup2 = _interopRequireDefault(_Popup);

var _selectors = require("../../../selectors/index");

var _actions = require("../../../actions/index");

var _actions2 = _interopRequireDefault(_actions);

var _editor = require("../../../utils/editor/index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

function inPopup(e) {
  const { relatedTarget } = e;

  if (!relatedTarget) {
    return true;
  }

  const pop = relatedTarget.closest(".tooltip") || relatedTarget.closest(".popover");

  return pop;
}

function getElementFromPos(pos) {
  // We need to use element*s*AtPoint because the tooltip overlays
  // the token and thus an undesirable element may be returned
  const elementsAtPoint = [
  // $FlowIgnore
  ...document.elementsFromPoint(pos.x + pos.width / 2, pos.y + pos.height / 2)];

  return elementsAtPoint.find(el => el.className.startsWith("cm-"));
}

class Preview extends _react.PureComponent {
  constructor(props) {
    super(props);
    this.target = null;

    this.onTokenEnter = ({ target, tokenPos }) => {
      if (this.props.isPaused) {
        this.props.updatePreview(target, tokenPos, this.props.editor.codeMirror);
      }
    };

    this.onTokenLeave = e => {
      if (this.props.isPaused && !inPopup(e)) {
        this.props.clearPreview();
      }
    };

    this.onMouseUp = () => {
      if (this.props.isPaused) {
        this.setState({ selecting: false });
        return true;
      }
    };

    this.onMouseDown = () => {
      if (this.props.isPaused) {
        this.setState({ selecting: true });
        return true;
      }
    };

    this.onScroll = () => {
      if (this.props.isPaused) {
        this.props.clearPreview();
      }
    };

    this.onClose = e => {
      if (this.props.isPaused) {
        this.props.clearPreview();
      }
    };

    this.state = { selecting: false };
  }

  componentDidMount() {
    this.updateListeners();
  }

  componentWillUnmount() {
    const { codeMirror } = this.props.editor;
    const codeMirrorWrapper = codeMirror.getWrapperElement();

    codeMirror.off("scroll", this.onScroll);
    codeMirror.off("tokenenter", this.onTokenEnter);
    codeMirror.off("tokenleave", this.onTokenLeave);
    codeMirrorWrapper.removeEventListener("mouseup", this.onMouseUp);
    codeMirrorWrapper.removeEventListener("mousedown", this.onMouseDown);
  }

  componentDidUpdate(prevProps) {
    this.updateHighlight(prevProps);
  }

  updateListeners(prevProps) {
    const { codeMirror } = this.props.editor;
    const codeMirrorWrapper = codeMirror.getWrapperElement();
    codeMirror.on("scroll", this.onScroll);
    codeMirror.on("tokenenter", this.onTokenEnter);
    codeMirror.on("tokenleave", this.onTokenLeave);
    codeMirrorWrapper.addEventListener("mouseup", this.onMouseUp);
    codeMirrorWrapper.addEventListener("mousedown", this.onMouseDown);
  }

  updateHighlight(prevProps) {
    const { preview } = this.props;

    if (preview && !preview.updating) {
      const target = getElementFromPos(preview.cursorPos);
      target && target.classList.add("preview-selection");
    }

    if (prevProps.preview && !prevProps.preview.updating) {
      const target = getElementFromPos(prevProps.preview.cursorPos);
      target && target.classList.remove("preview-selection");
    }
  }

  render() {
    const { selectedSource, preview } = this.props;
    if (!this.props.editor || !selectedSource || this.state.selecting) {
      return null;
    }

    if (!preview || preview.updating) {
      return null;
    }

    const { result, expression, location, cursorPos } = preview;
    const value = result;
    if (typeof value == "undefined" || value.optimizedOut) {
      return null;
    }

    const editorRange = (0, _editor.toEditorRange)(selectedSource.id, location);

    return _react2.default.createElement(_Popup2.default, {
      value: value,
      editor: this.props.editor,
      editorRef: this.props.editorRef,
      range: editorRange,
      expression: expression,
      popoverPos: cursorPos,
      onClose: this.onClose
    });
  }
}

const mapStateToProps = state => ({
  preview: (0, _selectors.getPreview)(state),
  isPaused: (0, _selectors.getIsPaused)(state, (0, _selectors.getCurrentThread)(state)),
  selectedSource: (0, _selectors.getSelectedSource)(state)
});

exports.default = (0, _connect.connect)(mapStateToProps, {
  clearPreview: _actions2.default.clearPreview,
  setPopupObjectProperties: _actions2.default.setPopupObjectProperties,
  addExpression: _actions2.default.addExpression,
  updatePreview: _actions2.default.updatePreview
})(Preview);