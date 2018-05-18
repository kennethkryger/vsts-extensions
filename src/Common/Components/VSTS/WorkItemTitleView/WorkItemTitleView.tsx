import "./WorkItemTitleView.scss";

import * as React from "react";

import {
    IVssComponentProps, IVssComponentState, VssComponent
} from "Common/Components/Utilities/VssComponent";
import { BaseDataService } from "Common/Services/BaseDataService";
import { WorkItemTypeService, WorkItemTypeServiceName } from "Common/Services/WorkItemTypeService";
import { IReactAppContext } from "Common/Utilities/Context";
import { stringEquals } from "Common/Utilities/String";
import { Link } from "OfficeFabric/Link";
import {
    DirectionalHint, TooltipDelay, TooltipHost, TooltipOverflowMode
} from "OfficeFabric/Tooltip";
import { css } from "OfficeFabric/Utilities";
import { WorkItemType } from "TFS/WorkItemTracking/Contracts";

export interface IWorkItemTitleViewProps extends IVssComponentProps {
    workItemId: number;
    title: string;
    workItemType: string;
    showId?: boolean;
    onClick?(e: React.MouseEvent<HTMLElement>): void;
}

export interface IWorkItemTitleViewState extends IVssComponentState {
    workItemType: WorkItemType;
}

export class WorkItemTitleView extends VssComponent<IWorkItemTitleViewProps, IWorkItemTitleViewState> {
    private _workItemTypeService: WorkItemTypeService;

    constructor(props: IWorkItemTitleViewProps, context?: IReactAppContext) {
        super(props, context);
        this._workItemTypeService = this.context.appContext.getService<WorkItemTypeService>(WorkItemTypeServiceName);
    }

    public componentDidMount() {
        super.componentDidMount();
        if (this._workItemTypeService.isLoaded()) {
            this.setState({
                workItemType: this._workItemTypeService.getItem(this.props.workItemType)
            });
        }
        else {
            this._workItemTypeService.initializeWorkItemTypes();
        }
    }

    public componentWillReceiveProps(nextProps: IWorkItemTitleViewProps, context?: IReactAppContext) {
        super.componentWillReceiveProps(nextProps, context);

        if (!stringEquals(nextProps.workItemType, this.props.workItemType, true)) {
            if (this._workItemTypeService.isLoaded()) {
                this.setState({
                    workItemType: this._workItemTypeService.getItem(nextProps.workItemType)
                });
            }
        }
    }

    public render(): JSX.Element {
        const wit = this.state.workItemType;

        const witIcon = wit ? wit.icon : null;
        const witIconUrl = (witIcon && witIcon.id) ? witIcon.url : null;

        const webContext = VSS.getWebContext();
        const witUrl = `${webContext.collection.uri}/${webContext.project.name}/_workitems/edit/${this.props.workItemId}`;

        return (
            <div
                className={`${css("work-item-title-view", this.props.className)}`}
            >
                {witIconUrl && <img src={witIconUrl} alt="icon" />}
                {this.props.showId && <span className="work-item-id">{this.props.workItemId}</span>}
                <div className="title-link">
                    <TooltipHost
                        content={this.props.title}
                        delay={TooltipDelay.medium}
                        overflowMode={TooltipOverflowMode.Parent}
                        directionalHint={DirectionalHint.bottomLeftEdge}
                    >
                        <Link
                            href={witUrl}
                            onClick={this._onLinkClick}
                        >
                            {this.props.title}
                        </Link>
                    </TooltipHost>
                </div>
            </div>
        );
    }

    protected getInitialState(): IWorkItemTitleViewState {
        return { workItemType: null };
    }

    protected getObservableDataServices(): BaseDataService<any, any, any>[] {
        return [this._workItemTypeService];
    }

    protected getDataServiceState(): IWorkItemTitleViewState {
        return {
            workItemType: this._workItemTypeService.isLoaded() ? this._workItemTypeService.getItem(this.props.workItemType) : null
        };
    }

    private _onLinkClick = (e: React.MouseEvent<HTMLElement>) => {
        if (this.props.onClick && !e.ctrlKey) {
            e.preventDefault();
            this.props.onClick(e);
        }
    }
}
