import * as React from "react";

import {
    BaseFluxComponent, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { ISimpleComboProps, SimpleCombo } from "Library/Components/VssCombo/SimpleCombo";
import { BaseStore } from "Library/Flux/BaseStore";
import { WorkItemFieldActionsCreator, WorkItemFieldStore } from "Library/Flux/WorkItemField";
import { WorkItemTypeActionsCreator, WorkItemTypeStore } from "Library/Flux/WorkItemType";
import { arrayEquals, contains } from "Library/Utilities/Array";
import { isNullOrWhiteSpace, stringEquals } from "Library/Utilities/String";
import { Spinner, SpinnerSize } from "OfficeFabric/Spinner";
import { css } from "OfficeFabric/Utilities";
import { FieldType, WorkItemField } from "TFS/WorkItemTracking/Contracts";

export interface IWorkItemFieldPickerProps extends ISimpleComboProps<WorkItemField> {
    allowedFieldTypes?: FieldType[];
    workItemType?: string;
    excludeFields?: string[];
    fieldStore: WorkItemFieldStore;
    fieldActionsCreator: WorkItemFieldActionsCreator;
    workItemTypeStore: WorkItemTypeStore;
    workItemTypeActionsCreator: WorkItemTypeActionsCreator;
}

export interface IWorkItemFieldPickerState extends IBaseFluxComponentState {
    allowedFields?: WorkItemField[];
}

export class WorkItemFieldPicker extends BaseFluxComponent<IWorkItemFieldPickerProps, IWorkItemFieldPickerState> {
    public componentDidMount() {
        super.componentDidMount();
        let waitForStores = false;

        if (!this.props.fieldStore.isLoaded()) {
            this.props.fieldActionsCreator.initializeWorkItemFields();
            waitForStores = true;
        }
        if (!isNullOrWhiteSpace(this.props.workItemType) && !this.props.workItemTypeStore.isLoaded()) {
            this.props.workItemTypeActionsCreator.initializeWorkItemTypes();
            waitForStores = true;
        }

        if (!waitForStores) {
            this.setState({
                allowedFields: this._getAllowedFields(this.props.allowedFieldTypes, this.props.excludeFields, this.props.workItemType)
            });
        }
    }

    public componentWillReceiveProps(nextProps: IWorkItemFieldPickerProps, context?: any) {
        super.componentWillReceiveProps(nextProps, context);

        if (!isNullOrWhiteSpace(nextProps.workItemType) && !this.props.workItemTypeStore.isLoaded()) {
            this.props.workItemTypeActionsCreator.initializeWorkItemTypes();
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

    protected getStores(): BaseStore<any, any, any, any>[] {
        return [this.props.fieldStore, this.props.workItemTypeStore];
    }

    protected getStoresState(): IWorkItemFieldPickerState {
        return {
            allowedFields: this._getAllowedFields(this.props.allowedFieldTypes, this.props.excludeFields, this.props.workItemType)
        };
    }

    private _getAllowedFields(allowedFieldTypes: FieldType[], excludeFields: string[], workItemType: string): WorkItemField[] {
        if (!this.props.fieldStore.isLoaded() || (!isNullOrWhiteSpace(workItemType) && !this.props.workItemTypeStore.isLoaded())) {
            return null;
        }

        const allFields = this.props.fieldStore.getAll();
        return allFields.filter(f => {
            let witFields: string[];
            if (!isNullOrWhiteSpace(workItemType) && this.props.workItemTypeStore.itemExists(workItemType)) {
                witFields = this.props.workItemTypeStore.getItem(workItemType).fields.map(wf => wf.referenceName);
            }

            return (!allowedFieldTypes || allowedFieldTypes.indexOf(f.type) !== -1)
                && (!excludeFields || !contains(excludeFields, f.referenceName, (a, b) => stringEquals(a, b, true)))
                && (!witFields || contains(witFields, f.referenceName, (s1, s2) => stringEquals(s1, s2, true)));
        });
    }
}
