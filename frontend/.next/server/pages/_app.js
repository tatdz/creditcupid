/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "./src/pages/_app.tsx":
/*!****************************!*\
  !*** ./src/pages/_app.tsx ***!
  \****************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ App)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var wagmi__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! wagmi */ \"wagmi\");\n/* harmony import */ var wagmi_chains__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! wagmi/chains */ \"wagmi/chains\");\n/* harmony import */ var _tanstack_react_query__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @tanstack/react-query */ \"@tanstack/react-query\");\n/* harmony import */ var wagmi_connectors__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! wagmi/connectors */ \"wagmi/connectors\");\n/* harmony import */ var next_dynamic__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! next/dynamic */ \"./node_modules/next/dynamic.js\");\n/* harmony import */ var next_dynamic__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(next_dynamic__WEBPACK_IMPORTED_MODULE_6__);\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../styles/globals.css */ \"./src/styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_7__);\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([wagmi__WEBPACK_IMPORTED_MODULE_2__, wagmi_chains__WEBPACK_IMPORTED_MODULE_3__, _tanstack_react_query__WEBPACK_IMPORTED_MODULE_4__, wagmi_connectors__WEBPACK_IMPORTED_MODULE_5__]);\n([wagmi__WEBPACK_IMPORTED_MODULE_2__, wagmi_chains__WEBPACK_IMPORTED_MODULE_3__, _tanstack_react_query__WEBPACK_IMPORTED_MODULE_4__, wagmi_connectors__WEBPACK_IMPORTED_MODULE_5__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);\n\n\n\n\n\n\n\n\n// Dynamic import with SSR disabled for Blockscout providers\nconst BlockscoutProviders = next_dynamic__WEBPACK_IMPORTED_MODULE_6___default()(()=>__webpack_require__.e(/*! import() */ \"src_components_BlockscoutProviders_tsx\").then(__webpack_require__.bind(__webpack_require__, /*! ../components/BlockscoutProviders */ \"./src/components/BlockscoutProviders.tsx\")).then((mod)=>({\n            default: mod.BlockscoutProviders\n        })), {\n    loadableGenerated: {\n        modules: [\n            \"pages/_app.tsx -> \" + \"../components/BlockscoutProviders\"\n        ]\n    },\n    ssr: false,\n    loading: ()=>/*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n            className: \"flex justify-center items-center py-4\",\n            children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"span\", {\n                className: \"loading loading-spinner loading-md text-primary\"\n            }, void 0, false, {\n                fileName: \"/Users/tatianadzhambinova/creditcupid/frontend/src/pages/_app.tsx\",\n                lineNumber: 28,\n                columnNumber: 9\n            }, undefined)\n        }, void 0, false, {\n            fileName: \"/Users/tatianadzhambinova/creditcupid/frontend/src/pages/_app.tsx\",\n            lineNumber: 27,\n            columnNumber: 7\n        }, undefined)\n});\n// RPC URLs keyed by chain ID - these are public, safe to keep in frontend\nconst rpcUrls = {\n    [wagmi_chains__WEBPACK_IMPORTED_MODULE_3__.sepolia.id]: \"https://rpc.sepolia.org\",\n    [wagmi_chains__WEBPACK_IMPORTED_MODULE_3__.mainnet.id]: \"https://eth.llamarpc.com\",\n    [wagmi_chains__WEBPACK_IMPORTED_MODULE_3__.polygon.id]: \"https://polygon.llamarpc.com\",\n    [wagmi_chains__WEBPACK_IMPORTED_MODULE_3__.arbitrum.id]: \"https://arbitrum.llamarpc.com\",\n    [wagmi_chains__WEBPACK_IMPORTED_MODULE_3__.optimism.id]: \"https://optimism.llamarpc.com\",\n    [wagmi_chains__WEBPACK_IMPORTED_MODULE_3__.base.id]: \"https://base.llamarpc.com\"\n};\nconst transports = {\n    [wagmi_chains__WEBPACK_IMPORTED_MODULE_3__.sepolia.id]: (0,wagmi__WEBPACK_IMPORTED_MODULE_2__.http)(rpcUrls[wagmi_chains__WEBPACK_IMPORTED_MODULE_3__.sepolia.id]),\n    [wagmi_chains__WEBPACK_IMPORTED_MODULE_3__.mainnet.id]: (0,wagmi__WEBPACK_IMPORTED_MODULE_2__.http)(rpcUrls[wagmi_chains__WEBPACK_IMPORTED_MODULE_3__.mainnet.id]),\n    [wagmi_chains__WEBPACK_IMPORTED_MODULE_3__.polygon.id]: (0,wagmi__WEBPACK_IMPORTED_MODULE_2__.http)(rpcUrls[wagmi_chains__WEBPACK_IMPORTED_MODULE_3__.polygon.id]),\n    [wagmi_chains__WEBPACK_IMPORTED_MODULE_3__.arbitrum.id]: (0,wagmi__WEBPACK_IMPORTED_MODULE_2__.http)(rpcUrls[wagmi_chains__WEBPACK_IMPORTED_MODULE_3__.arbitrum.id]),\n    [wagmi_chains__WEBPACK_IMPORTED_MODULE_3__.optimism.id]: (0,wagmi__WEBPACK_IMPORTED_MODULE_2__.http)(rpcUrls[wagmi_chains__WEBPACK_IMPORTED_MODULE_3__.optimism.id]),\n    [wagmi_chains__WEBPACK_IMPORTED_MODULE_3__.base.id]: (0,wagmi__WEBPACK_IMPORTED_MODULE_2__.http)(rpcUrls[wagmi_chains__WEBPACK_IMPORTED_MODULE_3__.base.id])\n};\nconst connectors = [\n    (0,wagmi_connectors__WEBPACK_IMPORTED_MODULE_5__.injected)({\n        shimDisconnect: true\n    })\n];\nconst config = (0,wagmi__WEBPACK_IMPORTED_MODULE_2__.createConfig)({\n    chains: [\n        wagmi_chains__WEBPACK_IMPORTED_MODULE_3__.sepolia,\n        wagmi_chains__WEBPACK_IMPORTED_MODULE_3__.mainnet,\n        wagmi_chains__WEBPACK_IMPORTED_MODULE_3__.polygon,\n        wagmi_chains__WEBPACK_IMPORTED_MODULE_3__.arbitrum,\n        wagmi_chains__WEBPACK_IMPORTED_MODULE_3__.optimism,\n        wagmi_chains__WEBPACK_IMPORTED_MODULE_3__.base\n    ],\n    connectors,\n    transports\n});\nconst queryClient = new _tanstack_react_query__WEBPACK_IMPORTED_MODULE_4__.QueryClient({\n    defaultOptions: {\n        queries: {\n            retry: 1,\n            staleTime: 60000,\n            gcTime: 300000,\n            refetchOnWindowFocus: false,\n            retryDelay: (attemptIndex)=>Math.min(1000 * 2 ** attemptIndex, 30000)\n        }\n    }\n});\nfunction App({ Component, pageProps }) {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(wagmi__WEBPACK_IMPORTED_MODULE_2__.WagmiProvider, {\n        config: config,\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_tanstack_react_query__WEBPACK_IMPORTED_MODULE_4__.QueryClientProvider, {\n            client: queryClient,\n            children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(BlockscoutProviders, {\n                children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n                    ...pageProps\n                }, void 0, false, {\n                    fileName: \"/Users/tatianadzhambinova/creditcupid/frontend/src/pages/_app.tsx\",\n                    lineNumber: 82,\n                    columnNumber: 11\n                }, this)\n            }, void 0, false, {\n                fileName: \"/Users/tatianadzhambinova/creditcupid/frontend/src/pages/_app.tsx\",\n                lineNumber: 81,\n                columnNumber: 9\n            }, this)\n        }, void 0, false, {\n            fileName: \"/Users/tatianadzhambinova/creditcupid/frontend/src/pages/_app.tsx\",\n            lineNumber: 80,\n            columnNumber: 7\n        }, this)\n    }, void 0, false, {\n        fileName: \"/Users/tatianadzhambinova/creditcupid/frontend/src/pages/_app.tsx\",\n        lineNumber: 79,\n        columnNumber: 5\n    }, this);\n}\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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L3NyYy9wYWdlcy9fYXBwLnRzeD9mOWQ2Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgdHlwZSB7IEFwcFByb3BzIH0gZnJvbSAnbmV4dC9hcHAnO1xuaW1wb3J0IHtcbiAgY3JlYXRlQ29uZmlnLFxuICBXYWdtaVByb3ZpZGVyLFxuICBodHRwLFxufSBmcm9tICd3YWdtaSc7XG5pbXBvcnQge1xuICBzZXBvbGlhLFxuICBtYWlubmV0LFxuICBwb2x5Z29uLFxuICBhcmJpdHJ1bSxcbiAgb3B0aW1pc20sXG4gIGJhc2UsXG59IGZyb20gJ3dhZ21pL2NoYWlucyc7XG5pbXBvcnQgeyBRdWVyeUNsaWVudCwgUXVlcnlDbGllbnRQcm92aWRlciB9IGZyb20gJ0B0YW5zdGFjay9yZWFjdC1xdWVyeSc7XG5pbXBvcnQgeyBpbmplY3RlZCB9IGZyb20gJ3dhZ21pL2Nvbm5lY3RvcnMnO1xuaW1wb3J0IGR5bmFtaWMgZnJvbSAnbmV4dC9keW5hbWljJztcbmltcG9ydCAnLi4vc3R5bGVzL2dsb2JhbHMuY3NzJztcblxuLy8gRHluYW1pYyBpbXBvcnQgd2l0aCBTU1IgZGlzYWJsZWQgZm9yIEJsb2Nrc2NvdXQgcHJvdmlkZXJzXG5jb25zdCBCbG9ja3Njb3V0UHJvdmlkZXJzID0gZHluYW1pYyhcbiAgKCkgPT4gaW1wb3J0KCcuLi9jb21wb25lbnRzL0Jsb2Nrc2NvdXRQcm92aWRlcnMnKS50aGVuKG1vZCA9PiAoeyBkZWZhdWx0OiBtb2QuQmxvY2tzY291dFByb3ZpZGVycyB9KSksXG4gIHsgXG4gICAgc3NyOiBmYWxzZSxcbiAgICBsb2FkaW5nOiAoKSA9PiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1jZW50ZXIgaXRlbXMtY2VudGVyIHB5LTRcIj5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibG9hZGluZyBsb2FkaW5nLXNwaW5uZXIgbG9hZGluZy1tZCB0ZXh0LXByaW1hcnlcIj48L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbik7XG5cbi8vIFJQQyBVUkxzIGtleWVkIGJ5IGNoYWluIElEIC0gdGhlc2UgYXJlIHB1YmxpYywgc2FmZSB0byBrZWVwIGluIGZyb250ZW5kXG5jb25zdCBycGNVcmxzOiBSZWNvcmQ8bnVtYmVyLCBzdHJpbmc+ID0ge1xuICBbc2Vwb2xpYS5pZF06ICdodHRwczovL3JwYy5zZXBvbGlhLm9yZycsXG4gIFttYWlubmV0LmlkXTogJ2h0dHBzOi8vZXRoLmxsYW1hcnBjLmNvbScsXG4gIFtwb2x5Z29uLmlkXTogJ2h0dHBzOi8vcG9seWdvbi5sbGFtYXJwYy5jb20nLFxuICBbYXJiaXRydW0uaWRdOiAnaHR0cHM6Ly9hcmJpdHJ1bS5sbGFtYXJwYy5jb20nLFxuICBbb3B0aW1pc20uaWRdOiAnaHR0cHM6Ly9vcHRpbWlzbS5sbGFtYXJwYy5jb20nLFxuICBbYmFzZS5pZF06ICdodHRwczovL2Jhc2UubGxhbWFycGMuY29tJyxcbn07XG5cbmNvbnN0IHRyYW5zcG9ydHMgPSB7XG4gIFtzZXBvbGlhLmlkXTogaHR0cChycGNVcmxzW3NlcG9saWEuaWRdKSxcbiAgW21haW5uZXQuaWRdOiBodHRwKHJwY1VybHNbbWFpbm5ldC5pZF0pLFxuICBbcG9seWdvbi5pZF06IGh0dHAocnBjVXJsc1twb2x5Z29uLmlkXSksXG4gIFthcmJpdHJ1bS5pZF06IGh0dHAocnBjVXJsc1thcmJpdHJ1bS5pZF0pLFxuICBbb3B0aW1pc20uaWRdOiBodHRwKHJwY1VybHNbb3B0aW1pc20uaWRdKSxcbiAgW2Jhc2UuaWRdOiBodHRwKHJwY1VybHNbYmFzZS5pZF0pLFxufTtcblxuY29uc3QgY29ubmVjdG9ycyA9IFtcbiAgaW5qZWN0ZWQoe1xuICAgIHNoaW1EaXNjb25uZWN0OiB0cnVlLFxuICB9KSxcbl07XG5cbmNvbnN0IGNvbmZpZyA9IGNyZWF0ZUNvbmZpZyh7XG4gIGNoYWluczogW3NlcG9saWEsIG1haW5uZXQsIHBvbHlnb24sIGFyYml0cnVtLCBvcHRpbWlzbSwgYmFzZV0sXG4gIGNvbm5lY3RvcnMsXG4gIHRyYW5zcG9ydHMsXG59KTtcblxuY29uc3QgcXVlcnlDbGllbnQgPSBuZXcgUXVlcnlDbGllbnQoe1xuICBkZWZhdWx0T3B0aW9uczoge1xuICAgIHF1ZXJpZXM6IHtcbiAgICAgIHJldHJ5OiAxLFxuICAgICAgc3RhbGVUaW1lOiA2MDAwMCxcbiAgICAgIGdjVGltZTogMzAwMDAwLFxuICAgICAgcmVmZXRjaE9uV2luZG93Rm9jdXM6IGZhbHNlLFxuICAgICAgcmV0cnlEZWxheTogKGF0dGVtcHRJbmRleCkgPT4gTWF0aC5taW4oMTAwMCAqIDIgKiogYXR0ZW1wdEluZGV4LCAzMDAwMClcbiAgICB9LFxuICB9LFxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEFwcCh7IENvbXBvbmVudCwgcGFnZVByb3BzIH06IEFwcFByb3BzKSB7XG4gIHJldHVybiAoXG4gICAgPFdhZ21pUHJvdmlkZXIgY29uZmlnPXtjb25maWd9PlxuICAgICAgPFF1ZXJ5Q2xpZW50UHJvdmlkZXIgY2xpZW50PXtxdWVyeUNsaWVudH0+XG4gICAgICAgIDxCbG9ja3Njb3V0UHJvdmlkZXJzPlxuICAgICAgICAgIDxDb21wb25lbnQgey4uLnBhZ2VQcm9wc30gLz5cbiAgICAgICAgPC9CbG9ja3Njb3V0UHJvdmlkZXJzPlxuICAgICAgPC9RdWVyeUNsaWVudFByb3ZpZGVyPlxuICAgIDwvV2FnbWlQcm92aWRlcj5cbiAgKTtcbn0iXSwibmFtZXMiOlsiUmVhY3QiLCJjcmVhdGVDb25maWciLCJXYWdtaVByb3ZpZGVyIiwiaHR0cCIsInNlcG9saWEiLCJtYWlubmV0IiwicG9seWdvbiIsImFyYml0cnVtIiwib3B0aW1pc20iLCJiYXNlIiwiUXVlcnlDbGllbnQiLCJRdWVyeUNsaWVudFByb3ZpZGVyIiwiaW5qZWN0ZWQiLCJkeW5hbWljIiwiQmxvY2tzY291dFByb3ZpZGVycyIsInRoZW4iLCJtb2QiLCJkZWZhdWx0Iiwic3NyIiwibG9hZGluZyIsImRpdiIsImNsYXNzTmFtZSIsInNwYW4iLCJycGNVcmxzIiwiaWQiLCJ0cmFuc3BvcnRzIiwiY29ubmVjdG9ycyIsInNoaW1EaXNjb25uZWN0IiwiY29uZmlnIiwiY2hhaW5zIiwicXVlcnlDbGllbnQiLCJkZWZhdWx0T3B0aW9ucyIsInF1ZXJpZXMiLCJyZXRyeSIsInN0YWxlVGltZSIsImdjVGltZSIsInJlZmV0Y2hPbldpbmRvd0ZvY3VzIiwicmV0cnlEZWxheSIsImF0dGVtcHRJbmRleCIsIk1hdGgiLCJtaW4iLCJBcHAiLCJDb21wb25lbnQiLCJwYWdlUHJvcHMiLCJjbGllbnQiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/pages/_app.tsx\n");

