import { BaseActionsCreator } from "Library/Flux/Action";
import { GitRepoActionsHub, GitRepoStore, KeyName } from "Library/Flux/GitRepo";
import { localeIgnoreCaseComparer } from "Library/Utilities/String";
import { GitRepository } from "TFS/VersionControl/Contracts";
import * as GitClient from "TFS/VersionControl/GitRestClient";

export class GitRepoActionsCreator extends BaseActionsCreator {
    constructor(private _actionsHub: GitRepoActionsHub, private _gitRepoStore: GitRepoStore) {
        super();
    }

    public getKey(): string {
        return KeyName;
    }

    public async initializeGitRepos() {
        if (this._gitRepoStore.isLoaded()) {
            this._actionsHub.InitializeGitRepos.invoke(null);
        }
        else if (!this._gitRepoStore.isLoading()) {
            this._gitRepoStore.setLoading(true);
            try {
                const gitRepos =  await GitClient.getClient().getRepositories(VSS.getWebContext().project.id);
                gitRepos.sort((a: GitRepository, b: GitRepository) => localeIgnoreCaseComparer(a.name, b.name));
                this._actionsHub.InitializeGitRepos.invoke(gitRepos);
                this._gitRepoStore.setLoading(false);
            }
            catch (e) {
                this._gitRepoStore.setLoading(false);
                throw e.message;
            }
        }
    }
}
