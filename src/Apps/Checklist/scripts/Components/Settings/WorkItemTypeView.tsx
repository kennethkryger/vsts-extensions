import "../ChecklistView.scss";

import * as React from "react";
import { arrayMove, SortableContainer, SortableElement, SortableHandle } from "react-sortable-hoc";

import { ChecklistItem } from "Checklist/Components/ChecklistItem";
import { ChecklistItemEditor } from "Checklist/Components/ChecklistItemEditor";
import { IChecklistItem, IWorkItemChecklist } from "Checklist/Interfaces";
import { ChecklistService, ChecklistServiceName } from "Checklist/Services/ChecklistService";
import { Loading } from "Common/Components/Loading";
import {
    IVssComponentProps, IVssComponentState, VssComponent
} from "Common/Components/Utilities/VssComponent";
import { BaseDataService } from "Common/Services/BaseDataService";
import { ErrorMessageService, ErrorMessageServiceName } from "Common/Services/ErrorMessageService";
import { findIndex } from "Common/Utilities/Array";
import { IReactAppContext } from "Common/Utilities/Context";
import { isNullOrWhiteSpace, stringEquals } from "Common/Utilities/String";
import { MessageBar, MessageBarType } from "OfficeFabric/MessageBar";
import { Modal } from "OfficeFabric/Modal";
import { Hub } from "VSSUI/Components/Hub";
import { HubHeader } from "VSSUI/Components/HubHeader";
import { IPivotBarAction, PivotBarItem } from "VSSUI/Components/PivotBar";
import { HubViewState, IHubViewState } from "VSSUI/Utilities/HubViewState";
import { VssIcon, VssIconType } from "VSSUI/VssIcon";

const DragHandle = SortableHandle(() => <VssIcon className="drag-handle" iconName="GlobalNavButton" iconType={VssIconType.fabric} />);

const SortableItem = SortableElement(({value}) => {
    return (
        <div className="checklist-item-container">
            <DragHandle />
            {value}
        </div>
    );
});

const SortableList = SortableContainer(({items}) => {
    return (
        <div className="checklist-items">
            {items.map((value, index) => (
                <SortableItem key={`item-${index}`} index={index} value={value} />
            ))}
        </div>
    );
});

export interface IWorkItemTypeViewProps extends IVssComponentProps {
    workItemType: string;
}

export interface IWorkItemTypeViewState extends IVssComponentState {
    checklist: IWorkItemChecklist;
    error?: string;
    disabled?: boolean;
    editItem?: IChecklistItem;
}

export class WorkItemTypeView extends VssComponent<IWorkItemTypeViewProps, IWorkItemTypeViewState> {
    private _hubViewState: IHubViewState;
    private _checklistService: ChecklistService;
    private _errorMessageService: ErrorMessageService;

    constructor(props: IWorkItemTypeViewProps, context?: IReactAppContext) {
        super(props, context);
        this._hubViewState = new HubViewState();
        this._hubViewState.selectedPivot.value = "Default";
        this._errorMessageService = this.context.appContext.getService<ErrorMessageService>(ErrorMessageServiceName);
        this._checklistService = this.context.appContext.getService<ChecklistService>(ChecklistServiceName);
    }

    public componentDidMount() {
        super.componentDidMount();
        this._refresh();
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
        this._clearStores();
    }

    public componentWillReceiveProps(nextProps: IWorkItemTypeViewProps, context?: IReactAppContext) {
        super.componentWillReceiveProps(nextProps, context);

        if (!stringEquals(this.props.workItemType, nextProps.workItemType, true)) {
            this._refresh(nextProps.workItemType);
        }
    }

    public render(): JSX.Element {
        return (
            <Hub
                className="rule-group-list-hub"
                hubViewState={this._hubViewState}
                hideFullScreenToggle={true}
                commands={this._getHubCommands()}
            >
                <HubHeader title={`Default checklist items for "${this.props.workItemType}"`} />

                <PivotBarItem name="Default" itemKey="Default">
                    {this._renderChecklistView()}
                </PivotBarItem>
            </Hub>
        );
    }

    protected getInitialState(): IWorkItemTypeViewState {
        return {
            checklist: null,
            disabled: false,
            error: null,
            editItem: null
        };
    }

    protected getObservableDataServices(): BaseDataService<any, any, any>[] {
        return [this._checklistService, this._errorMessageService];
    }

    protected getDataServiceState(): IWorkItemTypeViewState {
        const {workItemType} = this.props;
        const checklist = this._getChecklist(workItemType);
        const error = this._errorMessageService.getItem("ChecklistError");

        let newState: IWorkItemTypeViewState = {
            disabled: this._checklistService.isLoading(workItemType) || !isNullOrWhiteSpace(error),
            error: error
        } as IWorkItemTypeViewState;

        if (!this._checklistService.isLoading(workItemType)) {
            newState = {...newState, checklist: checklist};
        }
        return newState;
    }

    private _getHubCommands(): IPivotBarAction[] {
        return [
            {
                key: "refresh",
                name: "Refresh",
                disabled: this.state.checklist == null,
                important: true,
                iconProps: { iconName: "Refresh", iconType: VssIconType.fabric },
                onClick: () => this._refresh()
            }
        ];
    }

