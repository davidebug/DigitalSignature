/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global MozXULElement */
/* global openUILink */
/* global MessageIdClick */
/* global onClickEmailStar */
/* global onClickEmailPresence */
/* global gFolderDisplay */
/* global MozElementMixin */
/* global BaseControlMixin */

var {Services} = ChromeUtils.import("resource://gre/modules/Services.jsm");
var {MailUtils} = ChromeUtils.import("resource:///modules/MailUtils.jsm");
var {MailServices} = ChromeUtils.import("resource:///modules/MailServices.jsm");
var {DBViewWrapper} = ChromeUtils.import("resource:///modules/DBViewWrapper.jsm");
var {TagUtils} = ChromeUtils.import("resource:///modules/TagUtils.jsm");

class MozMailHeaderfield extends MozXULElement {
  connectedCallback() {
    this.setAttribute("context", "copyPopup");
    this.classList.add("headerValue");
  }

  set headerValue(val) {
    return (this.textContent = val);
  }
}
customElements.define("mail-headerfield", MozMailHeaderfield);

class MozMailUrlfield extends MozMailHeaderfield {
  constructor() {
    super();
    this.addEventListener("click", (event) => {
      if (event.button != 2) {
        openUILink(encodeURI(event.target.textContent), event);
      }
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute("context", "copyUrlPopup");
    this.classList.add("text-link", "headerValueUrl");
  }
}
customElements.define("mail-urlfield", MozMailUrlfield);

class MozMailHeaderfieldTags extends MozXULElement {
  connectedCallback() {
    this.classList.add("headerValue");
  }

  set headerValue(val) {
    return this.buildTags(val);
  }

  buildTags(tags) {
    // tags contains a list of actual tag names (not the keys), delimited by spaces
    // each tag name is encoded.

    // remove any existing tag items we've appended to the list
    while (this.hasChildNodes()) {
      this.lastChild.remove();
    }

    // tokenize the keywords based on ' '
    const tagsArray = tags.split(" ");
    for (let i = 0; i < tagsArray.length; i++) {
      // for each tag, create a label, give it the font color that corresponds to the
      // color of the tag and append it.
      let tagName;
      try {
        // if we got a bad tag name, getTagForKey will throw an exception, skip it
        // and go to the next one.
        tagName = MailServices.tags.getTagForKey(tagsArray[i]);
      } catch (ex) {
        continue;
      }

      let color = MailServices.tags.getColorForKey(tagsArray[i]);
      let textColor = "black";
      if (!TagUtils.isColorContrastEnough(color)) {
        textColor = "white";
      }

      // now create a label for the tag name, and set the color
      const label = document.createElement("label");
      label.setAttribute("value", tagName);
      label.className = "tagvalue";
      label.setAttribute("style", "color: " + textColor + "; background-color: " + color + ";");

      this.appendChild(label);
    }
  }
}
customElements.define("mail-tagfield", MozMailHeaderfieldTags);

class MozMailNewsgroup extends MozXULElement {
  connectedCallback() {
    this.classList.add("emailDisplayButton");
    this.setAttribute("context", "newsgroupPopup");
    this.setAttribute("popup", "newsgroupPopup");
  }
}
customElements.define("mail-newsgroup", MozMailNewsgroup);

class MozMailNewsgroupsHeaderfield extends MozXULElement {
  connectedCallback() {
    this.classList.add("headerValueBox");
    this.mNewsgroups = [];
  }

  addNewsgroupView(aNewsgroup) {
    this.mNewsgroups.push(aNewsgroup);
  }

  buildViews() {
    for (let i = 0; i < this.mNewsgroups.length; i++) {
      const newNode = document.createElement("mail-newsgroup");
      if (i > 0) {
        const textNode = document.createElement("text");
        textNode.setAttribute("value", ",");
        textNode.setAttribute("class", "newsgroupSeparator");
        this.appendChild(textNode);
      }

      newNode.textContent = this.mNewsgroups[i];
      newNode.setAttribute("newsgroup", this.mNewsgroups[i]);
      this.appendChild(newNode);
    }
  }

  clearHeaderValues() {
    this.mNewsgroups = [];
    while (this.hasChildNodes()) {
      this.lastChild.remove();
    }
  }
}
customElements.define("mail-newsgroups-headerfield", MozMailNewsgroupsHeaderfield);

class MozMailMessageid extends MozXULElement {
  static get observedAttributes() {
    return ["label"];
  }

  constructor() {
    super();
    this.addEventListener("click", (event) => {
      MessageIdClick(this, event);
    });
  }

  connectedCallback() {
    this.classList.add("messageIdDisplayButton");
    this.setAttribute("context", "messageIdContext");
    this._updateAttributes();
  }

  attributeChangedCallback() {
    this._updateAttributes();
  }

  _updateAttributes() {
    this.textContent = this.label || "";
  }

  set label(val) {
    if (val == null) {
      this.removeAttribute("label");
    } else {
      this.setAttribute("label", val);
    }

    return val;
  }

  get label() {
    return this.getAttribute("label");
  }
}
customElements.define("mail-messageid", MozMailMessageid);

/**
 * MozMailMessageidsHeaderfield is a widget used to show/link messages in the message header.
 * Shown by default for nntp messages, not for regular emails.
 * @extends {MozXULElement}
 */
class MozMailMessageidsHeaderfield extends MozXULElement {
  connectedCallback() {
    if (this.hasChildNodes() || this.delayConnectedCallback()) {
      return;
    }

    this.setAttribute("context", "messageIdsHeaderfieldContext");

    this.mMessageIds = [];
    this.showFullMessageIds = false;

    this.toggleIcon = document.createElement("image");
    this.toggleIcon.classList.add("emailToggleHeaderfield");
    this.toggleIcon.addEventListener("click", () => {
      this._toggleWrap();
    });
    this.appendChild(this.toggleIcon);

    this.headerValue = document.createElement("hbox");
    this.headerValue.classList.add("headerValue");
    this.headerValue.setAttribute("flex", "1");
    this.appendChild(this.headerValue);
  }

  _toggleWrap() {
    for (let i = 0; i < this.headerValue.childNodes.length; i += 2) {
      if (!this.showFullMessageIds) {
        this.toggleIcon.classList.add("open");
        this.headerValue.childNodes[i].setAttribute("label", this.mMessageIds[i / 2]);
        this.headerValue.childNodes[i].removeAttribute("tooltiptext");
        this.headerValue.removeAttribute("singleline");
      } else {
        this.toggleIcon.classList.remove("open");
        this.headerValue.childNodes[i].setAttribute("label", i / 2 + 1);
        this.headerValue.childNodes[i].setAttribute("tooltiptext", this.mMessageIds[i / 2]);
      }
    }

    this.showFullMessageIds = !this.showFullMessageIds;
  }

  fillMessageIdNodes() {
    while (this.headerValue.childNodes.length > this.mMessageIds.length * 2 - 1) {
      this.headerValue.lastChild.remove();
    }

    this.toggleIcon.hidden = this.mMessageIds.length <= 1;

    for (let i = 0; i < this.mMessageIds.length; i++) {
      if (i * 2 <= this.headerValue.childNodes.length - 1) {
        this._updateMessageIdNode(this.headerValue.childNodes[i * 2], i + 1,
          this.mMessageIds[i], this.mMessageIds.length);
      } else {
        let newMessageIdNode = document.createElement("mail-messageid");

        if (i > 0) {
          let textNode = document.createElement("text");
          textNode.setAttribute("value", ", ");
          textNode.setAttribute("class", "messageIdSeparator");
          this.headerValue.appendChild(textNode);
        }
        let itemInDocument = this.headerValue.appendChild(newMessageIdNode);
        this._updateMessageIdNode(itemInDocument, i + 1,
          this.mMessageIds[i], this.mMessageIds.length);
      }
    }
  }

  _updateMessageIdNode(messageIdNode, index, messageId, lastId) {
    if (this.showFullMessageIds || index == lastId) {
      messageIdNode.setAttribute("label", messageId);
      messageIdNode.removeAttribute("tooltiptext");
    } else {
      messageIdNode.setAttribute("label", index);
      messageIdNode.setAttribute("tooltiptext", messageId);
    }

    messageIdNode.setAttribute("index", index);
    messageIdNode.setAttribute("messageid", messageId);
  }

  addMessageIdView(messageId) {
    this.mMessageIds.push(messageId);
  }

  clearHeaderValues() {
    this.mMessageIds = [];
    if (this.showFullMessageIds) {
      this.showFullMessageIds = false;
      this.toggleIcon.classList.remove("open");
    }
  }
}
customElements.define("mail-messageids-headerfield", MozMailMessageidsHeaderfield);

class MozMailEmailaddress extends MozXULElement {
  static get observedAttributes() {
    return [
      "hascard",
      "label",
      "crop",
      "tooltipstar",
      "chatStatus",
      "presenceTooltip",
    ];
  }

  connectedCallback() {
    if (this.hasChildNodes() || this.delayConnectedCallback()) {
      return;
    }
    this.classList.add("emailDisplayButton");
    this.setAttribute("context", "emailAddressPopup");
    this.setAttribute("popup", "emailAddressPopup");

    const label = document.createElement("label");
    label.classList.add("emaillabel");

    const emailStarImage = document.createElement("image");
    emailStarImage.classList.add("emailStar");
    emailStarImage.setAttribute("context", "emailAddressPopup");

    const emailPresenceImage = document.createElement("image");
    emailPresenceImage.classList.add("emailPresence");

    this.appendChild(label);
    this.appendChild(emailStarImage);
    this.appendChild(emailPresenceImage);

    this._update();
    this._setupEventListeners();
  }

  attributeChangedCallback() {
    if (!this.isConnectedAndReady) {
      return;
    }
    this._update();
  }

  _update() {
    const emailLabel = this.querySelector(".emaillabel");
    const emailStarImage = this.querySelector(".emailStar");
    const emailPresenceImage = this.querySelector(".emailPresence");

    this._updateNodeAttributes(emailLabel, "crop");
    this._updateNodeAttributes(emailLabel, "value", "label");

    this._updateNodeAttributes(emailStarImage, "hascard");
    this._updateNodeAttributes(emailStarImage, "chatStatus");
    this._updateNodeAttributes(emailStarImage, "tooltiptext", "tooltipstar");

    this._updateNodeAttributes(emailPresenceImage, "chatStatus");
    this._updateNodeAttributes(
      emailPresenceImage, "tooltiptext", "presenceTooltip"
    );
  }

  _updateNodeAttributes(attrNode, attr, mappedAttr) {
    mappedAttr = mappedAttr || attr;

    if (this.hasAttribute(mappedAttr) && (this.getAttribute(mappedAttr) != null)) {
      attrNode.setAttribute(attr, this.getAttribute(mappedAttr));
    } else {
      attrNode.removeAttribute(attr);
    }
  }

  _setupEventListeners() {
    const emailStarImage = this.querySelector(".emailStar");
    const emailPresenceImage = this.querySelector(".emailPresence");

    emailStarImage.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });

    emailStarImage.addEventListener("click", (event) => {
      onClickEmailStar(event, this);
    });

    emailPresenceImage.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });

    emailPresenceImage.addEventListener("click", (event) => {
      onClickEmailPresence(event, this);
    });
  }
}
customElements.define("mail-emailaddress", MozMailEmailaddress);

