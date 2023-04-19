/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 1594:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PageContent = void 0;
var neighbors_service_1 = __webpack_require__(1072);
var node_info_service_1 = __webpack_require__(1017);
var PageContent = /** @class */ (function () {
    function PageContent() {
        this.paypalCount = 0;
        this.bodyText = '';
        this.pageFields = [];
        this.pageNodes = [];
    }
    PageContent.prototype.getNodeFeatures = function (document, textNodesAndPositions) {
        var inputNodes = document.getElementsByTagName('input');
        var selectNodes = document.getElementsByTagName('select');
        var h1Nodes = document.getElementsByTagName('h1');
        var h2Nodes = document.getElementsByTagName('h2');
        var h3Nodes = document.getElementsByTagName('h3');
        // get paypal paypalcount
        var targetRegex = /paypal/g;
        if (textNodesAndPositions.length > 0) {
            // we can get the paypal counts from this text already processed
            for (var i = 0; i < textNodesAndPositions.length; i++) {
                this.paypalCount += (textNodesAndPositions[i].text.toLowerCase().match(targetRegex) || []).length;
            }
        }
        else {
            // let's count paypal in the text of this document,
            // no need to get position of text on the rendered webpage
            this.paypalCount = this.countText(document.body, targetRegex);
        }
        // get h1 h2 text
        for (var i = 0; i < h1Nodes.length; i++) {
            this.bodyText += " " + h1Nodes[i].innerText;
        }
        for (var i = 0; i < h2Nodes.length; i++) {
            this.bodyText += " " + h2Nodes[i].innerText;
        }
        for (var i = 0; i < h3Nodes.length; i++) {
            this.bodyText += " " + h3Nodes[i].innerText;
        }
        for (var i = 0; i < inputNodes.length; i++) {
            this.processNodeInfo(inputNodes[i], textNodesAndPositions);
        }
        for (var i = 0; i < selectNodes.length; i++) {
            this.processNodeInfo(selectNodes[i], textNodesAndPositions);
        }
        var pageTitle = '';
        if (self === top) {
            // only assign document title of the top page
            pageTitle = document.title;
        }
        return this.generateResult(pageTitle);
    };
    PageContent.prototype.processNodeInfo = function (node, textNodesAndPositions) {
        if (node_info_service_1.NodeInfoService.checkNodeIsHidden(node)) {
            return;
        }
        var neighborsText = neighbors_service_1.NeighborsService.getNodeNeighborsText(node, textNodesAndPositions);
        // check placeholder value if no neighboor text is found
        if (neighborsText.length == 0 && node.hasAttribute('placeholder')) {
            neighborsText = node.getAttribute('placeholder');
        }
        this.bodyText = this.bodyText + " " + neighborsText + " <" + node.tagName + "> ";
        if (node.tagName.toLowerCase() === 'select' ||
            (node.tagName.toLowerCase() === 'input' && node_info_service_1.NodeInfoService.inputNodeToInclude(node))) {
            this.pageFields.push(node_info_service_1.NodeInfoService.buildFieldRecord(node, neighborsText));
            this.pageNodes.push(node);
        }
        return;
    };
    PageContent.prototype.generateResult = function (title) {
        var withInfo = false;
        if (title.trim().length > 0 || this.bodyText.trim().length > 0 ||
            this.paypalCount > 0 || this.pageFields.length > 0) {
            withInfo = true;
        }
        return {
            containsInfo: withInfo,
            pageToClassify: {
                pageData: {
                    title: title,
                    bodyText: this.bodyText,
                    paypalCount: this.paypalCount
                },
                pageFieldsData: this.pageFields
            },
            pageNodes: this.pageNodes
        };
    };
    PageContent.prototype.countText = function (node, targetRegex) {
        var _this = this;
        var ignoreTags = ['script', 'noscript', 'style', 'footer', 'header'];
        var count = 0;
        if (node.tagName && ignoreTags.includes(node.tagName.toLowerCase())) {
            return count;
        }
        if (node_info_service_1.NodeInfoService.checkNodeIsHidden(node)) {
            // if node is hidden, do not consider its children nodes nor text
            return count;
        }
        node.childNodes.forEach(function (child) {
            if (child instanceof Text) {
                if (!/^\s*$/.test(child.data)) {
                    count += (child.data.toLowerCase().match(targetRegex) || []).length;
                }
            }
            else if (child instanceof HTMLElement) {
                count += _this.countText(child, targetRegex);
            }
        });
        return count;
    };
    return PageContent;
}());
exports.PageContent = PageContent;


