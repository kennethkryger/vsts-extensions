import * as React from "react";

import { Loading } from "Common/Components/Loading";
import { ThrottledTextField } from "Common/Components/Utilities/ThrottledTextField";
import {
    IVssComponentProps, IVssComponentState, VssComponent
} from "Common/Components/Utilities/VssComponent";
import { WorkItemRelationTypePicker } from "Common/Components/VSTS/WorkItemRelationTypePicker";
import { BaseDataService } from "Common/Services/BaseDataService";
import {
    WorkItemRelationTypeService, WorkItemRelationTypeServiceName
} from "Common/Services/WorkItemRelationTypeService";
import { IReactAppContext } from "Common/Utilities/Context";
import { css } from "OfficeFabric/Utilities";
import { WorkItemRelationType } from "TFS/WorkItemTracking/Contracts";

export interface IAddExistingRelationActionRendererProps extends IVssComponentProps {
    workItemId: string;
    relationType: string;
    valueError?: string;
    onWorkItemIdChange(value: string): void;
    onRelationTypeChange(value: string): void;
}

export class AddExistingRelationActionRenderer extends VssComponent<IAddExistingRelationActionRendererProps, IVssComponentState> {
    private _workItemRelationTypeService: WorkItemRelationTypeService;

    constructor(props: IAddExistingRelationActionRendererProps, context?: IReactAppContext) {
        super(props, context);
        this._workItemRelationTypeService = this.context.appContext.getService<WorkItemRelationTypeService>(WorkItemRelationTypeServiceName);
    }

    public componentDidMount() {
        super.componentDidMount();
        this._workItemRelationTypeService.initializeWorkItemRelationTypes();
    }

    public render(): JSX.Element {
        if (this.state.loading) {
            return <Loading />;
        }

        const selectedRelationType: WorkItemRelationType = this._workItemRelationTypeService.getItem(this.props.relationType);

        return (
            <div className={css("add-existing-relation-picker", this.props.className)}>
                <WorkItemRelationTypePicker
                    className="action-property-control"
                    selectedOption={selectedRelationType}
                    selectedValue={this.props.relationType}
                    onChange={this._onWorkItemRelationTypeChange}
                    label="Work item relation type"
                    info="Select a work item relation type to link the workitems"
                    delay={200}
                    required={true}
                />
                <ThrottledTextField
                    className="action-property-control"
                    value={this.props.workItemId}
                    label="Work item id"
                    required={true}
                    info="Either add a work item id or use @fieldValue macro to pull work item id from a field value"
                    onChanged={this._onWorkItemIdChange}
                    delay={200}
                    errorMessage={this.props.valueError}
                />
            </div>
        );
    }

    protected getObservableDataServices(): BaseDataService<any, any, any>[] {
        return [this._workItemRelationTypeService];
    }

    protected getDataServiceState(): IVssComponentState {
        return {
            loading: this._workItemRelationTypeService.isLoading(),
        };
    }

    protected getInitialState(): IVssComponentState {
        return {
            loading: true
        };
    }

    private _onWorkItemIdChange = (value: string) => {
        this.props.onWorkItemIdChange(value);
    }

    private _onWorkItemRelationTypeChange = (witRelationType: WorkItemRelationType, value?: string) => {
        this.props.onRelationTypeChange(witRelationType ? witRelationType.name : value);
    }
}
