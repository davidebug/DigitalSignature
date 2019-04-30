/* -*- Mode: Java; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var {FeedUtils} = ChromeUtils.import("resource:///modules/FeedUtils.jsm");

/* Feed account standalone wizard functions */
var FeedAccountWizard = {
  accountName: "",

  accountSetupPageInit() {
    this.accountSetupPageValidate();
  },

  accountSetupPageValidate() {
    this.accountName = document.getElementById("prettyName").value.trim();
    document.documentElement.canAdvance = this.accountName;
  },

  accountSetupPageUnload() {
  },

  donePageInit() {
    document.getElementById("account.name.text").value = this.accountName;
  },

  onCancel() {
    return true;
  },

  onFinish() {
    let account = FeedUtils.createRssAccount(this.accountName);
    if ("gFolderTreeView" in window.opener.top) {
      // Opened from 3pane File->New or Appmenu New Message, or
      // Account Central link.
      window.opener.top.gFolderTreeView.selectFolder(account.incomingServer.rootMsgFolder);
    } else if ("selectServer" in window.opener) {
      // Opened from Account Settings.
      window.opener.selectServer(account.incomingServer);
    }

    window.close();
  },
};
