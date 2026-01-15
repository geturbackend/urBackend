import * as React from 'react';
import { AxisDomain, DataKey, ScaleType } from '../util/types';
import { AxisId } from '../state/cartesianAxisSlice';
import { RechartsScale } from '../util/ChartUtils';
import { AxisRange } from '../state/selectors/axisSelectors';
export interface Props {
    /**
     * @defaultValue number
     */
    type?: 'number' | 'category';
    /** The name of data displayed in the axis */
    name?: string;
    /** The unit of data displayed in the axis */
    unit?: string;
    /**
     * The unique id of z-axis
     *
     * @defaultValue 0
     */
    zAxisId?: AxisId;
    /** The key of data displayed in the axis */
    dataKey?: DataKey<any>;
    /**
     * The range of axis
     *
     * @defaultValue [64, 64]
     */
    range?: AxisRange;
    /**
     * @defaultValue auto
     */
    scale?: ScaleType | RechartsScale | undefined;
    /** The domain of scale in this axis */
    domain?: AxisDomain;
}
export declare const zAxisDefaultProps: {
    readonly zAxisId: 0;
    readonly range: AxisRange;
    readonly scale: ScaleType | RechartsScale | undefined;
    readonly type: import("../util/types").AxisDomainType;
};
export declare function ZAxis(outsideProps: Props): React.JSX.Element;
export declare namespace ZAxis {
    var displayName: string;
}
