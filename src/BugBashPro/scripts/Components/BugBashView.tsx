import "./BugBashView.scss";

import * as React from "react";

import { BugBashClientActionsHub } from "BugBashPro/Actions/ActionsHub";
import { BugBashActions } from "BugBashPro/Actions/BugBashActions";
import { BugBashItemActions } from "BugBashPro/Actions/BugBashItemActions";
import { BugBashItemCommentActions } from "BugBashPro/Actions/BugBashItemCommentActions";
import { LongTextActions } from "BugBashPro/Actions/LongTextActions";
import * as BugBashCharts_Async from "BugBashPro/Components/BugBashCharts";
import * as BugBashDetails_Async from "BugBashPro/Components/BugBashDetails";
import * as BugBashEditor_Async from "BugBashPro/Components/BugBashEditor";
import * as BugBashResults_Async from "BugBashPro/Components/BugBashResults";
import {
    BugBashFieldNames, BugBashItemFieldNames, BugBashViewActions, BugBashViewPivotKeys, HubKeys,
    UrlActions, WorkItemFieldNames
} from "BugBashPro/Constants";
import { getBugBashUrl } from "BugBashPro/Helpers";
import { StoresHub } from "BugBashPro/Stores/StoresHub";
import { BugBash } from "BugBashPro/ViewModels/BugBash";
import { BugBashItemKeyTypes } from "BugBashPro/ViewModels/BugBashItem";
import { LongText } from "BugBashPro/ViewModels/LongText";
import { Loading } from "Library/Components/Loading";
import { getAsyncLoadedComponent } from "Library/Components/Utilities/AsyncLoadedComponent";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { BaseStore } from "Library/Flux/Stores/BaseStore";
import { confirmAction, delegate } from "Library/Utilities/Core";
import { parseUniquefiedIdentityName } from "Library/Utilities/Identity";
import {
    readLocalSetting, WebSettingsScope, writeLocalSetting
} from "Library/Utilities/LocalSettingsService";
import { navigate } from "Library/Utilities/Navigation";
import { stringEquals } from "Library/Utilities/String";
import { SelectionMode } from "OfficeFabric/Selection";
import { FilterBar, IFilterBar, KeywordFilterBarItem } from "VSSUI/FilterBar";
import { Hub } from "VSSUI/Hub";
import { HubHeader, HubTextTile, HubTileRegion } from "VSSUI/HubHeader";
import { IPickListItem, PickListFilterBarItem } from "VSSUI/PickList";
import {
    IChoiceGroupViewActionProps, IPivotBarAction, IPivotBarViewAction, PivotBarItem,
    PivotBarViewActionType
} from "VSSUI/PivotBar";
import { FILTER_CHANGE_EVENT } from "VSSUI/Utilities/Filter";
import { HubViewState, IHubViewState } from "VSSUI/Utilities/HubViewState";
import { IViewOptionsValues, VIEW_OPTIONS_CHANGE_EVENT } from "VSSUI/Utilities/ViewOptions";
import { VssIconType } from "VSSUI/VssIcon";

export interface IBugBashViewProps extends IBaseFluxComponentProps {
    pivotKey: BugBashViewPivotKeys;
    bugBashId?: string;
    bugBashItemId?: string;
}

export interface IBugBashViewState extends IBaseFluxComponentState {
    bugBash: BugBash;
    bugBashDetails?: LongText;
    paneMode?: BugBashViewActions;
    isDetailsInEditMode?: boolean;
    selectedPivot?: BugBashViewPivotKeys;
    allItemsCount?: number;
    pendingItemsCount?: number;
    acceptedItemsCount?: number;
    rejectedItemsCount?: number;
}

const AsyncBugBashEditor = getAsyncLoadedComponent(
    ["scripts/BugBashEditor"],
    (m: typeof BugBashEditor_Async) => m.BugBashEditor,
    () => <Loading />);

