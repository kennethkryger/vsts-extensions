import { BaseStore } from "Library/Flux/BaseStore";
import { GitRepoActionsHub, KeyName } from "Library/Flux/GitRepo";
import { GitRepository } from "TFS/VersionControl/Contracts";

export class GitRepoStore extends BaseStore<GitRepository[], GitRepository, string, GitRepoActionsHub> {
    private _itemsIdMap: IDictionaryStringTo<GitRepository>;
    private _itemsNameMap: IDictionaryStringTo<GitRepository>;

    constructor(actionsHub: GitRepoActionsHub) {
        super(actionsHub);
        this._itemsIdMap = {};
        this._itemsNameMap = {};
    }

    public getItem(idOrName: string): GitRepository {
        const key = (idOrName || "").toLowerCase();
        return this._itemsIdMap[key] || this._itemsNameMap[key];
    }

    public getKey(): string {
        return KeyName;
    }

    protected initializeActionListeners() {
        this.actionsHub.InitializeGitRepos.addListener((repos: GitRepository[]) => {
            if (repos) {
                this.items = repos;
                this._itemsIdMap = {};
                this._itemsNameMap = {};

                for (const item of this.items) {
                    this._itemsIdMap[item.id.toLowerCase()] = item;
                    this._itemsNameMap[item.name.toLowerCase()] = item;
                }
            }

            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }
}
