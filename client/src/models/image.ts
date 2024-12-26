interface IImageFormat {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  path: string | null;
  width: number;
  height: number;
  size: number;
  url: string;
}

export interface IImage extends IImageFormat {
  id: number;
  alternativeText: string | null;
  caption: string | null;
  formats: {
    thumbnail: IImageFormat;
  };
  previewUrl: string | null;
  provider: string;
  provider_metadata: string | null;
  createdAt: string;
  updatedAt: string;
}
