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
  _syncQueues?: IObject[][];
}

export type ConnectorStore = IStore | IStore[];

export interface IConnectorProps extends React.Attributes, IObject {
  store?: ConnectorStore;
  View: React.ReactType;
}

export default class Connector extends React.PureComponent<IConnectorProps> {
  public static defaultProps = {
    store: [],
    View: null,
  };

  private static _wrapStore(store: ConnectorStore = []) {
    if (!Array.isArray(store)) {
      store = [store];
    }
    return store;
  }

  private _syncQueue: IObject[];
  private _queueInterval: number;
  private _actions: IObject = {};

  constructor(props: IConnectorProps) {
    super(props);

    // Start sync queue
    this._syncQueue = [];
    this._queueInterval = setInterval(() => {
      if (this._syncQueue.length > 0) {
        try {
          this.setState(Object.assign({}, ...this._syncQueue));
        } catch (err) {
          console.error(err);
        }
        this._syncQueue.splice(0);
      }
    });
    this._initState(props.store);
  }

  public componentWillUpdate(nextProps: Readonly<IConnectorProps>) {
    if (nextProps.store !== this.props.store) {
      this._update(nextProps.store, this.props.store);
    }
  }

  public componentWillUnmount() {
    clearInterval(this._queueInterval);
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
    store = Connector._wrapStore(store);
    prevStore = Connector._wrapStore(prevStore);

    // Unbind previous stores
    (prevStore as IStore[]).forEach(this._unbindStore.bind(this));
    // Bind stores
    (store as IStore[]).forEach(this._bindStore.bind(this));
  }

  private _unbindStore(store: IStore) {
    // Unbind sync queue
    if (store._syncQueues && store._syncQueues.length > 0) {
      store._syncQueues.splice(store._syncQueues.indexOf(this._syncQueue), 1);
    }
  }

  private _bindStore(store: IStore) {
    const keys = Object.getOwnPropertyNames(store).filter(k => !/^_/.test(k));
    const methods = getMethods(store);

    // Bind sync queue
    store._syncQueues = store._syncQueues || [];
    store._syncQueues.push(this._syncQueue);

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
          set(value: any) {
            if (setter) {
              setter.bind(this)(value);
            }
            this[privateKey] = value;
            const setState = {
              [key]: value,
            };
            (this._syncQueues as IObject[][]).forEach(syncQueue => syncQueue.push(setState));
          },
          get() {
            return this[privateKey];
          },
        };
      }

      return { state, properties };
    }, { state: {}, properties: {} });

    // Initialize state
    this._syncQueue.push(state);

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

    return state;
  }
}