/***/ }),

/***/ 5167:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TextInfo = void 0;
var TextInfo = /** @class */ (function () {
    function TextInfo(text, rect) {
        this.text = text;
        this.xTopLeft = rect.left;
        this.yTopLeft = rect.top;
        this.xBottomRight = rect.left + rect.width;
        this.yBottomRight = rect.top + rect.height;
        this.isVisible = this.checkTextIsVisible();
    }
    TextInfo.prototype.checkTextIsVisible = function () {
        var textLength = this.text.trim().length;
        var attributes = [this.xTopLeft, this.yTopLeft, this.xBottomRight, this.yBottomRight];
        return textLength > 0 && !attributes.includes(0);
    };
    ;
    return TextInfo;
}());
exports.TextInfo = TextInfo;


/***/ }),

/***/ 6716:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AutoCompleteService = void 0;
var AutoCompleteService = /** @class */ (function () {
    function AutoCompleteService() {
    }
    /**
     * Checks the payment page signature and returns auto complete rule name.
     * @param document html document
     */
    AutoCompleteService.getAutocompleteRule = function (document) {
        for (var i = 0; i < this.selectorList.length; i++) {
            // some sites (I'm looking at you coldwater creek) actually have multiple fields with autocomplete='cc-number' set
            // only one is visible, so let's get to the visible one
            var curSelectedNodes = document.querySelectorAll(this.selectorList[i].selector);
            for (var z = 0; z < curSelectedNodes.length; z++) {
                var possibleCCNum = curSelectedNodes[z];
                if (possibleCCNum && (possibleCCNum.type === 'text' || possibleCCNum.type === "tel" || possibleCCNum.type === "number" || possibleCCNum.type === "password") && !possibleCCNum.disabled &&
                    (possibleCCNum.offsetWidth >= 5 || possibleCCNum.offsetHeight >= 5 || possibleCCNum.getClientRects().length >= 5)) {
                    if (possibleCCNum.isVisible()) {
                        return this.selectorList[i].name;
                    }
                }
            }
        }
        return null;
    };
    AutoCompleteService.selectorList = [
        { selector: "[autocomplete*='cc-number']", name: "Google Autocomplete" },
        { selector: "[id$='_ccno']", name: "Generic" },
        { selector: "[data-braintree-name='number']", name: "Braintree" },
        { selector: "[id=dwfrm_billing_paymentMethods_creditCard_number]", name: "dwfrm" }
    ];
    return AutoCompleteService;
}());
exports.AutoCompleteService = AutoCompleteService;


/***/ }),

