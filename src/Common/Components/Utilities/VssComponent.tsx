import { BaseDataService } from "Common/Services/BaseDataService";
import { IReactAppContext } from "Common/Utilities/Context";
import { BaseComponent, IBaseProps } from "OfficeFabric/Utilities";
import * as PropTypes from "prop-types";

export interface IVssComponentProps extends IBaseProps {
    className?: string;
}

export interface IVssComponentState {
    loading?: boolean;
}

export class VssComponent<TProps extends IVssComponentProps, TState extends IVssComponentState> extends BaseComponent<TProps, TState> {
    public static defaultProps = {};
    public static contextTypes = {
        appContext: PropTypes.object
    };

    public context: IReactAppContext;

    constructor(props: TProps, context?: IReactAppContext) {
        super(props, context);
        if (context) {
            this.context = context;
        }
        this.state = this.getInitialState(props, context);
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

    protected getInitialState(_props: TProps, _context?: IReactAppContext): TState {
        return {} as TState;
    }

    private _onDataChanged = () => {
        const newDataState = this.getDataServiceState();
        this.setState(newDataState);
    }
}
