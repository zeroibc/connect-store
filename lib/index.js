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
var Connector = (function (_super) {
    __extends(Connector, _super);
    function Connector(props) {
        var _this = _super.call(this, props) || this;
        _this._actions = {};
        _this._syncQueue = [];
        _this._queueInterval = setInterval(function () {
            if (_this._syncQueue.length > 0) {
                try {
                    _this.setState(Object.assign.apply(Object, [{}].concat(_this._syncQueue)));
                }
                catch (err) {
                    console.error(err);
                }
                _this._syncQueue.splice(0);
            }
        });
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
        clearInterval(this._queueInterval);
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
        if (store === void 0) { store = []; }
        if (prevStore === void 0) { prevStore = []; }
        store = Connector._wrapStore(store);
        prevStore = Connector._wrapStore(prevStore);
        prevStore.forEach(this._unbindStore.bind(this));
        store.forEach(this._bindStore.bind(this));
    };
    Connector.prototype._unbindStore = function (store) {
        if (store._syncQueues && store._syncQueues.length > 0) {
            store._syncQueues.splice(store._syncQueues.indexOf(this._syncQueue), 1);
        }
    };
    Connector.prototype._bindStore = function (store) {
        var keys = Object.getOwnPropertyNames(store).filter(function (k) { return !/^_/.test(k); });
        var methods = getMethods(store);
        store._syncQueues = store._syncQueues || [];
        store._syncQueues.push(this._syncQueue);
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
                        var setState = (_a = {},
                            _a[key] = value,
                            _a);
                        this._syncQueues.forEach(function (syncQueue) { return syncQueue.push(setState); });
                        var _a;
                    },
                    get: function () {
                        return this[privateKey];
                    },
                };
            }
            return { state: state, properties: properties };
        }, { state: {}, properties: {} }), state = _a.state, properties = _a.properties;
        this._syncQueue.push(state);
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
        return state;
    };
    Connector.defaultProps = {
        store: [],
        View: null,
    };
    return Connector;
}(React.PureComponent));
exports.default = Connector;
//# sourceMappingURL=index.js.map