/***/ 927:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CheckoutListenerService = void 0;
var fingerprint_service_1 = __webpack_require__(1245);
var CheckoutListenerService = /** @class */ (function () {
    function CheckoutListenerService() {
    }
    CheckoutListenerService.launchMutationListeners = function () {
        // Start the mutation listener when the HTML loads
        if (document.readyState === 'loading') { // Loading hasn't finished yet
            document.addEventListener('DOMContentLoaded', function (event) {
                fingerprint_service_1.FingerprintService.fingerprintPage();
                if (!fingerprint_service_1.FingerprintService.isCheckout) {
                    CheckoutListenerService.activateListeners();
                }
            });
        }
        else { // `DOMContentLoaded` has already fired
            fingerprint_service_1.FingerprintService.fingerprintPage();
            if (!fingerprint_service_1.FingerprintService.isCheckout) {
                CheckoutListenerService.activateListeners();
            }
        }
        return CheckoutListenerService.observer;
    };
    ;
    CheckoutListenerService.closeListeners = function () {
        CheckoutListenerService.observer.takeRecords();
        CheckoutListenerService.observer.disconnect();
    };
    CheckoutListenerService.activateListeners = function () {
        CheckoutListenerService.observer.observe(document, CheckoutListenerService.observerOptions);
    };
    CheckoutListenerService.observeCheckoutMutations = function (mutations) {
        var isTargetMutation = false;
        CheckoutListenerService.totalMutations++;
        // If the DOM is hidden, don't check this mutation
        if (document.hidden) {
            return;
        }
        // Check each mutation in this event to see if it affects an input field
        isTargetMutation = CheckoutListenerService.checkTargetMutations(mutations);
        // If the mutation involves an target field, check if the page is now a possible payment page
        if (isTargetMutation) {
            CheckoutListenerService.totalInputMutations++;
            console.log('Total Mutations: ', CheckoutListenerService.totalMutations);
            console.log('Total Input Mutations: ', CheckoutListenerService.totalInputMutations);
            fingerprint_service_1.FingerprintService.fingerprintPage();
            if (fingerprint_service_1.FingerprintService.isCheckout) {
                // deactivate mutation listeners
                CheckoutListenerService.closeListeners();
            }
        }
    };
    CheckoutListenerService.checkNodeChildren = function (nodesToCheck, node) {
        //checks if elements with children have a change in their visibility
        if (node.nodeName.toLowerCase() != 'html' &&
            node.nodeName.toLowerCase() != 'body' &&
            node.hasChildNodes() && node.nodeType === Node.ELEMENT_NODE) {
            console.log('ML Mutation checking children nodes');
            // check if has children of types specified in nodesToCheck
            for (var i = 0; i < nodesToCheck.length; i++) {
                if (node.getElementsByTagName(nodesToCheck[i]).length > 0) {
                    return true;
                }
            }
        }
        return false;
    };
    CheckoutListenerService.checkTargetMutations = function (mutations) {
        var nodesToCheck = ['input', 'select', 'h1', 'h2', 'h3'];
        // Check each mutation in this event
        for (var i = 0; i < mutations.length; i++) {
            var mutation = mutations[i];
            switch (mutation.type) {
                // If there is a change to the attributes of nodes of interest, check this mutation
                case 'attributes':
                    var thisNode = mutation.target;
                    if (nodesToCheck.includes(thisNode.nodeName.toLowerCase()) ||
                        CheckoutListenerService.checkNodeChildren(nodesToCheck, thisNode)) {
                        console.log('ML Mutation Node: ', thisNode.nodeName);
                        console.log('ML Mutation Attribute Name: ', mutation.attributeName);
                        return true;
                    }
                    break;
                // If a new input field is added, check this mutation
                case 'childList':
                    for (var i_1 = 0; i_1 < mutation.addedNodes.length; i_1++) {
                        var thisNode_1 = mutation.addedNodes[i_1];
                        if (nodesToCheck.includes(thisNode_1.nodeName.toLowerCase()) ||
                            CheckoutListenerService.checkNodeChildren(nodesToCheck, thisNode_1)) {
                            console.log('ML Mutation Type List Length: ', mutation.addedNodes.length);
                            return true;
                        }
                    }
                    break;
            }
        }
        // check nodes with children
        return false;
    };
    ;
    CheckoutListenerService.observer = new MutationObserver(CheckoutListenerService.observeCheckoutMutations);
    CheckoutListenerService.totalMutations = 0;
    CheckoutListenerService.totalInputMutations = 0;
    CheckoutListenerService.totalFingerprintsSent = 0;
    CheckoutListenerService.observerOptions = {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: false,
        attributeFilter: ['style', 'class']
    };
    return CheckoutListenerService;
}());
exports.CheckoutListenerService = CheckoutListenerService;


/***/ }),

