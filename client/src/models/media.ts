export interface IMediaFormat {
  id: number;
  name: string;
  hash: string;
  ext: string;
  mime: string;
  path: string | null;
  width: number;
  height: number;
  size: number;
  alternativeText: string | null;
  url: string;
  caption: string | null;
  provider: string;
  previewUrl: string | null;
  provider_metadata: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IImage extends IMediaFormat {
  formats: {
    thumbnail: IMediaFormat;
  };
}
