import * as React from "react";

import { IVssComponentState, VssComponent } from "Common/Components/Utilities/VssComponent";
import { ISimpleComboProps, SimpleCombo } from "Common/Components/VssCombo/SimpleCombo";
import { BaseDataService } from "Common/Services/BaseDataService";
import {
    WorkItemFieldService, WorkItemFieldServiceName
} from "Common/Services/WorkItemFieldService";
import { WorkItemTypeService, WorkItemTypeServiceName } from "Common/Services/WorkItemTypeService";
import { arrayEquals, contains } from "Common/Utilities/Array";
import { IReactAppContext } from "Common/Utilities/Context";
import { isNullOrWhiteSpace, stringEquals } from "Common/Utilities/String";
import { Spinner, SpinnerSize } from "OfficeFabric/Spinner";
import { css } from "OfficeFabric/Utilities";
import { FieldType, WorkItemField } from "TFS/WorkItemTracking/Contracts";

export interface IWorkItemFieldPickerProps extends ISimpleComboProps<WorkItemField> {
    allowedFieldTypes?: FieldType[];
    workItemType?: string;
    excludeFields?: string[];
}

export interface IWorkItemFieldPickerState extends IVssComponentState {
    allowedFields?: WorkItemField[];
}

export class WorkItemFieldPicker extends VssComponent<IWorkItemFieldPickerProps, IWorkItemFieldPickerState> {
    private _fieldService: WorkItemFieldService;
    private _workItemTypeService: WorkItemTypeService;

    constructor(props: IWorkItemFieldPickerProps, context?: IReactAppContext) {
        super(props, context);
        this._fieldService = this.context.appContext.getService<WorkItemFieldService>(WorkItemFieldServiceName);
        this._workItemTypeService = this.context.appContext.getService<WorkItemTypeService>(WorkItemTypeServiceName);
    }

    public componentDidMount() {
        super.componentDidMount();
        let waitForStores = false;

        if (!this._fieldService.isLoaded()) {
            this._fieldService.initializeWorkItemFields();
            waitForStores = true;
        }
        if (!isNullOrWhiteSpace(this.props.workItemType) && !this._workItemTypeService.isLoaded()) {
            this._workItemTypeService.initializeWorkItemTypes();
            waitForStores = true;
        }

        if (!waitForStores) {
            this.setState({
                allowedFields: this._getAllowedFields(this.props.allowedFieldTypes, this.props.excludeFields, this.props.workItemType)
            });
        }
    }

    public componentWillReceiveProps(nextProps: IWorkItemFieldPickerProps, context?: IReactAppContext) {
        super.componentWillReceiveProps(nextProps, context);

        if (!isNullOrWhiteSpace(nextProps.workItemType) && !this._workItemTypeService.isLoaded()) {
            this._workItemTypeService.initializeWorkItemTypes();
            return;
        }

        if (!arrayEquals(nextProps.allowedFieldTypes, this.props.allowedFieldTypes) || !arrayEquals(nextProps.excludeFields, this.props.excludeFields)) {
            this.setState({allowedFields: this._getAllowedFields(nextProps.allowedFieldTypes, nextProps.excludeFields, nextProps.workItemType)});
        }
    }

    public render(): JSX.Element {
        if (!this.state.allowedFields) {
            return <Spinner size={SpinnerSize.large} />;
        }

        const props = {
            ...this.props,
            className: css("work-item-field-picker", this.props.className),
            getItemText: (field: WorkItemField) => field.name,
            options: this.state.allowedFields,
            limitedToAllowedOptions: true
        } as ISimpleComboProps<WorkItemField>;

        return <SimpleCombo {...props} />;
    }

    protected getObservableDataServices(): BaseDataService<any, any, any>[] {
        return [this._fieldService, this._workItemTypeService];
    }

    protected getDataServiceState(): IWorkItemFieldPickerState {
        return {
            allowedFields: this._getAllowedFields(this.props.allowedFieldTypes, this.props.excludeFields, this.props.workItemType)
        };
    }

    private _getAllowedFields(allowedFieldTypes: FieldType[], excludeFields: string[], workItemType: string): WorkItemField[] {
        if (!this._fieldService.isLoaded() || (!isNullOrWhiteSpace(workItemType) && !this._workItemTypeService.isLoaded())) {
            return null;
        }

        const allFields = this._fieldService.getAll();
        return allFields.filter(f => {
            let witFields: string[];
            if (!isNullOrWhiteSpace(workItemType) && this._workItemTypeService.itemExists(workItemType)) {
                witFields = this._workItemTypeService.getItem(workItemType).fields.map(wf => wf.referenceName);
            }

            return (!allowedFieldTypes || allowedFieldTypes.indexOf(f.type) !== -1)
                && (!excludeFields || !contains(excludeFields, f.referenceName, (a, b) => stringEquals(a, b, true)))
                && (!witFields || contains(witFields, f.referenceName, (s1, s2) => stringEquals(s1, s2, true)));
        });
    }
}
