import { TickItem } from '../../../util/types';
import { TooltipIndex } from '../../tooltipSlice';
import { ActiveLabel } from '../../../synchronisation/types';
export declare const combineActiveLabel: (tooltipTicks: ReadonlyArray<TickItem>, activeIndex: TooltipIndex) => ActiveLabel;