/***/ }),

/***/ "./src/styles/globals.css":
/*!********************************!*\
  !*** ./src/styles/globals.css ***!
  \********************************/
/***/ (() => {



/***/ }),

/***/ "next/dist/compiled/next-server/pages.runtime.dev.js":
/*!**********************************************************************!*\
  !*** external "next/dist/compiled/next-server/pages.runtime.dev.js" ***!
  \**********************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/pages.runtime.dev.js");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "react/jsx-runtime":
/*!************************************!*\
  !*** external "react/jsx-runtime" ***!
  \************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-runtime");

/***/ }),

/***/ "@blockscout/app-sdk":
/*!**************************************!*\
  !*** external "@blockscout/app-sdk" ***!
  \**************************************/
/***/ ((module) => {

"use strict";
module.exports = import("@blockscout/app-sdk");;

/***/ }),

/***/ "@tanstack/react-query":
/*!****************************************!*\
  !*** external "@tanstack/react-query" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = import("@tanstack/react-query");;

/***/ }),

/***/ "wagmi":
/*!************************!*\
  !*** external "wagmi" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = import("wagmi");;

/***/ }),

/***/ "wagmi/chains":
/*!*******************************!*\
  !*** external "wagmi/chains" ***!
  \*******************************/
/***/ ((module) => {

"use strict";
module.exports = import("wagmi/chains");;

/***/ }),

/***/ "wagmi/connectors":
/*!***********************************!*\
  !*** external "wagmi/connectors" ***!
  \***********************************/
/***/ ((module) => {

"use strict";
module.exports = import("wagmi/connectors");;

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next"], () => (__webpack_exec__("./src/pages/_app.tsx")));
module.exports = __webpack_exports__;

})();