/***/ 1245:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FingerprintService = void 0;
var page_content_model_1 = __webpack_require__(1594);
var neighbors_service_1 = __webpack_require__(1072);
var node_info_service_1 = __webpack_require__(1017);
var shared_service_1 = __webpack_require__(1619);
var FingerprintService = /** @class */ (function () {
    function FingerprintService() {
        this.lastPageEvaluated = {};
    }
    FingerprintService.fingerprintPage = function () {
        var result = FingerprintService.getPaymentPageInfo(document);
        if (result.containsInfo) {
            // This content is part of a possible payment page, send fingerprint to background script
            console.log('ML Sending fingerprint to background script');
            FingerprintService.totalFingerprintsSent++;
            console.log('totalFingerprints Sent: ', FingerprintService.totalFingerprintsSent);
            var message = {
                action: 'ml_fingerprint',
                data: result.pageToClassify,
                url: shared_service_1.SharedService.extractOriginPath(document.URL.valueOf()),
                referrer: shared_service_1.SharedService.extractOriginPath(document.referrer)
            };
            if (!FingerprintService.isLoading) {
                FingerprintService.isLoading = true;
                platform.sendMessage(message, function (response) {
                    console.log("ML fingerprint result:", response);
                    FingerprintService.isLoading = false;
                    FingerprintService.isCheckout = response.isCheckout;
                });
            }
        }
    };
    FingerprintService.checkPossiblePaymentPage = function (document) {
        // at least one input or select field visible to trigger fingerprinting of text neighboors
        // the input field for credit card number can be in one iframe
        // while the select for the expiration date in another iframe.
        //
        // (note, if the page changes, the Goldeneye trigger the content-script to run again)
        // some quick heuristics like number of input fields
        var inputNodes = document.getElementsByTagName('input');
        var selectNodes = document.getElementsByTagName('select');
        if ((inputNodes === null || inputNodes === undefined) &&
            (selectNodes === null || selectNodes === undefined)) {
            return false;
        }
        var count = 0;
        for (var i = 0; i < inputNodes.length; i++) {
            var node = inputNodes[i];
            if (node_info_service_1.NodeInfoService.inputNodeToInclude(node) && !node_info_service_1.NodeInfoService.checkNodeIsHidden(node)) {
                count += 1;
            }
        }
        for (var i = 0; i < selectNodes.length; i++) {
            var node = selectNodes[i];
            if (!node_info_service_1.NodeInfoService.checkNodeIsHidden(node)) {
                count += 1;
            }
        }
        if (count > 0) {
            return true;
        }
        return false;
    };
    FingerprintService.getPaymentPageInfo = function (document) {
        var textNodesAndPositions = [];
        if (FingerprintService.checkPossiblePaymentPage(document)) {
            textNodesAndPositions = neighbors_service_1.NeighborsService.getNeighborTextCandidates(document.body);
            console.log('ML after getNeighborTextCandidates');
        }
        var pageContent = new page_content_model_1.PageContent();
        var result = pageContent.getNodeFeatures(document, textNodesAndPositions);
        console.log('ML content script got data');
        console.log('ML Payment page result: ', result);
        return result;
    };
    FingerprintService.totalFingerprintsSent = 0;
    FingerprintService.isLoading = false;
    FingerprintService.isCheckout = false;
    return FingerprintService;
}());
exports.FingerprintService = FingerprintService;


/***/ }),