class MozMailEmailheaderfield extends MozXULElement {
  connectedCallback() {
    if (this.hasChildNodes() || this.delayConnectedCallback()) {
      return;
    }
    this._mailEmailAddress = document.createElement("mail-emailaddress");
    this._mailEmailAddress.classList.add("headerValue");
    this._mailEmailAddress.setAttribute("containsEmail", "true");

    this.appendChild(this._mailEmailAddress);
  }

  get emailAddressNode() {
    return this._mailEmailAddress;
  }
}
customElements.define("mail-emailheaderfield", MozMailEmailheaderfield);

class MozTreecolImage extends customElements.get("treecol") {
  static get observedAttributes() {
    return ["src"];
  }

  connectedCallback() {
    if (this.hasChildNodes() || this.delayConnectedCallback()) {
      return;
    }
    this.image = document.createElement("image");
    this.image.classList.add("treecol-icon");

    this.appendChild(this.image);
    this._updateAttributes();
  }

  attributeChangedCallback() {
    if (!this.isConnectedAndReady) {
      return;
    }
    this._updateAttributes();
  }

  _updateAttributes() {
    const src = this.getAttribute("src");

    if (src != null) {
      this.image.setAttribute("src", src);
    } else {
      this.image.removeAttribute("src");
    }
  }
}
customElements.define("treecol-image", MozTreecolImage, { extends: "treecol" });

