import { Action, BaseActionsHub } from "Library/Flux/Action";
import { GitRepository } from "TFS/VersionControl/Contracts";

export const KeyName = "GitRepo";

export class GitRepoActionsHub extends BaseActionsHub {
    public InitializeGitRepos = new Action<GitRepository[]>();

    public getKey(): string {
        return KeyName;
    }
}
