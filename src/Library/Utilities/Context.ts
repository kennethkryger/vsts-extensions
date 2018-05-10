import { IObservable, Observable } from "VSSUI/Utilities/Observable";

/**
 * An IVssObservableService<T> is a standard service that offers an observable as part
 * of the service itself. If the service wants to publish events this is an easy
 * model to follow.
 */
export interface IAppService<T> extends IObservable<T> {
    /**
     * serviceStart is called when a service is retrieved from the IAppContext
     * and the service implements IAppService.
     */
    serviceStart?(pageContext: IAppContext): void;

    /**
     * serviceEnd is called when the pageContext is being unloaded, this gives services
     * the opportunity to clean up anything they need to.
     */
    serviceEnd?(pageContext: IAppContext): void;
}

/**
 * An ObservableService is a service that allows callers to signup for notifications when
 * data within the service is changed.
 */
export abstract class AppService<T> extends Observable<T> implements IAppService<T> {
    protected pageContext: IAppContext;

    public serviceStart(pageContext: IAppContext): void {
        this.pageContext = pageContext;
    }

    public serviceEnd(_pageContext: IAppContext): void {
        // override
    }

    public serviceRestart(pageContext: IAppContext): void {
        this.pageContext = pageContext;
    }
}

/**
 * The IAppContext is at the core of the VSS platform. It acts as the
 * service provider for the page. Callers should register and interact with
 * API's through the pageContext instead of dealing directly with instances.
 * This supports a better seperation of concerns and encapsulation within
 * service objects through interfaces.
 */
export interface IAppContext {

    /**
     * Get a service by service name. The caller supplies the 'expected' type and
     * this method returns it as this type. There is no actual validation so it is
     * the responsibility of the caller to ensure the type is correct.
     *
     * @param serviceName - name of the service to retrieve.
     */
    getService<T extends IAppService>(serviceName: string): T;

    /**
     * For callers that want a unique number for this page. They can call getUniqueNumber().
     */
    getUniqueNumber(): number;
}

/**
 * Core WebContext used by the web platform to manage the page being executed
 */
export class AppContext implements IAppContext {

    // State information used to track services being initialized and destroyed.
    private initializatonInProgress: { [serviceName: string]: boolean } = {};
    private contextUnloadInProgress: boolean;

    // Details about the registered and active services.
    private serviceInstances: { [serviceName: string]: IAppService } = {};
    private subscriber: (entry: ICollectionEntry<IServiceDefinition>, action: string) => void;
    private services: IObservableCollection<IServiceDefinition>;

    // Unique counter for the pageContext.
    private uniqueNumber: number = 0;

    constructor(serviceRegistry: IObservableCollection<IServiceDefinition>) {
        this.services = serviceRegistry;

        // Start any new services that are registered after context creation that are startup
        this.subscriber = (entry: ICollectionEntry<IServiceDefinition>, action: string) => {
            if (action === "add") {
                if (entry && entry.value && entry.value.options && (entry.value.options & ServiceOptions.Startup) === ServiceOptions.Startup) {
                    this.getService<IAppService>(entry.key);
                }
            }
        };

        // Subscribe to service changes to ensure we start any persistant ones upon registration
        this.services.subscribe(this.subscriber);

        // Once the initial document is loaded we will setup of FPS navigation handler.
        document.addEventListener("DOMContentLoaded", () => {

            // Signup for FPS navigation events. We will use it to reset the service instances
            // associated with the current page.
            document.body.addEventListener("fpsLoaded", (event: FastPageSwitchEvent<FastPageSwitchEventLoadedDetail>) => {
                const persistantInstances: { [serviceName: string]: IAppService } = {};

                // Mark the context as being unloaded while we shutdown existing services.
                this.contextUnloadInProgress = true;

                // Go through all active services at this point in time.
                for (const serviceName of Object.keys(this.serviceInstances)) {
                    const serviceDefinition = this.services.get(serviceName);

                    // Save any persistant services for restart, and clear any non persistant services.
                    if (serviceDefinition && serviceDefinition.options && (serviceDefinition.options & ServiceOptions.Persistant) === ServiceOptions.Persistant) {
                        persistantInstances[serviceName] = this.serviceInstances[serviceName];
                    }
                    else {

                        // If the service implemented serviceEnd we will call it before removing from the context.
                        const registeredService = this.serviceInstances[serviceName];
                        if (registeredService._serviceEnd) {
                            try {
                                registeredService._serviceEnd(this);
                            }
                            catch (exception) {
                                console.error(exception);
                            }
                        }

                        delete this.serviceInstances[serviceName];
                    }
                }

                this.contextUnloadInProgress = false;

                // First restart any services that already exist. This may get dependent services that are
                // marked as startup created.
                for (let serviceName in persistantInstances) {
                    const serviceInstance = persistantInstances[serviceName] as IVssPersistantService;

                    if (serviceInstance && serviceInstance._serviceRestart) {
                        serviceInstance._serviceRestart(this);
                    }
                }

                // Now create any services that are marked as startup services.
                for (let serviceName of this.services.keys()) {
                    const serviceDefinition = this.services.get(serviceName);

                    if (serviceDefinition && serviceDefinition.options && (serviceDefinition.options & ServiceOptions.Startup) === ServiceOptions.Startup) {
                        if (!this.serviceInstances[serviceName]) {
                            this._loadService<IAppService>(serviceName, serviceDefinition);
                        }
                    }
                }
            });
        });
    }

    public getService<T extends IAppService>(serviceName: string): T {

        if (!this.contextUnloadInProgress) {
            let registeredService = this.serviceInstances[serviceName];

            // If no service is available, we will start an instance of the service.
            if (!registeredService) {
                const serviceDefinition = this.services.get(serviceName);
                if (serviceDefinition) {
                    if (!serviceDefinition.options || (serviceDefinition.options & ServiceOptions.Private) !== ServiceOptions.Private) {
                        registeredService = this._loadService(serviceName, serviceDefinition);
                    }
                }

                if (!registeredService) {
                    throw new Error(`No service has been registered with the name "${serviceName}".`);
                }
            }

            return registeredService as T;
        }
        else {
            throw new Error("Services can't be requested while a shutdown is in progress");
        }
    }

    public getUniqueNumber(): number {
        return ++this.uniqueNumber;
    }

    private _loadService<T>(serviceName: string, serviceDefinition: IServiceDefinition): T {
        let registeredService: IAppService;

        if (this.initializatonInProgress[serviceName]) {
            throw "Unable to initialize service due to cyclic dependency: " + serviceName;
        }

        try {

            // Mark this service as initialization in progress to detect cyclic dependencies in _serviceStart.
            this.initializatonInProgress[serviceName] = true;

            // Create and initialize a new instance of the service.
            registeredService = new serviceDefinition.serviceFactory();
            if (registeredService._serviceStart) {
                registeredService._serviceStart(this);
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
