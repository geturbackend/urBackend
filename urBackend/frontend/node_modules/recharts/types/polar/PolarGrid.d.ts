import * as React from 'react';
import { SVGProps } from 'react';
import { AxisId } from '../state/cartesianAxisSlice';
import { ZIndexable } from '../zIndex/ZIndexLayer';
interface PolarGridProps extends ZIndexable {
    cx?: number;
    cy?: number;
    innerRadius?: number;
    outerRadius?: number;
    polarAngles?: ReadonlyArray<number>;
    polarRadius?: ReadonlyArray<number>;
    /**
     * @defaultValue polygon
     */
    gridType?: 'polygon' | 'circle';
    /**
     * @defaultValue true
     */
    radialLines?: boolean;
    /**
     * @defaultValue 0
     */
    angleAxisId?: AxisId;
    /**
     * @defaultValue 0
     */
    radiusAxisId?: AxisId;
}
export type Props = SVGProps<SVGLineElement> & PolarGridProps;
export declare const PolarGrid: {
    ({ gridType, radialLines, angleAxisId, radiusAxisId, cx: cxFromOutside, cy: cyFromOutside, innerRadius: innerRadiusFromOutside, outerRadius: outerRadiusFromOutside, polarAngles: polarAnglesInput, polarRadius: polarRadiusInput, ...inputs }: Props): React.JSX.Element | null;
    displayName: string;
};
export {};
