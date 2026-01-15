import * as React from 'react';
import { MouseEvent, ReactElement, ReactNode, SVGProps } from 'react';
import { Props as RectangleProps } from '../shape/Rectangle';
import { DataKey, Margin, Percent, SankeyLink, SankeyNode } from '../util/types';
import { TooltipPayloadSearcher } from '../state/tooltipSlice';
type SankeyVerticalAlign = 'justify' | 'top';
export declare const sankeyPayloadSearcher: TooltipPayloadSearcher<any, any>;
interface LinkDataItem {
    source: number;
    target: number;
    value: number;
}
export interface NodeProps extends Omit<SVGProps<SVGRectElement>, 'height' | 'width'> {
    height: number;
    width: number;
    payload: SankeyNode;
    index: number;
    x: number;
    y: number;
}
export interface LinkProps extends SVGProps<SVGPathElement> {
    sourceX: number;
    targetX: number;
    sourceY: number;
    targetY: number;
    sourceControlX: number;
    targetControlX: number;
    sourceRelativeY: number;
    targetRelativeY: number;
    linkWidth: number;
    index: number;
    payload: Omit<SankeyLink, 'source' | 'target'> & {
        source: SankeyNode;
        target: SankeyNode;
    };
}
export interface SankeyData {
    nodes: any[];
    links: LinkDataItem[];
}
type SankeyNodeOptions = ReactElement<SVGProps<SVGRectElement>> | ((props: NodeProps) => ReactElement<SVGProps<SVGRectElement>>) | RectangleProps;
type SankeyLinkOptions = ReactElement<SVGProps<SVGPathElement>> | ((props: LinkProps) => ReactElement<SVGProps<SVGPathElement>>) | SVGProps<SVGPathElement>;
interface SankeyProps {
    nameKey?: DataKey<any>;
    dataKey?: DataKey<any>;
    width?: number | Percent;
    height?: number | Percent;
    data: SankeyData;
    nodePadding?: number;
    nodeWidth?: number;
    linkCurvature?: number;
    iterations?: number;
    node?: SankeyNodeOptions;
    link?: SankeyLinkOptions;
    style?: React.CSSProperties;
    className?: string;
    children?: ReactNode;
    margin?: Partial<Margin>;
    onClick?: (item: NodeProps | LinkProps, type: SankeyElementType, e: MouseEvent) => void;
    onMouseEnter?: (item: NodeProps | LinkProps, type: SankeyElementType, e: MouseEvent) => void;
    onMouseLeave?: (item: NodeProps | LinkProps, type: SankeyElementType, e: MouseEvent) => void;
    sort?: boolean;
    verticalAlign?: SankeyVerticalAlign;
    align?: 'left' | 'justify';
}
type Props = SVGProps<SVGSVGElement> & SankeyProps;
type SankeyElementType = 'node' | 'link';
export declare const sankeyDefaultProps: {
    readonly align: "justify";
    readonly dataKey: "value";
    readonly iterations: 32;
    readonly linkCurvature: 0.5;
    readonly margin: {
        readonly top: 5;
        readonly right: 5;
        readonly bottom: 5;
        readonly left: 5;
    };
    readonly nameKey: "name";
    readonly nodePadding: 10;
    readonly nodeWidth: 10;
    readonly sort: true;
    readonly verticalAlign: "justify";
};
export declare function Sankey(outsideProps: Props): React.JSX.Element;
export declare namespace Sankey {
    var displayName: string;
}
export {};
