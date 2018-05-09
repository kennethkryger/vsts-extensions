import { Action, IActionsHub } from "Library/Flux/Action";
import { GitRepository } from "TFS/VersionControl/Contracts";

export class GitRepoActionsHub implements IActionsHub {
    public InitializeGitRepos = new Action<GitRepository[]>();
}
