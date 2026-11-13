import raw from '../../../data/crops.json';
import type { CropDataset } from '../types';
import { validateDataset } from './schema';

export const DEFAULT_DATASET: CropDataset = validateDataset(raw as unknown as CropDataset);