/**
 * Class extending treecols. This features a customized treecolpicker that
 * features a menupopup with more items than the standard one.
 * @augments {MozTreecols}
 */
class MozThreadPaneTreecols extends customElements.get("treecols") {
  connectedCallback() {
    if (this.delayConnectedCallback()) {
      return;
    }
    let treecolpicker = this.querySelector("treecolpicker:not([is]");

    // Can't change the super treecolpicker by setting
    // is="thread-pane-treecolpicker" since that needs to be there at the
    // parsing stage to take effect.
    // So, remove the existing treecolpicker, and add a new one.
    if (treecolpicker) {
      treecolpicker.remove();
    }
    if (!this.querySelector("treecolpicker[is=thread-pane-treecolpicker]")) {
      this.appendChild(MozXULElement.parseXULToFragment(`
        <treecolpicker is="thread-pane-treecolpicker" class="treecol-image" fixed="true"></treecolpicker>
      `));
    }
    // Exceptionally apply super late, so we get the other goodness from there
    // now that the treecolpicker is corrected.
    super.connectedCallback();
  }
}
customElements.define("thread-pane-treecols", MozThreadPaneTreecols, { extends: "treecols" });

/**
 * Class extending treecolpicker. This implements UI to apply column settings
 * of the current thread pane to other mail folders too.
 * @augments {MozTreecolPicker}
 */
