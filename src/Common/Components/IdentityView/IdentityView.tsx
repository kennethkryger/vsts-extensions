import * as React from "react";

import { IVssComponentProps } from "Common/Components/Utilities/VssComponent";
import {
    IdentityRef, parseUniquefiedIdentityName, parseWorkItemIdentityName
} from "Common/Utilities/Identity";
import { Persona, PersonaSize } from "OfficeFabric/Persona";
import { css } from "OfficeFabric/Utilities";

export interface IIdentityViewProps extends IVssComponentProps {
    identityRef?: IdentityRef;
    identityDistinctName?: string;
    useWorkItemIdentityParser?: boolean;
    size?: PersonaSize;
}

export const IdentityView: React.StatelessComponent<IIdentityViewProps> =
    (props: IIdentityViewProps): JSX.Element => {
        const { identityDistinctName, useWorkItemIdentityParser } = props;
        let identityRef = props.identityRef;

        if (!identityRef) {
            identityRef = useWorkItemIdentityParser ? parseWorkItemIdentityName(identityDistinctName) : parseUniquefiedIdentityName(identityDistinctName);
        }

        if (!identityRef || !identityRef.displayName) {
            return null;
        }

        return (
            <Persona
                className={css("identity-view", props.className)}
                size={props.size || PersonaSize.extraExtraSmall}
                imageUrl={identityRef.imageUrl}
                primaryText={identityRef.displayName}
                secondaryText={identityRef.uniqueName}
            />
        );
    };
