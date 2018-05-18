import { BaseDataService } from "Common/Services/BaseDataService";
import { Services } from "Common/Utilities/Context";
import { localeIgnoreCaseComparer } from "Common/Utilities/String";
import { WebApiTagDefinition } from "TFS/Core/Contracts";
import * as Auth from "VSS/Authentication/Services";

export const WorkItemTagServiceName = "WorkItemTagService";

export class WorkItemTagService extends BaseDataService<WebApiTagDefinition[], WebApiTagDefinition, string> {
    private _itemsIdMap: IDictionaryStringTo<WebApiTagDefinition>;
    private _itemsNameMap: IDictionaryStringTo<WebApiTagDefinition>;

    constructor() {
        super();
        this._itemsIdMap = {};
        this._itemsNameMap = {};
    }

    public getItem(idOrName: string): WebApiTagDefinition {
        const key = (idOrName || "").toLowerCase();
        return this._itemsIdMap[key] || this._itemsNameMap[key];
    }

    public getKey(): string {
        return WorkItemTagServiceName;
    }

    public async initializeTags() {
        if (this.isLoaded()) {
            this._notifyChanged();
        }
        else if (!this.isLoading()) {
            this.setLoading(true);
            try {
                const tags = await this._getTags();
                tags.sort((a: WebApiTagDefinition, b: WebApiTagDefinition) => localeIgnoreCaseComparer(a.name, b.name));
                this._populateTags(tags);
            }
            catch (e) {
                this._populateTags([]);
            }
        }
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }

    private async _getTags(): Promise<WebApiTagDefinition[]> {
        const webContext = VSS.getWebContext();
        const accessToken = await VSS.getAccessToken();
        const authHeader = Auth.authTokenManager.getAuthorizationHeader(accessToken);
        const url = `${webContext.collection.uri}/_apis/tagging/scopes/${webContext.project.id}/tags`;

        const ajaxOptions = {
            url: url,
            method: "GET",
            data: null,
            beforeSend: (req) => {
                req.setRequestHeader("Authorization", authHeader);
                req.setRequestHeader("Accept", "application/json");
            }
        };

        const data = await $.ajax(ajaxOptions);
        return data.value;
    }

    private _populateTags(tags: WebApiTagDefinition[]) {
        if (tags) {
            this.items = tags;
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

Services.add(WorkItemTagServiceName, { serviceFactory: WorkItemTagService });
