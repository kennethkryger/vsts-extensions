import { DelayedFunction } from "Common/Utilities/Core";
import { newGuid } from "Common/Utilities/Guid";
import { getCurrentUserName, getDistinctNameFromIdentityRef } from "Common/Utilities/Identity";
import { Constants } from "OneClick/Constants";
import { IRule, IRuleGroup } from "OneClick/Interfaces";

const flush = new DelayedFunction(null, 100, () => {
    const insights = getInsights();
    if (insights) {
        insights.flush();
    }
});

let SessionId: string;

export function flushInsightsNow() {
    flush.invokeNow();
}

export function trackEvent(name: string, properties?: IDictionaryStringTo<string>, measurements?: IDictionaryStringTo<number>) {
    const insights = getInsights();
    if (insights) {
        const props = {
            ...(properties || {}),
            host: VSS.getWebContext().host.authority,
            sessionId: SessionId
        };
        insights.trackEvent(name, props, measurements);
        flush.reset();
    }
}

export function resetSession() {
    SessionId = newGuid();
}

export enum TelemetryEvent {
    CreateRuleGroup,
    UpdateRuleGroup,
    DeleteRuleGroup,
    CreateRule,
    UpdateRule,
    DeleteRule
}

export function publishTelemetry(event: TelemetryEvent, rule?: IRule, ruleGroupId?: string, ruleGroup?: IRuleGroup) {
    switch (event) {
        case TelemetryEvent.CreateRuleGroup:
            if (ruleGroup) {
                trackEvent("CreateRuleGroup", {
                    createdBy: getDistinctNameFromIdentityRef(ruleGroup.createdBy),
                    disabled: ruleGroup.disabled ? "true" : "false",
                    workItemTypeName: ruleGroup.workItemType,
                    project: ruleGroup.projectId
                });
            }
            break;
        case TelemetryEvent.UpdateRuleGroup:
            if (ruleGroup) {
                trackEvent("UpdateRuleGroup", {
                    createdBy: getDistinctNameFromIdentityRef(ruleGroup.createdBy),
                    updatedBy: getDistinctNameFromIdentityRef(ruleGroup.lastUpdatedBy),
                    disabled: ruleGroup.disabled ? "true" : "false",
                    workItemTypeName: ruleGroup.workItemType,
                    project: ruleGroup.projectId
                });
            }
            break;
        case TelemetryEvent.DeleteRuleGroup:
            if (ruleGroup) {
                trackEvent("DeleteRuleGroup", {
                    deletedBy: getCurrentUserName(),
                    workItemTypeName: ruleGroup.workItemType,
                    project: ruleGroup.projectId
                });
            }
            break;
        case TelemetryEvent.CreateRule:
            if (rule && ruleGroupId) {
                trackEvent("CreateRule", {
                    createdBy: getDistinctNameFromIdentityRef(rule.createdBy),
                    disabled: rule.disabled ? "true" : "false",
                    actionCount: rule.actions.length.toString(),
                    actions: rule.actions.map(a => a.name).join("; "),
                    triggerCount: rule.triggers.length.toString(),
                    triggers: rule.triggers.map(t => t.name).join("; "),
                    workItemTypeName: rule.workItemType,
                    project: rule.projectId,
                    ruleGroupId: ruleGroupId,
                    isPersonal: ruleGroupId === Constants.PersonalRuleGroupId ? "true" : "false",
                    isGlobal: ruleGroupId === Constants.GlobalRuleGroupId ? "true" : "false"
                });
            }
            break;
        case TelemetryEvent.UpdateRule:
            if (rule && ruleGroupId) {
                trackEvent("UpdateRule", {
                    createdBy: getDistinctNameFromIdentityRef(rule.createdBy),
                    updatedBy: getDistinctNameFromIdentityRef(rule.lastUpdatedBy),
                    disabled: rule.disabled ? "true" : "false",
                    actionCount: rule.actions.length.toString(),
                    actions: rule.actions.map(a => a.name).join("; "),
                    triggerCount: rule.triggers.length.toString(),
                    triggers: rule.triggers.map(t => t.name).join("; "),
                    workItemTypeName: rule.workItemType,
                    project: rule.projectId,
                    ruleGroupId: ruleGroupId,
                    isPersonal: ruleGroupId === Constants.PersonalRuleGroupId ? "true" : "false",
                    isGlobal: ruleGroupId === Constants.GlobalRuleGroupId ? "true" : "false"
                });
            }
            break;
        case TelemetryEvent.DeleteRule:
            if (rule && ruleGroupId) {
                trackEvent("DeleteRule", {
                    deletedBy: getCurrentUserName(),
                    workItemTypeName: rule.workItemType,
                    project: rule.projectId,
                    ruleGroupId: ruleGroupId,
                    isPersonal: ruleGroupId === Constants.PersonalRuleGroupId ? "true" : "false",
                    isGlobal: ruleGroupId === Constants.GlobalRuleGroupId ? "true" : "false"
                });
            }
            break;
        default:
            // no op
    }
}

function getInsights() {
    return window["appInsights"];
}