const AsyncBugBashDetails = getAsyncLoadedComponent(
    ["scripts/BugBashDetails"],
    (m: typeof BugBashDetails_Async) => m.BugBashDetails,
    () => <Loading />);

const AsyncBugBashResults = getAsyncLoadedComponent(
    ["scripts/BugBashResults"],
    (m: typeof BugBashResults_Async) => m.BugBashResults,
    () => <Loading />);

const AsyncBugBashCharts = getAsyncLoadedComponent(
    ["scripts/BugBashCharts"],
    (m: typeof BugBashCharts_Async) => m.BugBashCharts,
    () => <Loading />);

export class BugBashView extends BaseFluxComponent<IBugBashViewProps, IBugBashViewState> {
    private _hubViewState: IHubViewState;
    private _filterBar: IFilterBar;

    constructor(props: IBugBashViewProps, context?: any) {
        super(props, context);

        this._hubViewState = new HubViewState();
        this._hubViewState.selectedPivot.value = props.pivotKey;
        this._hubViewState.viewOptions.setViewOption(
            HubKeys.BugBashViewOptionsKey,
            readLocalSetting("bugbashviewactionkey", WebSettingsScope.User, BugBashViewActions.PendingItemsOnly));
    }

    public componentDidMount() {
        super.componentDidMount();

        if (this.props.bugBashId) {
            BugBashActions.initializeBugBash(this.props.bugBashId);
        }

        this._hubViewState.selectedPivot.subscribe(this._onPivotChanged);
        this._hubViewState.filter.subscribe(this._onFilterChange, FILTER_CHANGE_EVENT);
        this._hubViewState.viewOptions.subscribe(this._onViewOptionsChanged, VIEW_OPTIONS_CHANGE_EVENT);
        document.addEventListener("keydown", this._focusFilterBar, false);
    }

    public componentWillUnmount() {
        super.componentWillUnmount();

        this._cleanStores();
        this._hubViewState.selectedPivot.unsubscribe(this._onPivotChanged);
        this._hubViewState.filter.unsubscribe(this._onFilterChange, FILTER_CHANGE_EVENT);
        this._hubViewState.viewOptions.unsubscribe(this._onViewOptionsChanged, VIEW_OPTIONS_CHANGE_EVENT);
        document.removeEventListener("keydown", this._focusFilterBar);
    }

    public componentWillReceiveProps(nextProps: Readonly<IBugBashViewProps>) {
        if (this._hubViewState.selectedPivot.value !== nextProps.pivotKey) {
            this._hubViewState.selectedPivot.value = nextProps.pivotKey;
        }

        if (nextProps.bugBashId !== this.props.bugBashId) {
            this._cleanStores();

            if (!nextProps.bugBashId) {
                this.setState({
                    bugBash: StoresHub.bugBashStore.getNewBugBash(),
                    selectedPivot: nextProps.pivotKey
                });
            }
            else if (StoresHub.bugBashStore.getItem(nextProps.bugBashId)) {
                this.setState({
                    bugBash: StoresHub.bugBashStore.getItem(nextProps.bugBashId),
                    selectedPivot: nextProps.pivotKey
                });
            }
            else {
                this.setState({
                    bugBash: null,
                    selectedPivot: nextProps.pivotKey
                });

                BugBashActions.initializeBugBash(nextProps.bugBashId);
            }
        }
        else {
            this.setState({selectedPivot: nextProps.pivotKey});
        }
    }

