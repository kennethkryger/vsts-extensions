import { BaseDataService } from "Library/Services/BaseDataService";
import { BaseComponent, IBaseProps } from "OfficeFabric/Utilities";

export interface IBaseFluxComponentProps extends IBaseProps {
    className?: string;
}

export interface IBaseFluxComponentState {
    loading?: boolean;
}

export class BaseFluxComponent<TProps extends IBaseFluxComponentProps, TState extends IBaseFluxComponentState> extends BaseComponent<TProps, TState> {
    constructor(props: TProps, context?: any) {
        super(props, context);
        this.initializeState();
    }

    public componentDidMount() {
        super.componentDidMount();
        for (const dataService of this.getObservableDataServices()) {
            dataService.subscribe(this._onDataChanged, "dataChanged");
        }
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
        for (const dataService of this.getObservableDataServices()) {
            dataService.subscribe(this._onDataChanged, "dataChanged");
        }
    }

    protected getObservableDataServices(): BaseDataService<any, any, any>[] {
        return [];
    }

    protected getDataServiceState(): TState {
        return {} as TState;
    }

    protected initializeState(): void {
        this.state = {} as TState;
    }

    private _onDataChanged = () => {
        const newDataState = this.getDataServiceState();
        this.setState(newDataState);
    }
}
