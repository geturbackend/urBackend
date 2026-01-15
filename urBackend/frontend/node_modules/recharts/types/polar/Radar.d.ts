import * as React from 'react';
import { MouseEvent, ReactElement, SVGProps } from 'react';
import { RechartsScale } from '../util/ChartUtils';
import { ImplicitLabelListType } from '../component/LabelList';
import { ActiveDotType, AnimationDuration, AnimationTiming, DataKey, DotType, LegendType, TooltipType } from '../util/types';
import { ZIndexable } from '../zIndex/ZIndexLayer';
interface RadarPoint {
    x: number;
    y: number;
    cx?: number;
    cy?: number;
    angle: number;
    radius?: number;
    value?: number;
    payload?: any;
    name?: string;
}
interface RadarProps extends ZIndexable {
    /**
     * @defaultValue true
     */
    activeDot?: ActiveDotType;
    /**
     * @defaultValue 0
     */
    angleAxisId?: string | number;
    /**
     * @defaultValue 0
     */
    animationBegin?: number;
    /**
     * @defaultValue 1500
     */
    animationDuration?: AnimationDuration;
    /**
     * @defaultValue ease
     */
    animationEasing?: AnimationTiming;
    baseLinePoints?: RadarPoint[];
    className?: string;
    connectNulls?: boolean;
    dataKey?: DataKey<any>;
    /**
     * @defaultValue false
     */
    dot?: DotType;
    /**
     * @defaultValue false
     */
    hide?: boolean;
    /**
     * @defaultValue auto
     */
    isAnimationActive?: boolean | 'auto';
    isRange?: boolean;
    /**
     * @defaultValue false
     */
    label?: ImplicitLabelListType;
    /**
     * @defaultValue rect
     */
    legendType?: LegendType;
    onAnimationEnd?: () => void;
    onAnimationStart?: () => void;
    onMouseEnter?: (props: any, e: MouseEvent<SVGPolygonElement>) => void;
    onMouseLeave?: (props: any, e: MouseEvent<SVGPolygonElement>) => void;
    points?: RadarPoint[];
    /**
     * @defaultValue 0
     */
    radiusAxisId?: string | number;
    shape?: ReactElement<SVGElement> | ((props: any) => ReactElement<SVGElement>);
    tooltipType?: TooltipType;
    /**
     * @defaultValue 100
     */
    zIndex?: number;
}
export type RadiusAxisForRadar = {
    scale: RechartsScale;
};
export type AngleAxisForRadar = {
    scale: RechartsScale;
    type: 'number' | 'category';
    dataKey: DataKey<any> | undefined;
    cx: number;
    cy: number;
};
export type Props = Omit<SVGProps<SVGElement>, 'onMouseEnter' | 'onMouseLeave' | 'points' | 'ref'> & RadarProps;
export type RadarComposedData = {
    points: RadarPoint[];
    baseLinePoints: RadarPoint[];
    isRange: boolean;
};
export declare function computeRadarPoints({ radiusAxis, angleAxis, displayedData, dataKey, bandSize, }: {
    radiusAxis: RadiusAxisForRadar;
    angleAxis: AngleAxisForRadar;
    displayedData: any[];
    dataKey: RadarProps['dataKey'];
    bandSize: number;
}): RadarComposedData;
export declare const defaultRadarProps: {
    readonly activeDot: true;
    readonly angleAxisId: 0;
    readonly animationBegin: 0;
    readonly animationDuration: 1500;
    readonly animationEasing: "ease";
    readonly dot: false;
    readonly hide: false;
    readonly isAnimationActive: "auto";
    readonly label: false;
    readonly legendType: "rect";
    readonly radiusAxisId: 0;
    readonly zIndex: 100;
};
export declare function Radar(outsideProps: Props): React.JSX.Element;
export declare namespace Radar {
    var displayName: string;
}
export {};
