import * as React from "react";

import { Loading } from "Common/Components/Loading";
import {
    IVssComponentProps, IVssComponentState, VssComponent
} from "Common/Components/Utilities/VssComponent";
import { WorkItemFieldPicker } from "Common/Components/VSTS/WorkItemFieldPicker";
import { WorkItemFieldValuePicker } from "Common/Components/VSTS/WorkItemFieldValuePicker";
import { BaseDataService } from "Common/Services/BaseDataService";
import {
    WorkItemFieldService, WorkItemFieldServiceName
} from "Common/Services/WorkItemFieldService";
import { WorkItemTypeService, WorkItemTypeServiceName } from "Common/Services/WorkItemTypeService";
import { contains } from "Common/Utilities/Array";
import { IReactAppContext } from "Common/Utilities/Context";
import { stringEquals } from "Common/Utilities/String";
import { css } from "OfficeFabric/Utilities";
import { ExcludedFields } from "OneClick/Constants";
import { WorkItemField } from "TFS/WorkItemTracking/Contracts";

export interface IFieldNameValuePickerProps extends IVssComponentProps {
    fieldRefName: string;
    fieldValue: string;
    workItemType: string;
    valueError?: string;
    onFieldChange(fieldRefName: string): void;
    onFieldValueChange(value: string): void;
}

export class FieldNameValuePicker extends VssComponent<IFieldNameValuePickerProps, IVssComponentState> {
    private _workItemTypeService: WorkItemTypeService;
    private _fieldService: WorkItemFieldService;

    constructor(props: IFieldNameValuePickerProps, context?: IReactAppContext) {
        super(props, context);
        this._fieldService = this.context.appContext.getService<WorkItemFieldService>(WorkItemFieldServiceName);
        this._workItemTypeService = this.context.appContext.getService<WorkItemTypeService>(WorkItemTypeServiceName);
    }

    public componentDidMount() {
        super.componentDidMount();
        this._fieldService.initializeWorkItemFields();
    }

    public render(): JSX.Element {
        if (this.state.loading) {
            return <Loading />;
        }

        const workItemType = this._workItemTypeService.getItem(this.props.workItemType);
        const witFields = workItemType.fields.map(f => f.referenceName);
        let selectedField: WorkItemField = this._fieldService.getItem(this.props.fieldRefName);

        if (selectedField == null
            || !contains(witFields, this.props.fieldRefName, (s1, s2) => stringEquals(s1, s2, true))
            || contains(ExcludedFields, selectedField.referenceName, (s1, s2) => stringEquals(s1, s2, true))) {
            selectedField = null;
        }

        return (
            <div className={css("field-name-value-picker", this.props.className)}>
                <WorkItemFieldPicker
                    className="action-property-control"
                    selectedOption={selectedField}
                    selectedValue={this.props.fieldRefName}
                    onChange={this._onFieldChange}
                    label="Field name"
                    info="Select a field"
                    delay={200}
                    required={true}
                    excludeFields={ExcludedFields}
                    workItemType={this.props.workItemType}
                />
                <WorkItemFieldValuePicker
                    className="action-property-control"
                    value={this.props.fieldValue}
                    field={selectedField}
                    workItemType={this.props.workItemType}
                    onChange={this._onFieldValueChange}
                    delay={200}
                    label="Field value"
                    info="Enter field value. Supported macros - @fieldValue, @today, @me."
                    error={this.props.valueError}
                />
            </div>
        );
    }

    protected getObservableDataServices(): BaseDataService<any, any, any>[] {
        return [this._fieldService];
    }

    protected getDataServiceState(): IVssComponentState {
        return {
            loading: this._fieldService.isLoading()
        };
    }

    protected getInitialState(): IVssComponentState {
        return {
            loading: true
        };
    }

    private _onFieldChange = (field: WorkItemField, value?: string) => {
        this.props.onFieldChange(field ? field.referenceName : value);
    }

    private _onFieldValueChange = (value: any) => {
        this.props.onFieldValueChange(value);
    }
}
