import * as React from 'react';
import { FunctionComponent, ReactElement, SVGProps } from 'react';
import { Props as TextProps } from '../component/Text';
import { AxisDomain, DataKey, PresentationAttributesAdaptChildEvent, ScaleType, TickItem } from '../util/types';
import { RechartsScale } from '../util/ChartUtils';
import { defaultPolarAngleAxisProps } from './defaultPolarAngleAxisProps';
import { RequiresDefaultProps } from '../util/resolveDefaultProps';
import { ZIndexable } from '../zIndex/ZIndexLayer';
export interface PolarAngleAxisProps extends ZIndexable {
    /**
     * @defaultValue false
     */
    allowDecimals?: boolean;
    /**
     * @defaultValue true
     */
    allowDuplicatedCategory?: boolean;
    /**
     * @defaultValue 0
     */
    angleAxisId?: string | number;
    /**
     * @defaultValue true
     */
    axisLine?: boolean | SVGProps<SVGLineElement>;
    /**
     * @defaultValue polygon
     */
    axisLineType?: 'polygon' | 'circle';
    dataKey?: DataKey<any>;
    domain?: AxisDomain;
    /**
     * @defaultValue 'outer'
     */
    orientation?: 'inner' | 'outer';
    /**
     * @defaultValue false
     */
    reversed?: boolean;
    /**
     * @defaultValue auto
     */
    scale?: ScaleType | RechartsScale;
    /**
     * @defaultValue true
     */
    tick?: SVGProps<SVGTextElement> | ReactElement<SVGElement> | ((props: TickItemTextProps) => ReactElement<SVGElement>) | boolean;
    tickCount?: number;
    tickFormatter?: (value: any, index: number) => string;
    /**
     * @defaultValue true
     */
    tickLine?: boolean | SVGProps<SVGLineElement>;
    /**
     * @defaultValue 8
     */
    tickSize?: number;
    ticks?: ReadonlyArray<TickItem>;
    /**
     * @defaultValue category
     */
    type?: 'category' | 'number';
    /**
     * @defaultValue 500
     */
    zIndex?: number;
}
type AxisSvgProps = Omit<PresentationAttributesAdaptChildEvent<any, SVGTextElement>, 'scale' | 'type'>;
export type Props = AxisSvgProps & PolarAngleAxisProps;
type PropsWithDefaults = RequiresDefaultProps<Props, typeof defaultPolarAngleAxisProps>;
export type TickItemTextProps = TextProps & {
    index: number;
    payload: any;
};
export declare const PolarAngleAxisWrapper: FunctionComponent<PropsWithDefaults>;
export declare function PolarAngleAxis(outsideProps: Props): React.ReactNode;
export declare namespace PolarAngleAxis {
    var displayName: string;
}
export {};
