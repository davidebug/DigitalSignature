// -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

var EXPORTED_SYMBOLS = ["Readerable"];

//@line 1 "$SRCDIR\toolkit\components\reader\Readability-readerable.js"
/* eslint-env es6:false */
/* globals exports */
/*
 * DO NOT MODIFY THIS FILE DIRECTLY!
 *
 * This is a shared library that is maintained in an external repo:
 * https://github.com/mozilla/readability
 */

/*
 * Copyright (c) 2010 Arc90 Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * This code is heavily based on Arc90's readability.js (1.7.1) script
 * available at: http://code.google.com/p/arc90labs-readability
 */

var REGEXPS = {
  // NOTE: These two regular expressions are duplicated in
  // Readability.js. Please keep both copies in sync.
  unlikelyCandidates: /-ad-|ai2html|banner|breadcrumbs|combx|comment|community|cover-wrap|disqus|extra|foot|gdpr|header|legends|menu|related|remark|replies|rss|shoutbox|sidebar|skyscraper|social|sponsor|supplemental|ad-break|agegate|pagination|pager|popup|yom-remote/i,
  okMaybeItsACandidate: /and|article|body|column|main|shadow/i,
};

function isNodeVisible(node) {
  // Have to null-check node.style to deal with SVG and MathML nodes.
  return (!node.style || node.style.display != "none") && !node.hasAttribute("hidden");
}

/**
 * Decides whether or not the document is reader-able without parsing the whole thing.
 *
 * @return boolean Whether or not we suspect Readability.parse() will suceeed at returning an article object.
 */
function isProbablyReaderable(doc, isVisible) {
  if (!isVisible) {
    isVisible = isNodeVisible;
  }

  var nodes = doc.querySelectorAll("p, pre");

  // Get <div> nodes which have <br> node(s) and append them into the `nodes` variable.
  // Some articles' DOM structures might look like
  // <div>
  //   Sentences<br>
  //   <br>
  //   Sentences<br>
  // </div>
  var brNodes = doc.querySelectorAll("div > br");
  if (brNodes.length) {
    var set = new Set(nodes);
    [].forEach.call(brNodes, function(node) {
      set.add(node.parentNode);
    });
    nodes = Array.from(set);
  }

  var score = 0;
  // This is a little cheeky, we use the accumulator 'score' to decide what to return from
  // this callback:
  return [].some.call(nodes, function(node) {
    if (!isVisible(node))
      return false;

    var matchString = node.className + " " + node.id;
    if (REGEXPS.unlikelyCandidates.test(matchString) &&
        !REGEXPS.okMaybeItsACandidate.test(matchString)) {
      return false;
    }

    if (node.matches("li p")) {
      return false;
    }

    var textContentLength = node.textContent.trim().length;
    if (textContentLength < 140) {
      return false;
    }

    score += Math.sqrt(textContentLength - 140);

    if (score > 20) {
      return true;
    }
    return false;
  });
}

if (typeof exports === "object") {
  exports.isProbablyReaderable = isProbablyReaderable;
}
//@line 1 "$SRCDIR\toolkit\components\reader\Readerable.js"
// -*- indent-tabs-mode: nil; js-indent-level: 2 -*-
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

// This file and Readability-readerable.js are merged together into
// Readerable.jsm.

/* exported Readerable */
/* import-globals-from Readability-readerable.js */

const {Services} = ChromeUtils.import("resource://gre/modules/Services.jsm");
const {XPCOMUtils} = ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");

function isNodeVisible(node) {
  return node.clientHeight > 0 && node.clientWidth > 0;
}

var Readerable = {
  get isEnabledForParseOnLoad() {
    return this.isEnabled || this.isForceEnabled;
  },

  /**
   * Decides whether or not a document is reader-able without parsing the whole thing.
   *
   * @param doc A document to parse.
   * @return boolean Whether or not we should show the reader mode button.
   */
  isProbablyReaderable(doc) {
    // Only care about 'real' HTML documents:
    if (doc.mozSyntheticDocument || !(doc instanceof doc.defaultView.HTMLDocument)) {
      return false;
    }

    let uri = Services.io.newURI(doc.location.href);
    if (!this.shouldCheckUri(uri)) {
      return false;
    }

    return isProbablyReaderable(doc, isNodeVisible);
  },

  _blockedHosts: [
    "amazon.com",
    "github.com",
    "mail.google.com",
    "pinterest.com",
    "reddit.com",
    "twitter.com",
    "youtube.com",
  ],

  shouldCheckUri(uri, isBaseUri = false) {
    if (!["http", "https"].includes(uri.scheme)) {
      return false;
    }

    if (!isBaseUri) {
      // Sadly, some high-profile pages have false positives, so bail early for those:
      let {host} = uri;
      if (this._blockedHosts.some(blockedHost => host.endsWith(blockedHost))) {
        return false;
      }

      if (uri.filePath == "/") {
        return false;
      }
    }

    return true;
  },
};

XPCOMUtils.defineLazyPreferenceGetter(
  Readerable, "isEnabled", "reader.parse-on-load.enabled", true);
XPCOMUtils.defineLazyPreferenceGetter(
  Readerable, "isForceEnabled", "reader.parse-on-load.force-enabled", false);
