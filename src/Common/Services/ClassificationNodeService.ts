import { BaseDataService } from "Common/Services/BaseDataService";
import { Services } from "Common/Utilities/Context";
import { TreeStructureGroup, WorkItemClassificationNode } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";

export const ClassificationNodeServiceName = "ClassificationNodeService";

export interface IClassificationNodeItem {
    areaPathRoot: WorkItemClassificationNode;
    iterationPathRoot: WorkItemClassificationNode;
}

export enum ClassificationNodeKey {
    Area = "Area",
    Iteration = "Iteration"
}

export class ClassificationNodeService extends BaseDataService<IClassificationNodeItem, WorkItemClassificationNode, ClassificationNodeKey> {
    private _areaPathIdMap: IDictionaryStringTo<WorkItemClassificationNode>;
    private _areaPathMap: IDictionaryStringTo<WorkItemClassificationNode>;
    private _iterationPathIdMap: IDictionaryStringTo<WorkItemClassificationNode>;
    private _iterationPathMap: IDictionaryStringTo<WorkItemClassificationNode>;

    constructor() {
        super();

        this.items = {} as IClassificationNodeItem;
        this._areaPathIdMap = {};
        this._areaPathMap = {};
        this._iterationPathIdMap = {};
        this._iterationPathMap = {};
    }

    public async initializeAreaPaths() {
        if (this.isLoaded(ClassificationNodeKey.Area)) {
            this._notifyChanged();
        }
        else if (!this.isLoading(ClassificationNodeKey.Area)) {
            this.setLoading(true, ClassificationNodeKey.Area);
            try {
                const rootNode: WorkItemClassificationNode = await WitClient.getClient()
                                                                    .getClassificationNode(VSS.getWebContext().project.id, TreeStructureGroup.Areas, null, 5);
                this._populateAreaPaths(rootNode);
            }
            catch (e) {
                this.setLoading(false, ClassificationNodeKey.Area);
                throw e.message;
            }
        }
    }

    public async initializeIterationPaths() {
        if (this.isLoaded(ClassificationNodeKey.Iteration)) {
            this._notifyChanged();
        }
        else if (!this.isLoading(ClassificationNodeKey.Iteration)) {
            this.setLoading(true, ClassificationNodeKey.Iteration);
            try {
                const rootNode: WorkItemClassificationNode = await WitClient.getClient()
                                                                    .getClassificationNode(VSS.getWebContext().project.id, TreeStructureGroup.Iterations, null, 5);
                this._populateIterationPaths(rootNode);
            }
            catch (e) {
                this.setLoading(false, ClassificationNodeKey.Iteration);
                throw e.message;
            }
        }
    }

    public getItem(nodeKey: ClassificationNodeKey): WorkItemClassificationNode {
        return nodeKey === ClassificationNodeKey.Area ? this.items.areaPathRoot : this.items.iterationPathRoot;
    }

    public getAreaPathNode(nodeIdOrPath: string): WorkItemClassificationNode {
        const key = (nodeIdOrPath || "").toLowerCase();
        return this._areaPathIdMap[key] || this._areaPathMap[key];
    }

    public getIterationPathNode(nodeIdOrPath: string): WorkItemClassificationNode {
        const key = (nodeIdOrPath || "").toLowerCase();
        return this._iterationPathIdMap[key] || this._iterationPathMap[key];
    }

    public getKey(): string {
        return ClassificationNodeServiceName;
    }

    protected convertItemKeyToString(key: ClassificationNodeKey): string {
        return key;
    }

    private _populateAreaPaths(rootNode: WorkItemClassificationNode) {
        if (rootNode) {
            this.items.areaPathRoot = rootNode;
            this._populateNodeData(rootNode, null, ClassificationNodeKey.Area);
        }

        this.setLoading(false, ClassificationNodeKey.Area);
    }

    private _populateIterationPaths(rootNode: WorkItemClassificationNode) {
        if (rootNode) {
            this.items.iterationPathRoot = rootNode;
            this._populateNodeData(rootNode, null, ClassificationNodeKey.Iteration);
        }

        this.setLoading(false, ClassificationNodeKey.Iteration);
    }

    private _populateNodeData(node: WorkItemClassificationNode, parentNodeName: string, nodeType: ClassificationNodeKey) {
        const nodeName = parentNodeName ? `${parentNodeName}\\${node.name}` : node.name;

        if (nodeType === ClassificationNodeKey.Area) {
            this._areaPathMap[nodeName.toLowerCase()] = node;
            this._areaPathIdMap[node.id.toString()] = node;
        }
        else {
            this._iterationPathMap[nodeName.toLowerCase()] = node;
            this._iterationPathIdMap[node.id.toString()] = node;
        }

        if (node.children) {
            for (const child of node.children) {
                this._populateNodeData(child, nodeName, nodeType);
            }
        }
    }
}

Services.add(ClassificationNodeServiceName, { serviceFactory: ClassificationNodeService });
