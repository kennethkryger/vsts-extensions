import {
    BugBashItemCommentDataService
} from "BugBashPro/DataServices/BugBashItemCommentDataService";
import { IBugBashItemComment } from "BugBashPro/Interfaces";
import { BaseDataService } from "Common/Services/BaseDataService";
import { Services } from "Common/Utilities/Context";
import { isNullOrWhiteSpace } from "Common/Utilities/String";

export const BugBashItemCommentServiceName = "BugBashItemCommentService";

export class BugBashItemCommentService extends BaseDataService<IDictionaryStringTo<IBugBashItemComment[]>, IBugBashItemComment[], string> {
    constructor() {
        super();
        this.items = {};
    }

    public getItem(bugBashItemId: string): IBugBashItemComment[] {
         return this.items[(bugBashItemId || "").toLowerCase()] || null;
    }

    public getKey(): string {
        return BugBashItemCommentServiceName;
    }

    public clean() {
        this.items = {};
        this._notifyChanged();
    }

    public initializeComments(bugBashItemId: string) {
        if (this.isLoaded(bugBashItemId)) {
            this._notifyChanged();
        }
        else {
            this.refreshComments(bugBashItemId);
        }
    }

    public async refreshComments(bugBashItemId: string) {
        if (!this.isLoading(bugBashItemId)) {
            this.setLoading(true, bugBashItemId);

            const comments = await BugBashItemCommentDataService.loadComments(bugBashItemId);
            this.items[bugBashItemId.toLowerCase()] = comments;
            this.setLoading(false, bugBashItemId);
        }
    }

    public async createComment(bugBashItemId: string, commentString: string) {
        if (isNullOrWhiteSpace(commentString)) {
            return;
        }

        if (!this.isLoading(bugBashItemId)) {
            this.setLoading(true, bugBashItemId);

            try {
                const savedComment = await BugBashItemCommentDataService.createComment(bugBashItemId, commentString);
                if (this.items[bugBashItemId.toLowerCase()] == null) {
                    this.items[bugBashItemId.toLowerCase()] = [];
                }
                this.items[bugBashItemId.toLowerCase()].push(savedComment);
                this.setLoading(false, bugBashItemId);
            }
            catch (e) {
                this.setLoading(false, bugBashItemId);
                throw e;
            }
        }
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }
}

Services.add(BugBashItemCommentServiceName, { serviceFactory: BugBashItemCommentService });
