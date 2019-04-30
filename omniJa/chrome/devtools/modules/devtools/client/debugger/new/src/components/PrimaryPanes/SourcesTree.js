"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("devtools/client/shared/vendor/react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("devtools/client/debugger/new/dist/vendors").vendored["classnames"];

var _classnames2 = _interopRequireDefault(_classnames);

var _connect = require("../../utils/connect");

var _selectors = require("../../selectors/index");

var _sources = require("../../reducers/sources");

var _actions = require("../../actions/index");

var _actions2 = _interopRequireDefault(_actions);

var _AccessibleImage = require("../shared/AccessibleImage");

var _AccessibleImage2 = _interopRequireDefault(_AccessibleImage);

var _SourcesTreeItem = require("./SourcesTreeItem");

var _SourcesTreeItem2 = _interopRequireDefault(_SourcesTreeItem);

var _ManagedTree = require("../shared/ManagedTree");

var _ManagedTree2 = _interopRequireDefault(_ManagedTree);

var _sourcesTree = require("../../utils/sources-tree/index");

var _source = require("../../utils/source");

var _workers = require("../../utils/workers");

var _prefs = require("../../utils/prefs");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Utils


// Actions


// Selectors
class SourcesTree extends _react.Component {

  constructor(props) {
    super(props);

    _initialiseProps.call(this);

    const { debuggeeUrl, sources, projectRoot } = this.props;

    this.state = (0, _sourcesTree.createTree)({
      projectRoot,
      debuggeeUrl,
      sources
    });
  }

  componentWillReceiveProps(nextProps) {
    const {
      projectRoot,
      debuggeeUrl,
      sources,
      shownSource,
      selectedSource
    } = this.props;
    const { uncollapsedTree, sourceTree } = this.state;

    if (projectRoot != nextProps.projectRoot || debuggeeUrl != nextProps.debuggeeUrl || nextProps.sourceCount === 0) {
      // early recreate tree because of changes
      // to project root, debugee url or lack of sources
      return this.setState((0, _sourcesTree.createTree)({
        sources: nextProps.sources,
        debuggeeUrl: nextProps.debuggeeUrl,
        projectRoot: nextProps.projectRoot
      }));
    }

    if (nextProps.shownSource && nextProps.shownSource != shownSource) {
      const listItems = (0, _sourcesTree.getDirectories)(nextProps.shownSource, sourceTree);
      return this.setState({ listItems });
    }

    if (nextProps.selectedSource && nextProps.selectedSource != selectedSource) {
      const highlightItems = (0, _sourcesTree.getDirectories)(nextProps.selectedSource, sourceTree);
      this.setState({ highlightItems });
    }

    // NOTE: do not run this every time a source is clicked,
    // only when a new source is added
    if (nextProps.sources != this.props.sources) {
      this.setState((0, _sourcesTree.updateTree)({
        newSources: nextProps.sources,
        prevSources: sources,
        debuggeeUrl,
        projectRoot,
        uncollapsedTree,
        sourceTree
      }));
    }
  }

  // NOTE: we get the source from sources because item.contents is cached
  getSource(item) {
    const source = (0, _sourcesTree.getSourceFromNode)(item);
    if (source) {
      return this.props.sources[source.id];
    }

    return null;
  }

  isEmpty() {
    const { sourceTree } = this.state;
    return sourceTree.contents.length === 0;
  }

  renderEmptyElement(message) {
    return _react2.default.createElement(
      "div",
      { key: "empty", className: "no-sources-message" },
      message
    );
  }

  renderTree() {
    const { expanded, focused } = this.props;
    const { highlightItems, listItems, parentMap } = this.state;

    const treeProps = {
      autoExpandAll: false,
      autoExpandDepth: expanded ? 0 : 1,
      expanded,
      focused,
      getChildren: item => (0, _sourcesTree.nodeHasChildren)(item) ? item.contents : [],
      getParent: item => parentMap.get(item),
      getPath: this.getPath,
      getRoots: this.getRoots,
      highlightItems,
      itemHeight: 21,
      key: this.isEmpty() ? "empty" : "full",
      listItems,
      onCollapse: this.onCollapse,
      onExpand: this.onExpand,
      onFocus: this.onFocus,
      onActivate: this.onActivate,
      renderItem: this.renderItem,
      preventBlur: true
    };

    return _react2.default.createElement(_ManagedTree2.default, treeProps);
  }

  renderPane(...children) {
    const { projectRoot, thread } = this.props;

    return _react2.default.createElement(
      "div",
      {
        key: "pane",
        className: (0, _classnames2.default)("sources-pane", {
          "sources-list-custom-root": projectRoot,
          thread
        })
      },
      children
    );
  }

