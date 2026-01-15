import * as React from 'react';
import { ReactElement, ReactNode, SVGProps } from 'react';
import { RenderableText, TextAnchor, TextVerticalAnchor } from './Text';
import { DataKey, Percent, PolarViewBoxRequired, TrapezoidViewBox, ViewBox } from '../util/types';
import { ZIndexable } from '../zIndex/ZIndexLayer';
export type LabelContentType = ReactElement | ((props: Props) => RenderableText | ReactElement);
type CartesianLabelPosition = 'top' | 'left' | 'right' | 'bottom' | 'inside' | 'outside' | 'insideLeft' | 'insideRight' | 'insideTop' | 'insideBottom' | 'insideTopLeft' | 'insideBottomLeft' | 'insideTopRight' | 'insideBottomRight' | 'insideStart' | 'insideEnd' | 'end' | 'center' | 'centerTop' | 'centerBottom' | 'middle' | {
    x?: number | Percent;
    y?: number | Percent;
};
type PolarLabelPosition = 'insideStart' | 'insideEnd' | 'end';
export type LabelPosition = CartesianLabelPosition | PolarLabelPosition;
export type LabelFormatter = (label: RenderableText) => RenderableText;
interface LabelProps extends ZIndexable {
    viewBox?: ViewBox;
    parentViewBox?: ViewBox;
    formatter?: LabelFormatter;
    value?: RenderableText;
    /**
     * @defaultValue 5
     */
    offset?: number;
    /**
     * @defaultValue middle
     */
    position?: LabelPosition;
    children?: RenderableText;
    className?: string;
    content?: LabelContentType;
    /**
     * @defaultValue false
     */
    textBreakAll?: boolean;
    /**
     * @defaultValue 0
     */
    angle?: number;
    index?: number;
    labelRef?: React.RefObject<SVGTextElement> | null;
    /**
     * @since 3.4
     * @defaultValue 2000
     */
    zIndex?: number;
}
export type Props = Omit<SVGProps<SVGTextElement>, 'viewBox'> & LabelProps;
export type ImplicitLabelType = boolean | string | number | ReactElement<SVGElement> | ((props: any) => RenderableText | ReactElement) | (Props & {
    dataKey?: DataKey<any>;
});
export declare const CartesianLabelContextProvider: ({ x, y, upperWidth, lowerWidth, width, height, children, }: TrapezoidViewBox & {
    children: ReactNode;
}) => React.JSX.Element;
export declare const PolarLabelContextProvider: ({ cx, cy, innerRadius, outerRadius, startAngle, endAngle, clockWise, children, }: PolarViewBoxRequired & {
    children: ReactNode;
}) => React.JSX.Element;
export declare const usePolarLabelContext: () => PolarViewBoxRequired | undefined;
export declare const isLabelContentAFunction: (content: unknown) => content is (props: Props) => React.ReactNode;
export type CartesianLabelPositionInput = {
    parentViewBox?: ViewBox;
    offset: number;
    position?: CartesianLabelPosition;
};
export type LabelPositionAttributes = {
    x: number;
    y: number;
    textAnchor: TextAnchor;
    verticalAnchor: TextVerticalAnchor;
    width?: number;
    height?: number;
};
export declare const getAttrsOfCartesianLabel: (props: CartesianLabelPositionInput, viewBox: TrapezoidViewBox) => LabelPositionAttributes;
export declare const defaultLabelProps: {
    readonly angle: 0;
    readonly offset: 5;
    readonly zIndex: 2000;
    readonly position: "middle";
    readonly textBreakAll: false;
};
export declare function Label(outerProps: Props): React.JSX.Element | null;
export declare namespace Label {
    var displayName: string;
}
export declare function CartesianLabelFromLabelProp({ label, labelRef, }: {
    label: ImplicitLabelType | undefined;
    labelRef?: React.RefObject<SVGTextElement> | null;
}): React.JSX.Element | null;
export declare function PolarLabelFromLabelProp({ label }: {
    label: ImplicitLabelType | undefined;
}): React.JSX.Element | null;
export {};
