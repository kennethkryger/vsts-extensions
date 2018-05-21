import { BaseDataService } from "Common/Services/BaseDataService";
import { findIndex } from "Common/Utilities/Array";
import { Services } from "Common/Utilities/Context";
import { stringEquals } from "Common/Utilities/String";
import { Constants, GlobalRuleGroup, PersonalRuleGroup } from "OneClick/Constants";
import { RuleGroupsDataService } from "OneClick/DataServices/RuleGroupsDataService";
import { SettingsDataService } from "OneClick/DataServices/SettingsDataService";
import { IRuleGroup } from "OneClick/Interfaces";
import { publishTelemetry, TelemetryEvent } from "OneClick/Telemetry";

export const RuleGroupServiceName = "RuleGroupService";

export class RuleGroupService extends BaseDataService<IRuleGroup[], IRuleGroup, string> {
    private _idToGroupMap: IDictionaryStringTo<IRuleGroup>;
    private _workItemTypeName: string;

    constructor() {
        super();
        this._idToGroupMap = {};
    }

    public getItem(groupId: string, personalRulesEnabled?: boolean, globalRulesEnabled?: boolean): IRuleGroup {
        if (personalRulesEnabled && groupId === Constants.PersonalRuleGroupId) {
            return PersonalRuleGroup;
        }
        if (globalRulesEnabled && groupId === Constants.GlobalRuleGroupId) {
            return GlobalRuleGroup;
        }

        return this._idToGroupMap[groupId.toLowerCase()];
    }

    public getAll(personalRulesEnabled?: boolean, globalRulesEnabled?: boolean): IRuleGroup[] {
        if (this.items) {
            const extraRuleGroups: IRuleGroup[] = [];

            if (personalRulesEnabled) {
                extraRuleGroups.push(PersonalRuleGroup);
            }
            if (globalRulesEnabled) {
                extraRuleGroups.push(GlobalRuleGroup);
            }

            return extraRuleGroups.concat(this.items);
        }
        else {
            return null;
        }
    }

    public setCurrentWorkItemType(workItemTypeName: string) {
        this._workItemTypeName = workItemTypeName;
    }

    public checkCurrentWorkItemType(workItemTypeName: string): boolean {
        return stringEquals(this._workItemTypeName, workItemTypeName, true);
    }

    public clear() {
        this.items = null;
        this._idToGroupMap = {};
        this._workItemTypeName = null;
    }

    public getKey(): string {
        return RuleGroupServiceName;
    }

    public async initializeRuleGroups(workItemTypeName: string) {
        if (!this.isLoading(workItemTypeName)) {
            this.setLoading(true, workItemTypeName);

            const ruleGroups = await RuleGroupsDataService.loadRuleGroups(workItemTypeName, VSS.getWebContext().project.id);

            if (this.checkCurrentWorkItemType(workItemTypeName)) {
                this._initializeItems(ruleGroups);
            }

            this.setLoading(false, workItemTypeName);
        }
    }

    public async createRuleGroup(workItemTypeName: string, ruleGroup: IRuleGroup) {
        if (!this.isLoading(workItemTypeName)) {
            const createdRuleGroup = await RuleGroupsDataService.createRuleGroup(workItemTypeName, ruleGroup, VSS.getWebContext().project.id);

            if (this.checkCurrentWorkItemType(workItemTypeName)) {
                this._addOrUpdateItem(createdRuleGroup);
            }

            SettingsDataService.updateCacheStamp(workItemTypeName, VSS.getWebContext().project.id);
            publishTelemetry(TelemetryEvent.CreateRuleGroup, null, null, ruleGroup);
        }
    }

    public async updateRuleGroup(workItemTypeName: string, ruleGroup: IRuleGroup) {
        if (!this.isLoading(ruleGroup.id)) {
            this.setLoading(true, ruleGroup.id);

            try {
                const updatedRuleGroup = await RuleGroupsDataService.updateRuleGroup(workItemTypeName, ruleGroup, VSS.getWebContext().project.id);

                if (this.checkCurrentWorkItemType(workItemTypeName)) {
                    this._addOrUpdateItem(updatedRuleGroup);
                }
                this.setLoading(false, ruleGroup.id);

                SettingsDataService.updateCacheStamp(workItemTypeName, VSS.getWebContext().project.id);
                publishTelemetry(TelemetryEvent.UpdateRuleGroup, null, null, ruleGroup);
            }
            catch (e) {
                this.setLoading(false, ruleGroup.id);
                throw e;
            }
        }
    }

    public async deleteRuleGroup(workItemTypeName: string, ruleGroup: IRuleGroup) {
        if (!this.isLoading(ruleGroup.id)) {
            this.setLoading(true, ruleGroup.id);
            await RuleGroupsDataService.deleteRuleGroup(workItemTypeName, ruleGroup.id, VSS.getWebContext().project.id);

            if (this.checkCurrentWorkItemType(workItemTypeName)) {
                this._removeItem(ruleGroup);
            }

            this.setLoading(false, ruleGroup.id);
            SettingsDataService.updateCacheStamp(workItemTypeName, VSS.getWebContext().project.id);
            publishTelemetry(TelemetryEvent.DeleteRuleGroup, null, null, ruleGroup);
        }
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }

    private _initializeItems(ruleGroups: IRuleGroup[]) {
        if (ruleGroups) {
            this.items = ruleGroups;
            this._idToGroupMap = {};
            for (const ruleGroup of ruleGroups) {
                this._idToGroupMap[ruleGroup.id.toLowerCase()] = ruleGroup;
            }
        }

        this._notifyChanged();
    }

    private _addOrUpdateItem(ruleGroup: IRuleGroup) {
        if (!ruleGroup || !this.items) {
            return;
        }

        if (this._idToGroupMap == null) {
            this._idToGroupMap = {};
        }
        // add in all items
        const existingIndex = findIndex(this.items, (existingItem: IRuleGroup) => stringEquals(ruleGroup.id, existingItem.id, true));
        if (existingIndex === -1) {
            this.items.push(ruleGroup);
        }
        else {
            this.items[existingIndex] = ruleGroup;
        }

        this._idToGroupMap[ruleGroup.id.toLowerCase()] = ruleGroup;
        this._notifyChanged();
    }

    private _removeItem(ruleGroup: IRuleGroup) {
        if (!ruleGroup || !ruleGroup.id || !this.items) {
            return;
        }

        // remove from all items
        const existingIndex = findIndex(this.items, (existingItem: IRuleGroup) => stringEquals(ruleGroup.id, existingItem.id, true));
        if (existingIndex !== -1) {
            this.items.splice(existingIndex, 1);
        }

        if (this._idToGroupMap && this._idToGroupMap[ruleGroup.id.toLowerCase()]) {
            delete this._idToGroupMap[ruleGroup.id.toLowerCase()];
        }
        this._notifyChanged();
    }
}

Services.add(RuleGroupServiceName, { serviceFactory: RuleGroupService });