    public render(): JSX.Element {
        if (!this.state.bugBash) {
            return <Loading />;
        }

        const bugBash = this.state.bugBash;

        let title = bugBash.getFieldValue<string>(BugBashFieldNames.Title);
        if (bugBash.isDirty()) {
            title = `* ${title}`;
        }

        return (
            <Hub
                className="bugbash-view-hub"
                hideFullScreenToggle={true}
                hubViewState={this._hubViewState}
            >
                <HubHeader
                    title={title}
                    breadcrumbItems={[{
                        text: "Bug Bashes", key: "bugbashes", onClick: this._onBugBashesLinkClick, href: getBugBashUrl(null, UrlActions.ACTION_ALL)
                    }]}
                />

                {this._renderHubTitle()}
                {this._renderHubFilterBar()}

                {!this.state.bugBash.isNew() &&
                    <PivotBarItem
                        name={"Results"}
                        url={getBugBashUrl(bugBash.id, UrlActions.ACTION_RESULTS)}
                        itemKey={BugBashViewPivotKeys.Results}
                        commands={this._getResultViewCommands()}
                        viewActions={this.props.bugBashItemId ? null : this._getViewActions()}
                    >
                        <div className="bugbash-hub-contents bugbash-results-hub-contents">
                            <AsyncBugBashResults
                                view={this.state.paneMode}
                                bugBash={this.state.bugBash}
                                bugBashItemId={this.props.bugBashItemId}
                            />
                        </div>
                    </PivotBarItem>
                }
                {!this.props.bugBashItemId &&
                    <PivotBarItem
                        name={"Editor"}
                        url={getBugBashUrl(bugBash.id, UrlActions.ACTION_EDIT)}
                        itemKey={BugBashViewPivotKeys.Edit}
                        commands={this._getEditorViewCommands()}
                    >
                        <div className="bugbash-hub-contents bugbash-editor-hub-contents">
                            <AsyncBugBashEditor bugBash={this.state.bugBash} />
                        </div>
                    </PivotBarItem>
                }
                {!this.state.bugBash.isNew() && !this.props.bugBashItemId &&
                    <PivotBarItem
                        name={"Charts"}
                        url={getBugBashUrl(bugBash.id, UrlActions.ACTION_CHARTS)}
                        itemKey={BugBashViewPivotKeys.Charts}
                        commands={this._getChartsViewCommands()}
                        viewActions={this._getViewActions()}
                    >
                        <div className="bugbash-hub-contents bugbash-charts-hub-contents">
                            <AsyncBugBashCharts bugBash={this.state.bugBash} view={this.state.paneMode} />
                        </div>
                    </PivotBarItem>
                }
                {!this.state.bugBash.isNew() && !this.props.bugBashItemId &&
                    <PivotBarItem
                        name={"Details"}
                        url={getBugBashUrl(bugBash.id, UrlActions.ACTION_DETAILS)}
                        itemKey={BugBashViewPivotKeys.Details}
                        commands={this._getDetailsViewCommands()}
                    >
                        <div className="bugbash-hub-contents bugbash-details-hub-contents">
                            <AsyncBugBashDetails isEditMode={this.state.isDetailsInEditMode} id={this.props.bugBashId} />
                        </div>
                    </PivotBarItem>
                }
            </Hub>
        );
    }

    protected initializeState() {
        this.state = {
            bugBash: this.props.bugBashId ? null : StoresHub.bugBashStore.getNewBugBash(),
            paneMode: readLocalSetting("bugbashviewactionkey", WebSettingsScope.User, BugBashViewActions.PendingItemsOnly) as BugBashViewActions,
            pendingItemsCount: -1,
            acceptedItemsCount: -1,
            rejectedItemsCount: -1,
            allItemsCount: -1,
            selectedPivot: this.props.pivotKey,
            isDetailsInEditMode: false
        };
    }

    protected getObservableDataServices(): BaseStore<any, any, any>[] {
        return [StoresHub.bugBashStore, StoresHub.bugBashItemStore, StoresHub.longTextStore];
    }

