import { Action } from "Library/Flux/Actions/Action";
import { WebApiTagDefinition, WebApiTeam } from "TFS/Core/Contracts";
import { GitRepository } from "TFS/VersionControl/Contracts";
import { TeamFieldValues } from "TFS/Work/Contracts";
import {
    WorkItem, WorkItemClassificationNode, WorkItemField, WorkItemRelationType, WorkItemStateColor,
    WorkItemTemplate, WorkItemTemplateReference, WorkItemType
} from "TFS/WorkItemTracking/Contracts";

export class WorkItemTypeActionsHub {
    public InitializeWorkItemTypes = new Action<WorkItemType[]>();
}

export class WorkItemRelationTypeActionsHub {
    public InitializeWorkItemRelationTypes = new Action<WorkItemRelationType[]>();
}

export class WorkItemFieldActionsHub {
    public InitializeWorkItemFields = new Action<WorkItemField[]>();
}

export class WorkItemTemplateActionsHub {
    public InitializeWorkItemTemplates = new Action<{teamId: string, templates: WorkItemTemplateReference[]}>();
}

export class WorkItemTemplateItemActionsHub {
    public InitializeWorkItemTemplateItem = new Action<WorkItemTemplate>();
}

export class WorkItemStateItemActionsHub {
    public InitializeWorkItemStateItems = new Action<{witName: string, states: WorkItemStateColor[]}>();
}

export class TeamActionsHub {
    public InitializeTeams = new Action<WebApiTeam[]>();
}

export class WorkItemTagActionsHub {
    public InitializeTags = new Action<WebApiTagDefinition[]>();
}

export class GitRepoActionsHub {
    public InitializeGitRepos = new Action<GitRepository[]>();
}

export class TeamFieldActionsHub {
    public InitializeTeamFieldItem = new Action<{teamId: string, teamFieldValues: TeamFieldValues}>();
}

export class WorkItemTypeFieldAllowedValuesActionsHub {
    public InitializeAllowedValues = new Action<{workItemType: string, fieldRefName: string, allowedValues: string[]}>();
}

export class WorkItemActionsHub {
    public AddOrUpdateWorkItems = new Action<WorkItem[]>();
    public DeleteWorkItems = new Action<number[]>();
    public ClearWorkItems = new Action();
}

export class ErrorMessageActionsHub {
    public PushErrorMessage = new Action<{errorMessage: string, errorKey: string}>();
    public DismissErrorMessage = new Action<string>();
    public DismissAllErrorMessages = new Action<void>();
}

export class ClassificationNodeActionsHub {
    public InitializeAreaPaths = new Action<WorkItemClassificationNode>();
    public InitializeIterationPaths = new Action<WorkItemClassificationNode>();
}
