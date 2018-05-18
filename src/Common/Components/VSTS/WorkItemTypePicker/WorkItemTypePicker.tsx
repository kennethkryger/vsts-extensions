import * as React from "react";

import { IVssComponentState, VssComponent } from "Common/Components/Utilities/VssComponent";
import { ISimpleComboProps, SimpleCombo } from "Common/Components/VssCombo/SimpleCombo";
import { BaseDataService } from "Common/Services/BaseDataService";
import { WorkItemTypeService, WorkItemTypeServiceName } from "Common/Services/WorkItemTypeService";
import { IReactAppContext } from "Common/Utilities/Context";
import { Spinner, SpinnerSize } from "OfficeFabric/Spinner";
import { css } from "OfficeFabric/Utilities";
import { WorkItemType } from "TFS/WorkItemTracking/Contracts";

export interface IWorkItemTypePickerState extends IVssComponentState {
    allWits?: WorkItemType[];
}

export class WorkItemTypePicker extends VssComponent<ISimpleComboProps<WorkItemType>, IWorkItemTypePickerState> {
    private _workItemTypeService: WorkItemTypeService;

    constructor(props: ISimpleComboProps<WorkItemType>, context?: IReactAppContext) {
        super(props, context);
        this._workItemTypeService = this.context.appContext.getService<WorkItemTypeService>(WorkItemTypeServiceName);
    }

    public componentDidMount() {
        super.componentDidMount();
        if (this._workItemTypeService.isLoaded()) {
            this.setState({
                allWits: this._workItemTypeService.getAll()
            });
        }
        else {
            this._workItemTypeService.initializeWorkItemTypes();
        }
    }

    public render(): JSX.Element {
        if (!this.state.allWits) {
            return <Spinner size={SpinnerSize.large} />;
        }

        const props = {
            ...this.props,
            className: css("work-item-type-picker", this.props.className),
            getItemText: (wit: WorkItemType) => wit.name,
            options: this.state.allWits,
            limitedToAllowedOptions: true
        } as ISimpleComboProps<WorkItemType>;

        return <SimpleCombo {...props} />;
    }

    protected getDataServiceState(): IWorkItemTypePickerState {
        return {
            allWits: this._workItemTypeService.getAll()
        };
    }

    protected getObservableDataServices(): BaseDataService<any, any, any>[] {
        return [this._workItemTypeService];
    }
}
