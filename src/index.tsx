import * as React from 'react';

function getMethods(store: object) {
  const methods = Object.getOwnPropertyNames(store).filter(k => !/^_/.test(k) && typeof Object.getOwnPropertyDescriptor(store, k)!.value === 'function');
  if (Object.getPrototypeOf(store).constructor.name !== 'Object') {
    const inheritedMethods = getMethods(Object.getPrototypeOf(store));
    inheritedMethods.forEach(method => {
      if (!methods.includes(method) && method !== 'constructor' && !/^_/.test(method)) {
        methods.push(method);
      }
    });
  }
  return methods;
}

export interface IObject {
  [key: string]: any;
}

export interface IStore extends IObject {
  _connectors?: Connector[];

  __binding?(): void;

  __idle?(): void;
}

export type ConnectorStore = IStore | IStore[];

export interface IConnectorProps extends React.Attributes, IObject {
  store?: ConnectorStore;
  View: React.ReactType;
  flushKeys?: string[];
}

class SyncQueue {
  private _queue: IObject[] = [];
  private _activated: boolean = false;
  private _connector: Connector;
  private _flushKeys: string[];

  constructor(connector: Connector, flushKeys: string[]) {
    this._connector = connector;
    this._flushKeys = flushKeys;
  }

  public push(state: IObject) {
    if (this._flushKeys.length > 0 && this._flushKeys.includes(Object.keys(state)[0])) {
      this._connector.setState(state);
      return;
    }
    this._queue.push(state);
    this._activate();
  }

  private _activate() {
    if (this._activated) {
      return;
    }
    this._activated = true;
    setImmediate(() => {
      this._connector.setState(Object.assign({}, ...this._queue));
      this._queue = [];
      this._activated = false;
    });
  }
}

export default class Connector extends React.PureComponent<IConnectorProps> {
  public static defaultProps = {
    store: [],
    View: null,
    flushKeys: [],
  };

  private static _wrapStore(store: ConnectorStore = []) {
    if (!Array.isArray(store)) {
      store = [store];
    }
    return store;
  }

  public syncQueue: SyncQueue;

  private _actions: IObject = {};

  constructor(props: IConnectorProps) {
    super(props);
    this.syncQueue = new SyncQueue(this, props.flushKeys || []);
    this._initState(props.store);
  }

  public componentWillUpdate(nextProps: Readonly<IConnectorProps>) {
    if (nextProps.store !== this.props.store) {
      this._update(nextProps.store, this.props.store);
    }
  }

  public componentWillUnmount() {
    // When connector unmount, unbind all stores.
    this._update([], this.props.store);
  }

  public render() {
    const { View, ...rest } = this.props;
    if (!View || !this.state) {
      return null;
    }
    return (
      <View
        {...rest}
        {...this.state}
        {...this._actions}
      />
    );
  }

  private _initState(store: ConnectorStore = []) {
    store = Connector._wrapStore(store);
    this.state = Object.assign({}, ...(store as IStore[]).map(this._bindStore.bind(this)));
  }

  private _update(store: ConnectorStore = [], prevStore: ConnectorStore = []) {
    const newStores = Connector._wrapStore(store) as IStore[];
    const oldStores = Connector._wrapStore(prevStore) as IStore[];

    const addedStores = newStores.filter(s => !oldStores.includes(s));
    const removedStores = oldStores.filter(s => !newStores.includes(s));

    // Unbind previous stores
    removedStores.forEach(this._unbindStore.bind(this));
    // Bind stores
    addedStores.forEach(s => {
      this.setState(this._bindStore(s));
    });
  }

  private _unbindStore(store: IStore) {
    // Unbind connector
    if (store._connectors && store._connectors.length > 0) {
      store._connectors.splice(store._connectors.indexOf(this), 1);
      // When all connectors has unbind, the store is idle, call the idle method
      if (store.__idle) {
        store.__idle();
      }
    }
  }

  private _bindStore(store: IStore) {
    const keys = Object.getOwnPropertyNames(store).filter(k => !/^_/.test(k));
    const methods = getMethods(store);

    // Bind connector
    store._connectors = store._connectors || [];
    store._connectors.push(this);

    const { state, properties } = keys.reduce(({ state, properties }: {
      state: IObject;
      properties: IObject;
    }, key) => {
      const privateKey = `_${key}`;

      state[key] = store[key];
      store[privateKey] = store[key];

      if (!store._definedProperties) {
        const setter = store.__lookupSetter__(key);
        properties[key] = {
          set(this: IStore, value: any) {
            if (setter) {
              setter.bind(this)(value);
            }
            this[privateKey] = value;
            this._connectors!.forEach(connector => {
              connector.syncQueue.push({
                [key]: value,
              });
            });
          },
          get() {
            return this[privateKey];
          },
        };
      }

      return { state, properties };
    }, { state: {}, properties: {} });

    // Transform actions
    this._actions = {
      ...this._actions,
      ...methods.reduce((memo: IObject, method) => {
        const actionName = `on${method.slice(0, 1).toUpperCase()}${method.slice(1)}`;
        memo[actionName] = (...params: any[]) => {
          return store[method](...params);
        };
        return memo;
      }, {}),
    };

    // Define getters/setters
    if (!store._definedProperties) {
      Object.defineProperties(store, properties);
      store._definedProperties = true;
    }

    // Has bind to connector, call the __binding method of the store.
    if (store.__binding) {
      store.__binding();
    }

    return state;
  }
}
