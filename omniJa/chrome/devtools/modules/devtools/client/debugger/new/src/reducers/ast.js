"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initialASTState = initialASTState;
exports.getSymbols = getSymbols;
exports.hasSymbols = hasSymbols;
exports.isSymbolsLoading = isSymbolsLoading;
exports.getOutOfScopeLocations = getOutOfScopeLocations;
exports.getPreview = getPreview;
exports.getSourceMetaData = getSourceMetaData;
exports.hasSourceMetaData = hasSourceMetaData;
exports.getInScopeLines = getInScopeLines;
exports.isLineInScope = isLineInScope;
function initialASTState() {
  return {
    symbols: {},
    emptyLines: {},
    outOfScopeLocations: null,
    inScopeLines: null,
    preview: null,
    sourceMetaData: {}
  };
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

/**
 * Ast reducer
 * @module reducers/ast
 */

function update(state = initialASTState(), action) {
  switch (action.type) {
    case "SET_SYMBOLS":
      {
        const { sourceId } = action;
        if (action.status === "start") {
          return {
            ...state,
            symbols: { ...state.symbols, [sourceId]: { loading: true } }
          };
        }

        const value = action.value;
        return {
          ...state,
          symbols: { ...state.symbols, [sourceId]: value }
        };
      }

    case "OUT_OF_SCOPE_LOCATIONS":
      {
        return { ...state, outOfScopeLocations: action.locations };
      }

    case "IN_SCOPE_LINES":
      {
        return { ...state, inScopeLines: action.lines };
      }

    case "CLEAR_SELECTION":
      {
        return { ...state, preview: null };
      }

    case "SET_PREVIEW":
      {
        if (action.status == "start") {
          return { ...state, preview: { updating: true } };
        }

        if (!action.value) {
          return { ...state, preview: null };
        }

        // NOTE: if the preview does not exist, it has been cleared
        if (state.preview) {
          return { ...state, preview: { ...action.value, updating: false } };
        }

        return state;
      }

    case "RESUME":
      {
        return { ...state, outOfScopeLocations: null };
      }

    case "NAVIGATE":
      {
        return initialASTState();
      }

    case "SET_SOURCE_METADATA":
      {
        const { sourceId, sourceMetaData } = action;
        return {
          ...state,
          sourceMetaData: { ...state.sourceMetaData, [sourceId]: sourceMetaData }
        };
      }

    default:
      {
        return state;
      }
  }
}

// NOTE: we'd like to have the app state fully typed
// https://github.com/firefox-devtools/debugger/blob/master/src/reducers/sources.js#L179-L185
function getSymbols(state, source) {
  if (!source) {
    return null;
  }

  return state.ast.symbols[source.id] || null;
}

function hasSymbols(state, source) {
  const symbols = getSymbols(state, source);

  if (!symbols) {
    return false;
  }

  return !symbols.loading;
}

function isSymbolsLoading(state, source) {
  const symbols = getSymbols(state, source);
  if (!symbols) {
    return false;
  }

  return symbols.loading;
}

function getOutOfScopeLocations(state) {
  return state.ast.outOfScopeLocations;
}

function getPreview(state) {
  return state.ast.preview;
}

const emptySourceMetaData = {};
function getSourceMetaData(state, sourceId) {
  return state.ast.sourceMetaData[sourceId] || emptySourceMetaData;
}

function hasSourceMetaData(state, sourceId) {
  return state.ast.sourceMetaData[sourceId];
}

function getInScopeLines(state) {
  return state.ast.inScopeLines;
}

function isLineInScope(state, line) {
  const linesInScope = state.ast.inScopeLines;
  return linesInScope && linesInScope.includes(line);
}

exports.default = update;