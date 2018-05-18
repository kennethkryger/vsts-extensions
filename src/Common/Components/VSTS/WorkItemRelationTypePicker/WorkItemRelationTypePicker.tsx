import * as React from "react";

import { IVssComponentState, VssComponent } from "Common/Components/Utilities/VssComponent";
import { ISimpleComboProps, SimpleCombo } from "Common/Components/VssCombo/SimpleCombo";
import { BaseDataService } from "Common/Services/BaseDataService";
import {
    WorkItemRelationTypeService, WorkItemRelationTypeServiceName
} from "Common/Services/WorkItemRelationTypeService";
import { IReactAppContext } from "Common/Utilities/Context";
import { Spinner, SpinnerSize } from "OfficeFabric/Spinner";
import { css } from "OfficeFabric/Utilities";
import { WorkItemRelationType } from "TFS/WorkItemTracking/Contracts";

export interface IWorkItemRelationTypePickerState extends IVssComponentState {
    relationTypes?: WorkItemRelationType[];
}

export class WorkItemRelationTypePicker extends VssComponent<ISimpleComboProps<WorkItemRelationType>, IWorkItemRelationTypePickerState> {
    private _workItemRelationTypeService: WorkItemRelationTypeService;

    constructor(props: ISimpleComboProps<WorkItemRelationType>, context?: IReactAppContext) {
        super(props, context);
        this._workItemRelationTypeService = this.context.appContext.getService<WorkItemRelationTypeService>(WorkItemRelationTypeServiceName);
    }

    public componentDidMount() {
        super.componentDidMount();
        if (this._workItemRelationTypeService.isLoaded()) {
            this.setState({
                relationTypes: this._workItemRelationTypeService.getAll()
            });
        }
        else {
            this._workItemRelationTypeService.initializeWorkItemRelationTypes();
        }
    }

    public render(): JSX.Element {
        if (!this.state.relationTypes) {
            return <Spinner size={SpinnerSize.large} />;
        }

        const props = {
            ...this.props,
            className: css("work-item-relation-type-picker", this.props.className),
            getItemText: (relationType: WorkItemRelationType) => relationType.name,
            options: this.state.relationTypes,
            limitedToAllowedOptions: true
        } as ISimpleComboProps<WorkItemRelationType>;

        return <SimpleCombo {...props} />;
    }

    protected getDataServiceState(): IWorkItemRelationTypePickerState {
        return {
            relationTypes: this._workItemRelationTypeService.getAll()
        };
    }

    protected getObservableDataServices(): BaseDataService<any, any, any>[] {
        return [this._workItemRelationTypeService];
    }
}
