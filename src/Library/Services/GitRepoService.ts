import { BaseDataService } from "Library/Services/BaseDataService";
import { Services } from "Library/Utilities/Context";
import { localeIgnoreCaseComparer } from "Library/Utilities/String";
import { GitRepository } from "TFS/VersionControl/Contracts";
import * as GitClient from "TFS/VersionControl/GitRestClient";

export const GitRepoServiceName = "GitRepoService";

export class GitRepoService extends BaseDataService<GitRepository[], GitRepository, string> {
    private _itemsIdMap: IDictionaryStringTo<GitRepository>;
    private _itemsNameMap: IDictionaryStringTo<GitRepository>;

    constructor() {
        super();
        this._itemsIdMap = {};
        this._itemsNameMap = {};
    }

    public getItem(idOrName: string): GitRepository {
        const key = (idOrName || "").toLowerCase();
        return this._itemsIdMap[key] || this._itemsNameMap[key];
    }

    public getKey(): string {
        return GitRepoServiceName;
    }

    public async initializeGitRepos() {
        if (this.isLoaded()) {
            this._notifyChanged();
        }
        else if (!this.isLoading()) {
            this.setLoading(true);
            try {
                const gitRepos =  await GitClient.getClient().getRepositories(VSS.getWebContext().project.id);
                gitRepos.sort((a: GitRepository, b: GitRepository) => localeIgnoreCaseComparer(a.name, b.name));
                this._populateRepos(gitRepos);
            }
            catch (e) {
                this.setLoading(false);
                throw e.message;
            }
        }
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }

    private _populateRepos(repos: GitRepository[]) {
        if (repos) {
            this.items = repos;
            this._itemsIdMap = {};
            this._itemsNameMap = {};

            for (const item of this.items) {
                this._itemsIdMap[item.id.toLowerCase()] = item;
                this._itemsNameMap[item.name.toLowerCase()] = item;
            }
        }

        this.setLoading(false);
    }
}

Services.add(GitRepoServiceName, { serviceFactory: GitRepoService });