class MozThreadPaneTreeColpicker extends customElements.get("treecolpicker") {
  connectedCallback() {
    super.connectedCallback();
    if (this.delayConnectedCallback()) {
      return;
    }
    let popup = this.querySelector(`menupopup[anonid="popup"]`);

    // We'll add an "Apply columns to..." menu
    popup.appendChild(MozXULElement.parseXULToFragment(`
      <menu class="applyTo-menu" label="&columnPicker.applyTo.label;">
        <menupopup>
          <menu class="applyToFolder-menu" label="&columnPicker.applyToFolder.label;">
            <menupopup class="applyToFolder" type="folder" showFileHereLabel="true" position="start_before"></menupopup>
          </menu>
          <menu class="applyToFolderAndChildren-menu" label="&columnPicker.applyToFolderAndChildren.label;">
            <menupopup class="applyToFolderAndChildren" type="folder" showFileHereLabel="true" showAccountsFileHere="true" position="start_before"></menupopup>
          </menu>
        </menupopup>
      </menu>
    `, ["chrome://messenger/locale/messenger.dtd"]));

    let confirmApply = (destFolder, useChildren) => {
      // Confirm the action with the user.
      let bundle = document.getElementById("bundle_messenger");
      let title = (useChildren) ?
        "threadPane.columnPicker.confirmFolder.withChildren.title" :
        "threadPane.columnPicker.confirmFolder.noChildren.title";
      let confirmed = Services.prompt.confirm(null, title,
        bundle.getFormattedString(title, [destFolder.prettyName]));
      if (confirmed) {
        this._applyColumns(destFolder, useChildren);
      }
    };

    let applyToFolderMenu = this.querySelector(".applyToFolder-menu");
    applyToFolderMenu.addEventListener("command", (event) => {
      confirmApply(event.originalTarget._folder, false);
    });

    let applyToFolderAndChildrenMenu = this.querySelector(".applyToFolderAndChildren-menu");
    applyToFolderAndChildrenMenu.addEventListener("command", (event) => {
      confirmApply(event.originalTarget._folder, true);
    });
  }

