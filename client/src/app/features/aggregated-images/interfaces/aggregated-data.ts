import {Provider} from "./provider";

export interface AggregatedData {
  _id: string;
  provider: Provider;
  aggregationJob?: string;
  originalId?: string;
  prompt?: string;
  negativePrompt?: string;
  model?: string;
  author?: string;
  createdAt?: Date;
  publicationUrl?: string;
  status?: 'pending' | 'approved' | 'rejected';
  reviewedAt?: Date;
}
