"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
function getMethods(store) {
    var methods = Object.getOwnPropertyNames(store).filter(function (k) { return !/^_/.test(k) && typeof Object.getOwnPropertyDescriptor(store, k).value === 'function'; });
    if (Object.getPrototypeOf(store).constructor.name !== 'Object') {
        var inheritedMethods = getMethods(Object.getPrototypeOf(store));
        inheritedMethods.forEach(function (method) {
            if (!methods.includes(method) && method !== 'constructor' && !/^_/.test(method)) {
                methods.push(method);
            }
        });
    }
    return methods;
}
var SyncQueue = (function () {
    function SyncQueue(connector, flushKeys) {
        this._queue = [];
        this._activated = false;
        this._connector = connector;
        this._flushKeys = flushKeys;
    }
    SyncQueue.prototype.push = function (state) {
        if (this._flushKeys.length > 0 && this._flushKeys.includes(Object.keys(state)[0])) {
            this._connector.setState(state);
            return;
        }
        this._queue.push(state);
        this._activate();
    };
    SyncQueue.prototype._activate = function () {
        var _this = this;
        if (this._activated) {
            return;
        }
        this._activated = true;
        setImmediate(function () {
            _this._connector.setState(Object.assign.apply(Object, [{}].concat(_this._queue)));
            _this._queue = [];
            _this._activated = false;
        });
    };
    return SyncQueue;
}());
var Connector = (function (_super) {
    __extends(Connector, _super);
    function Connector(props) {
        var _this = _super.call(this, props) || this;
        _this._actions = {};
        _this.syncQueue = new SyncQueue(_this, props.flushKeys || []);
        _this._initState(props.store);
        return _this;
    }
    Connector._wrapStore = function (store) {
        if (store === void 0) { store = []; }
        if (!Array.isArray(store)) {
            store = [store];
        }
        return store;
    };
    Connector.prototype.componentWillUpdate = function (nextProps) {
        if (nextProps.store !== this.props.store) {
            this._update(nextProps.store, this.props.store);
        }
    };
    Connector.prototype.componentWillUnmount = function () {
        this._update([], this.props.store);
    };
    Connector.prototype.render = function () {
        var _a = this.props, View = _a.View, rest = __rest(_a, ["View"]);
        if (!View || !this.state) {
            return null;
        }
        return (React.createElement(View, __assign({}, rest, this.state, this._actions)));
    };
    Connector.prototype._initState = function (store) {
        if (store === void 0) { store = []; }
        store = Connector._wrapStore(store);
        this.state = Object.assign.apply(Object, [{}].concat(store.map(this._bindStore.bind(this))));
    };
    Connector.prototype._update = function (store, prevStore) {
        var _this = this;
        if (store === void 0) { store = []; }
        if (prevStore === void 0) { prevStore = []; }
        var newStores = Connector._wrapStore(store);
        var oldStores = Connector._wrapStore(prevStore);
        var addedStores = newStores.filter(function (s) { return !oldStores.includes(s); });
        var removedStores = oldStores.filter(function (s) { return !newStores.includes(s); });
        removedStores.forEach(this._unbindStore.bind(this));
        addedStores.forEach(function (s) {
            _this.setState(_this._bindStore(s));
        });
    };
    Connector.prototype._unbindStore = function (store) {
        if (store._connectors && store._connectors.length > 0) {
            store._connectors.splice(store._connectors.indexOf(this), 1);
            if (store.__idle) {
                store.__idle();
            }
        }
    };
    Connector.prototype._bindStore = function (store) {
        var keys = Object.getOwnPropertyNames(store).filter(function (k) { return !/^_/.test(k); });
        var methods = getMethods(store);
        store._connectors = store._connectors || [];
        store._connectors.push(this);
        var _a = keys.reduce(function (_a, key) {
            var state = _a.state, properties = _a.properties;
            var privateKey = "_" + key;
            state[key] = store[key];
            store[privateKey] = store[key];
            if (!store._definedProperties) {
                var setter_1 = store.__lookupSetter__(key);
                properties[key] = {
                    set: function (value) {
                        if (setter_1) {
                            setter_1.bind(this)(value);
                        }
                        this[privateKey] = value;
                        this._connectors.forEach(function (connector) {
                            var _a;
                            connector.syncQueue.push((_a = {},
                                _a[key] = value,
                                _a));
                        });
                    },
                    get: function () {
                        return this[privateKey];
                    },
                };
            }
            return { state: state, properties: properties };
        }, { state: {}, properties: {} }), state = _a.state, properties = _a.properties;
        this._actions = __assign({}, this._actions, methods.reduce(function (memo, method) {
            var actionName = "on" + method.slice(0, 1).toUpperCase() + method.slice(1);
            memo[actionName] = function () {
                var params = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    params[_i] = arguments[_i];
                }
                return store[method].apply(store, params);
            };
            return memo;
        }, {}));
        if (!store._definedProperties) {
            Object.defineProperties(store, properties);
            store._definedProperties = true;
        }
        if (store.__binding) {
            store.__binding();
        }
        return state;
    };
    Connector.defaultProps = {
        store: [],
        View: null,
        flushKeys: [],
    };
    return Connector;
}(React.PureComponent));
exports.default = Connector;
//# sourceMappingURL=index.js.map