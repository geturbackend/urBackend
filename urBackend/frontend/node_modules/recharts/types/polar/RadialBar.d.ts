import * as React from 'react';
import { ReactElement } from 'react';
import { Series } from 'victory-vendor/d3-shape';
import { Props as SectorProps } from '../shape/Sector';
import { ImplicitLabelListType } from '../component/LabelList';
import { BarPositionPosition } from '../util/ChartUtils';
import { ActiveShape, AnimationDuration, AnimationTiming, DataKey, LayoutType, LegendType, PolarViewBoxRequired, PresentationAttributesAdaptChildEvent, TickItem, TooltipType } from '../util/types';
import { BaseAxisWithScale } from '../state/selectors/axisSelectors';
import { ChartData } from '../state/chartDataSlice';
import { AxisId } from '../state/cartesianAxisSlice';
import { ZIndexable } from '../zIndex/ZIndexLayer';
export type RadialBarDataItem = SectorProps & PolarViewBoxRequired & {
    value?: any;
    payload?: any;
    background?: SectorProps;
};
type RadialBarBackground = boolean | (ActiveShape<SectorProps> & ZIndexable);
interface InternalRadialBarProps extends ZIndexable {
    activeShape?: ActiveShape<SectorProps, SVGPathElement>;
    /**
     * @defaultValue 0
     */
    angleAxisId?: AxisId;
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
    /**
     * @defaultValue false
     */
    background?: RadialBarBackground;
    /**
     * So in Bar, this can be a percent value - but that won't work in RadialBar. RadialBar: only numbers.
     */
    barSize?: number;
    className?: string;
    /**
     * @defaultValue false
     */
    cornerIsExternal?: boolean;
    /**
     * @defaultValue 0
     */
    cornerRadius?: string | number;
    /**
     * @defaultValue []
     */
    data?: ReadonlyArray<RadialBarDataItem>;
    dataKey: string | number | ((obj: any) => any);
    /**
     * @defaultValue false
     */
    forceCornerRadius?: boolean;
    /**
     * @defaultValue false
     */
    hide?: boolean;
    /**
     * @defaultValue auto
     */
    isAnimationActive?: boolean | 'auto';
    /**
     * @defaultValue false
     */
    label?: ImplicitLabelListType;
    /**
     * @defaultValue rect
     */
    legendType?: LegendType;
    maxBarSize?: number;
    /**
     * @defaultValue 0
     */
    minPointSize?: number;
    onAnimationEnd?: () => void;
    onAnimationStart?: () => void;
    /**
     * @defaultValue 0
     */
    radiusAxisId?: AxisId;
    shape?: ActiveShape<SectorProps, SVGPathElement>;
    stackId?: string | number;
    tooltipType?: TooltipType;
}
export type RadialBarProps = Omit<PresentationAttributesAdaptChildEvent<any, SVGElement>, 'ref'> & InternalRadialBarProps;
export declare const defaultRadialBarProps: {
    readonly angleAxisId: 0;
    readonly animationBegin: 0;
    readonly animationDuration: 1500;
    readonly animationEasing: "ease";
    readonly background: false;
    readonly cornerIsExternal: false;
    readonly cornerRadius: 0;
    readonly data: ReadonlyArray<RadialBarDataItem>;
    readonly forceCornerRadius: false;
    readonly hide: false;
    readonly isAnimationActive: "auto";
    readonly label: false;
    readonly legendType: "rect";
    readonly minPointSize: 0;
    readonly radiusAxisId: 0;
    readonly zIndex: 300;
};
export declare function computeRadialBarDataItems({ displayedData, stackedData, dataStartIndex, stackedDomain, dataKey, baseValue, layout, radiusAxis, radiusAxisTicks, bandSize, pos, angleAxis, minPointSize, cx, cy, angleAxisTicks, cells, startAngle: rootStartAngle, endAngle: rootEndAngle, }: {
    displayedData: ChartData;
    stackedData: Series<Record<number, number>, DataKey<any>> | undefined;
    dataStartIndex: number;
    stackedDomain: ReadonlyArray<unknown> | null;
    dataKey: DataKey<any> | undefined;
    baseValue: number | unknown;
    layout: LayoutType;
    radiusAxis: BaseAxisWithScale;
    radiusAxisTicks: ReadonlyArray<TickItem> | undefined;
    bandSize: number;
    pos: BarPositionPosition;
    angleAxis: BaseAxisWithScale;
    minPointSize: number;
    cx: number;
    cy: number;
    angleAxisTicks: ReadonlyArray<TickItem> | undefined;
    cells: ReadonlyArray<ReactElement> | undefined;
    startAngle: number;
    endAngle: number;
}): ReadonlyArray<RadialBarDataItem>;
export declare function RadialBar(outsideProps: RadialBarProps): React.JSX.Element;
export declare namespace RadialBar {
    var displayName: string;
}
export {};
