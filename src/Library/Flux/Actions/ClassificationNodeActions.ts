import { ClassificationNodeActionsHub } from "Library/Flux/Actions/ActionsHub";
import {
    ClassificationNodeKey, ClassificationNodeStore
} from "Library/Flux/Stores/ClassificationNodeStore";
import { TreeStructureGroup, WorkItemClassificationNode } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";

export class ClassificationNodeActions {
    constructor(private _actionsHub: ClassificationNodeActionsHub, private _classificationNodeStore: ClassificationNodeStore) {}

    public async initializeAreaPaths() {
        if (this._classificationNodeStore.isLoaded(ClassificationNodeKey.Area)) {
            this._actionsHub.InitializeAreaPaths.invoke(null);
        }
        else if (!this._classificationNodeStore.isLoading(ClassificationNodeKey.Area)) {
            this._classificationNodeStore.setLoading(true, ClassificationNodeKey.Area);
            try {
                const rootNode: WorkItemClassificationNode = await WitClient.getClient().getClassificationNode(VSS.getWebContext().project.id, TreeStructureGroup.Areas, null, 5);
                this._actionsHub.InitializeAreaPaths.invoke(rootNode);
                this._classificationNodeStore.setLoading(false, ClassificationNodeKey.Area);
            }
            catch (e) {
                this._classificationNodeStore.setLoading(false, ClassificationNodeKey.Area);
                throw e.message;
            }
        }
    }

    public async initializeIterationPaths() {
        if (this._classificationNodeStore.isLoaded(ClassificationNodeKey.Iteration)) {
            this._actionsHub.InitializeIterationPaths.invoke(null);
        }
        else if (!this._classificationNodeStore.isLoading(ClassificationNodeKey.Iteration)) {
            this._classificationNodeStore.setLoading(true, ClassificationNodeKey.Iteration);
            try {
                const rootNode: WorkItemClassificationNode = await WitClient.getClient()
                                                                    .getClassificationNode(VSS.getWebContext().project.id, TreeStructureGroup.Iterations, null, 5);
                this._actionsHub.InitializeIterationPaths.invoke(rootNode);
                this._classificationNodeStore.setLoading(false, ClassificationNodeKey.Iteration);
            }
            catch (e) {
                this._classificationNodeStore.setLoading(false, ClassificationNodeKey.Iteration);
                throw e.message;
            }
        }
    }
}
