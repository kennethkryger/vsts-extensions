import { BaseDataService } from "Common/Services/BaseDataService";
import { findIndex, first } from "Common/Utilities/Array";
import { Services } from "Common/Utilities/Context";
import { stringEquals } from "Common/Utilities/String";
import { Constants, GlobalRuleGroup, PersonalRuleGroup } from "OneClick/Constants";
import { RulesDataService } from "OneClick/DataServices/RulesDataService";
import { SettingsDataService } from "OneClick/DataServices/SettingsDataService";
import { IRule, IRuleGroup } from "OneClick/Interfaces";

export const RuleServiceName = "RuleService";

export class RuleService extends BaseDataService<IDictionaryStringTo<IRule[]>, IRule[], string> {
    constructor() {
        super();
        this.items = {};
    }

    public getItem(ruleGroupId: string): IRule[] {
        return this.getRules(ruleGroupId, null);
    }

    public getRules(ruleGroupId: string, workItemType: string): IRule[] {
        const items = this.items[ruleGroupId.toLowerCase()];
        if (items && (ruleGroupId === Constants.PersonalRuleGroupId || ruleGroupId === Constants.GlobalRuleGroupId)) {
            return items.filter(i => stringEquals(i.workItemType, workItemType, true));
        }
        return items;
    }

    public getRule(ruleGroupId: string, ruleId: string, workItemType: string): IRule {
        const rules = this.getRules(ruleGroupId, workItemType) || [];
        return first(rules, rg => stringEquals(rg.id, ruleId, true));
    }

    public getKey(): string {
        return RuleServiceName;
    }

    public clear() {
        this.items = {};
    }

    public async initializeRules(ruleGroupId: string) {
        if (this.isLoaded(ruleGroupId)) {
            this._initializeRules(null, null);
        }
        else {
            this.refreshRules(ruleGroupId);
        }
    }

    public async refreshRules(ruleGroupId: string) {
        if (!this.isLoading(ruleGroupId)) {
            this.setLoading(true, ruleGroupId);
            const rules = await RulesDataService.loadRulesForGroup(ruleGroupId, VSS.getWebContext().project.id);

            this._initializeRules(ruleGroupId, rules);
        }
    }

    public async createRule(ruleGroupId: string, rule: IRule) {
        if (!this.isLoading(ruleGroupId)) {
            const createdRule = await RulesDataService.createRule(ruleGroupId, rule);
            this._addOrUpdateItem(ruleGroupId, createdRule);

            SettingsDataService.updateCacheStamp(rule.workItemType, rule.projectId);
        }
    }

    public async updateRule(ruleGroupId: string, rule: IRule) {
        if (!this.isLoading(rule.id)) {
            this.setLoading(true, rule.id);
            try {
                const updatedRule = await RulesDataService.updateRule(ruleGroupId, rule);
                this._addOrUpdateItem(ruleGroupId, updatedRule);

                SettingsDataService.updateCacheStamp(rule.workItemType, rule.projectId);
            }
            catch (e) {
                this.setLoading(false, rule.id);
                throw e;
            }
        }
    }

    public async deleteRule(ruleGroupId: string, rule: IRule) {
        if (!this.isLoading(rule.id)) {
            await RulesDataService.deleteRule(ruleGroupId, rule.id);
            this._removeItem(ruleGroupId, rule);
            SettingsDataService.updateCacheStamp(rule.workItemType, rule.projectId);
        }
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }

    private _initializeRules(ruleGroupId: string, rules: IRule[]) {
        if (ruleGroupId && rules) {
            this.items[ruleGroupId.toLowerCase()] = rules;
        }

        this.setLoading(false, ruleGroupId);
    }

    private _addOrUpdateItem(ruleGroupId: string, item: IRule) {
        if (!item || !ruleGroupId) {
            return;
        }

        if (this.items[ruleGroupId.toLowerCase()] == null) {
            this.items[ruleGroupId.toLowerCase()] = [];
        }
        // add in all items
        const existingIndex = findIndex(this.items[ruleGroupId.toLowerCase()], (existingItem: IRule) => stringEquals(item.id, existingItem.id, true));
        if (existingIndex !== -1) {
            this.items[ruleGroupId.toLowerCase()][existingIndex] = item;
        }
        else {
            this.items[ruleGroupId.toLowerCase()].push(item);
        }

        this.setLoading(false, item.id);
    }

    private _removeItem(ruleGroupId: string, rule: IRule) {
        if (!rule || !rule.id || !ruleGroupId || this.items[ruleGroupId.toLowerCase()] == null) {
            return;
        }

        // remove from all items
        const existingIndex = findIndex(this.items[ruleGroupId.toLowerCase()], (existingItem: IRule) => stringEquals(rule.id, existingItem.id, true));
        if (existingIndex !== -1) {
            this.items[ruleGroupId.toLowerCase()].splice(existingIndex, 1);
        }

        this._notifyChanged();
    }
}

Services.add(RuleServiceName, { serviceFactory: RuleService });