/***/ 1072:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NeighborsService = void 0;
var text_info_model_1 = __webpack_require__(5167);
var wge_distance_service_1 = __webpack_require__(138);
var DISTANCE_CUTOFF = 30.;
var NeighborsService = /** @class */ (function () {
    function NeighborsService() {
    }
    NeighborsService.getNeighborTextCandidates = function (node) {
        var ignoreTags = ['script', 'noscript', 'style', 'footer', 'header'];
        var textInfos = [];
        if (node.tagName && ignoreTags.includes(node.tagName)) {
            return textInfos;
        }
        var rect;
        try {
            rect = node.getBoundingClientRect();
        }
        catch (err) {
            console.log('node with exception: ' + node.tagName);
            return textInfos;
        }
        ;
        // if the children of this node are text only
        // then the coordinates of the rect object apply to the textInfo.
        // However if the children of this node is a mix of text and other elements,
        // then the coordinates of the rect may not apply to the textInfo
        // Read the children
        var filteredChildNodes = [];
        var textOnly = true;
        node.childNodes.forEach(function (child) {
            if (child instanceof Text) {
                if (!/^\s*$/.test(child.data)) {
                    filteredChildNodes.push(child);
                }
            }
            else if (child instanceof Element) {
                filteredChildNodes.push(child);
                textOnly = false;
            }
        });
        if (textOnly) {
            //all children are text, then the rect box coordiates apply to them
            var textData = filteredChildNodes.map(function (childNode) {
                return childNode.data.trim();
            }).join(' ');
            if (textData.trim().length > 0) {
                var textInfo = new text_info_model_1.TextInfo(textData, rect);
                if (textInfo.isVisible) {
                    textInfos.push(textInfo);
                }
            }
        }
        else {
            // one of the children elements could be a huge div,
            // then the coordinates of this box don't apply to the text inside
            // let's figure it out the coordinates for the text in this set of children
            filteredChildNodes.forEach(function (child) {
                if (child instanceof Text) {
                    var textInfo = NeighborsService.getFigureTextInfo(child);
                    if (textInfo.isVisible) {
                        textInfos.push(textInfo);
                    }
                }
                else {
                    // this is an element, recurse
                    textInfos = textInfos.concat(NeighborsService.getNeighborTextCandidates(child));
                }
            });
        }
        return textInfos;
    };
    NeighborsService.getFigureTextInfo = function (childText) {
        var text = childText.data.trim();
        var range = document.createRange();
        range.selectNodeContents(childText);
        var rect = range.getBoundingClientRect();
        return new text_info_model_1.TextInfo(text, rect);
    };
    NeighborsService.getNodeNeighborsText = function (node, neighborCandidates) {
        var neighbors = [];
        var nodeInfo;
        try {
            var rect = node.getBoundingClientRect();
            nodeInfo = new text_info_model_1.TextInfo(node.tagName, rect);
        }
        catch (err) {
            console.log('node with exception: ' + node.tagName);
            return '';
        }
        ;
        for (var i = 0; i < neighborCandidates.length; i++) {
            var candidate = neighborCandidates[i];
            if (NeighborsService.matchNeighbors(nodeInfo, candidate)) {
                // replace multiple blanks with one blank
                var neighbor_text = candidate.text.replace(/\s\s+/g, ' ');
                neighbors.push(neighbor_text);
            }
        }
        if (neighbors.length > 0) {
            // return a string with all text items in the list of neighbors
            return neighbors.join(' ');
        }
        return '';
    };
    NeighborsService.matchNeighbors = function (nodeInfo, candidate) {
        var distance = wge_distance_service_1.WgeDistanceService.wgeRowColDistance(nodeInfo.xTopLeft, nodeInfo.yTopLeft, nodeInfo.xBottomRight, nodeInfo.yBottomRight, candidate.xTopLeft, candidate.yTopLeft, candidate.xBottomRight, candidate.yBottomRight);
        return distance <= DISTANCE_CUTOFF;
    };
    return NeighborsService;
}());
exports.NeighborsService = NeighborsService;


/***/ }),

/***/ 1017:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NodeInfoService = void 0;
var NodeInfoService = /** @class */ (function () {
    function NodeInfoService() {
    }
    NodeInfoService.checkNodeIsHidden = function (node) {
        if (node.type === 'hidden' || node.disabled ||
            (node.offsetWidth < 5 && node.offsetHeight < 5 &&
                node.getClientRects().length < 5)) {
            return true;
        }
        else {
            return false;
        }
    };
    NodeInfoService.inputNodeToInclude = function (node) {
        var allowedTypes = ['text', 'tel', 'number', 'password'];
        return allowedTypes.includes(node.type);
    };
    NodeInfoService.getNodeAttributesValues = function (node) {
        var attributesToInclude = ['id', 'name', 'type', 'autocomplete', 'data-automation-id', 'placeholder'];
        var attrs = node.attributes;
        var output = '';
        for (var i = 0; i < attrs.length; i++) {
            if (attributesToInclude.includes(attrs[i].name)) {
                var value = attrs[i].value;
                value = value.replace('-', ' ');
                value = value.replace('_', ' ');
                output += ' ' + value;
            }
        }
        return output.trim();
    };
    NodeInfoService.buildFieldRecord = function (node, neighborsText) {
        // [inputInd, selectInd, text (neighboorText and attribute values)]
        var attributes = NodeInfoService.getNodeAttributesValues(node);
        var inputInd = 0;
        var selectInd = 0;
        var textForField = neighborsText + " " + attributes;
        if (node.tagName.toLowerCase() === 'input') {
            inputInd = 1;
        }
        else {
            selectInd = 1;
        }
        return [inputInd, selectInd, textForField];
    };
    return NodeInfoService;
}());
exports.NodeInfoService = NodeInfoService;


/***/ }),