    protected getDataServiceState(): IBugBashViewState {
        const bugBashItems = StoresHub.bugBashItemStore.isLoaded() ? StoresHub.bugBashItemStore.getFilteredItems() : null;
        const bugBash = this.props.bugBashId ? StoresHub.bugBashStore.getItem(this.props.bugBashId) : StoresHub.bugBashStore.getNewBugBash();

        const paneMode = bugBash && bugBash.isAutoAccept ? BugBashViewActions.AcceptedItemsOnly : this.state.paneMode;
        this._hubViewState.viewOptions.setViewOption(HubKeys.BugBashViewOptionsKey, paneMode);

        return {
            bugBash: bugBash,
            paneMode: paneMode,
            bugBashDetails: this.props.bugBashId ? StoresHub.longTextStore.getItem(this.props.bugBashId) : null,
            allItemsCount: bugBashItems ? bugBashItems.length : -1,
            pendingItemsCount: bugBashItems ? bugBashItems.filter(b => !b.isAccepted && !b.getFieldValue<boolean>(BugBashItemFieldNames.Rejected, true)).length : -1,
            acceptedItemsCount: bugBashItems ? bugBashItems.filter(b => b.isAccepted).length : -1,
            rejectedItemsCount: bugBashItems ? bugBashItems.filter(b => !b.isAccepted && b.getFieldValue<boolean>(BugBashItemFieldNames.Rejected, true)).length : -1
        } as IBugBashViewState;
    }

    private _renderHubTitle(): JSX.Element {
        if ((this.state.selectedPivot === BugBashViewPivotKeys.Results || this.state.selectedPivot === BugBashViewPivotKeys.Charts)
            && !this.props.bugBashItemId) {

            return (
                <HubTileRegion>
                    <HubTextTile
                        text={this.state.allItemsCount < 0 ? "Loading..." : `${this.state.allItemsCount} items`}
                        secondaryText={
                            this.state.allItemsCount < 0
                            ? ""
                            : `${this.state.pendingItemsCount} Pending, ${this.state.acceptedItemsCount} Accepted, ${this.state.rejectedItemsCount} Rejected`
                        }
                    />
                </HubTileRegion>
            );
        }

        return null;
    }

    private _getPickListFilterBarItem(
        placeholder: string,
        filterItemKey: BugBashItemFieldNames | WorkItemFieldNames
    ): JSX.Element {
        return (
            <PickListFilterBarItem
                key={filterItemKey}
                filterItemKey={filterItemKey}
                selectionMode={SelectionMode.multiple}
                getPickListItems={delegate(this, this._getPicklistItems, filterItemKey)}
                getListItem={delegate(this, this._getListItem, filterItemKey)}
                placeholder={placeholder}
                noItemsText="No items"
                showSelectAll={false}
                isSearchable={true}
                searchTextPlaceholder="Search"
                minItemsForSearchBox={4}
                indicators={[
                    {
                        getItemIndicator: ((value: string) => {
                            if (!value) {
                                return null;
                            }
                            return { title: `${StoresHub.bugBashItemStore.propertyMap[filterItemKey][value]}` };
                        })
                    }
                ]}
            />
        );
    }

    private _renderHubFilterBar(): JSX.Element {
        if ((this.state.selectedPivot === BugBashViewPivotKeys.Results || this.state.selectedPivot === BugBashViewPivotKeys.Charts)
            && !this.props.bugBashItemId) {

            return (
                <FilterBar componentRef={this._resolveFilterBar}>
                    <KeywordFilterBarItem filterItemKey={"keyword"} />
                    {
                        this.state.paneMode !== BugBashViewActions.AcceptedItemsOnly &&
                        this.state.paneMode !== BugBashViewActions.AllItems &&
                        this._getPickListFilterBarItem("Team", BugBashItemFieldNames.TeamId)
                    }
                    {this._getPickListFilterBarItem("Created By", BugBashItemFieldNames.CreatedBy)}
                    {
                        this.state.paneMode === BugBashViewActions.RejectedItemsOnly &&
                        this._getPickListFilterBarItem("Rejected By", BugBashItemFieldNames.RejectedBy)
                    }
                    {
                        this.state.paneMode === BugBashViewActions.AcceptedItemsOnly &&
                        this._getPickListFilterBarItem("State", WorkItemFieldNames.State)
                    }
                    {
                        this.state.paneMode === BugBashViewActions.AcceptedItemsOnly &&
                        this._getPickListFilterBarItem("Assigned To", WorkItemFieldNames.AssignedTo)
                    }
                    {
                        this.state.paneMode === BugBashViewActions.AcceptedItemsOnly &&
                        this._getPickListFilterBarItem("Area Path", WorkItemFieldNames.AreaPath)
                    }
                </FilterBar>
            );
        }

        return null;
    }

