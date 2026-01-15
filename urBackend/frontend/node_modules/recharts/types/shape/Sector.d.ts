import * as React from 'react';
import { SVGProps } from 'react';
import { GeometrySectorWithCornerRadius } from '../util/types';
interface SectorProps extends GeometrySectorWithCornerRadius {
    className?: string;
}
/**
 * SVG cx, cy are `string | number | undefined`, but internally we use `number` so let's
 * override the types here.
 */
export type Props = Omit<SVGProps<SVGPathElement>, 'cx' | 'cy' | 'dangerouslySetInnerHTML'> & Partial<SectorProps>;
export declare const defaultSectorProps: {
    readonly cx: 0;
    readonly cy: 0;
    readonly innerRadius: 0;
    readonly outerRadius: 0;
    readonly startAngle: 0;
    readonly endAngle: 0;
    readonly cornerRadius: 0;
    readonly forceCornerRadius: false;
    readonly cornerIsExternal: false;
};
export declare const Sector: React.FC<Props>;
export {};
