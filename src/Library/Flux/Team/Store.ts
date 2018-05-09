import { BaseStore } from "Library/Flux/BaseStore";
import { TeamActionsHub } from "Library/Flux/Team";
import { WebApiTeam } from "TFS/Core/Contracts";

export class TeamStore extends BaseStore<WebApiTeam[], WebApiTeam, string, TeamActionsHub> {
    private _itemsIdMap: IDictionaryStringTo<WebApiTeam>;
    private _itemsNameMap: IDictionaryStringTo<WebApiTeam>;

    constructor(actionsHub: TeamActionsHub) {
        super(actionsHub);
        this._itemsIdMap = {};
        this._itemsNameMap = {};
    }

    public getItem(idOrName: string): WebApiTeam {
        const key = (idOrName || "").toLowerCase();
        return this._itemsIdMap[key] || this._itemsNameMap[key];
    }

    public getKey(): string {
        return "TeamStore";
    }

    protected initializeActionListeners() {
        this.actionsHub.InitializeTeams.addListener((teams: WebApiTeam[]) => {
            if (teams) {
                this.items = teams;
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