    private _getViewActions(): IPivotBarViewAction[] {
        if (this.state.bugBash.isAutoAccept) {
            return null;
        }

        return [
            {
                key: HubKeys.BugBashViewOptionsKey,
                name: HubKeys.BugBashViewOptionsKey,
                actionType: PivotBarViewActionType.ChoiceGroup,
                iconProps: { iconName: "Equalizer", iconType: VssIconType.fabric },
                important: true,
                actionProps: {
                    options: [
                        {
                            key: BugBashViewActions.PendingItemsOnly,
                            text: BugBashViewActions.PendingItemsOnly,
                            ariaLabel: BugBashViewActions.PendingItemsOnly,
                        },
                        {
                            key: BugBashViewActions.RejectedItemsOnly,
                            text: BugBashViewActions.RejectedItemsOnly,
                            ariaLabel: BugBashViewActions.RejectedItemsOnly,
                        },
                        {
                            key: BugBashViewActions.AcceptedItemsOnly,
                            text: BugBashViewActions.AcceptedItemsOnly,
                            ariaLabel: BugBashViewActions.AcceptedItemsOnly,
                        },
                        {
                            key: BugBashViewActions.AllItems,
                            text: BugBashViewActions.AllItems,
                            ariaLabel: BugBashViewActions.AllItems,
                        },
                    ]
                } as IChoiceGroupViewActionProps
            }
        ];
    }

    private _getResultViewCommands(): IPivotBarAction[] {
        if (this.props.bugBashItemId) {
            return [
                {
                    key: "goback", name: "Go back to list", important: true,
                    iconProps: { iconName: "RevToggleKey", iconType: VssIconType.fabric },
                    disabled: this.state.bugBash.isNew(),
                    onClick: this._goBackToBugBashResults
                }
            ];
        }
        else {
            return [
                {
                    key: "refresh", name: "Refresh", important: true,
                    iconProps: { iconName: "Refresh", iconType: VssIconType.fabric },
                    disabled: this.state.bugBash.isNew(),
                    onClick: this._refreshBugBashItems
                },
                {
                    key: "newitem", name: "New Item",  important: true,
                    iconProps: { iconName: "Add", iconType: VssIconType.fabric },
                    disabled: this.state.bugBash.isNew(),
                    onClick: () => {
                        StoresHub.bugBashItemStore.getNewBugBashItem().reset(false);
                        BugBashClientActionsHub.SelectedBugBashItemChanged.invoke(null);
                    }
                }
            ];
        }
    }

    private _getEditorViewCommands(): IPivotBarAction[] {
        return [
            {
                key: "save", name: "Save", important: true,
                iconProps: { iconName: "Save", iconType: VssIconType.fabric },
                disabled: !this.state.bugBash.isDirty() || !this.state.bugBash.isValid(),
                onClick: this._saveBugBash
            },
            {
                key: "undo", name: "Undo", important: true,
                iconProps: { iconName: "Undo", iconType: VssIconType.fabric },
                disabled: this.state.bugBash.isNew() || !this.state.bugBash.isDirty(),
                onClick: this._revertBugBash
            },
            {
                key: "refresh", name: "Refresh", important: true,
                iconProps: { iconName: "Refresh", iconType: VssIconType.fabric },
                disabled: this.state.bugBash.isNew(),
                onClick: this._refreshBugBash
            }
        ];
    }