  renderThreadHeader() {
    const { worker, workerCount } = this.props;

    if (!_prefs.features.windowlessWorkers || workerCount == 0) {
      return null;
    }

    if (worker) {
      return _react2.default.createElement(
        "div",
        { className: "node thread-header" },
        _react2.default.createElement(_AccessibleImage2.default, { className: "worker" }),
        _react2.default.createElement(
          "span",
          { className: "label" },
          (0, _workers.getDisplayName)(worker)
        )
      );
    }

    return _react2.default.createElement(
      "div",
      { className: "node thread-header" },
      _react2.default.createElement(_AccessibleImage2.default, { className: "file" }),
      _react2.default.createElement(
        "span",
        { className: "label" },
        L10N.getStr("mainThread")
      )
    );
  }

  render() {
    const { worker } = this.props;

    if (!_prefs.features.windowlessWorkers && worker) {
      return null;
    }

    return this.renderPane(this.renderThreadHeader(), this.isEmpty() ? this.renderEmptyElement(L10N.getStr("noSourcesText")) : _react2.default.createElement(
      "div",
      { key: "tree", className: "sources-list" },
      this.renderTree()
    ));
  }
}

// Components
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// Dependencies

var _initialiseProps = function () {
  this.selectItem = item => {
    if (item.type == "source" && !Array.isArray(item.contents)) {
      this.props.selectSource(item.contents.id);
    }
  };

  this.onFocus = item => {
    this.props.focusItem({ thread: this.props.thread, item });
  };

  this.onActivate = item => {
    this.selectItem(item);
  };

  this.getPath = item => {
    const path = `${item.path}/${item.name}`;
    const source = this.getSource(item);

    if (!source || (0, _sourcesTree.isDirectory)(item)) {
      return path;
    }

    const blackBoxedPart = source.isBlackBoxed ? ":blackboxed" : "";
    return `${path}/${source.id}/${blackBoxedPart}`;
  };

  this.onExpand = (item, expandedState) => {
    this.props.setExpandedState(this.props.thread, expandedState);
  };

  this.onCollapse = (item, expandedState) => {
    this.props.setExpandedState(this.props.thread, expandedState);
  };

  this.getRoots = () => {
    const { projectRoot } = this.props;
    const { sourceTree } = this.state;

    const sourceContents = sourceTree.contents[0];
    const rootLabel = projectRoot.split("/").pop();

    // The "sourceTree.contents[0]" check ensures that there are contents
    // A custom root with no existing sources will be ignored
    if (projectRoot && sourceContents) {
      if (sourceContents && sourceContents.name !== rootLabel) {
        return sourceContents.contents[0].contents;
      }
      return sourceContents.contents;
    }

    return sourceTree.contents;
  };

  this.renderItem = (item, depth, focused, _, expanded, { setExpanded }) => {
    const { debuggeeUrl, projectRoot } = this.props;

    return _react2.default.createElement(_SourcesTreeItem2.default, {
      item: item,
      depth: depth,
      focused: focused,
      expanded: expanded,
      focusItem: this.onFocus,
      selectItem: this.selectItem,
      source: this.getSource(item),
      debuggeeUrl: debuggeeUrl,
      projectRoot: projectRoot,
      setExpanded: setExpanded
    });
  };
};

function getSourceForTree(state, displayedSources, source, thread) {
  if (!source) {
    return null;
  }

  source = displayedSources[source.id];
  if (!source || !source.isPrettyPrinted) {
    return source;
  }

  return (0, _sources.getGeneratedSourceByURL)(state, (0, _source.getRawSourceURL)(source.url));
}

const mapStateToProps = (state, props) => {
  const selectedSource = (0, _selectors.getSelectedSource)(state);
  const shownSource = (0, _selectors.getShownSource)(state);
  const focused = (0, _selectors.getFocusedSourceItem)(state);
  const thread = props.thread;
  const displayedSources = (0, _selectors.getDisplayedSourcesForThread)(state, thread);

  return {
    shownSource: getSourceForTree(state, displayedSources, shownSource, thread),
    selectedSource: getSourceForTree(state, displayedSources, selectedSource, thread),
    debuggeeUrl: (0, _selectors.getDebuggeeUrl)(state),
    expanded: (0, _selectors.getExpandedState)(state, props.thread),
    focused: focused && focused.thread == props.thread ? focused.item : null,
    projectRoot: (0, _selectors.getProjectDirectoryRoot)(state),
    sources: displayedSources,
    sourceCount: Object.values(displayedSources).length,
    worker: (0, _selectors.getWorkerByThread)(state, thread),
    workerCount: (0, _selectors.getWorkerCount)(state)
  };
};

exports.default = (0, _connect.connect)(mapStateToProps, {
  selectSource: _actions2.default.selectSource,
  setExpandedState: _actions2.default.setExpandedState,
  focusItem: _actions2.default.focusItem
})(SourcesTree);