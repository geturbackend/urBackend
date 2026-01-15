import * as React from 'react';
import { ReactElement } from 'react';
import { ImplicitLabelType } from '../component/Label';
import { IfOverflow } from '../util/IfOverflow';
import { Props as RectangleProps } from '../shape/Rectangle';
import { ZIndexable } from '../zIndex/ZIndexLayer';
interface ReferenceAreaProps extends ZIndexable {
    /**
     * @defaultValue discard
     */
    ifOverflow?: IfOverflow;
    x1?: number | string;
    x2?: number | string;
    y1?: number | string;
    y2?: number | string;
    className?: number | string;
    /**
     * @defaultValue 0
     */
    yAxisId?: number | string;
    /**
     * @defaultValue 0
     */
    xAxisId?: number | string;
    shape?: ReactElement<SVGElement> | ((props: any) => ReactElement<SVGElement>);
    label?: ImplicitLabelType;
    /**
     * @defaultValue 100
     */
    zIndex?: number;
}
export type Props = RectangleProps & ReferenceAreaProps;
export declare const referenceAreaDefaultProps: {
    readonly ifOverflow: "discard";
    readonly xAxisId: 0;
    readonly yAxisId: 0;
    readonly radius: 0;
    readonly fill: "#ccc";
    readonly fillOpacity: 0.5;
    readonly stroke: "none";
    readonly strokeWidth: 1;
    readonly zIndex: 100;
};
export declare function ReferenceArea(outsideProps: Props): React.JSX.Element;
export declare namespace ReferenceArea {
    var displayName: string;
}
export {};