    private _getChartsViewCommands(): IPivotBarAction[] {
        return [
            {
                key: "refresh", name: "Refresh", important: true,
                iconProps: { iconName: "Refresh", iconType: VssIconType.fabric },
                disabled: this.state.bugBash.isNew(),
                onClick: this._refreshBugBashItems
            }
        ];
    }

    private _getDetailsViewCommands(): IPivotBarAction[] {
        if (this.state.isDetailsInEditMode) {
            return [
                {
                    key: "save", name: "Save", important: true,
                    iconProps: { iconName: "Save", iconType: VssIconType.fabric },
                    disabled: !this.state.bugBashDetails || !this.state.bugBashDetails.isDirty(),
                    onClick: this._saveBugBashDetails
                },
                {
                    key: "undo", name: "Undo", important: true,
                    iconProps: { iconName: "Undo", iconType: VssIconType.fabric },
                    disabled: !this.state.bugBashDetails || !this.state.bugBashDetails.isDirty(),
                    onClick: this._revertBugBashDetails
                },
                {
                    key: "refresh", name: "Refresh", important: true,
                    iconProps: { iconName: "Refresh", iconType: VssIconType.fabric },
                    disabled: !this.state.bugBashDetails,
                    onClick: this._refreshBugBashDetails
                },
                {
                    key: "done", name: "Done", important: true,
                    iconProps: { iconName: "Accept", iconType: VssIconType.fabric },
                    disabled: !this.state.bugBashDetails,
                    onClick: () => this.setState({isDetailsInEditMode: false} as IBugBashViewState)
                },
            ];
        }
        else {
            return [
                {
                    key: "edit", name: "Edit", important: true,
                    iconProps: { iconName: "Edit", iconType: VssIconType.fabric },
                    disabled: !this.state.bugBashDetails,
                    onClick: () => this.setState({isDetailsInEditMode: true} as IBugBashViewState)
                },
                {
                    key: "refresh", name: "Refresh", important: true,
                    iconProps: { iconName: "Refresh", iconType: VssIconType.fabric },
                    disabled: !this.state.bugBashDetails,
                    onClick: this._refreshBugBashDetails
                }
            ];
        }
    }

    private _cleanStores() {
        BugBashItemActions.clean();
        BugBashActions.clean();
        LongTextActions.clean();
        BugBashItemCommentActions.clean();
        StoresHub.workItemStore.clearStore();
    }

    private _isAnyProviderDirty(): boolean {
        const bugBash = this.state.bugBash;
        const items = StoresHub.bugBashItemStore.getAll() || [];
        const isAnyBugBashItemDirty = items.some(item => item.isDirty());
        return bugBash.isDirty()
            || isAnyBugBashItemDirty
            || StoresHub.bugBashItemStore.getNewBugBashItem().isDirty()
            || (this.state.bugBashDetails && this.state.bugBashDetails.isDirty());
    }

    private _getPicklistItems = (key: BugBashItemFieldNames | WorkItemFieldNames): string[] => {
        return Object.keys(StoresHub.bugBashItemStore.propertyMap[key]);
    }

    private _getListItem = (value: string, key: BugBashItemFieldNames | WorkItemFieldNames): IPickListItem => {
        const keyType = BugBashItemKeyTypes[key];

        if (keyType === "identity" || keyType === "identityRef") {
            const identity = parseUniquefiedIdentityName(value);
            return {
                name: identity.displayName,
                key: value,
                iconProps: identity.imageUrl ? {
                    iconType: VssIconType.image,
                    imageProps: {
                        src: identity.imageUrl
                    }
                } : null
            };
        }
        else if (key === WorkItemFieldNames.AreaPath) {
            return {
                name: value.substr(value.lastIndexOf("\\") + 1),
                key: value
            };
        }
        else if (key === BugBashItemFieldNames.TeamId) {
            return {
                name: (StoresHub.teamStore.getItem(value) && StoresHub.teamStore.getItem(value).name) || value,
                key: value
            };
        }
        else {
            return {
                name: value,
                key: value
            };
        }
    }

