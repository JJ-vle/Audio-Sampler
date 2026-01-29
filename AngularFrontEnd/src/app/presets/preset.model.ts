export interface Sample {
  name: string;
  url: string;
}

export class Preset {
  _id!: string;          // MongoDB id
  name!: string;
  type!: string;
  isFactoryPresets!: boolean;
  samples!: Sample[];
  updatedAt!: Date;
}
