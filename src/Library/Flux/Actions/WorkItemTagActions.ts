import { WorkItemTagActionsHub } from "Library/Flux/Actions/ActionsHub";
import { WorkItemTagStore } from "Library/Flux/Stores/WorkItemTagStore";
import { localeIgnoreCaseComparer } from "Library/Utilities/String";
import { WebApiTagDefinition } from "TFS/Core/Contracts";
import * as Auth from "VSS/Authentication/Services";

export class WorkItemTagActions {
    constructor(private _actionsHub: WorkItemTagActionsHub, private _tagsStore: WorkItemTagStore) {}

    public async initializeTags() {
        if (this._tagsStore.isLoaded()) {
            this._actionsHub.InitializeTags.invoke(null);
        }
        else if (!this._tagsStore.isLoading()) {
            this._tagsStore.setLoading(true);
            try {
                const tags = await this._getTags();
                tags.sort((a: WebApiTagDefinition, b: WebApiTagDefinition) => localeIgnoreCaseComparer(a.name, b.name));
                this._actionsHub.InitializeTags.invoke(tags);
                this._tagsStore.setLoading(false);
            }
            catch (e) {
                this._actionsHub.InitializeTags.invoke([]);
                this._tagsStore.setLoading(false);
            }
        }
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
}
