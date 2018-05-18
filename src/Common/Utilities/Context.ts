export interface IObservable<T> {
    subscribe(observer: (value: T, action?: string) => void, action?: string): void;
    unsubscribe(observer: (value: T, action?: string) => void, action?: string): void;
}

interface IObservableEvent<T> {
    action: string;
    value: T;
}

export class Observable<T> implements IObservable<T> {
    private observers: { [action: string]: ((value: T, action: string) => void)[] } = {};
    private events?: IObservableEvent<T>[];

    public notify(value: T, action: string, persistEvent?: boolean): void {
        if (this.observers[action]) {
            const observers = this.observers[action].slice();
            for (const observer of observers) {
                observer(value, action);
            }
        }

        if (this.observers[""]) {
            const observers = this.observers[""].slice();
            for (const observer of observers) {
                observer(value, action);
            }
        }

        if (persistEvent) {
            if (!this.events) {
                this.events = [];
            }

            this.events.push({ action: action, value: value });
        }
    }

    public subscribe(observer: (value: T, action: string) => void, action?: string): void {
        const innerAction = action || "";
        if (!this.observers[innerAction]) {
            this.observers[innerAction] = [];
        }

        this.observers[innerAction].push(observer);

        // Fire the callback for any events that were persisted when they were sent.
        if (this.events) {
            for (const event of this.events) {
                this.notify(event.value, event.action, false);
            }
        }
    }

    public unsubscribe(observer: (value: T, action: string) => void, action?: string): void {
        const innerAction = action || "";
        if (this.observers[innerAction]) {
            const observerIndex = this.observers[innerAction].indexOf(observer);
            if (observerIndex >= 0) {
                this.observers[innerAction].splice(observerIndex, 1);
            }
        }
    }
}

export interface ICollectionEntry<T> {
    key: string;
    value?: T;
}

export interface IObservableCollection<V> extends IObservable<ICollectionEntry<V>> {
    add(objectName: string, objectDefinition: V): void;
    get(objectName: string): V | undefined;
    keys(): string[];
}

export class ObservableCollection<V> extends Observable<ICollectionEntry<V>> implements IObservableCollection<V> {
    private objects: { [objectName: string]: V } = {};

    public add(objectName: string, objectDefinition: V): void {
        if (!this.objects.hasOwnProperty(objectName)) {
            this.objects[objectName] = objectDefinition;
            this.notify({ key: objectName, value: objectDefinition }, "add");
        }
    }

    public get(objectName: string): V | undefined {
        return this.objects[objectName];
    }

    public keys(): string[] {
        return Object.keys(this.objects);
    }
}

export interface IAppService {
    serviceStart?(pageContext: IAppPageContext): void;
    serviceEnd?(pageContext: IAppPageContext): void;
}

export abstract class AppService implements IAppService {
    protected pageContext: IAppPageContext;

    public serviceStart(pageContext: IAppPageContext): void {
        this.pageContext = pageContext;
    }

    public serviceEnd(_pageContext: IAppPageContext): void {
        // dispose
    }
}

export interface IAppObservableService<T> extends IAppService, IObservable<T> {
}

export abstract class AppObservableService<T> extends AppService implements IAppObservableService<T> {
    private observable = new Observable<T>();

    public subscribe(observer: (value: T, action: string) => void, action?: string): void {
        this.observable.subscribe(observer, action);
    }

    public unsubscribe(observer: (value: T, action: string) => void, action?: string): void {
        this.observable.unsubscribe(observer, action);
    }

    protected notify(value: T, action: string, persistEvent?: boolean) {
        this.observable.notify(value, action, persistEvent);
    }
}

export type ServiceFactory = new () => IAppService;

export interface IServiceDefinition {
    serviceFactory: ServiceFactory;
}

export const Services: IObservableCollection<IServiceDefinition> = new ObservableCollection<IServiceDefinition>();

export interface IAppPageContext {
    getService<T extends IAppService>(serviceName: string): T;
}

export interface IReactAppContext {
    appContext: IAppPageContext;
}

class AppPageContext implements IAppPageContext {
    private initializatonInProgress: { [serviceName: string]: boolean } = {};

    private serviceInstances: { [serviceName: string]: IAppService } = {};
    private services: IObservableCollection<IServiceDefinition>;

    constructor(serviceRegistry: IObservableCollection<IServiceDefinition>) {
        this.services = serviceRegistry;
    }

    public getService<T extends IAppService>(serviceName: string): T {
        let registeredService = this.serviceInstances[serviceName];

        // If no service is available, we will start an instance of the service.
        if (!registeredService) {
            const serviceDefinition = this.services.get(serviceName);
            if (serviceDefinition) {
                registeredService = this._loadService(serviceName, serviceDefinition);
            }

            if (!registeredService) {
                throw new Error(`No service has been registered with the name "${serviceName}".`);
            }
        }

        return registeredService as T;
    }

    private _loadService<T>(serviceName: string, serviceDefinition: IServiceDefinition): T {
        let registeredService: IAppService;

        if (this.initializatonInProgress[serviceName]) {
            throw `Unable to initialize service due to cyclic dependency: ${serviceName}`;
        }

        try {
            // Mark this service as initialization in progress to detect cyclic dependencies in _serviceStart.
            this.initializatonInProgress[serviceName] = true;

            // Create and initialize a new instance of the service.
            registeredService = new serviceDefinition.serviceFactory();
            if (registeredService.serviceStart) {
                registeredService.serviceStart(this);
            }
        }
        catch (exception) {
            delete this.initializatonInProgress[serviceName];
            throw exception;
        }

        // Save this service in the registered services.
        this.serviceInstances[serviceName] = registeredService;
        delete this.initializatonInProgress[serviceName];

        return registeredService as T;
    }
}

/**
 * Context for the currently executing page
 */
export const AppContext: IAppPageContext = new AppPageContext(Services);