    private _onPivotChanged = (pivotKey: string) => {
        if (pivotKey) {
            navigate({ view: pivotKey as UrlActions, id: this.props.bugBashId}, false, false, null, true);
            this.setState({selectedPivot: pivotKey as BugBashViewPivotKeys});
        }
    }

    private _onFilterChange = () => {
        BugBashItemActions.applyFilter(this._hubViewState.filter.getState());
    }

    private _onViewOptionsChanged = (changedState: IViewOptionsValues) => {
        const paneMode = changedState[HubKeys.BugBashViewOptionsKey];
        if (paneMode && this.state.bugBash && !this.state.bugBash.isAutoAccept) {
            writeLocalSetting("bugbashviewactionkey", paneMode, WebSettingsScope.User);
            this.setState({paneMode: paneMode});
        }
    }

    private _onBugBashesLinkClick = async (e: React.MouseEvent<HTMLElement>) => {
        if (!e.ctrlKey) {
            e.preventDefault();

            const confirm = await confirmAction(this._isAnyProviderDirty(),
                                                "You have unsaved changes in the bug bash. Navigating to Home will revert your changes. Are you sure you want to do that?");

            if (confirm) {
                navigate({ view: UrlActions.ACTION_ALL });
            }
        }
    }

    private _goBackToBugBashResults = () => {
        navigate({ view: UrlActions.ACTION_RESULTS, id: this.props.bugBashId });
    }

    private _refreshBugBashItems = async () => {
        const items = StoresHub.bugBashItemStore.getAll() || [];
        const isAnyBugBashItemDirty = items.some(item => item.isDirty());
        const confirm = await confirmAction(
            isAnyBugBashItemDirty || StoresHub.bugBashItemStore.getNewBugBashItem().isDirty(),
            "You have some unsaved items in the list. Refreshing the page will remove all the unsaved data. Are you sure you want to do it?");
        if (confirm) {
            await BugBashItemActions.refreshItems(this.props.bugBashId);
            BugBashClientActionsHub.SelectedBugBashItemChanged.invoke(null);
        }
    }

    private _revertBugBash = async () => {
        const confirm = await confirmAction(true, "Are you sure you want to undo your changes to this instance?");
        if (confirm) {
            this.state.bugBash.reset();
        }
    }

    private _refreshBugBash = async () => {
        const confirm = await confirmAction(this.state.bugBash.isDirty(),
                                            "Refreshing will undo your unsaved changes. Are you sure you want to do that?");

        if (confirm) {
            this.state.bugBash.refresh();
        }
    }

    private _saveBugBash = () => {
        this.state.bugBash.save();
    }

    private _revertBugBashDetails = async () => {
        const confirm = await confirmAction(true, "Are you sure you want to undo your changes to this instance?");
        if (confirm) {
            this.state.bugBashDetails.reset();
        }
    }

    private _refreshBugBashDetails = async () => {
        const confirm = await confirmAction(this.state.bugBashDetails.isDirty(),
                                            "Refreshing will undo your unsaved changes. Are you sure you want to do that?");

        if (confirm) {
            this.state.bugBashDetails.refresh();
        }
    }

    private _saveBugBashDetails = () => {
        this.state.bugBashDetails.save();
    }

    private _focusFilterBar = (ev: KeyboardEvent) => {
        if (this._filterBar && ev.ctrlKey && ev.shiftKey && stringEquals(ev.key, "f", true)) {
            this._filterBar.focus();
        }
    }

    private _resolveFilterBar = (filterBar: IFilterBar) => {
        this._filterBar = filterBar;
    }
}