    private _renderChecklistView(): JSX.Element {
        const {checklist, disabled} = this.state;

        if (checklist == null) {
            return <Loading />;
        }
        return (
            <div className="checklist-view">
                {this._renderZeroDataMessage()}
                {this._renderEditView()}
                {this._renderError()}
                <div className="checklist-items-container">
                    {this._renderChecklistItems()}
                </div>
                <ChecklistItemEditor
                    inputPlaceholder="Add new item"
                    disabled={disabled}
                    onSubmit={this._addChecklistItem}
                />
            </div>
        );
    }

    private _renderZeroDataMessage(): JSX.Element {
        const {checklist} = this.state;
        if (checklist.checklistItems == null || checklist.checklistItems.length === 0) {
            return (
                <MessageBar messageBarType={MessageBarType.info} className="message-bar">
                    {`No default checklist items created for "${this.props.workItemType}".`}
                </MessageBar>
            );
        }
        return null;
    }

    private _renderEditView(): JSX.Element {
        if (this.state.editItem) {
            return (
                <Modal
                    isOpen={true}
                    onDismiss={this._cancelItemEdit}
                    isBlocking={false}
                    containerClassName="edit-checklist-item-overlay"
                >
                    <ChecklistItemEditor
                        checklistItem={this.state.editItem}
                        onSubmit={this._updateChecklistItem}
                        onCancel={this._cancelItemEdit}
                        autoFocus={true}
                    />
                </Modal>
            );
        }
        return null;
    }

    private _renderError(): JSX.Element {
        const error = this.state.error;
        if (error) {
            return (
                <MessageBar className="error-message" messageBarType={MessageBarType.error}>
                    {error}
                </MessageBar>
            );
        }
        return null;
    }

    private _renderChecklistItems(): JSX.Element {
        const {checklist} = this.state;
        if (checklist.checklistItems != null && checklist.checklistItems.length > 0) {
            const items = checklist.checklistItems.map(this._renderChecklistItem);
            return (
                <SortableList
                    items={items}
                    axis="y"
                    lockAxis="y"
                    onSortEnd={this._reorderChecklistItem}
                    useDragHandle={true}
                />
            );
        }
        return null;
    }

    private _refresh(workItemType?: string) {
        const workItemTypeName = workItemType || this.props.workItemType;
        this._clearStores(workItemTypeName);

        this.setState({checklist: null, editItem: null, error: null, disabled: false});
        this._checklistService.initializeChecklistForWorkItemType(workItemTypeName);
    }

    private _clearStores(currentWorkItemType?: string) {
        this._checklistService.clear();
        this._checklistService.setCurrentWorkItemType(currentWorkItemType);
    }

    private _updateChecklist(checklistItems: IChecklistItem[]) {
        const checklist = {...this.state.checklist};
        checklist.checklistItems = checklistItems;

        this.setState({checklist: checklist});
        this._checklistService.updateChecklistForWorkItemType(checklist);
    }

    private _getChecklist(workItemType: string): IWorkItemChecklist {
        if (isNullOrWhiteSpace(workItemType)) {
            return null;
        }

        const checklists = this._checklistService.getItem(this.props.workItemType);
        return checklists == null ? null : checklists.witDefault;
    }

    private _renderChecklistItem = (checklistItem: IChecklistItem): JSX.Element => {
        return (
            <ChecklistItem
                checklistItem={checklistItem}
                disabled={this.state.disabled}
                allowEditDefaultItems={true}
                disableStateChange={true}
                onEdit={this._editChecklistItem}
                onDelete={this._deleteChecklistItem}
            />
        );
    }

    private _editChecklistItem = (item: IChecklistItem) => {
        this.setState({editItem: {...item}});
    }

    private _cancelItemEdit = () => {
        this.setState({editItem: null});
    }

    private _reorderChecklistItem = (data: {oldIndex: number, newIndex: number}) => {
        const {oldIndex, newIndex} = data;
        if (oldIndex !== newIndex) {
            const {checklist} = this.state;
            const newChecklistItems = arrayMove([...checklist.checklistItems], oldIndex, newIndex);
            this._updateChecklist(newChecklistItems);
        }
    }

    private _deleteChecklistItem = (item: IChecklistItem) => {
        const {checklist} = this.state;
        const newChecklistItems = checklist.checklistItems.filter((i: IChecklistItem) => !stringEquals(i.id, item.id, true));
        if (newChecklistItems.length !== checklist.checklistItems.length) {
            this._updateChecklist(newChecklistItems);
        }
    }

    private _addChecklistItem = (checklistItem: IChecklistItem) => {
        const {checklist} = this.state;
        const newChecklistItem = {...checklistItem, id: `dcwiti_${Date.now()}`, isDefault: true};
        const newChecklistItems = (checklist.checklistItems || []).concat(newChecklistItem);

        this._updateChecklist(newChecklistItems);
    }

    private _updateChecklistItem = (item: IChecklistItem) => {
        const {checklist} = this.state;
        const newChecklistItems = [...checklist.checklistItems];
        const index = findIndex(newChecklistItems, (i: IChecklistItem) => stringEquals(i.id, item.id, true));
        if (index !== -1) {
            newChecklistItems[index] = {...newChecklistItems[index], text: item.text, required: item.required};
            this._updateChecklist(newChecklistItems);
        }

        this._cancelItemEdit();
    }
}
