import * as React from "react";

import {
    BaseFluxComponent, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { ITreeComboProps, TreeCombo } from "Library/Components/VssCombo/TreeCombo";
import { BaseStore } from "Library/Flux/BaseStore";
import {
    ClassificationNodeActionsCreator, ClassificationNodeKey, ClassificationNodeStore
} from "Library/Flux/ClassificationNode";
import { isNullOrEmpty } from "Library/Utilities/String";
import { Spinner, SpinnerSize } from "OfficeFabric/Spinner";
import { css } from "OfficeFabric/Utilities";
import { WorkItemClassificationNode } from "TFS/WorkItemTracking/Contracts";
import { TreeNode } from "VSS/Controls/TreeView";

export interface IClassificationPickerProps extends ITreeComboProps {
    keyType: ClassificationNodeKey;
    store: ClassificationNodeStore;
    actionsCreator: ClassificationNodeActionsCreator;
}

export interface IClassificationPickerState extends IBaseFluxComponentState {
    treeNode?: TreeNode;
    value?: string;
}

export class ClassificationPicker extends BaseFluxComponent<IClassificationPickerProps, IClassificationPickerState> {
    public componentDidMount() {
        super.componentDidMount();
        this._initializeNodes(this.props.keyType);
    }

    public componentWillReceiveProps(nextProps: IClassificationPickerProps, context?: any) {
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

    protected getStoresState(): IClassificationPickerState {
        return {
            treeNode: this._getTreeNode(this.props.store.getItem(this.props.keyType), null, 1)
        };
    }

    protected initializeState(): void {
        this.state = {
            value: this.props.value || ""
        };
    }

    protected getStores(): BaseStore<any, any, any, any>[] {
        return [this.props.store];
    }

    private _initializeNodes(keyType: ClassificationNodeKey) {
        if (this.props.store.isLoaded(keyType)) {
            this.setState({
                treeNode: this._getTreeNode(this.props.store.getItem(keyType), null, 1)
            });
        }
        else if (keyType === ClassificationNodeKey.Area) {
            this.props.actionsCreator.initializeAreaPaths();
        }
        else {
            this.props.actionsCreator.initializeIterationPaths();
        }
    }

    private _getTreeNode(node: WorkItemClassificationNode, uiNode: TreeNode, level: number): TreeNode {
        if (!node) {
            return null;
        }

        const nodes = node.children;
        let newUINode: TreeNode;
        const nodeName = node.name;

        level = level || 1;
        if (uiNode) {
            newUINode = TreeNode.create(nodeName);
            uiNode.add(newUINode);
            uiNode = newUINode;
        }
        else {
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
            return !this.props.store.getAreaPathNode(nodePath) ? "This area path doesn't exist in the current project" : null;
        }
        else if (this.props.keyType === ClassificationNodeKey.Iteration) {
            return !this.props.store.getIterationPathNode(nodePath) ? "This iteration path doesn't exist in the current project" : null;
        }

        return null;
    }

    private _onChange = (value: string) => {
        this.setState({value: value}, () => {
            this.props.onChange(value);
        });
    }
}
