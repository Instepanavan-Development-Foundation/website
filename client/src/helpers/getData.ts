import qs from "qs";
type IUrlTypes =
  | "projects"
  | "blogs"
  | "contributors"
  | "menus"
  | "static-pages"
  | "site-config";

interface IDataParams {
  type: IUrlTypes;
  populate?: any;
  filters?: any;
  params?: string;
  fields?: string[];
  sort?: string;
  offset?: number;
  limit?: number;
}

// TODO add query by dynamic component (if possible) || create custom query on backend
// TODO fix TS types
export default async function getData({
  type,
  params = "",
  filters = {},
  populate = {},
  fields = [],
  sort = "",
  offset = 0,
  limit = 10,
}: IDataParams): Promise<{ data: any[] }> {
  const query = qs.stringify(
    {
      populate,
      fields,
      params,
      filters,
      sort,
      pagination: { start: offset, limit },
    },
    {
      encodeValuesOnly: true,
    }
  );

  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/${type}?${query}&${params}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch data: ${res.statusText}`);
    }

    return res.json();
  } catch (e) {
    console.log(e);

    return { data: [] };
  }
}
