import "./WorkItemTagsView.scss";

import * as React from "react";

import { IVssComponentProps } from "Common/Components/Utilities/VssComponent";
import { Label } from "OfficeFabric/Label";
import { css } from "OfficeFabric/Utilities";

export interface IWorkItemTagsViewProps extends IVssComponentProps {
    tags: string[];
}

export const WorkItemTagsView: React.StatelessComponent<IWorkItemTagsViewProps> =
    (props: IWorkItemTagsViewProps): JSX.Element => {
        const tags = props.tags.filter(tag => tag != null && tag.trim() !== "");
        if (tags.length === 0) {
            return null;
        }

        return (
            <div className={css("tags-view", props.className)}>
                {tags.map((tag: string, index: number) => <Label key={index} className="tag">{tag.trim()}</Label>)}
            </div>
        );
};