/***/ 1619:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SharedService = void 0;
var SharedService = /** @class */ (function () {
    function SharedService() {
    }
    /**
     * Extract Origin Path from the given url
     * @param url Full url of the site
     */
    SharedService.extractOriginPath = function (url) {
        try {
            var u = new URL(url);
            return u.origin + u.pathname;
        }
        catch (e) {
            console.log('Invalid url: ' + url);
            return '';
        }
    };
    return SharedService;
}());
exports.SharedService = SharedService;


/***/ }),

/***/ 138:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WgeDistanceService = void 0;
var WgeDistanceService = /** @class */ (function () {
    function WgeDistanceService() {
    }
    // reference in python
    // https://github.com/stanfordnlp/wge/blob/master/wge/miniwob/distance.py
    WgeDistanceService.lineSegmentDistance = function (start1, end1, start2, end2) {
        /*Returns the distance between two line segments on the real line.
        Line segments defined by (start1, end1) and (start2, end2) with:
    
            start1 <= end1, start2 <= end2
    
        Args:
            start1, end1 (float): start and end of first line segment
            start2, end2 (float): start and end of second line segment
    
        Returns:
            distance (float)
        */
        //assert end1 >= start1
        //assert end2 >= start2
        //if start1 <= start2 <= end1:
        if (start2 >= start1 && start2 <= end1) {
            return 0;
        }
        else if (start1 <= start2) {
            return start2 - end1;
        }
        else if (start1 >= start2 && start1 <= end2) {
            return 0;
        }
        else {
            return start1 - end2;
        }
    };
    WgeDistanceService.wgeRowColDistance = function (x1TopLeft, y1TopLeft, x1BottomRight, y1BottomRight, x2TopLeft, y2TopLeft, x2BottomRight, y2BottomRight) {
        /* Computes distance between two rectangles specified by corners. The
        distance metric is their x distance if they are in the same row, y
        distance if same col, otherwise inf.
    
        Args:
            x1, y1 (float, float): coords of top left corner
            x1b, y1b (float, float): coords of bottom right corner
            x2, y2 (float, float): coords of top left corner
            x2b, y2b (float, float): coords of bottom right corner
    
        Returns:
            float
        */
        var xDist = WgeDistanceService.lineSegmentDistance(x1TopLeft, x1BottomRight, x2TopLeft, x2BottomRight);
        var yDist = WgeDistanceService.lineSegmentDistance(y1TopLeft, y1BottomRight, y2TopLeft, y2BottomRight) * 3;
        if (xDist > 0 && yDist > 0) {
            return Number.MAX_VALUE;
        }
        else {
            return Math.max(xDist, yDist);
        }
    };
    return WgeDistanceService;
}());
exports.WgeDistanceService = WgeDistanceService;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
var shared_service_1 = __webpack_require__(1619);
var auto_complete_service_1 = __webpack_require__(6716);
var checkout_listener_service_1 = __webpack_require__(927);
platform.sendMessage({ action: 'get_feature_flag' }, function (data) {
    // Check if feature toggle is on
    if (data && data.featureToggle) {
        checkout_listener_service_1.CheckoutListenerService.launchMutationListeners();
    }
    else {
        checkout_listener_service_1.CheckoutListenerService.closeListeners();
    }
});
platform.onMessage(function (request, sender, sendResponse) {
    if (request && request.action) {
        switch (request.action) {
            case 'refingerprint':
                console.log("ML refingerprint request");
                checkout_listener_service_1.CheckoutListenerService.activateListeners();
                break;
            case 'populate_generate_card_number':
                setTimeout(function () {
                    // report data to potomac if payment page uses autofill patterns like google, brain tree etc
                    var autocompleteRuleName = auto_complete_service_1.AutoCompleteService.getAutocompleteRule(document);
                    if (autocompleteRuleName != null) {
                        platform.sendMessage({
                            action: 'report_event',
                            event: {
                                event: 'autocomplete_pattern_found',
                                extra: {
                                    rule_type: autocompleteRuleName,
                                    hostname: location.hostname,
                                    url: shared_service_1.SharedService.extractOriginPath(document.URL.valueOf()),
                                }
                            }
                        }, function () { });
                    }
                }, 2000);
                break;
        }
    }
});

})();

/******/ })()
;