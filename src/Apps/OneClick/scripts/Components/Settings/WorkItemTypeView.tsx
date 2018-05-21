import * as React from "react";

import { Loading } from "Common/Components/Loading";
import {
    IVssComponentProps, IVssComponentState, VssComponent
} from "Common/Components/Utilities/VssComponent";
import { BaseDataService } from "Common/Services/BaseDataService";
import { IReactAppContext } from "Common/Utilities/Context";
import { confirmAction } from "Common/Utilities/Core";
import { getCurrentUserName } from "Common/Utilities/Identity";
import { stringEquals } from "Common/Utilities/String";
import { RuleGroupList } from "OneClick/Components/Settings/RuleGroupList";
import { RuleGroupView } from "OneClick/Components/Settings/RuleGroupView";
import { SettingKey } from "OneClick/Constants";
import { isPersonalOrGlobalRuleGroup } from "OneClick/Helpers";
import { IRuleGroup } from "OneClick/Interfaces";
import { RuleGroupService, RuleGroupServiceName } from "OneClick/Services/RuleGroupService";
import { RuleService, RuleServiceName } from "OneClick/Services/RuleService";
import { SettingsService, SettingsServiceName } from "OneClick/Services/SettingsService";
import { trackEvent } from "OneClick/Telemetry";
import { ZeroData, ZeroDataActionType } from "VSSUI/ZeroData";

export interface IWorkItemTypeViewProps extends IVssComponentProps {
    workItemTypeName: string;
    ruleGroupId?: string;
}

export interface IWorkItemTypeViewState extends IVssComponentState {
    workItemTypeEnabled?: boolean;
}

export class WorkItemTypeView extends VssComponent<IWorkItemTypeViewProps, IWorkItemTypeViewState> {
    private _ruleGroupService: RuleGroupService;
    private _ruleService: RuleService;
    private _settingsService: SettingsService;

    constructor(props: IWorkItemTypeViewProps, context?: IReactAppContext) {
        super(props, context);
        this._ruleGroupService = this.context.appContext.getService<RuleGroupService>(RuleGroupServiceName);
        this._ruleService = this.context.appContext.getService<RuleService>(RuleServiceName);
        this._settingsService = this.context.appContext.getService<SettingsService>(SettingsServiceName);
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

        if (!stringEquals(this.props.workItemTypeName, nextProps.workItemTypeName, true)) {
            this._refresh(nextProps.workItemTypeName);
        }
    }

    public render(): JSX.Element {
        if (this.state.loading) {
            return <Loading />;
        }
        if (!this.state.workItemTypeEnabled) {
            return (
                <ZeroData
                    actionText="Enable"
                    actionType={ZeroDataActionType.ctaButton}
                    onActionClick={this._toggleWorkItemType}
                    imagePath={`${VSS.getExtensionContext().baseUri}/images/blocked.png`}
                    imageAltText=""
                    primaryText={"This work item type has been disabled."}
                />
            );
        }

        if (this.props.ruleGroupId) {
            return (
                <RuleGroupView
                    refresh={this._refresh}
                    toggleSubscription={this._toggleSubscription}
                    workItemTypeName={this.props.workItemTypeName}
                    ruleGroupId={this.props.ruleGroupId}
                />
            );
        }
        else {
            return (
                <RuleGroupList
                    refresh={this._refresh}
                    toggleSubscription={this._toggleSubscription}
                    workItemTypeName={this.props.workItemTypeName}
                />
            );
        }
    }

    protected getDataServiceState(): IWorkItemTypeViewState {
        const workItemTypeEnabled = this._settingsService.getItem<boolean>(SettingKey.WorkItemTypeEnabled);
        return {
            loading: workItemTypeEnabled == null,
            workItemTypeEnabled: workItemTypeEnabled
        } as IWorkItemTypeViewState;
    }

    protected getObservableDataServices(): BaseDataService<any, any, any>[] {
        return [this._settingsService];
    }

    protected getInitialState(): IWorkItemTypeViewState {
        return {
            loading: true,
            workItemTypeEnabled: null
        };
    }

    private _clearStores(currentWorkItemType?: string) {
        this._ruleGroupService.clear();
        this._settingsService.clear();
        this._ruleService.clear();

        this._ruleGroupService.setCurrentWorkItemType(currentWorkItemType);
        this._settingsService.setCurrentWorkItemType(currentWorkItemType);
    }

    private _toggleWorkItemType = async () => {
        const confirm = await confirmAction(true, `This setting would be globally applied for "${this.props.workItemTypeName}" work item type in the current project.
        Are you sure you still want to enable this work item type? If you are unsure, please consult your administrator first.`);

        if (confirm) {
            this._settingsService.updateSetting<boolean>(this.props.workItemTypeName, SettingKey.WorkItemTypeEnabled, true, false);
        }
    }

    private _refresh = (workItemType?: string) => {
        const workItemTypeName = workItemType || this.props.workItemTypeName;
        this._clearStores(workItemTypeName);

        this._ruleGroupService.initializeRuleGroups(workItemTypeName);
        this._settingsService.initializeSetting<string[]>(workItemTypeName, SettingKey.UserSubscriptions, true, []);
        this._settingsService.initializeSetting<boolean>(workItemTypeName, SettingKey.PersonalRulesEnabled, false, true);
        this._settingsService.initializeSetting<boolean>(workItemTypeName, SettingKey.GlobalRulesEnabled, false, true);
        this._settingsService.initializeSetting<boolean>(workItemTypeName, SettingKey.WorkItemTypeEnabled, false, true);
    }

    private _toggleSubscription = (subscribe: boolean, ruleGroup: IRuleGroup) => {
        if (isPersonalOrGlobalRuleGroup(ruleGroup)) {
            return;
        }

        const currentSubscriptions = this._settingsService.getItem<string[]>(SettingKey.UserSubscriptions);
        if (currentSubscriptions) {
            let updatedSubscriptions = [...currentSubscriptions];

            if (subscribe) {
                // subscribe
                updatedSubscriptions.push(ruleGroup.id);
            }
            else {
                // unsubscribe
                updatedSubscriptions = updatedSubscriptions.filter(srgId => !stringEquals(srgId, ruleGroup.id, true));
            }

            this._settingsService.updateSetting<string[]>(this.props.workItemTypeName, SettingKey.UserSubscriptions, updatedSubscriptions, true);

            // log event
            if (subscribe) {
                trackEvent("SubscribeToRuleGroup", {
                    user: getCurrentUserName(),
                    ruleGroupId: ruleGroup.id,
                    workItemTypeName: ruleGroup.workItemType,
                    project: ruleGroup.projectId
                });
            }
            else {
                trackEvent("UnsubscribeFromRuleGroup", {
                    user: getCurrentUserName(),
                    ruleGroupId: ruleGroup.id,
                    workItemTypeName: ruleGroup.workItemType,
                    project: ruleGroup.projectId
                });
            }
        }
    }
}
