import "./WorkItemStateView.scss";

import * as React from "react";

import {
    IVssComponentProps, IVssComponentState, VssComponent
} from "Common/Components/Utilities/VssComponent";
import { BaseDataService } from "Common/Services/BaseDataService";
import {
    WorkItemStateItemService, WorkItemStateItemServiceName
} from "Common/Services/WorkItemStateItemService";
import { first } from "Common/Utilities/Array";
import { IReactAppContext } from "Common/Utilities/Context";
import { stringEquals } from "Common/Utilities/String";
import { Label } from "OfficeFabric/Label";
import { css } from "OfficeFabric/Utilities";
import { WorkItemStateColor } from "TFS/WorkItemTracking/Contracts";

export interface IWorkItemStateViewProps extends IVssComponentProps {
    state: string;
    workItemType: string;
}

export interface IWorkItemStateViewState extends IVssComponentState {
    workItemTypeState: WorkItemStateColor;
}

export class WorkItemStateView extends VssComponent<IWorkItemStateViewProps, IWorkItemStateViewState> {
    private _workItemStateItemService: WorkItemStateItemService;

    constructor(props: IWorkItemStateViewProps, context?: IReactAppContext) {
        super(props, context);
        this._workItemStateItemService = this.context.appContext.getService<WorkItemStateItemService>(WorkItemStateItemServiceName);
    }

    public componentDidMount() {
        super.componentDidMount();
        if (this._workItemStateItemService.isLoaded(this.props.workItemType)) {
            const workItemTypeStates = this._workItemStateItemService.getItem(this.props.workItemType);
            this.setState({
                workItemTypeState: first(workItemTypeStates, s => stringEquals(s.name, this.props.state, true))
            });
        }
        else {
            this._workItemStateItemService.initializeWorkItemStates(this.props.workItemType);
        }
    }

    public componentWillReceiveProps(nextProps: IWorkItemStateViewProps, context?: IReactAppContext) {
        super.componentWillReceiveProps(nextProps, context);

        if (!stringEquals(nextProps.state, this.props.state, true) || !stringEquals(nextProps.workItemType, this.props.workItemType, true)) {
            if (this._workItemStateItemService.isLoaded(nextProps.workItemType)) {
                const workItemTypeStates = this._workItemStateItemService.getItem(nextProps.workItemType);
                this.setState({
                    workItemTypeState: first(workItemTypeStates, s => stringEquals(s.name, nextProps.state, true))
                });
            }
            else {
                this._workItemStateItemService.initializeWorkItemStates(nextProps.workItemType);
            }
        }
    }

    public render(): JSX.Element {
        let stateColor;

        if (this.state.workItemTypeState && this.state.workItemTypeState.color) {
            stateColor = `#${this.state.workItemTypeState.color.substring(this.state.workItemTypeState.color.length - 6)}`;
        }
        else {
            stateColor = "#000000";
        }

        return (
            <div className={css("work-item-state-view", this.props.className)}>
                <span
                    className="work-item-type-state-color"
                    style={{
                        backgroundColor: stateColor,
                        borderColor: stateColor
                    }}
                />
                <Label className="state-name">{this.props.state}</Label>
            </div>
        );
    }

    protected getDataServiceState(): IWorkItemStateViewState {
        const workItemTypeStates = this._workItemStateItemService.getItem(this.props.workItemType);

        return {
            workItemTypeState: workItemTypeStates ? first(workItemTypeStates, s => stringEquals(s.name, this.props.state, true)) : null
        };
    }

    protected getInitialState(): IWorkItemStateViewState {
        return { workItemTypeState: null };
    }

    protected getObservableDataServices(): BaseDataService<any, any, any>[] {
        return [this._workItemStateItemService];
    }
}
