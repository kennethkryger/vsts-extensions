import * as React from "react";

import { IVssComponentState, VssComponent } from "Common/Components/Utilities/VssComponent";
import { ITreeComboProps, TreeCombo } from "Common/Components/VssCombo/TreeCombo";
import { BaseDataService } from "Common/Services/BaseDataService";
import {
    ClassificationNodeKey, ClassificationNodeService, ClassificationNodeServiceName
} from "Common/Services/ClassificationNodeService";
import { IReactAppContext } from "Common/Utilities/Context";
import { isNullOrEmpty } from "Common/Utilities/String";
import { Spinner, SpinnerSize } from "OfficeFabric/Spinner";
import { css } from "OfficeFabric/Utilities";
import { WorkItemClassificationNode } from "TFS/WorkItemTracking/Contracts";
import { TreeNode } from "VSS/Controls/TreeView";

export interface IClassificationPickerProps extends ITreeComboProps {
    keyType: ClassificationNodeKey;
}

export interface IClassificationPickerState extends IVssComponentState {
    treeNode?: TreeNode;
    value?: string;
}

export class ClassificationPicker extends VssComponent<IClassificationPickerProps, IClassificationPickerState> {
    private _classificationNodeService: ClassificationNodeService;

    constructor(props: IClassificationPickerProps, context?: IReactAppContext) {
        super(props, context);
        this._classificationNodeService = this.context.appContext.getService<ClassificationNodeService>(ClassificationNodeServiceName);
    }

    public componentDidMount() {
        super.componentDidMount();
        this._initializeNodes(this.props.keyType);
    }

    public componentWillReceiveProps(nextProps: IClassificationPickerProps, context?: IReactAppContext) {
        super.componentWillReceiveProps(nextProps, context);
        if (nextProps.value !== this.props.value) {
            this.setState({
                value: nextProps.value
            });
        }

        if (nextProps.keyType !== this.props.keyType) {
            this._initializeNodes(nextProps.keyType);
        }
    }

    public render(): JSX.Element {
        if (!this.state.treeNode) {
            return <Spinner size={SpinnerSize.large} />;
        }

        const { value } = this.state;
        const error = this.props.error || this._getDefaultError();
        const props = {
            ...this.props,
            className: css("classification-picker", this.props.className),
            value: value,
            options: [this.state.treeNode],
            error: error,
            onChange: this._onChange
        } as ITreeComboProps;

        return <TreeCombo {...props} />;
    }

    protected getDataServiceState(): IClassificationPickerState {
        return {
            treeNode: this._getTreeNode(this._classificationNodeService.getItem(this.props.keyType), null, 1)
        };
    }

    protected getInitialState(props: IClassificationPickerProps): IClassificationPickerState {
        return {
            value: props.value || ""
        };
    }

    protected getObservableDataServices(): BaseDataService<any, any, any>[] {
        return [this._classificationNodeService];
    }

    private _initializeNodes(keyType: ClassificationNodeKey) {
        if (this._classificationNodeService.isLoaded(keyType)) {
            this.setState({
                treeNode: this._getTreeNode(this._classificationNodeService.getItem(keyType), null, 1)
            });
        }
        else if (keyType === ClassificationNodeKey.Area) {
            this._classificationNodeService.initializeAreaPaths();
        }
        else {
            this._classificationNodeService.initializeIterationPaths();
        }
    }

    private _getTreeNode(node: WorkItemClassificationNode, uiNode: TreeNode, level: number): TreeNode {
        if (!node) {
            return null;
        }

        const nodes = node.children;
        let newUINode: TreeNode;
        const nodeName = node.name;

        // tslint:disable-next-line:no-parameter-reassignment
        level = level || 1;
        if (uiNode) {
            newUINode = TreeNode.create(nodeName);
            uiNode.add(newUINode);
            // tslint:disable-next-line:no-parameter-reassignment
            uiNode = newUINode;
        }
        else {
            // tslint:disable-next-line:no-parameter-reassignment
            uiNode = TreeNode.create(nodeName);
        }
        uiNode.expanded = level < 2;
        if (nodes) {
            for (const n of nodes) {
                this._getTreeNode(n, uiNode, level + 1);
            }
        }
        return uiNode;
    }

    private _getDefaultError(): string {
        const nodePath = this.state.value;
        if (isNullOrEmpty(nodePath)) {
            return this.props.required ? "A value is required." : null;
        }
        else if (this.props.keyType === ClassificationNodeKey.Area) {
            return !this._classificationNodeService.getAreaPathNode(nodePath) ? "This area path doesn't exist in the current project" : null;
        }
        else if (this.props.keyType === ClassificationNodeKey.Iteration) {
            return !this._classificationNodeService.getIterationPathNode(nodePath) ? "This iteration path doesn't exist in the current project" : null;
        }

        return null;
    }

    private _onChange = (value: string) => {
        this.setState({value: value}, () => {
            this.props.onChange(value);
        });
    }
}
