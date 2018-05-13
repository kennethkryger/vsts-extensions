import { IObservable, Observable } from "VSSUI/Utilities/Observable";

/**
 * When an action occurs on an IObservableCollection the event should take the form
 * of an ICollectionEntry<T> where T is the type of object being stored in
 * the collection.
 */
export interface ICollectionEntry<T> {
    key: string;
    value?: T;
}

/**
 * An Observable collection is used to track a set of objects by name and offer notifications
 * for consumers when the collection has changed.
 *
 * EventTypes:
 *  add - ICollectionEvent<V>
 */
export interface IObservableCollection<V> extends IObservable<ICollectionEntry<V>> {

    /**
     * Adding an object to the collection will notify all observers of the collection
     * and keep track of the objects.
     *
     * @param objectName - name of the object be registered.
     *
     * @param objectDefinition - details of the object being registered
     */
    add(objectName: string, objectDefinition: V): void;

    /**
     * get is used to retrieve the objectDefinition for named object.
     *
     * @param objectName - name of the object to get the definition.
     */
    get(objectName: string): V | undefined;

    /**
     * A read-only collection of the existing objects.
     */
    keys(): string[];
}

/**
 * An ObservableCollection can be used to key a named collection of objects
 * and offer an observable endpoint.
 */
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
    serviceStart?(pageContext: IAppContext): void;
    serviceEnd?(pageContext: IAppContext): void;
}

export abstract class AppService implements IAppService {
    protected pageContext: IAppContext;

    public serviceStart(pageContext: IAppContext): void {
        this.pageContext = pageContext;
    }

    public serviceEnd(_pageContext: IAppContext): void {
        // dispose
    }

    public serviceRestart(pageContext: IAppContext): void {
        this.pageContext = pageContext;
    }
}

/**
 * An IAppObservableService<T> is a standard service that offers an observable as part
 * of the service itself. If the service wants to publish events this is an easy
 * model to follow.
 */
export interface IAppObservableService<T> extends IAppService, IObservable<T> {
}

/**
 * An ObservableService is a service that allows callers to signup for notifications when
 * data within the service is changed.
 */
export abstract class AppObservableService<T> extends AppService implements IAppObservableService<T> {
    private observable = new Observable<T>();

    public subscribe(observer: (value: T, action: string) => void, action?: string): void {
        this.observable.subscribe(observer, action);
    }

    public unsubscribe(observer: (value: T, action: string) => void, action?: string): void {
        this.observable.unsubscribe(observer, action);
    }

    protected _notify(value: T, action: string, persistEvent?: boolean) {
        this.observable.notify(value, action, persistEvent);
    }
}

/**
 * A service factory is the method used to create and initialize an IAppService.
 */
export type ServiceFactory = new () => IAppService;

/**
 * Details that describe how a service is created and its capabilities.
 */
export interface IServiceDefinition {
    /**
     * This is the constructor used to create an instance of the service.
     */
    serviceFactory: ServiceFactory;
}

/**
 * Create and expose the service registry to the platform for developers to register
 * their services.
 */
export const Services: IObservableCollection<IServiceDefinition> = new ObservableCollection<IServiceDefinition>();

export interface IAppContext {
    getService<T extends IAppService>(serviceName: string): T;
}

export class AppContext implements IAppContext {
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

            // Mark this service as initialization in progress to detect cyclic dependencies in serviceStart.
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
