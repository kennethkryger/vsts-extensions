import { BaseDataService } from "Common/Services/BaseDataService";
import { Services } from "Common/Utilities/Context";
import { localeIgnoreCaseComparer } from "Common/Utilities/String";
import { WebApiTeam } from "TFS/Core/Contracts";
import * as CoreClient from "TFS/Core/RestClient";
import * as VSS_Service from "VSS/Service";

export const TeamServiceName = "TeamService";

export class TeamService extends BaseDataService<WebApiTeam[], WebApiTeam, string> {
    private _itemsIdMap: IDictionaryStringTo<WebApiTeam>;
    private _itemsNameMap: IDictionaryStringTo<WebApiTeam>;

    constructor() {
        super();
        this._itemsIdMap = {};
        this._itemsNameMap = {};
    }

    public getItem(idOrName: string): WebApiTeam {
        const key = (idOrName || "").toLowerCase();
        return this._itemsIdMap[key] || this._itemsNameMap[key];
    }

    public getKey(): string {
        return TeamServiceName;
    }

    public async initializeTeams() {
        if (this.isLoaded()) {
            this._notifyChanged();
        }
        else if (!this.isLoading()) {
            this.setLoading(true);
            try {
                const teams = await this._getTeams();
                teams.sort((a: WebApiTeam, b: WebApiTeam) => localeIgnoreCaseComparer(a.name, b.name));
                this._populateTeams(teams);
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

    private async _getTeams(): Promise<WebApiTeam[]> {
        const teams: WebApiTeam[] = [];
        const top: number = 300;
        const client = await VSS_Service.getClient<CoreClient.CoreHttpClient4>(CoreClient.CoreHttpClient4);
        const project = VSS.getWebContext().project.id;

        const getTeamDelegate = async (skip: number) => {
            const result: WebApiTeam[] = await client.getTeams(project, top, skip);
            if (result.length > 0) {
                teams.push(...result);
            }
            if (result.length === top) {
                await getTeamDelegate(skip + top);
            }
            return;
        };

        await getTeamDelegate(0);
        return teams;
    }

    private _populateTeams(teams: WebApiTeam[]) {
        if (teams) {
            this.items = teams;
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

Services.add(TeamServiceName, { serviceFactory: TeamService });