  _applyColumns(destFolder, useChildren) {
    // Get the current folder's column state, plus the "swapped" column
    // state, which swaps "From" and "Recipient" if only one is shown.
    // This is useful for copying an incoming folder's columns to an
    // outgoing folder, or vice versa.
    let colState = gFolderDisplay.getColumnStates();

    let myColStateString = JSON.stringify(colState);
    let swappedColStateString;
    if (colState.senderCol.visible != colState.recipientCol.visible) {
      let tmp = colState.senderCol;
      colState.senderCol = colState.recipientCol;
      colState.recipientCol = tmp;
      swappedColStateString = JSON.stringify(colState);
    } else {
      swappedColStateString = myColStateString;
    }

    let isOutgoing = function(folder) {
      return folder.isSpecialFolder(
        DBViewWrapper.prototype.OUTGOING_FOLDER_FLAGS, true
      );
    };

    let amIOutgoing = isOutgoing(gFolderDisplay.displayedFolder);

    let colStateString = function(folder) {
      return (isOutgoing(folder) == amIOutgoing ? myColStateString :
        swappedColStateString);
    };

    // Now propagate appropriately...
    const propName = gFolderDisplay.PERSISTED_COLUMN_PROPERTY_NAME;
    if (useChildren) {
      // Generate an observer notification when we have finished
      // configuring all folders.  This is currently done for the benefit
      // of our mozmill tests.
      let observerCallback = function() {
        Services.obs.notifyObservers(gFolderDisplay.displayedFolder,
          "msg-folder-columns-propagated");
      };
      MailUtils.setStringPropertyOnFolderAndDescendents(
        propName, colStateString, destFolder, observerCallback
      );
    } else {
      destFolder.setStringProperty(propName, colStateString(destFolder));
      // null out to avoid memory bloat
      destFolder.msgDatabase = null;
    }
  }
}
customElements.define("thread-pane-treecolpicker", MozThreadPaneTreeColpicker, { extends: "treecolpicker" });

customElements.whenDefined("menulist").then(() => {
  /**
   * MozMenulistEditable is a menulist widget that can be made editable by setting editable="true".
   * With an additional type="description" the list also contains an additional label that can hold
   * for instance, a description of a menu item.
   * It is typically used e.g. for the "Custom From Address..." feature to let the user chose and
   * edit the address to send from.
   * @extends {MozMenuList}
   */
  class MozMenulistEditable extends customElements.get("menulist") {
    connectedCallback() {
      if (this.delayConnectedCallback()) {
        return;
      }

      this.prepend(MozMenulistEditable.fragment.cloneNode(true));
      this._inputField = this.querySelector(".menulist-input");
      this._labelBox = this.querySelector(".menulist-label-box");
      this._dropmarker = this.querySelector(".menulist-dropmarker");

      if (this.getAttribute("type") == "description") {
        this._description = document.createElement("label");
        this._description.classList.add("menulist-description");
        this._description.setAttribute("crop", "right");
        this._description.setAttribute("flex", "10000");
        this._description.setAttribute("role", "none");
        this.querySelector(".menulist-label").after(this._description);
      }

      this.initializeAttributeInheritance();

      this.mSelectedInternal = null;
      this.setInitialSelection();

      this._handleMutation = (mutations) => {
        this.editable = this.getAttribute("editable") == "true";
      };
      this.mAttributeObserver = new MutationObserver(this._handleMutation);
      this.mAttributeObserver.observe(this, {
        attributes: true,
        attributeFilter: ["editable"],
      });

      this._keypress = (event) => {
        if (event.key == "ArrowDown") {
          this.open = true;
        }
      };
      this._inputField.addEventListener("keypress", this._keypress);
      this._change = (event) => {
        event.stopPropagation();
        this.selectedItem = null;
        this.setAttribute("value", this._inputField.value);
        // Start the event again, but this time with the menulist as target.
        this.dispatchEvent(new CustomEvent("change", { bubbles: true }));
      };
      this._inputField.addEventListener("change", this._change);

      this._popupHiding = (event) => {
        // layerX is 0 if the user clicked outside the popup.
        if (this.editable && event.layerX > 0) {
          this._inputField.select();
        }
      };
      if (!this.menupopup) {
        this.appendChild(MozXULElement.parseXULToFragment(`<menupopup />`));
      }
      this.menupopup.addEventListener("popuphiding", this._popupHiding);
    }

    disconnectedCallback() {
      super.disconnectedCallback();

      this.mAttributeObserver.disconnect();
      this._inputField.removeEventListener("keypress", this._keypress);
      this._inputField.removeEventListener("change", this._change);
      this.menupopup.removeEventListener("popuphiding", this._popupHiding);

      for (let prop of ["_inputField", "_labelBox", "_dropmarker", "_description"]) {
        if (this[prop]) {
          this[prop].remove();
          this[prop] = null;
        }
      }
    }

    static get fragment() {
      // Accessibility information of these nodes will be
      // presented on XULComboboxAccessible generated from <menulist>;
      // hide these nodes from the accessibility tree.
      return document.importNode(MozXULElement.parseXULToFragment(`
        <textbox class="menulist-input" allowevents="true" flex="1" role="none"/>
        <hbox class="menulist-label-box" flex="1" role="none">
          <image class="menulist-icon" role="none"/>
          <label class="menulist-label" crop="right" flex="1" role="none"/>
          <label class="menulist-highlightable-label" crop="right" flex="1" role="none"/>
        </hbox>
        <dropmarker class="menulist-dropmarker" type="menu" role="none"/>
      `), true);
    }

    static get inheritedAttributes() {
      let attrs = super.inheritedAttributes;
      attrs[".menulist-input"] = "value,disabled";
      attrs[".menulist-description"] = "value=description";
      return attrs;
    }

    set editable(val) {
      if (val == this.editable)
        return val;

      if (!val) {
        // If we were focused and transition from editable to not editable,
        // focus the parent menulist so that the focus does not get stuck.
        if (this._inputField == document.activeElement)
          window.setTimeout(() => this.focus(), 0);
      }

      this.setAttribute("editable", val);
      return val;
    }

    get editable() {
      return this.getAttribute("editable") == "true";
    }

    set value(val) {
      this._inputField.value = val;
      this.setAttribute("value", val);
      this.setAttribute("label", val);
      return val;
    }

    get value() {
      if (this.editable) {
        return this._inputField.value;
      }
      return super.value;
    }

    get label() {
      if (this.editable) {
        return this._inputField.value;
      }
      return super.label;
    }

    set placeholder(val) {
      this._inputField.placeholder = val;
    }

    get placeholder() {
      return this._inputField.placeholder;
    }

    set selectedItem(val) {
      if (val) {
        this._inputField.value = val.getAttribute("value");
      }
      super.selectedItem = val;
    }

    get selectedItem() {
      return super.selectedItem;
    }

    select() {
      if (this.editable) {
        this._inputField.select();
      }
    }
  }

  const MozXULMenuElement = MozElementMixin(XULMenuElement);
  const MenuBaseControl = BaseControlMixin(MozXULMenuElement);
  MenuBaseControl.implementCustomInterface(
    MozMenulistEditable, [Ci.nsIDOMXULMenuListElement, Ci.nsIDOMXULSelectControlElement]
  );

  customElements.define("menulist-editable", MozMenulistEditable, { extends: "menulist" });
});
